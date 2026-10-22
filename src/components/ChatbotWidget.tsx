import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { chatbotApi } from "../api/chatbotApi";
import { useAuthStore } from "../store/authStore";
import type { Room } from "../types/room";
import { apiRetryAfter } from "../utils/apiError";

const HIDDEN_ROUTES = ["/login", "/register", "/chat"];

const SUGGESTIONS = [
    "Tìm phòng trọ giá dưới 3 triệu",
    "Làm sao để liên hệ chủ trọ?",
    "Cách đăng tin cho thuê phòng?",
    "Cách lưu phòng yêu thích?",
];

interface DisplayMessage {
    id: number;
    role: "USER" | "BOT";
    content: string;
    suggestedRooms?: Room[];
    isError?: boolean;
    retryText?: string;
    retryAt?: number;
}

let idCounter = 1;
const newId = () => idCounter++;

// Mỗi tài khoản (hoặc khách) có phiên riêng, tránh lộ lịch sử khi dùng chung trình duyệt
const storageKey = (email: string | null) => `chatbot_session_id:${email ?? "guest"}`;

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}

function renderInline(text: string): ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
            part
        )
    );
}

/** Hiển thị **in đậm** và danh sách gạch đầu dòng mà Gemini hay trả về (không dùng innerHTML). */
function BotText({ text }: { text: string }) {
    return (
        <div className="flex flex-col gap-1">
            {text.split("\n").map((line, i) => {
                const bullet = line.match(/^\s*[*-]\s+(.*)$/);
                if (bullet) {
                    return (
                        <div key={i} className="flex gap-2">
                            <span className="text-primary-container">•</span>
                            <span>{renderInline(bullet[1])}</span>
                        </div>
                    );
                }
                if (line.trim() === "") return <div key={i} className="h-1" />;
                return <p key={i}>{renderInline(line)}</p>;
            })}
        </div>
    );
}

function BotAvatar() {
    return (
        <span className="w-7 h-7 shrink-0 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
            <span className="material-symbols-outlined !text-[16px]">smart_toy</span>
        </span>
    );
}

export default function ChatbotWidget() {
    const { pathname } = useLocation();
    const email = useAuthStore((s) => s.email);

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const sessionIdRef = useRef<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Đổi tài khoản (đăng nhập, đăng xuất): nạp phiên riêng của tài khoản đó
    useEffect(() => {
        sessionIdRef.current = localStorage.getItem(storageKey(email));
        setMessages([]);
    }, [email]);

    // Mở panel lần đầu: tải lại lịch sử nếu đã có phiên
    useEffect(() => {
        if (!open || messages.length > 0) return;
        const sessionId = sessionIdRef.current;
        if (!sessionId) return;

        let cancelled = false;
        setLoadingHistory(true);
        chatbotApi
            .getHistory(sessionId)
            .then((history) => {
                if (cancelled) return;
                const restored = history.map((h) => ({ id: newId(), role: h.role, content: h.content }));
                setMessages((prev) => [...restored, ...prev]);
            })
            .catch(() => {
                if (cancelled) return;
                localStorage.removeItem(storageKey(email));
                sessionIdRef.current = null;
            })
            .finally(() => {
                if (!cancelled) setLoadingHistory(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, email, messages.length]);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending, open]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    const [now, setNow] = useState(() => Date.now());
    const hasPendingRetry = messages.some((m) => m.retryAt !== undefined && m.retryAt > now);

    useEffect(() => {
        if (!hasPendingRetry) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasPendingRetry]);

    if (HIDDEN_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

    const deliver = async (text: string) => {
        setSending(true);
        try {
            const res = await chatbotApi.sendMessage(text, sessionIdRef.current);
            sessionIdRef.current = res.sessionId;
            localStorage.setItem(storageKey(email), res.sessionId);
            setMessages((prev) => [
                ...prev,
                { id: newId(), role: "BOT", content: res.reply, suggestedRooms: res.suggestedRooms },
            ]);
        } catch (err: any) {
            const status = err.response?.status;
            const retryAfter = apiRetryAfter(err);
            const serverMessage = err.response?.data?.message as string | undefined;

            let content: string;
            let canRetry = true;

            if (!err.response) {
                content = "Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.";
            } else if (status === 429) {
                content = serverMessage ?? "Bạn gửi quá nhiều tin. Vui lòng thử lại sau ít phút.";
                // Chờ lâu (hết lượt trong ngày) thì không có nút thử lại
                canRetry = retryAfter !== null && retryAfter <= 120;
            } else if (status === 400) {
                content = serverMessage ?? "Tin nhắn không hợp lệ.";
                canRetry = false;
            } else if (status === 503) {
                content = serverMessage ?? "Hệ thống chatbot đang quá tải, vui lòng thử lại sau ít phút.";
            } else {
                content = "Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé.";
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: newId(),
                    role: "BOT",
                    content,
                    isError: true,
                    retryText: canRetry ? text : undefined,
                    retryAt: status === 429 && canRetry && retryAfter ? Date.now() + retryAfter * 1000 : undefined,
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    const sendNew = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setMessages((prev) => [...prev, { id: newId(), role: "USER", content: trimmed }]);
        void deliver(trimmed);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const text = input;
        setInput("");
        sendNew(text);
    };

    const handleRetry = (errorId: number, text: string) => {
        if (sending) return;
        setMessages((prev) => prev.filter((m) => m.id !== errorId));
        void deliver(text);
    };

    const waitLeft = (m: DisplayMessage) =>
        m.retryAt ? Math.max(0, Math.ceil((m.retryAt - now) / 1000)) : 0;

    const startNew = () => {
        if (sending) return;
        localStorage.removeItem(storageKey(email));
        sessionIdRef.current = null;
        setMessages([]);
        inputRef.current?.focus();
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
                aria-expanded={open}
                className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-lg hover:bg-primary transition-colors flex items-center justify-center"
            >
                <span className="material-symbols-outlined !text-[26px]">{open ? "close" : "smart_toy"}</span>
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Trợ lý BoardingHome"
                    className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw_-_2.5rem)] h-[min(34rem,calc(100dvh_-_10rem))] bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-xl flex flex-col overflow-hidden"
                >
                    <header className="bg-primary-container text-on-primary px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-on-primary/15 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined !text-[20px]">smart_toy</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm leading-tight">Trợ lý BoardingHome</p>
                            <p className="text-xs text-on-primary-container truncate">Hỏi cách dùng web hoặc nhờ tìm phòng</p>
                        </div>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={startNew}
                                disabled={sending}
                                title="Cuộc trò chuyện mới"
                                aria-label="Cuộc trò chuyện mới"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-on-primary/15 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined !text-[20px]">add_comment</span>
                            </button>
                        )}
                    </header>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface">
                        {loadingHistory ? (
                            <p className="text-center text-sm text-on-surface-variant py-10">Đang tải hội thoại...</p>
                        ) : messages.length === 0 ? (
                            <div className="py-4 flex flex-col items-center gap-3 text-center">
                                <span className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[26px]">smart_toy</span>
                                </span>
                                <div>
                                    <p className="font-semibold text-on-surface">Xin chào!</p>
                                    <p className="text-sm text-on-surface-variant">Mình có thể giúp gì cho bạn hôm nay?</p>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => sendNew(s)}
                                            disabled={sending}
                                            className="text-left text-sm px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:bg-primary-fixed/40 hover:text-on-surface transition-colors disabled:opacity-60"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) =>
                                msg.role === "USER" ? (
                                    <div key={msg.id} className="flex justify-end">
                                        <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-md bg-primary-container text-on-primary text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div key={msg.id} className="flex items-start gap-2">
                                        <BotAvatar />
                                        <div className="max-w-[85%] flex flex-col gap-2">
                                            <div
                                                className={`px-3.5 py-2.5 rounded-2xl rounded-tl-md text-sm break-words ${msg.isError
                                                    ? "bg-error-container text-on-error-container"
                                                    : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface"
                                                    }`}
                                            >
                                                <BotText text={msg.content} />
                                                {msg.isError && msg.retryText && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetry(msg.id, msg.retryText!)}
                                                        disabled={sending || waitLeft(msg) > 0}
                                                        className="mt-2 text-xs font-semibold underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined !text-[14px]">refresh</span>
                                                        {waitLeft(msg) > 0 ? `Thử lại sau ${waitLeft(msg)} giây` : "Thử lại"}
                                                    </button>
                                                )}
                                            </div>

                                            {msg.suggestedRooms && msg.suggestedRooms.length > 0 && (
                                                <div className="flex flex-col gap-1.5">
                                                    {msg.suggestedRooms.map((room) => {
                                                        const thumb =
                                                            room.images.find((i) => i.thumbnail)?.imageUrl ?? room.images[0]?.imageUrl;
                                                        return (
                                                            <Link
                                                                key={room.id}
                                                                to={`/rooms/${room.id}`}
                                                                onClick={() => setOpen(false)}
                                                                className="flex items-center gap-2.5 bg-surface-container-lowest border border-outline-variant/50 hover:border-primary-container rounded-xl p-1.5 transition-colors"
                                                            >
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                                                                    {thumb ? (
                                                                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="material-symbols-outlined !text-[20px] text-outline">image</span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-on-surface line-clamp-1">{room.title}</p>
                                                                    <p className="text-[11px] text-on-surface-variant line-clamp-1">{room.houseName}</p>
                                                                    <p className="text-xs font-bold text-primary-container tabular-nums">
                                                                        {formatPrice(room.price)} đ/tháng
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            )
                        )}

                        {sending && (
                            <div className="flex items-start gap-2">
                                <BotAvatar />
                                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-surface-container-lowest border border-outline-variant/40 flex gap-1">
                                    {[0, 150, 300].map((delay) => (
                                        <span
                                            key={delay}
                                            style={{ animationDelay: `${delay}ms` }}
                                            className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    <div className="border-t border-outline-variant/40 p-3">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                aria-label="Nhập tin nhắn"
                                maxLength={500}
                                className="flex-1 h-10 px-4 bg-surface-container-low focus:bg-surface-container-lowest rounded-full text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                                type="submit"
                                disabled={sending || !input.trim()}
                                aria-label="Gửi"
                                className="w-10 h-10 shrink-0 rounded-full bg-primary-container text-on-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined !text-[20px]">send</span>
                            </button>
                        </form>
                        <p className="text-[11px] text-on-surface-variant text-center mt-2">
                            Trợ lý AI có thể nhầm lẫn. Hãy kiểm tra lại thông tin quan trọng.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
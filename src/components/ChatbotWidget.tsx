import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { chatbotApi } from "../api/chatbotApi";
import type { ChatbotHistoryItem } from "../types/chatbot";
import type { Room } from "../types/room";

const SESSION_KEY = "chatbot_session_id";

interface DisplayMessage {
    role: "USER" | "BOT";
    content: string;
    suggestedRooms?: Room[];
    isError?: boolean;
    retryText?: string;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ/tháng";
}

export default function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const sessionIdRef = useRef<string | null>(localStorage.getItem(SESSION_KEY));
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const sessionId = sessionIdRef.current;
        if (sessionId && messages.length === 0) {
            setLoadingHistory(true);
            chatbotApi
                .getHistory(sessionId)
                .then((history: ChatbotHistoryItem[]) => {
                    setMessages(history.map((h) => ({ role: h.role, content: h.content })));
                })
                .catch(() => {
                    localStorage.removeItem(SESSION_KEY);
                    sessionIdRef.current = null;
                })
                .finally(() => setLoadingHistory(false));
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const sendText = async (text: string) => {
        setMessages((prev) => [...prev, { role: "USER", content: text }]);
        setSending(true);

        try {
            const res = await chatbotApi.sendMessage(text, sessionIdRef.current);
            sessionIdRef.current = res.sessionId;
            localStorage.setItem(SESSION_KEY, res.sessionId);

            setMessages((prev) => [
                ...prev,
                { role: "BOT", content: res.reply, suggestedRooms: res.suggestedRooms },
            ]);
        } catch (err: any) {
            const isOverloaded = err.response?.status === 503;
            const content = isOverloaded
                ? (err.response?.data?.message as string) ??
                "Hệ thống chatbot đang quá tải, vui lòng thử lại sau ít phút."
                : "Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé.";

            setMessages((prev) => [
                ...prev,
                { role: "BOT", content, isError: true, retryText: text },
            ]);
        } finally {
            setSending(false);
        }
    };

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        await sendText(text);
    };

    const handleRetry = (text: string) => {
        if (sending) return;
        sendText(text);
    };

    return (
        <>
            <button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl"
                aria-label="Mở trợ lý AI"
            >
                {open ? "×" : "💬"}
            </button>

            {open && (
                <div className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2.5rem)] h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-3">
                        <p className="font-semibold text-sm">Trợ lý BoardingHome</p>
                        <p className="text-xs text-blue-100">Hỏi về cách dùng web hoặc nhờ tìm phòng giúp bạn</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {loadingHistory ? (
                            <p className="text-center text-sm text-gray-400 py-8">Đang tải hội thoại...</p>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-sm text-gray-400 py-8 px-4">
                                👋 Xin chào! Mình có thể giúp bạn tìm phòng trọ hoặc giải đáp cách sử dụng web. Thử hỏi:
                                <br />
                                <span className="italic">"Tìm phòng trọ giá dưới 3 triệu"</span>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${msg.role === "USER"
                                                ? "bg-blue-600 text-white"
                                                : msg.isError
                                                    ? "bg-red-50 text-red-700 border border-red-100"
                                                    : "bg-gray-100 text-gray-900"
                                            }`}
                                    >
                                        {msg.content}

                                        {msg.isError && msg.retryText && (
                                            <button
                                                onClick={() => handleRetry(msg.retryText!)}
                                                disabled={sending}
                                                className="block mt-2 text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                                            >
                                                🔄 Thử lại
                                            </button>
                                        )}

                                        {msg.suggestedRooms && msg.suggestedRooms.length > 0 && (
                                            <div className="mt-2 space-y-1.5">
                                                {msg.suggestedRooms.map((room) => (
                                                    <Link
                                                        key={room.id}
                                                        to={`/rooms/${room.id}`}
                                                        onClick={() => setOpen(false)}
                                                        className="block bg-white border rounded-lg px-2.5 py-1.5 hover:border-blue-400"
                                                    >
                                                        <p className="text-gray-900 font-medium text-xs line-clamp-1">{room.title}</p>
                                                        <p className="text-blue-600 text-xs font-semibold">{formatPrice(room.price)}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-3 py-2 rounded-2xl text-sm text-gray-400">Đang trả lời...</div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 border rounded-full px-4 py-2 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={sending || !input.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
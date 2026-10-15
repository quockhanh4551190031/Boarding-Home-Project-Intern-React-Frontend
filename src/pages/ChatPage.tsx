import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { chatApi } from "../api/chatApi";
import { useChatSocket } from "../hooks/useChatSocket";
import { useAuthStore } from "../store/authStore";
import Avatar from "../components/ui/Avatar";
import { alertErrorCls, btnSmSecondary, iconBtn, inputCls } from "../components/ui/styles";
import { isSoundMuted, playNotificationSound, setSoundMuted } from "../utils/sound";
import { timeAgo } from "../utils/time";
import type { ChatRoom, Message } from "../types/chat";
import { useUnreadStore } from "../store/unreadStore";

const PAGE_SIZE = 30;
const POLL_MS = 15000;
const GROUP_MS = 5 * 60 * 1000;

function mergeMessages(base: Message[], extra: Message[]): Message[] {
  const map = new Map<number, Message>();
  [...base, ...extra].forEach((m) => map.set(m.id, m));
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

function sortRooms(list: ChatRoom[]): ChatRoom[] {
  return [...list].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (ta !== tb) return tb - ta;
    return b.id - a.id;
  });
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN");
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserEmail = useAuthStore((s) => s.email);
  const setUnreadTotal = useUnreadStore((s) => s.setCount);

  const roomParam = Number(searchParams.get("roomId"));
  const selectedRoomId = Number.isFinite(roomParam) && roomParam > 0 ? roomParam : null;
  const selectedRef = useRef<number | null>(selectedRoomId);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(false);
  const [query, setQuery] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [muted, setMuted] = useState(isSoundMuted());

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    selectedRef.current = selectedRoomId;
  }, [selectedRoomId]);

  /* ---------- Danh sách cuộc trò chuyện ---------- */

  const loadRooms = useCallback(async () => {
    try {
      const data = await chatApi.getMyRooms();
      setRooms(data.map((r) => (r.id === selectedRef.current ? { ...r, unreadCount: 0 } : r)));
      setRoomsError(false);
    } catch {
      setRoomsError(true);
    }
  }, []);

  useEffect(() => {
    loadRooms().finally(() => setRoomsLoading(false));

    // Cuộc trò chuyện do người khác vừa mở sẽ xuất hiện sau tối đa POLL_MS
    const timer = window.setInterval(() => {
      if (!document.hidden) loadRooms();
    }, POLL_MS);

    const onVisible = () => {
      if (document.hidden) return;
      loadRooms();
      const open = selectedRef.current;
      if (open) {
        chatApi
          .markAsRead(open)
          .then(() =>
            setRooms((prev) => prev.map((r) => (r.id === open ? { ...r, unreadCount: 0 } : r)))
          )
          .catch(() => { });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadRooms]);

  /* ---------- Tải tin nhắn khi đổi cuộc trò chuyện ---------- */
  useEffect(() => {
    if (roomsLoading || (roomsError && rooms.length === 0)) return;
    setUnreadTotal(rooms.reduce((sum, r) => sum + r.unreadCount, 0));
  }, [rooms, roomsLoading, roomsError, setUnreadTotal]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setMessages([]);
    setPage(0);
    setHasOlder(false);
    setThreadError(null);
    setSendError(null);
    setThreadLoading(true);

    chatApi
      .getMessages(selectedRoomId, 0, PAGE_SIZE)
      .then((msgs) => {
        if (cancelled) return;
        // Backend trả mới nhất trước: đảo lại để hiển thị theo thời gian.
        // Gộp với tin realtime có thể đã tới trong lúc đang tải.
        setMessages((prev) => mergeMessages([...msgs].reverse(), prev));
        setHasOlder(msgs.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) setThreadError("Không tải được tin nhắn của cuộc trò chuyện này");
      })
      .finally(() => {
        if (!cancelled) setThreadLoading(false);
      });

    chatApi
      .markAsRead(selectedRoomId)
      .then(() => {
        if (cancelled) return;
        setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? { ...r, unreadCount: 0 } : r)));
      })
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [selectedRoomId, reloadKey]);

  const loadOlder = async () => {
    const roomId = selectedRoomId;
    if (!roomId || olderLoading) return;
    setOlderLoading(true);
    try {
      const next = page + 1;
      const msgs = await chatApi.getMessages(roomId, next, PAGE_SIZE);
      if (selectedRef.current !== roomId) return;
      setMessages((prev) => mergeMessages([...msgs].reverse(), prev));
      setPage(next);
      setHasOlder(msgs.length === PAGE_SIZE);
    } catch {
      setThreadError("Không tải thêm được tin nhắn cũ");
    } finally {
      setOlderLoading(false);
    }
  };

  /* ---------- Cuộn xuống cuối khi có tin mới ---------- */

  useEffect(() => {
    firstLoadRef.current = true;
  }, [selectedRoomId]);

  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (lastId === null) return;
    const el = scrollRef.current;
    const last = messages[messages.length - 1];
    const mine = last.senderEmail === currentUserEmail;
    const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 240 : true;

    // Đang đọc tin cũ ở phía trên thì không giật màn hình xuống cuối
    if (firstLoadRef.current || mine || nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: firstLoadRef.current ? "auto" : "smooth" });
    }
    firstLoadRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId]);

  /* ---------- Realtime ---------- */

  const handleIncoming = useCallback(
    (msg: Message) => {
      const mine = msg.senderEmail === currentUserEmail;
      const isOpen = msg.chatRoomId === selectedRef.current;
      const viewing = isOpen && !document.hidden;

      if (!mine && !viewing) playNotificationSound();

      if (isOpen) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (!mine && viewing) chatApi.markAsRead(msg.chatRoomId).catch(() => { });
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.id !== msg.chatRoomId
            ? r
            : {
              ...r,
              lastMessage: msg.content,
              lastMessageAt: msg.createdAt,
              unreadCount: !mine && !viewing ? r.unreadCount + 1 : r.unreadCount,
            }
        )
      );
    },
    [currentUserEmail]
  );

  const roomIds = useMemo(() => rooms.map((r) => r.id), [rooms]);
  const { connected, sendMessage } = useChatSocket(roomIds, handleIncoming);

  /* ---------- Gửi tin ---------- */

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedRoomId) return;

    if (!sendMessage(selectedRoomId, text)) {
      setSendError("Đang mất kết nối nên tin nhắn chưa được gửi. Nội dung của bạn vẫn được giữ lại.");
      return;
    }
    setSendError(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing: đang gõ dở dấu tiếng Việt (Telex/VNI) thì Enter không được gửi
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const selectRoom = (id: number) => setSearchParams({ roomId: String(id) });
  const backToList = () => setSearchParams({}, { replace: true });

  /* ---------- Hiển thị ---------- */

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const selectedId = selectedRoom?.id ?? null;

  useEffect(() => {
    if (selectedId !== null && window.matchMedia("(min-width: 768px)").matches) {
      textareaRef.current?.focus();
    }
  }, [selectedId]);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = sortRooms(rooms);
    if (!q) return sorted;
    return sorted.filter((r) =>
      `${r.otherUserFullName ?? ""} ${r.otherUserEmail} ${r.relatedRoomTitle ?? ""}`.toLowerCase().includes(q)
    );
  }, [rooms, query]);

  const otherName = selectedRoom ? selectedRoom.otherUserFullName ?? selectedRoom.otherUserEmail : "";

  return (
    <div className="max-w-6xl mx-auto sm:px-4 sm:py-6">
      <div className="flex h-[calc(100dvh_-_4rem)] sm:h-[calc(100dvh_-_7rem)] min-h-[26rem] bg-surface-container-lowest sm:rounded-xl sm:border border-outline-variant/50 sm:shadow-sm overflow-hidden">
        {/* Danh sách cuộc trò chuyện */}
        <aside
          className={`${selectedRoom ? "hidden md:flex" : "flex"
            } w-full md:w-80 md:shrink-0 flex-col md:border-r border-outline-variant/40`}
        >
          <div className="p-4 border-b border-outline-variant/40">
            <h1 className="text-lg font-bold tracking-tight text-on-surface mb-3">Tin nhắn</h1>
            <div className="relative">
              <span className="material-symbols-outlined !text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Tìm cuộc trò chuyện..."
                className={`${inputCls} pl-9`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="p-4 space-y-4 animate-pulse">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-container" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/2 bg-surface-container rounded" />
                      <div className="h-3 w-3/4 bg-surface-container rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : roomsError && rooms.length === 0 ? (
              <div className="p-6 flex flex-col items-center gap-3 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined !text-[32px] text-outline">cloud_off</span>
                Không tải được danh sách tin nhắn
                <button onClick={loadRooms} className={btnSmSecondary}>
                  Thử lại
                </button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-6 flex flex-col items-center gap-2 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined !text-[32px] text-outline">forum</span>
                {rooms.length === 0 ? (
                  <>
                    <p className="font-medium text-on-surface">Chưa có cuộc trò chuyện nào</p>
                    <p>
                      Mở một phòng và bấm "Nhắn tin cho chủ trọ" để bắt đầu.{" "}
                      <Link to="/" className="text-primary-container font-medium hover:underline">
                        Tìm phòng
                      </Link>
                    </p>
                  </>
                ) : (
                  <p>Không có cuộc trò chuyện phù hợp</p>
                )}
              </div>
            ) : (
              filteredRooms.map((room) => {
                const name = room.otherUserFullName ?? room.otherUserEmail;
                const active = room.id === selectedRoomId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => selectRoom(room.id)}
                    aria-current={active}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-outline-variant/30 transition-colors ${active ? "bg-primary-fixed/40" : "hover:bg-surface-container-low"
                      }`}
                  >
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm truncate ${room.unreadCount > 0 ? "font-bold text-on-surface" : "font-semibold text-on-surface"
                            }`}
                        >
                          {name}
                        </span>
                        {room.lastMessageAt && (
                          <span className="text-[11px] text-on-surface-variant shrink-0">
                            {timeAgo(room.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      {room.relatedRoomTitle && (
                        <p className="text-[11px] text-primary-container truncate">
                          Về: {room.relatedRoomTitle}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={`text-xs truncate ${room.unreadCount > 0 ? "text-on-surface font-medium" : "text-on-surface-variant"
                            }`}
                        >
                          {room.lastMessage ?? "Chưa có tin nhắn"}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center tabular-nums shrink-0">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Khung trò chuyện */}
        <section className={`${selectedRoom ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
          {!selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-on-surface-variant p-6 text-center">
              <span className="material-symbols-outlined !text-[48px] text-outline">chat</span>
              <p className="font-medium text-on-surface">Chọn một cuộc trò chuyện</p>
              <p className="text-sm">Tin nhắn của bạn sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/40">
                <button type="button" onClick={backToList} aria-label="Quay lại danh sách" className={`${iconBtn} md:hidden`}>
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <Avatar name={otherName} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface truncate leading-tight">{otherName}</p>
                  {selectedRoom.relatedRoomId ? (
                    <Link
                      to={`/rooms/${selectedRoom.relatedRoomId}`}
                      className="text-xs text-primary-container hover:underline truncate block"
                    >
                      Về phòng: {selectedRoom.relatedRoomTitle}
                    </Link>
                  ) : (
                    <p className="text-xs text-on-surface-variant truncate">{selectedRoom.otherUserEmail}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Bật âm thông báo" : "Tắt âm thông báo"}
                  title={muted ? "Bật âm thông báo" : "Tắt âm thông báo"}
                  className={iconBtn}
                >
                  <span className="material-symbols-outlined">{muted ? "volume_off" : "volume_up"}</span>
                </button>
              </header>

              {!connected && (
                <div className="bg-amber-100 text-amber-700 text-xs px-4 py-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[16px]">sync</span>
                  Đang kết nối lại...
                </div>
              )}

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                className="flex-1 overflow-y-auto px-4 py-4 bg-surface"
              >
                {threadError && (
                  <div className={`${alertErrorCls} mb-3 flex items-center justify-between gap-3`}>
                    <span>{threadError}</span>
                    <button
                      onClick={() => {
                        setThreadError(null);
                        setReloadKey((k) => k + 1);
                      }}
                      className="font-semibold underline shrink-0"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {threadLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[60, 40, 70, 45].map((w, i) => (
                      <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                        <div style={{ width: `${w}%` }} className="h-10 rounded-2xl bg-surface-container" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 && !threadError ? (
                  <div className="h-full flex flex-col items-center justify-center gap-1 text-on-surface-variant text-center">
                    <span className="material-symbols-outlined !text-[36px] text-outline">waving_hand</span>
                    <p className="font-medium text-on-surface">Chưa có tin nhắn nào</p>
                    <p className="text-sm">Hãy gửi lời chào đầu tiên.</p>
                  </div>
                ) : (
                  <>
                    {hasOlder && (
                      <div className="flex justify-center mb-2">
                        <button onClick={loadOlder} disabled={olderLoading} className={btnSmSecondary}>
                          {olderLoading ? "Đang tải..." : "Xem tin nhắn cũ hơn"}
                        </button>
                      </div>
                    )}

                    {messages.map((m, i) => {
                      const prev = messages[i - 1];
                      const next = messages[i + 1];
                      const mine = m.senderEmail === currentUserEmail;
                      const t = new Date(m.createdAt).getTime();
                      const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                      const joinsPrev =
                        !!prev &&
                        !newDay &&
                        prev.senderEmail === m.senderEmail &&
                        t - new Date(prev.createdAt).getTime() < GROUP_MS;
                      const joinsNext =
                        !!next &&
                        dayKey(next.createdAt) === dayKey(m.createdAt) &&
                        next.senderEmail === m.senderEmail &&
                        new Date(next.createdAt).getTime() - t < GROUP_MS;

                      return (
                        <div key={m.id}>
                          {newDay && (
                            <div className="flex justify-center my-4">
                              <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                                {dayLabel(m.createdAt)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${joinsPrev ? "mt-0.5" : "mt-3"
                              }`}
                          >
                            {!mine &&
                              (joinsNext ? (
                                <span className="w-8 shrink-0" />
                              ) : (
                                <Avatar name={otherName} size="sm" tone="muted" />
                              ))}
                            <div className={`max-w-[75%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                              <div
                                className={`px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${mine
                                  ? "bg-primary-container text-on-primary rounded-2xl rounded-br-md"
                                  : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface rounded-2xl rounded-bl-md"
                                  }`}
                              >
                                {m.content}
                              </div>
                              {!joinsNext && (
                                <span className="text-[11px] text-on-surface-variant mt-1 tabular-nums">
                                  {clock(m.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-outline-variant/40 p-3">
                {sendError && <p className="text-xs text-error mb-2">{sendError}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    maxLength={2000}
                    placeholder="Nhập tin nhắn..."
                    aria-label="Nhập tin nhắn"
                    className="flex-1 min-h-10 max-h-[120px] px-3.5 py-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      autoResize(e.target);
                    }}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || !connected}
                    aria-label="Gửi"
                    className="w-10 h-10 shrink-0 rounded-full bg-primary-container text-on-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
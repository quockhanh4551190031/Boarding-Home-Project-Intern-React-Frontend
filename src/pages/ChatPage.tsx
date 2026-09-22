import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { chatApi } from "../api/chatApi";
import { useChatSocket } from "../hooks/useChatSocket";
import { useAuthStore } from "../store/authStore";
import type { ChatRoom, Message } from "../types/chat";

function playNotificationSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserEmail = useAuthStore((s) => s.email);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    searchParams.get("roomId") ? Number(searchParams.get("roomId")) : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.getMyRooms().then(setRooms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;
    chatApi.getMessages(selectedRoomId).then((msgs) => {
      setMessages([...msgs].reverse());
    });
    chatApi.markAsRead(selectedRoomId).then(() => {
        setRooms((prev) =>
          prev.map((r) => (r.id === selectedRoomId ? { ...r, unreadCount: 0 } : r))
        );
      }).catch(() => {});
  }, [selectedRoomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleIncoming = (msg: Message) => {
    if (msg.senderEmail !== currentUserEmail) {
      playNotificationSound();
    }
    if (msg.chatRoomId === selectedRoomId) {
      setMessages((prev) => [...prev, msg]);
    }
    setRooms((prev) =>
      prev.map((r) =>
        r.id === msg.chatRoomId
          ? { ...r, lastMessage: msg.content, lastMessageAt: msg.createdAt }
          : r
      )
    );
  };

  const { connected, sendMessage } = useChatSocket(selectedRoomId, handleIncoming);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const selectRoom = (id: number) => {
    setSelectedRoomId(id);
    setSearchParams({ roomId: String(id) });
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex h-[calc(100vh-8rem)] border rounded-xl overflow-hidden bg-white">
        <div className="w-72 border-r overflow-y-auto">
          {rooms.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Chưa có cuộc trò chuyện nào</p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room.id)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                  room.id === selectedRoomId ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {room.otherUserFullName ?? room.otherUserEmail}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                {room.relatedRoomTitle && (
                  <p className="text-xs text-gray-400 truncate">Về: {room.relatedRoomTitle}</p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {room.lastMessage ?? "Chưa có tin nhắn"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedRoom ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {selectedRoom.otherUserFullName ?? selectedRoom.otherUserEmail}
                  </p>
                  {selectedRoom.relatedRoomTitle && (
                    <p className="text-xs text-gray-400">Về phòng: {selectedRoom.relatedRoomTitle}</p>
                  )}
                </div>
                <span className={`text-xs ${connected ? "text-green-600" : "text-gray-400"}`}>
                  {connected ? "● Đang kết nối" : "○ Mất kết nối"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderEmail === currentUserEmail;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                          isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border rounded-full px-4 py-2 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!connected}
                  className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
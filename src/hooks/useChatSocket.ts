import { useEffect, useRef, useCallback, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../store/authStore";
import type { Message } from "../types/chat";

export function useChatSocket(
  chatRoomId: number | null,
  onMessage: (msg: Message) => void
) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore((state) => state.accessToken);

  // luôn dùng callback mới nhất mà không cần reconnect socket
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!chatRoomId || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat/${chatRoomId}`, (message: IMessage) => {
          const body: Message = JSON.parse(message.body);
          onMessageRef.current(body);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [chatRoomId, token]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current || !chatRoomId) return;
      clientRef.current.publish({
        destination: "/app/chat.send",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatRoomId, content, messageType: "TEXT" }),
      });
    },
    [chatRoomId]
  );

  return { connected, sendMessage };
}
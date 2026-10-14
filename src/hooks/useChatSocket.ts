import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../store/authStore";
import type { Message } from "../types/chat";

export function useChatSocket(roomIds: number[], onMessage: (msg: Message) => void) {
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<Map<number, StompSubscription>>(new Map());
  const roomIdsRef = useRef<number[]>(roomIds);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  const hasToken = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const syncSubscriptions = useCallback(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    const wanted = new Set(roomIdsRef.current);

    subsRef.current.forEach((sub, id) => {
      if (!wanted.has(id)) {
        sub.unsubscribe();
        subsRef.current.delete(id);
      }
    });

    wanted.forEach((id) => {
      if (subsRef.current.has(id)) return;
      const sub = client.subscribe(`/topic/chat/${id}`, (m: IMessage) => {
        onMessageRef.current(JSON.parse(m.body) as Message);
      });
      subsRef.current.set(id, sub);
    });
  }, []);

  // Danh sách phòng đổi (có phòng mới) thì đồng bộ lại subscription
  const roomKey = roomIds.join(",");
  useEffect(() => {
    roomIdsRef.current = roomIds;
    syncSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey, syncSubscriptions]);

  useEffect(() => {
    if (!hasToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      reconnectDelay: 3000,
      beforeConnect: () => {
        client.connectHeaders = {
          Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}`,
        };
      },
      onConnect: () => {
        setConnected(true);
        subsRef.current.clear();
        syncSubscriptions();
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => {
        setConnected(false);
        subsRef.current.clear();
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subsRef.current.clear();
      clientRef.current = null;
      setConnected(false);
      void client.deactivate();
    };
  }, [hasToken, syncSubscriptions]);

  /** Trả về false nếu đang mất kết nối (tin chưa được gửi). */
  const sendMessage = useCallback((chatRoomId: number, content: string): boolean => {
    const client = clientRef.current;
    if (!client || !client.connected) return false;
    client.publish({
      destination: "/app/chat.send",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatRoomId, content, messageType: "TEXT" }),
    });
    return true;
  }, []);

  return { connected, sendMessage };
}
import axiosClient from "./axiosClient";
import type { ChatRoom, Message } from "../types/chat";

export const chatApi = {
  createOrGetRoom: async (targetUserId: number, relatedRoomId?: number): Promise<ChatRoom> => {
    const res = await axiosClient.post<ChatRoom>("/chat/rooms", {
      targetUserId,
      relatedRoomId: relatedRoomId ?? null,
    });
    return res.data;
  },

  getMyRooms: async (): Promise<ChatRoom[]> => {
    const res = await axiosClient.get<ChatRoom[]>("/chat/rooms");
    return res.data;
  },

  getMessages: async (chatRoomId: number, page = 0, size = 30): Promise<Message[]> => {
    const res = await axiosClient.get<Message[]>(`/chat/rooms/${chatRoomId}/messages`, {
      params: { page, size },
    });
    return res.data;
  },

  markAsRead: (chatRoomId: number) => axiosClient.put(`/chat/rooms/${chatRoomId}/read`),
};
import axiosClient from "./axiosClient";
import type { ChatbotHistoryItem, ChatbotMessageResponse } from "../types/chatbot";

export const chatbotApi = {
    sendMessage: async (message: string, sessionId: string | null): Promise<ChatbotMessageResponse> => {
        const res = await axiosClient.post<ChatbotMessageResponse>("/chatbot/message", {
            sessionId,
            message,
        });
        return res.data;
    },

    getHistory: async (sessionId: string): Promise<ChatbotHistoryItem[]> => {
        const res = await axiosClient.get<ChatbotHistoryItem[]>(`/chatbot/history/${sessionId}`);
        return res.data;
    },
};
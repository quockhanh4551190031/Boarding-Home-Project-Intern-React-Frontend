import type { Room } from "./room";

export type ChatSenderRole = "USER" | "BOT";

export interface ChatbotHistoryItem {
  role: ChatSenderRole;
  content: string;
  createdAt: string;
}

export interface ChatbotMessageResponse {
  sessionId: string;
  reply: string;
  suggestedRooms: Room[];
}
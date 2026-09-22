export interface ChatRoom {
  id: number;
  otherUserId: number;
  otherUserEmail: string;
  otherUserFullName: string | null;
  relatedRoomId: number | null;
  relatedRoomTitle: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderEmail: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "ROOM_SHARE";
  isRead: boolean;
  createdAt: string;
}
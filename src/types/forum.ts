export interface ForumPost {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string | null;
  title: string;
  content: string;
  sharedRoomId: number | null;
  sharedRoomTitle: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  createdAt: string;
}

export interface ForumComment {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string | null;
  content: string;
  parentCommentId: number | null;
  createdAt: string;
}

export interface PostFormData {
  title: string;
  content: string;
  sharedRoomId: number | null;
}

export type ReportTargetType = "ROOM" | "POST" | "COMMENT" | "USER";
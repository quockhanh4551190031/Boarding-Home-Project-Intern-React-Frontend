import axiosClient from "./axiosClient";
import type { ForumComment, ForumPost, PostFormData, ReportTargetType } from "../types/forum";

export const forumApi = {
  getPosts: async (page = 0, size = 10): Promise<ForumPost[]> => {
    const res = await axiosClient.get<ForumPost[]>("/forum/posts", { params: { page, size } });
    return res.data;
  },

  getPost: async (id: number): Promise<ForumPost> => {
    const res = await axiosClient.get<ForumPost>(`/forum/posts/${id}`);
    return res.data;
  },

  createPost: async (data: PostFormData): Promise<ForumPost> => {
    const res = await axiosClient.post<ForumPost>("/forum/posts", data);
    return res.data;
  },

  deletePost: (id: number) => axiosClient.delete(`/forum/posts/${id}`),

  // Trả về trạng thái mới: true = vừa like, false = vừa bỏ like
  toggleLike: async (id: number): Promise<boolean> => {
    const res = await axiosClient.post<{ liked: boolean }>(`/forum/posts/${id}/like`);
    return res.data.liked;
  },

  getComments: async (postId: number): Promise<ForumComment[]> => {
    const res = await axiosClient.get<ForumComment[]>(`/forum/posts/${postId}/comments`);
    return res.data;
  },

  addComment: async (postId: number, content: string, parentCommentId?: number): Promise<ForumComment> => {
    const res = await axiosClient.post<ForumComment>(`/forum/posts/${postId}/comments`, {
      content,
      parentCommentId: parentCommentId ?? null,
    });
    return res.data;
  },

  deleteComment: (id: number) => axiosClient.delete(`/forum/comments/${id}`),

  report: (targetType: ReportTargetType, targetId: number, reason: string) =>
    axiosClient.post("/forum/report", { targetType, targetId, reason }),
};
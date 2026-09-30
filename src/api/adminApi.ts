import axiosClient from "./axiosClient";
import type { AdminReport, AdminStats, AdminUser, PostStatus, ReportStatus, UserStatus } from "../types/admin";
import type { ForumPost } from "../types/forum";
import axios from "axios";

export const adminApi = {
    getStats: async (): Promise<AdminStats> => {
        const res = await axiosClient.get<AdminStats>("/admin/stats");
        return res.data;
    },

    getUsers: async (params: {
        role?: string;
        status?: string;
        keyword?: string;
        page?: number;
        size?: number;
    }): Promise<AdminUser[]> => {
        const res = await axiosClient.get<AdminUser[]>("/admin/users", { params });
        return res.data;
    },

    updateUserStatus: async (id: number, status: UserStatus): Promise<AdminUser> => {
        const res = await axiosClient.put<AdminUser>(`/admin/users/${id}/status`, { status });
        return res.data;
    },

    getPosts: async (params: { status?: PostStatus; page?: number; size?: number }): Promise<ForumPost[]> => {
        const res = await axiosClient.get<ForumPost[]>("/admin/posts", { params });
        return res.data;
    },

    updatePostStatus: async (id: number, status: PostStatus) =>
        axiosClient.put(`/admin/posts/${id}/status`, { status }),

    getReports: async (params: {
        status?: ReportStatus;
        page?: number;
        size?: number;
    }): Promise<AdminReport[]> => {
        const res = await axiosClient.get<AdminReport[]>("/admin/reports", { params });
        return res.data;
    },

    updateReportStatus: async (id: number, status: ReportStatus): Promise<AdminReport> => {
        const res = await axiosClient.put<AdminReport>(`/admin/reports/${id}`, { status });
        return res.data;
    },
}
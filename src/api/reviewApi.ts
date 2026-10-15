import axiosClient from "./axiosClient";
import type {
    Review,
    ReviewFormData,
    ReviewList,
    ReviewSummaryItem,
    ReviewTargetType,
} from "../types/review";

export const reviewApi = {
    getList: async (type: ReviewTargetType, id: number, page = 0, size = 10): Promise<ReviewList> => {
        const res = await axiosClient.get<ReviewList>(`/reviews/${type}/${id}`, { params: { page, size } });
        return res.data;
    },

    save: async (type: ReviewTargetType, id: number, data: ReviewFormData): Promise<Review> => {
        const res = await axiosClient.put<Review>(`/reviews/${type}/${id}`, {
            rating: data.rating,
            comment: data.comment,
        });
        return res.data;
    },

    remove: (id: number) => axiosClient.delete(`/reviews/${id}`),

    getSummaries: async (
        type: ReviewTargetType,
        ids: number[]
    ): Promise<Record<number, ReviewSummaryItem>> => {
        if (ids.length === 0) return {};
        const res = await axiosClient.get<Record<number, ReviewSummaryItem>>("/reviews/summary", {
            params: { targetType: type, ids: ids.join(",") },
        });
        return res.data;
    },
};
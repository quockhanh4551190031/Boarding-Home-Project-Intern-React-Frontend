import axiosClient from "./axiosClient";
import type { SearchResult } from "../types/search";

export const searchApi = {
    search: async (q: string, limit = 5): Promise<SearchResult> => {
        const res = await axiosClient.get<SearchResult>("/search", { params: { q, limit } });
        return res.data;
    },
};
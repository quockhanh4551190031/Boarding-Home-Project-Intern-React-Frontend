import axiosClient from "./axiosClient";
import type { PublicProfile } from "../types/user";

export const userApi = {
    getPublicProfile: async (id: number): Promise<PublicProfile> => {
        const res = await axiosClient.get<PublicProfile>(`/users/${id}/public-profile`);
        return res.data;
    },
};
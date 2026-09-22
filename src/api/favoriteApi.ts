import axiosClient from "./axiosClient";
import type { Favorite } from "../types/favorite";

export const favoriteApi = {
  add: (roomId: number) => axiosClient.post<Favorite>(`/favorites/${roomId}`),
  remove: (roomId: number) => axiosClient.delete(`/favorites/${roomId}`),
  getMine: async (): Promise<Favorite[]> => {
    const res = await axiosClient.get<Favorite[]>("/favorites");
    return res.data;
  },
  checkStatus: async (roomId: number): Promise<boolean> => {
    const res = await axiosClient.get<{ favorited: boolean }>(`/favorites/${roomId}/status`);
    return res.data.favorited;
  },
};
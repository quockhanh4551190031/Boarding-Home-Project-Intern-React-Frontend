import axiosClient from "./axiosClient";
import type { BoardingHouse, HouseFormData } from "../types/house";

export const houseApi = {
  getMine: async (): Promise<BoardingHouse[]> => {
    const res = await axiosClient.get<BoardingHouse[]>("/houses/mine");
    return res.data;
  },
  create: async (data: HouseFormData): Promise<BoardingHouse> => {
    const res = await axiosClient.post<BoardingHouse>("/houses", data);
    return res.data;
  },
  update: async (id: number, data: HouseFormData): Promise<BoardingHouse> => {
    const res = await axiosClient.put<BoardingHouse>(`/houses/${id}`, data);
    return res.data;
  },
  remove: (id: number) => axiosClient.delete(`/houses/${id}`),
};

export const locationApi = {
  getProvinces: async (): Promise<string[]> => {
    const res = await axiosClient.get<string[]>("/locations/provinces");
    return res.data;
  },
  getWards: async (province: string): Promise<string[]> => {
    const res = await axiosClient.get<string[]>("/locations/wards", { params: { province } });
    return res.data;
  },
};
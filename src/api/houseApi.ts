import axiosClient from "./axiosClient";
import type { BoardingHouse, HouseFormData, HouseSearchParams, HouseSearchResponse } from "../types/house";

export const houseApi = {
  getById: async (id: number): Promise<BoardingHouse> => {
    const res = await axiosClient.get<BoardingHouse>(`/houses/${id}`);
    return res.data;
  },
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
  search: async (p: HouseSearchParams): Promise<HouseSearchResponse> => {
    const qs = new URLSearchParams();
    const put = (key: string, value: string | number | undefined | null) => {
      if (value !== undefined && value !== null && value !== "") qs.append(key, String(value));
    };

    put("keyword", p.keyword?.trim());
    put("minPrice", p.minPrice);
    put("maxPrice", p.maxPrice);
    put("minArea", p.minArea);
    put("maxArea", p.maxArea);
    put("city", p.city);
    put("ward", p.ward);
    // Lặp tham số: amenityIds=1&amenityIds=2 (Spring không nhận dạng amenityIds[]=1 của Axios)
    p.amenityIds?.forEach((id) => qs.append("amenityIds", String(id)));
    put("lat", p.lat);
    put("lng", p.lng);
    put("radiusKm", p.radiusKm);
    put("sortBy", p.sortBy);
    put("page", p.page ?? 0);
    put("size", p.size ?? 12);

    const res = await axiosClient.get<HouseSearchResponse>(`/houses/search?${qs.toString()}`);
    return res.data;
  },
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
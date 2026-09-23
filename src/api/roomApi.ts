import axiosClient from "./axiosClient";
import type { Amenity, Room, RoomFormData, RoomSearchParams, RoomSearchResponse } from "../types/room";

export const roomApi = {
    search: async (params: RoomSearchParams): Promise<RoomSearchResponse> => {
        const response = await axiosClient.get<RoomSearchResponse>("/rooms/search", {
            params: {
                ...params,
                amenityIds: params.amenityIds?.length ? params.amenityIds : undefined,
            },
        });
        return response.data;
    },

    getAmenities: async (): Promise<Amenity[]> => {
        const response = await axiosClient.get<Amenity[]>("/amenities");
        return response.data;
    },

    getById: async (id: number): Promise<Room> => {
      const response = await axiosClient.get<Room>(`/rooms/${id}`);
      return response.data;
    },

    getMine: async (): Promise<Room[]> => {
      const res = await axiosClient.get<Room[]>("/rooms/mine");
      return res.data;
    },

    create: async (data: RoomFormData): Promise<Room> => {
      const res = await axiosClient.post<Room>("/rooms", data);
      return res.data;
    },

    update: async (id: number, data: RoomFormData): Promise<Room> => {
      const res = await axiosClient.put<Room>(`/rooms/${id}`, data);
      return res.data;
    },

    remove: (id: number) => axiosClient.delete(`/rooms/${id}`),

    addImage: async (roomId: number, imageUrl: string, thumbnail: boolean) => {
      const res = await axiosClient.post(`/rooms/${roomId}/images`, { imageUrl, thumbnail });
      return res.data;
    },

    deleteImage: (roomId: number, imageId: number) =>
      axiosClient.delete(`/rooms/${roomId}/images/${imageId}`),
};
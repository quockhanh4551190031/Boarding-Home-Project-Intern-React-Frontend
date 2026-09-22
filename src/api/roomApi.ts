import axiosClient from "./axiosClient";
import type {Amenity, RoomSearchParams, RoomSearchResponse} from "../types/room";

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
};
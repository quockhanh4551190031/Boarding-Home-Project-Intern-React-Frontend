import type { RoomSearchParams } from "./room";

export interface BoardingHouse {
  id: number;
  landlordId: number;
  name: string;
  address: string;
  ward: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  roomCount: number;
  images: string[];
  createdAt: string;
}

export interface HouseFormData {
  name: string;
  address: string;
  ward: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface HouseSearchItem {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  roomCount: number;
  minPrice: number;
  maxPrice: number;
  thumbnail: string | null;
  distanceKm: number | null;
}

export interface HouseSearchResponse {
  houses: HouseSearchItem[];
  currentPage: number;
  totalPages: number;
  totalHouses: number;
  totalRooms: number;
  hasNext: boolean;
}

export type HouseSearchParams = Omit<RoomSearchParams, "sortBy"> & {
  sortBy?: RoomSearchParams["sortBy"] | "DISTANCE";
  lat?: number;
  lng?: number;
  radiusKm?: number;
};
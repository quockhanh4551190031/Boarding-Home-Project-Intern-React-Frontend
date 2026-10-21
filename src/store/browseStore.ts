import { create } from "zustand";
import type { RoomSearchParams } from "../types/room";
import type { GeoPoint } from "../utils/geo";

export type BrowseView = "list" | "map";

export const defaultFilters: RoomSearchParams = { page: 0, size: 12, sortBy: "NEWEST" };

interface BrowseState {
    filters: RoomSearchParams;
    view: BrowseView;
    near: GeoPoint | null;
    radiusKm: number | null;
    setFilters: (filters: RoomSearchParams) => void;
    setView: (view: BrowseView) => void;
    setNear: (near: GeoPoint | null) => void;
    setRadiusKm: (radiusKm: number | null) => void;
}

// Chỉ giữ trong bộ nhớ (không lưu vào localStorage): vị trí của người dùng không được ghi lại
export const useBrowseStore = create<BrowseState>((set) => ({
    filters: defaultFilters,
    view: "list",
    near: null,
    radiusKm: null,
    setFilters: (filters) => set({ filters }),
    setView: (view) => set({ view }),
    setNear: (near) => set({ near }),
    setRadiusKm: (radiusKm) => set({ radiusKm }),
}));
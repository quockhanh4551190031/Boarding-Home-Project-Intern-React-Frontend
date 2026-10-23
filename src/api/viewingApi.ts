import axiosClient from "./axiosClient";
import { normalizePhone } from "../utils/profile";
import type { LandlordScope, TenantScope, Viewing, ViewingList, ViewingRoomState } from "../types/viewing";

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export const viewingApi = {
    create: async (p: { roomId: number; scheduledAt: string; message: string; contactPhone: string }): Promise<Viewing> => {
        const res = await axiosClient.post<Viewing>("/viewings", {
            roomId: p.roomId,
            scheduledAt: p.scheduledAt,
            message: orNull(p.message),
            contactPhone: orNull(normalizePhone(p.contactPhone)),
        });
        return res.data;
    },

    mine: async (scope: TenantScope, page: number, size = 10): Promise<ViewingList> => {
        const res = await axiosClient.get<ViewingList>("/viewings/mine", { params: { scope, page, size } });
        return res.data;
    },

    incoming: async (scope: LandlordScope, page: number, size = 10): Promise<ViewingList> => {
        const res = await axiosClient.get<ViewingList>("/viewings/incoming", { params: { scope, page, size } });
        return res.data;
    },

    accept: async (id: number): Promise<Viewing> => (await axiosClient.put<Viewing>(`/viewings/${id}/accept`)).data,

    reject: async (id: number, note: string): Promise<Viewing> =>
        (await axiosClient.put<Viewing>(`/viewings/${id}/reject`, { note: orNull(note) })).data,

    cancel: async (id: number, note: string): Promise<Viewing> =>
        (await axiosClient.put<Viewing>(`/viewings/${id}/cancel`, { note: orNull(note) })).data,

    roomState: async (roomId: number): Promise<ViewingRoomState> =>
        (await axiosClient.get<ViewingRoomState>(`/viewings/room/${roomId}/state`)).data,

    pendingCount: async (): Promise<number> =>
        (await axiosClient.get<{ count: number }>("/viewings/pending-count")).data.count,
};
import { create } from "zustand";
import { viewingApi } from "../api/viewingApi";

interface ViewingState {
    pending: number;
    setPending: (n: number) => void;
}

export const useViewingStore = create<ViewingState>((set) => ({
    pending: 0,
    setPending: (pending) => set({ pending }),
}));

export function refreshPendingViewings() {
    viewingApi
        .pendingCount()
        .then((n) => useViewingStore.getState().setPending(n))
        .catch(() => { });
}
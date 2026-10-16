import { create } from "zustand";

interface PhoneGateState {
    needsPhone: boolean | null;
    setNeedsPhone: (value: boolean | null) => void;
}

export const usePhoneGateStore = create<PhoneGateState>((set) => ({
    needsPhone: null,
    setNeedsPhone: (needsPhone) => set({ needsPhone }),
}));
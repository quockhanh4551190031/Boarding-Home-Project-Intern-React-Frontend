import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {AuthResponse, Role} from "../types/auth";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    email: string | null;
    role: Role | null;
    isAuthenticated: boolean;
    setAuth: (auth: AuthResponse) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            email: null,
            role: null,
            isAuthenticated: false,
            setAuth: (auth) =>
                set({
                    accessToken: auth.accessToken,
                    refreshToken: auth.refreshToken,
                    email: auth.email,
                    role: auth.role,
                    isAuthenticated: true,
                }),
            logout: () =>
                set({
                    accessToken: null,
                    refreshToken: null,
                    email: null,
                    role: null,
                    isAuthenticated: false,
                }),
        }),
        { name: "auth-storage" } // lưu vào localStorage, tự khôi phục khi reload trang
    )
);
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface FromState {
    from?: { pathname?: string; search?: string; hash?: string };
}

/** Chuyển sang /login và ghi nhớ trang hiện tại để quay lại sau khi đăng nhập. */
export function useLoginRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    return useCallback(() => {
        navigate("/login", { state: { from: location } });
    }, [navigate, location]);
}

/** Trang cần quay về sau khi đăng nhập hoặc đăng ký (mặc định là "/"). */
export function useAuthRedirectTarget(): string {
    const location = useLocation();
    const from = (location.state as FromState | null)?.from;
    if (!from?.pathname) return "/";
    if (from.pathname.startsWith("/login") || from.pathname.startsWith("/register")) return "/";
    return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
}
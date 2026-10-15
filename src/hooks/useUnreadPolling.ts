import { useEffect } from "react";
import { chatApi } from "../api/chatApi";
import { useAuthStore } from "../store/authStore";
import { useUnreadStore } from "../store/unreadStore";

const POLL_MS = 30000;

/** Hỏi server số tin chưa đọc. `paused` bật khi đang ở trang chat (trang đó tự cập nhật số). */
export function useUnreadPolling(paused: boolean) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setCount = useUnreadStore((s) => s.setCount);

    useEffect(() => {
        if (!isAuthenticated) {
            setCount(0);
            return;
        }
        if (paused) return;

        let cancelled = false;
        const refresh = () => {
            if (document.hidden) return;
            chatApi
                .getUnreadCount()
                .then((n) => {
                    if (!cancelled) setCount(n);
                })
                .catch(() => { });
        };

        refresh();
        const timer = window.setInterval(refresh, POLL_MS);
        document.addEventListener("visibilitychange", refresh);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [isAuthenticated, paused, setCount]);
}
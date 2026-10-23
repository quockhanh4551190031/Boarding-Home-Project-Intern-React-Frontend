import { useEffect } from "react";
import { viewingApi } from "../api/viewingApi";
import { useAuthStore } from "../store/authStore";
import { useViewingStore } from "../store/viewingStore";

const POLL_MS = 60000;

/** Chủ trọ: định kỳ hỏi số yêu cầu xem phòng đang chờ xác nhận. */
export function useViewingPolling() {
    const isLandlord = useAuthStore((s) => s.isAuthenticated && s.role === "LANDLORD");
    const setPending = useViewingStore((s) => s.setPending);

    useEffect(() => {
        if (!isLandlord) {
            setPending(0);
            return;
        }
        let cancelled = false;
        const refresh = () => {
            if (document.hidden) return;
            viewingApi
                .pendingCount()
                .then((n) => {
                    if (!cancelled) setPending(n);
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
    }, [isLandlord, setPending]);
}
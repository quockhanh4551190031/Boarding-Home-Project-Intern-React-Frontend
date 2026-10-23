import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { viewingApi } from "../api/viewingApi";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import Badge from "./ui/Badge";
import ViewingRequestModal from "./ViewingRequestModal";
import { btnPrimary } from "./ui/styles";
import { formatSlotDate, formatSlotTime, statusInfo } from "../utils/viewing";
import type { ViewingRoomState } from "../types/viewing";

interface Props {
    roomId: number;
    roomTitle: string;
}

export default function ViewingPanel({ roomId, roomTitle }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const goLogin = useLoginRedirect();

    const [state, setState] = useState<ViewingRoomState | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setState(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setFailed(false);
        viewingApi
            .roomState(roomId)
            .then((s) => {
                if (!cancelled) setState(s);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [roomId, isAuthenticated, reloadKey]);

    const bookButton = (onClick: () => void) => (
        <button type="button" onClick={onClick} className={`${btnPrimary} w-full h-11`}>
            <span className="material-symbols-outlined !text-[20px]">event_available</span>
            Đặt lịch xem phòng
        </button>
    );

    if (!isAuthenticated) return bookButton(goLogin);

    if (loading && !state) return <div className="h-11 rounded-lg bg-surface-container animate-pulse" />;

    if (failed || !state) {
        return (
            <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-sm text-on-surface-variant hover:text-primary-container text-left"
            >
                Không tải được lịch hẹn. Bấm để thử lại.
            </button>
        );
    }

    if (state.active) {
        const info = statusInfo(state.active, "tenant");
        return (
            <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-on-surface">Bạn đã đặt lịch xem phòng</p>
                    <Badge tone={info.tone} dot>
                        {info.label}
                    </Badge>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-on-surface">
                    <span className="material-symbols-outlined !text-[18px] text-primary">event</span>
                    <span className="tabular-nums">{formatSlotTime(state.active.scheduledAt)}</span>
                    <span className="text-on-surface-variant">· {formatSlotDate(state.active.scheduledAt)}</span>
                </p>
                <Link to="/viewings" className="text-sm font-medium text-primary-container hover:underline">
                    Xem lịch hẹn của tôi
                </Link>
            </div>
        );
    }

    if (!state.canRequest) {
        return state.reason ? (
            <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2.5">{state.reason}</p>
        ) : null;
    }

    return (
        <>
            {bookButton(() => setOpen(true))}
            {open && (
                <ViewingRequestModal
                    roomId={roomId}
                    roomTitle={roomTitle}
                    onClose={() => setOpen(false)}
                    onCreated={() => setReloadKey((k) => k + 1)}
                />
            )}
        </>
    );
}
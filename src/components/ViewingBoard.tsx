import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { viewingApi } from "../api/viewingApi";
import ViewingActionDialog from "./ViewingActionDialog";
import ViewingCard from "./ViewingCard";
import Pager from "./ui/Pager";
import Segmented from "./ui/Segmented";
import { alertErrorCls, btnPrimary, btnSecondary } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import { formatSlotDate, formatSlotTime } from "../utils/viewing";
import type { Perspective, Viewing, ViewingList } from "../types/viewing";

const PAGE_SIZE = 10;

interface EmptyInfo {
    title: string;
    hint: string;
    cta?: { to: string; label: string };
}

interface Props<S extends string> {
    perspective: Perspective;
    scopes: { value: S; label: string }[];
    fetch: (scope: S, page: number, size: number) => Promise<ViewingList>;
    empty: Record<S, EmptyInfo>;
    onChanged?: () => void;
    onLoaded?: (scope: S, list: ViewingList) => void;
}

type DialogState = { kind: "reject" | "cancel"; viewing: Viewing } | null;

export default function ViewingBoard<S extends string>({
    perspective,
    scopes,
    fetch,
    empty,
    onChanged,
    onLoaded,
}: Props<S>) {
    const [scope, setScope] = useState<S>(scopes[0].value);
    const [page, setPage] = useState(0);
    const [data, setData] = useState<ViewingList | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [dialog, setDialog] = useState<DialogState>(null);

    // Giữ hàm mới nhất trong ref để effect không chạy lại mỗi lần cha render
    const fetchRef = useRef(fetch);
    const loadedRef = useRef(onLoaded);
    const changedRef = useRef(onChanged);
    useEffect(() => {
        fetchRef.current = fetch;
        loadedRef.current = onLoaded;
        changedRef.current = onChanged;
    });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        fetchRef
            .current(scope, page, PAGE_SIZE)
            .then((res) => {
                if (cancelled) return;
                // Vừa xử lý hết dòng cuối của trang: lùi về trang trước
                if (res.items.length === 0 && page > 0) {
                    setPage(page - 1);
                    return;
                }
                setData(res);
                loadedRef.current?.(scope, res);
            })
            .catch((err) => {
                if (!cancelled) setLoadError(apiErrorMessage(err, "Không tải được lịch hẹn"));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [scope, page, reloadKey]);

    const changed = () => {
        setReloadKey((k) => k + 1);
        changedRef.current?.();
    };

    const handleAccept = async (v: Viewing) => {
        setBusyId(v.id);
        setNotice(null);
        try {
            await viewingApi.accept(v.id);
        } catch (err) {
            setNotice(apiErrorMessage(err, "Không thể xác nhận lịch hẹn, thử lại sau"));
        } finally {
            setBusyId(null);
            changed();
        }
    };

    const confirmDialog = async (note: string) => {
        if (!dialog) return;
        const { kind, viewing } = dialog;
        try {
            if (kind === "reject") await viewingApi.reject(viewing.id, note);
            else await viewingApi.cancel(viewing.id, note);
        } finally {
            changed(); // thành công hay thất bại đều tải lại để thấy trạng thái mới nhất
        }
    };

    const emptyInfo = empty[scope];
    let body: ReactNode;

    if (loadError) {
        body = (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm py-14 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined !text-[40px] text-outline">cloud_off</span>
                <p className="font-medium text-on-surface">{loadError}</p>
                <button onClick={() => setReloadKey((k) => k + 1)} className={btnSecondary}>
                    Thử lại
                </button>
            </div>
        );
    } else if (loading && !data) {
        body = (
            <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="h-44 bg-surface-container rounded-xl" />
                ))}
            </div>
        );
    } else if (data && data.items.length === 0) {
        body = (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm py-14 flex flex-col items-center gap-2 text-center px-4">
                <span className="material-symbols-outlined !text-[40px] text-outline">event_busy</span>
                <p className="font-medium text-on-surface">{emptyInfo.title}</p>
                <p className="text-sm text-on-surface-variant">{emptyInfo.hint}</p>
                {emptyInfo.cta && (
                    <Link to={emptyInfo.cta.to} className={`${btnPrimary} mt-2`}>
                        {emptyInfo.cta.label}
                    </Link>
                )}
            </div>
        );
    } else if (data) {
        body = (
            <div className="flex flex-col gap-3">
                {data.items.map((v) => (
                    <ViewingCard
                        key={v.id}
                        viewing={v}
                        perspective={perspective}
                        busy={busyId === v.id}
                        onAccept={handleAccept}
                        onReject={(x) => setDialog({ kind: "reject", viewing: x })}
                        onCancel={(x) => setDialog({ kind: "cancel", viewing: x })}
                    />
                ))}

                {(page > 0 || data.hasNext) && (
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm">
                        <Pager page={page} hasMore={data.hasNext} disabled={loading} onChange={setPage} />
                    </div>
                )}
            </div>
        );
    }

    const target = dialog?.viewing;
    const targetText = target ? `${formatSlotTime(target.scheduledAt)}, ${formatSlotDate(target.scheduledAt)}` : "";

    return (
        <div>
            <div className="mb-4">
                <Segmented<S>
                    options={scopes}
                    value={scope}
                    onChange={(v) => {
                        setScope(v);
                        setPage(0);
                    }}
                />
            </div>

            {notice && <div className={`${alertErrorCls} mb-4`}>{notice}</div>}

            <div className={loading && data ? "opacity-60 transition-opacity" : ""}>{body}</div>

            {dialog && target && (
                <ViewingActionDialog
                    title={dialog.kind === "reject" ? "Từ chối lịch hẹn" : "Hủy lịch hẹn"}
                    description={
                        <>
                            {dialog.kind === "reject" ? "Từ chối" : "Hủy"} lịch xem phòng{" "}
                            <strong className="text-on-surface">{target.roomTitle}</strong> lúc {targetText}? Bên còn lại sẽ nhận
                            được thông báo qua tin nhắn.
                        </>
                    }
                    noteLabel={dialog.kind === "reject" ? "Lý do từ chối" : "Lý do hủy"}
                    placeholder={
                        dialog.kind === "reject"
                            ? "Ví dụ: giờ này mình bận, bạn chọn giờ khác giúp mình nhé"
                            : "Ví dụ: mình có việc đột xuất, xin lỗi bạn"
                    }
                    confirmLabel={dialog.kind === "reject" ? "Từ chối" : "Hủy lịch hẹn"}
                    onConfirm={confirmDialog}
                    onClose={() => setDialog(null)}
                />
            )}
        </div>
    );
}
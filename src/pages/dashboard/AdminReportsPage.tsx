import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import Badge from "../../components/ui/Badge";
import type { BadgeTone } from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";
import Pager from "../../components/ui/Pager";
import Segmented from "../../components/ui/Segmented";
import TableSkeleton from "../../components/ui/TableSkeleton";
import {
    alertErrorCls,
    btnSmPrimary,
    btnSmSecondary,
    tableCardCls,
    thCls,
} from "../../components/ui/styles";
import { timeAgo } from "../../utils/time";
import type { AdminReport, ReportStatus } from "../../types/admin";

const PAGE_SIZE = 20;

type Filter = "" | ReportStatus;

const filterOptions: { value: Filter; label: string }[] = [
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "RESOLVED", label: "Đã xử lý" },
    { value: "REJECTED", label: "Đã từ chối" },
    { value: "", label: "Tất cả" },
];

const statusLabel: Record<ReportStatus, string> = {
    PENDING: "Chờ xử lý",
    RESOLVED: "Đã xử lý",
    REJECTED: "Đã từ chối",
};
const statusTone: Record<ReportStatus, BadgeTone> = {
    PENDING: "warning",
    RESOLVED: "success",
    REJECTED: "neutral",
};

const targetLabel: Record<string, string> = {
    ROOM: "Phòng trọ",
    POST: "Bài đăng",
    COMMENT: "Bình luận",
    USER: "Người dùng",
};

function targetLink(type: string, id: number): string | null {
    if (type === "ROOM") return `/rooms/${id}`;
    if (type === "POST") return `/forum/${id}`;
    return null;
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [filter, setFilter] = useState<Filter>("PENDING");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        adminApi
            .getReports({ status: filter || undefined, page, size: PAGE_SIZE })
            .then((res) => {
                if (cancelled) return;
                setReports(res);
                setHasMore(res.length === PAGE_SIZE);
            })
            .catch(() => {
                if (!cancelled) setError("Không tải được danh sách báo cáo");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [filter, page]);

    const resolve = async (id: number, next: ReportStatus) => {
        setError(null);
        setBusyId(id);
        try {
            const updated = await adminApi.updateReportStatus(id, next);
            setReports((prev) =>
                filter && updated.status !== filter
                    ? prev.filter((r) => r.id !== id)
                    : prev.map((r) => (r.id === id ? updated : r))
            );
        } catch {
            setError("Không thể cập nhật báo cáo, thử lại sau");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            <PageHeader
                eyebrow="Quản trị"
                note="Kiểm duyệt"
                title="Báo cáo vi phạm"
                description="Xem xét các báo cáo từ người dùng và đánh dấu kết quả xử lý."
                actions={
                    <Segmented
                        options={filterOptions}
                        value={filter}
                        onChange={(v) => {
                            setFilter(v);
                            setPage(0);
                        }}
                    />
                }
            />

            {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

            <div className={tableCardCls}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[820px]">
                        <thead className="bg-surface-container-low select-none">
                            <tr>
                                <th className={`${thCls} text-left`}>Người báo cáo</th>
                                <th className={`${thCls} text-left`}>Đối tượng</th>
                                <th className={`${thCls} text-left`}>Lý do</th>
                                <th className={`${thCls} text-left`}>Thời gian</th>
                                <th className={`${thCls} text-left`}>Trạng thái</th>
                                <th className={`${thCls} text-right`}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40">
                            {loading ? (
                                <TableSkeleton cols={6} />
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-14 text-center text-on-surface-variant select-none">
                                        <span className="material-symbols-outlined !text-[36px] text-outline block mb-1">
                                            task_alt
                                        </span>
                                        Không có báo cáo nào
                                    </td>
                                </tr>
                            ) : (
                                reports.map((r) => {
                                    const link = targetLink(r.targetType, r.targetId);
                                    return (
                                        <tr key={r.id} className="align-top hover:bg-surface-container-low/60 transition-colors">
                                            <td className="px-4 py-3 text-on-surface">{r.reporterEmail}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <Badge tone="neutral">{targetLabel[r.targetType] ?? r.targetType}</Badge>
                                                    <span className="text-on-surface-variant tabular-nums">#{r.targetId}</span>
                                                    {link && (
                                                        <Link
                                                            to={link}
                                                            target="_blank"
                                                            className="text-primary-container text-xs font-medium hover:underline"
                                                        >
                                                            Xem
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 max-w-xs">
                                                <p className="line-clamp-2 text-on-surface-variant" title={r.reason}>
                                                    {r.reason}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                                                {timeAgo(r.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge tone={statusTone[r.status]} dot>
                                                    {statusLabel[r.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {r.status === "PENDING" && (
                                                    <div className="inline-flex gap-1.5">
                                                        <button
                                                            onClick={() => resolve(r.id, "RESOLVED")}
                                                            disabled={busyId === r.id}
                                                            className={btnSmPrimary}
                                                        >
                                                            Đã xử lý
                                                        </button>
                                                        <button
                                                            onClick={() => resolve(r.id, "REJECTED")}
                                                            disabled={busyId === r.id}
                                                            className={btnSmSecondary}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <Pager page={page} hasMore={hasMore} disabled={loading} onChange={setPage} />
            </div>
        </div>
    );
}
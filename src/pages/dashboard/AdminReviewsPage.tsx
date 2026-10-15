import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { reviewApi } from "../../api/reviewApi";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PageHeader from "../../components/ui/PageHeader";
import Pager from "../../components/ui/Pager";
import StarRating from "../../components/ui/StarRating";
import TableSkeleton from "../../components/ui/TableSkeleton";
import { alertErrorCls, btnSmDanger, tableCardCls, thCls } from "../../components/ui/styles";
import { timeAgo } from "../../utils/time";
import type { AdminReview } from "../../types/review";

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [target, setTarget] = useState<AdminReview | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        adminApi
            .getReviews({ page, size: PAGE_SIZE })
            .then((res) => {
                if (cancelled) return;
                setReviews(res);
                setHasMore(res.length === PAGE_SIZE);
            })
            .catch(() => {
                if (!cancelled) setError("Không tải được danh sách đánh giá");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page, reloadKey]);

    const handleDelete = async () => {
        if (!target) return;
        await reviewApi.remove(target.id);
        setReloadKey((k) => k + 1);
    };

    return (
        <div>
            <PageHeader
                eyebrow="Quản trị"
                note="Kiểm duyệt"
                title="Đánh giá"
                description="Xem các đánh giá mới nhất và xóa những đánh giá spam hoặc vi phạm."
            />

            {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

            <div className={tableCardCls}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[860px]">
                        <thead className="bg-surface-container-low">
                            <tr>
                                <th className={`${thCls} text-left`}>Đối tượng</th>
                                <th className={`${thCls} text-left`}>Điểm</th>
                                <th className={`${thCls} text-left`}>Nội dung</th>
                                <th className={`${thCls} text-left`}>Người đánh giá</th>
                                <th className={`${thCls} text-left`}>Thời gian</th>
                                <th className={`${thCls} text-right`}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40">
                            {loading ? (
                                <TableSkeleton cols={6} />
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-14 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined !text-[36px] text-outline block mb-1">star</span>
                                        Chưa có đánh giá nào
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((r) => (
                                    <tr key={r.id} className="align-top hover:bg-surface-container-low/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1 items-start">
                                                <Badge tone={r.targetType === "HOUSE" ? "info" : "neutral"}>
                                                    {r.targetType === "HOUSE" ? "Nhà trọ" : "Phòng"}
                                                </Badge>
                                                <Link
                                                    to={r.targetType === "HOUSE" ? `/houses/${r.targetId}` : `/rooms/${r.targetId}`}
                                                    target="_blank"
                                                    className="text-primary-container font-medium hover:underline line-clamp-1 max-w-48"
                                                >
                                                    {r.targetName}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StarRating value={r.rating} size={14} />
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            {r.comment ? (
                                                <p className="line-clamp-3 text-on-surface-variant whitespace-pre-line" title={r.comment}>
                                                    {r.comment}
                                                </p>
                                            ) : (
                                                <span className="text-xs text-outline">(Không có nhận xét)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-on-surface">{r.authorEmail}</td>
                                        <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => setTarget(r)} className={btnSmDanger}>
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pager page={page} hasMore={hasMore} disabled={loading} onChange={setPage} />
            </div>

            {target && (
                <ConfirmDialog
                    title="Xóa đánh giá"
                    danger
                    confirmLabel="Xóa đánh giá"
                    message={
                        <>
                            Xóa đánh giá {target.rating} sao của <strong className="text-on-surface">{target.authorEmail}</strong>{" "}
                            cho <strong className="text-on-surface">{target.targetName}</strong>? Hành động này không thể hoàn tác.
                        </>
                    }
                    onConfirm={handleDelete}
                    onClose={() => setTarget(null)}
                />
            )}
        </div>
    );
}
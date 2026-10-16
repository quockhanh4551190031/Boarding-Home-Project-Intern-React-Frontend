import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { reviewApi } from "../api/reviewApi";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import { UserAvatarLink, UserNameLink } from "./ui/UserLink";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import StarInput from "./ui/StarInput";
import StarRating from "./ui/StarRating";
import { alertErrorCls, btnPrimary, btnSecondary, btnSmSecondary, textareaCls } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import { timeAgo } from "../utils/time";
import type { Review, ReviewList, ReviewSummary, ReviewTargetType } from "../types/review";

const PAGE_SIZE = 10;
const MAX_COMMENT = 1000;
const cardCls = "bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-6";

interface Props {
    targetType: ReviewTargetType;
    targetId: number;
    noun: string; // "nhà trọ" hoặc "phòng"
    onSummaryChange?: (summary: ReviewSummary) => void;
}

export default function ReviewSection({ targetType, targetId, noun, onSummaryChange }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const role = useAuthStore((s) => s.role);
    const goLogin = useLoginRedirect();

    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [myReview, setMyReview] = useState<Review | null>(null);
    const [canReview, setCanReview] = useState(false);
    const [reason, setReason] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [moreLoading, setMoreLoading] = useState(false);
    const [moreError, setMoreError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

    const summaryCb = useRef(onSummaryChange);
    useEffect(() => {
        summaryCb.current = onSummaryChange;
    }, [onSummaryChange]);

    const applyFirst = useCallback((res: ReviewList, resetForm: boolean) => {
        setReviews(res.reviews);
        setHasMore(res.hasMore);
        setPage(0);
        setSummary(res.summary);
        setMyReview(res.myReview);
        setCanReview(res.canReview);
        setReason(res.cannotReviewReason);
        if (resetForm) {
            setRating(res.myReview?.rating ?? 0);
            setComment(res.myReview?.comment ?? "");
        }
        summaryCb.current?.(res.summary);
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(false);
        reviewApi
            .getList(targetType, targetId, 0, PAGE_SIZE)
            .then((res) => {
                if (!cancelled) applyFirst(res, true);
            })
            .catch(() => {
                if (!cancelled) setLoadError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [targetType, targetId, isAuthenticated, reloadKey, applyFirst]);

    useEffect(() => {
        if (!formSuccess) return;
        const timer = setTimeout(() => setFormSuccess(false), 3500);
        return () => clearTimeout(timer);
    }, [formSuccess]);

    const refresh = async (resetForm: boolean): Promise<boolean> => {
        try {
            applyFirst(await reviewApi.getList(targetType, targetId, 0, PAGE_SIZE), resetForm);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (rating < 1) {
            setFormError("Vui lòng chọn số sao");
            return;
        }
        setSaving(true);
        setFormError(null);
        setFormSuccess(false);

        try {
            await reviewApi.save(targetType, targetId, { rating, comment });
        } catch (err) {
            setFormError(apiErrorMessage(err, "Gửi đánh giá thất bại, thử lại sau"));
            setSaving(false);
            return;
        }

        if (!(await refresh(true))) setReloadKey((k) => k + 1);
        setFormSuccess(true);
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await reviewApi.remove(deleteTarget.id);
        if (!(await refresh(deleteTarget.mine))) setReloadKey((k) => k + 1);
    };

    const loadMore = async () => {
        setMoreLoading(true);
        setMoreError(false);
        try {
            const next = page + 1;
            const res = await reviewApi.getList(targetType, targetId, next, PAGE_SIZE);
            setReviews((prev) => {
                const seen = new Set(prev.map((r) => r.id));
                return [...prev, ...res.reviews.filter((r) => !seen.has(r.id))];
            });
            setPage(next);
            setHasMore(res.hasMore);
        } catch {
            setMoreError(true);
        } finally {
            setMoreLoading(false);
        }
    };

    const dirty = rating !== (myReview?.rating ?? 0) || comment.trim() !== (myReview?.comment ?? "");

    return (
        <section className={cardCls}>
            <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                    <span className="material-symbols-outlined !text-[16px]">star</span>
                </div>
                <h2 className="font-semibold text-on-surface">Đánh giá và nhận xét</h2>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-surface-container rounded-lg" />
                    <div className="h-16 bg-surface-container rounded-lg" />
                </div>
            ) : loadError || !summary ? (
                <div className="py-8 flex flex-col items-center gap-3 text-center">
                    <span className="material-symbols-outlined !text-[36px] text-outline">cloud_off</span>
                    <p className="text-sm text-on-surface-variant">Không tải được đánh giá</p>
                    <button onClick={() => setReloadKey((k) => k + 1)} className={btnSmSecondary}>
                        Thử lại
                    </button>
                </div>
            ) : (
                <>
                    {/* Tổng quan */}
                    <div className="flex flex-col sm:flex-row gap-6 sm:items-center pb-6 border-b border-outline-variant/40">
                        <div className="flex flex-col items-center sm:items-start gap-1 sm:w-44 shrink-0 text-center sm:text-left">
                            {summary.count > 0 ? (
                                <>
                                    <span className="text-5xl font-bold tracking-tight text-on-surface tabular-nums">
                                        {summary.average.toFixed(1)}
                                    </span>
                                    <StarRating value={summary.average} size={20} />
                                    <span className="text-sm text-on-surface-variant tabular-nums">{summary.count} đánh giá</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xl font-bold text-on-surface">Chưa có đánh giá</span>
                                    <span className="text-sm text-on-surface-variant">
                                        Hãy là người đầu tiên chia sẻ trải nghiệm.
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const n = summary.distribution[star - 1] ?? 0;
                                const pct = summary.count > 0 ? (n / summary.count) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center gap-2 text-xs">
                                        <span className="w-8 text-on-surface-variant tabular-nums">{star} ★</span>
                                        <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                                            <div style={{ width: `${pct}%` }} className="h-full bg-amber-500 rounded-full" />
                                        </div>
                                        <span className="w-8 text-right text-on-surface-variant tabular-nums">{n}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Khu vực gửi đánh giá */}
                    <div className="py-6 border-b border-outline-variant/40">
                        {!isAuthenticated ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low rounded-xl p-4">
                                <p className="text-sm text-on-surface-variant">Đăng nhập để chia sẻ đánh giá của bạn.</p>
                                <button onClick={goLogin} className={btnPrimary}>
                                    Đăng nhập
                                </button>
                            </div>
                        ) : !canReview ? (
                            <div className="bg-surface-container-low rounded-xl p-4 text-sm text-on-surface-variant flex items-start gap-2">
                                <span className="material-symbols-outlined !text-[18px] mt-0.5">info</span>
                                {reason ?? `Bạn không thể đánh giá ${noun} này`}
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="border border-outline-variant/50 rounded-xl p-4 flex flex-col gap-3"
                            >
                                <p className="text-sm font-semibold text-on-surface">
                                    {myReview ? "Đánh giá của bạn" : `Đánh giá ${noun} này`}
                                </p>

                                <StarInput value={rating} onChange={setRating} disabled={saving} />

                                <div>
                                    <textarea
                                        rows={3}
                                        maxLength={MAX_COMMENT}
                                        aria-label="Nhận xét"
                                        placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..."
                                        className={textareaCls}
                                        value={comment}
                                        onChange={(e) => {
                                            setComment(e.target.value);
                                            setFormSuccess(false);
                                        }}
                                    />
                                    <div className="flex items-center justify-between mt-1 text-xs text-on-surface-variant">
                                        <span>Không đăng đường dẫn hoặc số điện thoại.</span>
                                        <span className="tabular-nums">
                                            {comment.length}/{MAX_COMMENT}
                                        </span>
                                    </div>
                                </div>

                                {formError && (
                                    <div role="alert" className={alertErrorCls}>
                                        {formError}
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-emerald-700 min-h-5 inline-flex items-center gap-1">
                                        {formSuccess && (
                                            <>
                                                <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                                                Đã lưu đánh giá
                                            </>
                                        )}
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={saving || rating < 1 || (!!myReview && !dirty)}
                                        className={btnPrimary}
                                    >
                                        {saving ? "Đang gửi..." : myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Danh sách */}
                    {reviews.length === 0 ? (
                        <p className="text-sm text-on-surface-variant text-center pt-6">Chưa có nhận xét nào.</p>
                    ) : (
                        <ul className="divide-y divide-outline-variant/40">
                            {reviews.map((r) => (
                                <li key={r.id} className="flex gap-3 py-4 first:pt-6">
                                    <UserAvatarLink userId={r.authorId} name={r.authorName} size="sm" tone="muted" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <UserNameLink userId={r.authorId} className="font-semibold text-sm text-on-surface">
                                                {r.authorName}
                                            </UserNameLink>
                                            {r.mine && <Badge tone="info">Của bạn</Badge>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <StarRating value={r.rating} size={16} />
                                            <span className="text-xs text-on-surface-variant">
                                                {timeAgo(r.createdAt)}
                                                {r.edited && " · đã chỉnh sửa"}
                                            </span>
                                        </div>
                                        {r.comment && (
                                            <p className="text-sm text-on-surface-variant whitespace-pre-line break-words mt-2">
                                                {r.comment}
                                            </p>
                                        )}
                                    </div>
                                    {(r.mine || role === "ADMIN") && (
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(r)}
                                            aria-label="Xóa đánh giá"
                                            title="Xóa đánh giá"
                                            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-colors"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {hasMore && (
                        <div className="text-center pt-4">
                            {moreError && <p className="text-xs text-error mb-2">Không tải thêm được, thử lại.</p>}
                            <button onClick={loadMore} disabled={moreLoading} className={btnSecondary}>
                                {moreLoading ? "Đang tải..." : "Xem thêm đánh giá"}
                            </button>
                        </div>
                    )}
                </>
            )}

            {deleteTarget && (
                <ConfirmDialog
                    title="Xóa đánh giá"
                    danger
                    confirmLabel="Xóa đánh giá"
                    message={
                        deleteTarget.mine ? (
                            "Xóa đánh giá của bạn? Hành động này không thể hoàn tác."
                        ) : (
                            <>
                                Xóa đánh giá của <strong className="text-on-surface">{deleteTarget.authorName}</strong>? Hành động
                                này không thể hoàn tác.
                            </>
                        )
                    }
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </section>
    );
}
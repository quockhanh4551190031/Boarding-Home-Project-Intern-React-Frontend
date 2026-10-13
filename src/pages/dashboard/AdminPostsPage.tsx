import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import Badge from "../../components/ui/Badge";
import type { BadgeTone } from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PageHeader from "../../components/ui/PageHeader";
import Pager from "../../components/ui/Pager";
import Segmented from "../../components/ui/Segmented";
import { alertErrorCls, btnSmDanger, btnSmPrimary, btnSmSecondary } from "../../components/ui/styles";
import { timeAgo } from "../../utils/time";
import type { PostStatus } from "../../types/admin";
import type { ForumPost } from "../../types/forum";

const PAGE_SIZE = 20;

type Filter = "" | PostStatus;

const filterOptions: { value: Filter; label: string }[] = [
    { value: "", label: "Tất cả" },
    { value: "ACTIVE", label: "Hiển thị" },
    { value: "HIDDEN", label: "Đã ẩn" },
    { value: "DELETED", label: "Đã xóa" },
];

const statusLabel: Record<PostStatus, string> = { ACTIVE: "Hiển thị", HIDDEN: "Đã ẩn", DELETED: "Đã xóa" };
const statusTone: Record<PostStatus, BadgeTone> = { ACTIVE: "success", HIDDEN: "neutral", DELETED: "danger" };

export default function AdminPostsPage() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [filter, setFilter] = useState<Filter>("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<ForumPost | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        adminApi
            .getPosts({ status: filter || undefined, page, size: PAGE_SIZE })
            .then((res) => {
                if (cancelled) return;
                setPosts(res);
                setHasMore(res.length === PAGE_SIZE);
            })
            .catch(() => {
                if (!cancelled) setError("Không tải được danh sách bài đăng");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [filter, page]);

    const changeStatus = async (id: number, next: PostStatus) => {
        setError(null);
        setBusyId(id);
        try {
            await adminApi.updatePostStatus(id, next);
            setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
        } catch {
            setError("Không thể cập nhật trạng thái bài viết, thử lại sau");
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        await adminApi.updatePostStatus(deleting.id, "DELETED");
        setPosts((prev) => prev.map((p) => (p.id === deleting.id ? { ...p, status: "DELETED" } : p)));
    };

    return (
        <div>
            <PageHeader
                eyebrow="Quản trị"
                note="Kiểm duyệt"
                title="Bài đăng diễn đàn"
                description="Ẩn, khôi phục hoặc xóa các bài đăng vi phạm quy định cộng đồng."
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

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="h-32 bg-surface-container rounded-xl" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl shadow-sm py-16 flex flex-col items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined !text-[40px] text-outline">forum</span>
                    <p className="font-medium text-on-surface">Không có bài đăng nào</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map((p) => (
                        <article
                            key={p.id}
                            className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    {p.status === "ACTIVE" ? (
                                        <Link
                                            to={`/forum/${p.id}`}
                                            target="_blank"
                                            className="font-semibold text-on-surface hover:text-primary-container transition-colors"
                                        >
                                            {p.title}
                                        </Link>
                                    ) : (
                                        <span className="font-semibold text-on-surface">{p.title}</span>
                                    )}
                                    <p className="text-xs text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-x-2">
                                        <span>{p.userFullName ?? p.userEmail}</span>
                                        <span>·</span>
                                        <span>{timeAgo(p.createdAt)}</span>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-0.5 tabular-nums">
                                            <span className="material-symbols-outlined !text-[14px]">favorite</span>
                                            {p.likeCount}
                                        </span>
                                    </p>
                                </div>
                                <Badge tone={statusTone[p.status]} dot>
                                    {statusLabel[p.status]}
                                </Badge>
                            </div>

                            <p className="text-sm text-on-surface-variant line-clamp-2 mt-2 whitespace-pre-line">{p.content}</p>

                            {p.sharedRoomTitle && (
                                <span className="mt-2 inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed-variant text-xs font-medium px-2.5 py-1 rounded-full">
                                    <span className="material-symbols-outlined !text-[14px]">home</span>
                                    Chia sẻ phòng: {p.sharedRoomTitle}
                                </span>
                            )}

                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-outline-variant/40">
                                {p.status !== "ACTIVE" && (
                                    <button
                                        onClick={() => changeStatus(p.id, "ACTIVE")}
                                        disabled={busyId === p.id}
                                        className={btnSmPrimary}
                                    >
                                        Khôi phục
                                    </button>
                                )}
                                {p.status === "ACTIVE" && (
                                    <button
                                        onClick={() => changeStatus(p.id, "HIDDEN")}
                                        disabled={busyId === p.id}
                                        className={btnSmSecondary}
                                    >
                                        Ẩn
                                    </button>
                                )}
                                {p.status !== "DELETED" && (
                                    <button onClick={() => setDeleting(p)} className={btnSmDanger}>
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}

                    {(page > 0 || hasMore) && (
                        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm">
                            <Pager page={page} hasMore={hasMore} disabled={loading} onChange={setPage} />
                        </div>
                    )}
                </div>
            )}

            {deleting && (
                <ConfirmDialog
                    title="Xóa bài đăng"
                    danger
                    confirmLabel="Xóa bài"
                    message={
                        <>
                            Xóa bài <strong className="text-on-surface">{deleting.title}</strong>? Bài sẽ không còn hiển thị
                            công khai. Bạn vẫn có thể khôi phục lại từ bộ lọc "Đã xóa".
                        </>
                    }
                    onConfirm={handleDelete}
                    onClose={() => setDeleting(null)}
                />
            )}
        </div>
    );
}
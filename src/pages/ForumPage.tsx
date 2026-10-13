import { useCallback, useEffect, useState } from "react";
import { forumApi } from "../api/forumApi";
import { useAuthStore } from "../store/authStore";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import { alertErrorCls, btnPrimary, btnSecondary } from "../components/ui/styles";
import type { ForumPost, PostFormData } from "../types/forum";
import { useLoginRedirect } from "../hooks/useAuthRedirect";

const PAGE_SIZE = 10;

function SkeletonPost() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-surface-container" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 bg-surface-container rounded" />
          <div className="h-3 w-16 bg-surface-container rounded" />
        </div>
      </div>
      <div className="h-5 w-2/3 bg-surface-container rounded mb-2" />
      <div className="h-3.5 w-full bg-surface-container rounded mb-1.5" />
      <div className="h-3.5 w-4/5 bg-surface-container rounded" />
    </div>
  );
}

export default function ForumPage() {
  const goLogin = useLoginRedirect();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setError(null);
    forumApi
      .getPosts(0, PAGE_SIZE)
      .then((res) => {
        setPosts(res);
        setPage(0);
        setHasMore(res.length === PAGE_SIZE);
      })
      .catch(() => setError("Không tải được bài viết, thử lại sau"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadFirstPage, [loadFirstPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    setError(null);
    try {
      const next = page + 1;
      const res = await forumApi.getPosts(next, PAGE_SIZE);
      setPosts((prev) => [...prev, ...res]);
      setPage(next);
      setHasMore(res.length === PAGE_SIZE);
    } catch {
      setError("Không tải thêm được bài viết");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLike = async (post: ForumPost) => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    setError(null);
    try {
      const liked = await forumApi.toggleLike(post.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) }
            : p
        )
      );
    } catch {
      setError("Thao tác thất bại, thử lại sau");
    }
  };

  const handleCreate = async (data: PostFormData) => {
    await forumApi.createPost(data);
    loadFirstPage();
  };

  const openCreate = () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    setShowCreate(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Cộng đồng</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="text-xs text-on-surface-variant">Chia sẻ và hỏi đáp</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Diễn đàn</h1>
          <p className="text-sm text-on-surface-variant">
            Kinh nghiệm thuê trọ, review khu vực và những câu hỏi từ cộng đồng.
          </p>
        </div>

        <button onClick={openCreate} className={`${btnPrimary} shrink-0`}>
          <span className="material-symbols-outlined !text-[18px]">edit_square</span>
          Đăng bài
        </button>
      </div>

      {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm py-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined !text-[40px] text-outline">forum</span>
          <p className="font-medium text-on-surface">Chưa có bài viết nào</p>
          <p className="text-sm">Hãy là người đầu tiên chia sẻ kinh nghiệm!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={loadMore} disabled={loadingMore} className={btnSecondary}>
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
    </div>
  );
}
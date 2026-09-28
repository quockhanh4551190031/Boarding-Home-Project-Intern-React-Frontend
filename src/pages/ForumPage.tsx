import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { forumApi } from "../api/forumApi";
import { useAuthStore } from "../store/authStore";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import type { ForumPost, PostFormData } from "../types/forum";

const PAGE_SIZE = 10;

export default function ForumPage() {
  const navigate = useNavigate();
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
      navigate("/login");
      return;
    }
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
      navigate("/login");
      return;
    }
    setShowCreate(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Diễn đàn</h1>
          <p className="text-sm text-gray-500">Chia sẻ kinh nghiệm thuê trọ, hỏi đáp cùng cộng đồng</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Đăng bài
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Chưa có bài viết nào. Hãy là người đầu tiên!</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-5 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
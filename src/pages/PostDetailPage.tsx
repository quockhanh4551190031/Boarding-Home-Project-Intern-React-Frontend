import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { forumApi } from "../api/forumApi";
import { useAuthStore } from "../store/authStore";
import ReportModal from "../components/ReportModal";
import { timeAgo } from "../utils/time";
import type { ForumComment, ForumPost, ReportTargetType } from "../types/forum";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated, email, role } = useAuthStore();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: ReportTargetType; id: number; label: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [p, c] = await Promise.all([forumApi.getPost(postId), forumApi.getComments(postId)]);
    setPost(p);
    setComments(c);
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch(() => setError("Không tìm thấy bài viết này"))
      .finally(() => setLoading(false));
  }, [loadAll]);

  const requireLogin = (): boolean => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const canModify = (ownerEmail: string) => email === ownerEmail || role === "ADMIN";

  const handleLike = async () => {
    if (!post || !requireLogin()) return;
    try {
      const liked = await forumApi.toggleLike(post.id);
      setPost({ ...post, likedByMe: liked, likeCount: post.likeCount + (liked ? 1 : -1) });
    } catch {
      setError("Thao tác thất bại, thử lại sau");
    }
  };

  const handleDeletePost = async () => {
    if (!post || !confirm("Xóa bài viết này?")) return;
    try {
      await forumApi.deletePost(post.id);
      navigate("/forum");
    } catch {
      setError("Xóa bài thất bại, thử lại sau");
    }
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireLogin() || !input.trim()) return;
    setSubmitting(true);
    try {
      await forumApi.addComment(postId, input.trim(), replyTo?.id);
      setInput("");
      setReplyTo(null);
      await loadAll();
    } catch {
      setError("Gửi bình luận thất bại, thử lại sau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Xóa bình luận này? Các trả lời bên dưới cũng sẽ bị xóa.")) return;
    try {
      await forumApi.deleteComment(commentId);
      await loadAll();
    } catch {
      setError("Xóa bình luận thất bại, thử lại sau");
    }
  };

  const startReply = (c: ForumComment) => {
    if (!requireLogin()) return;
    // Luôn gắn vào comment gốc để giữ tối đa 1 cấp trả lời
    setReplyTo({ id: c.parentCommentId ?? c.id, name: c.userFullName ?? c.userEmail });
  };

  const openReport = (type: ReportTargetType, targetId: number, label: string) => {
    if (!requireLogin()) return;
    setReportTarget({ type, id: targetId, label });
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">Đang tải...</div>;
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error ?? "Không tìm thấy bài viết"}</p>
        <Link to="/forum" className="text-blue-600 hover:underline">Quay lại diễn đàn</Link>
      </div>
    );
  }

  const author = post.userFullName ?? post.userEmail;
  const topLevel = comments.filter((c) => c.parentCommentId === null);
  const repliesOf = (parentId: number) => comments.filter((c) => c.parentCommentId === parentId);

  const renderComment = (c: ForumComment, isReply: boolean) => {
    const name = c.userFullName ?? c.userEmail;
    return (
      <div key={c.id} className={isReply ? "ml-10 mt-3" : "mt-4"}>
        <div className="flex gap-3">
          <span className="w-8 h-8 shrink-0 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{c.content}</p>
            </div>
            <div className="flex gap-3 mt-1 ml-1 text-xs text-gray-400">
              <span>{timeAgo(c.createdAt)}</span>
              <button onClick={() => startReply(c)} className="hover:text-blue-600">Trả lời</button>
              {canModify(c.userEmail) && (
                <button onClick={() => handleDeleteComment(c.id)} className="hover:text-red-600">Xóa</button>
              )}
              {email !== c.userEmail && (
                <button
                  onClick={() => openReport("COMMENT", c.id, c.content)}
                  className="hover:text-red-600"
                >
                  Báo cáo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/forum" className="text-sm text-blue-600 hover:underline">← Quay lại diễn đàn</Link>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mt-4">{error}</div>}

      <article className="bg-white border rounded-xl p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {author.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium">{author}</p>
              <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          <div className="flex gap-3 text-sm">
            {canModify(post.userEmail) && (
              <button onClick={handleDeletePost} className="text-red-600 hover:underline">Xóa bài</button>
            )}
            {email !== post.userEmail && (
              <button
                onClick={() => openReport("POST", post.id, post.title)}
                className="text-gray-500 hover:text-red-600"
              >
                Báo cáo
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{post.title}</h1>
        <p className="text-gray-700 whitespace-pre-line">{post.content}</p>

        {post.sharedRoomId && (
          <Link
            to={`/rooms/${post.sharedRoomId}`}
            className="inline-block mt-4 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-100"
          >
            🏠 Xem phòng được chia sẻ: {post.sharedRoomTitle}
          </Link>
        )}

        <div className="flex items-center gap-5 mt-5 pt-4 border-t text-sm">
          <button
            onClick={handleLike}
            className={post.likedByMe ? "text-red-600 font-medium" : "text-gray-500 hover:text-red-600"}
          >
            {post.likedByMe ? "♥" : "♡"} {post.likeCount} lượt thích
          </button>
          <span className="text-gray-500">💬 {post.commentCount} bình luận</span>
        </div>
      </article>

      <section className="bg-white border rounded-xl p-6 mt-4">
        <h2 className="font-semibold mb-2">Bình luận</h2>

        <form onSubmit={handleSubmitComment} className="mb-2">
          {replyTo && (
            <div className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-t-lg">
              <span>Đang trả lời {replyTo.name}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="hover:underline">Hủy</button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAuthenticated ? "Viết bình luận..." : "Đăng nhập để bình luận"}
              onFocus={() => !isAuthenticated && navigate("/login")}
              className={`flex-1 border px-4 py-2 text-sm ${replyTo ? "rounded-b-lg" : "rounded-full"}`}
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </form>

        {topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Chưa có bình luận nào.</p>
        ) : (
          topLevel.map((c) => (
            <div key={c.id}>
              {renderComment(c, false)}
              {repliesOf(c.id).map((r) => renderComment(r, true))}
            </div>
          ))
        )}
      </section>

      {reportTarget && (
        <ReportModal
          title={reportTarget.label}
          onClose={() => setReportTarget(null)}
          onSubmit={(reason) => forumApi.report(reportTarget.type, reportTarget.id, reason).then(() => {})}
        />
      )}
    </div>
  );
}
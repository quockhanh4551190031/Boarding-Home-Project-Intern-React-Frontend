import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { forumApi } from "../api/forumApi";
import { useAuthStore } from "../store/authStore";
import Avatar from "../components/ui/Avatar";
import ReportModal from "../components/ReportModal";
import { alertErrorCls, btnPrimary, inputCls } from "../components/ui/styles";
import { timeAgo } from "../utils/time";
import type { ForumComment, ForumPost, ReportTargetType } from "../types/forum";

const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';
const cardCls = "bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-6";
const ghostBtn =
  "h-8 px-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-1 transition-colors";

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
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: number;
    label: string;
  } | null>(null);

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
    setError(null);
    try {
      const liked = await forumApi.toggleLike(post.id);
      setPost({ ...post, likedByMe: liked, likeCount: post.likeCount + (liked ? 1 : -1) });
    } catch {
      setError("Thao tác thất bại, thử lại sau");
    }
  };

  const handleDeletePost = async () => {
    if (!post || !confirm("Xóa bài viết này?")) return;
    setError(null);
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
    setError(null);
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
    setError(null);
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 w-24 bg-surface-container rounded mb-5" />
        <div className="h-64 bg-surface-container rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined !text-[40px] text-outline">error</span>
        <p className="text-on-surface font-medium">{error ?? "Không tìm thấy bài viết"}</p>
        <Link to="/forum" className="text-primary-container hover:underline text-sm">
          Quay lại diễn đàn
        </Link>
      </div>
    );
  }

  const author = post.userFullName ?? post.userEmail;
  const topLevel = comments.filter((c) => c.parentCommentId === null);
  const repliesOf = (parentId: number) => comments.filter((c) => c.parentCommentId === parentId);

  const renderComment = (c: ForumComment, isReply: boolean) => {
    const name = c.userFullName ?? c.userEmail;
    return (
      <div key={c.id} className={isReply ? "ml-11 mt-3" : "mt-5"}>
        <div className="flex gap-3">
          <Avatar name={name} size="sm" tone="muted" />
          <div className="flex-1 min-w-0">
            <div className="bg-surface-container-low rounded-xl px-3.5 py-2.5">
              <p className="text-sm font-semibold text-on-surface">{name}</p>
              <p className="text-sm text-on-surface-variant whitespace-pre-line break-words">
                {c.content}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-on-surface-variant">
              <span>{timeAgo(c.createdAt)}</span>
              <button onClick={() => startReply(c)} className="font-medium hover:text-primary-container">
                Trả lời
              </button>
              {canModify(c.userEmail) && (
                <button onClick={() => handleDeleteComment(c.id)} className="font-medium hover:text-error">
                  Xóa
                </button>
              )}
              {email !== c.userEmail && (
                <button
                  onClick={() => openReport("COMMENT", c.id, c.content)}
                  className="font-medium hover:text-error"
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
      <Link
        to="/forum"
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary-container mb-5"
      >
        <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
        Diễn đàn
      </Link>

      {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

      <article className={cardCls}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={author} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{author}</p>
              <p className="text-xs text-on-surface-variant">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            {canModify(post.userEmail) && (
              <button
                onClick={handleDeletePost}
                className={`${ghostBtn} text-error hover:bg-error-container/40`}
              >
                <span className="material-symbols-outlined !text-[18px]">delete</span>
                Xóa bài
              </button>
            )}
            {email !== post.userEmail && (
              <button
                onClick={() => openReport("POST", post.id, post.title)}
                className={`${ghostBtn} text-on-surface-variant hover:bg-surface-container-low`}
              >
                <span className="material-symbols-outlined !text-[18px]">flag</span>
                Báo cáo
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-3">{post.title}</h1>
        <p className="text-on-surface-variant whitespace-pre-line leading-relaxed break-words">
          {post.content}
        </p>

        {post.sharedRoomId && (
          <Link
            to={`/rooms/${post.sharedRoomId}`}
            className="mt-4 inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed-variant text-sm font-medium px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined !text-[18px]">home</span>
            Xem phòng được chia sẻ: {post.sharedRoomTitle}
          </Link>
        )}

        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-outline-variant/40">
          <button
            onClick={handleLike}
            className={`h-9 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${post.likedByMe
              ? "text-error bg-error-container/40"
              : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
          >
            <span
              className="material-symbols-outlined !text-[18px]"
              style={post.likedByMe ? { fontVariationSettings: FILLED } : undefined}
            >
              favorite
            </span>
            <span className="tabular-nums">{post.likeCount}</span> lượt thích
          </button>
          <span className="text-sm text-on-surface-variant inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
            <span className="tabular-nums">{post.commentCount}</span> bình luận
          </span>
        </div>
      </article>

      <section className={`${cardCls} mt-4`}>
        <h2 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
          Bình luận
          <span className="bg-surface-container-low text-on-surface-variant text-xs font-medium px-2 py-0.5 rounded-full tabular-nums">
            {comments.length}
          </span>
        </h2>

        <form onSubmit={handleSubmitComment}>
          {replyTo && (
            <div className="flex items-center justify-between bg-primary-fixed/60 text-on-primary-fixed-variant text-xs px-3 py-1.5 rounded-lg mb-2">
              <span>
                Đang trả lời <strong>{replyTo.name}</strong>
              </span>
              <button type="button" onClick={() => setReplyTo(null)} className="font-medium hover:underline">
                Hủy
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAuthenticated ? "Viết bình luận..." : "Đăng nhập để bình luận"}
              onFocus={() => {
                if (!isAuthenticated) navigate("/login");
              }}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className={`${btnPrimary} shrink-0`}
            >
              <span className="material-symbols-outlined !text-[18px]">send</span>
              Gửi
            </button>
          </div>
        </form>

        {topLevel.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            Chưa có bình luận nào. Hãy là người đầu tiên.
          </p>
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
          onSubmit={(reason) =>
            forumApi.report(reportTarget.type, reportTarget.id, reason).then(() => { })
          }
        />
      )}
    </div>
  );
}
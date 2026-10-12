import { Link } from "react-router-dom";
import Avatar from "./ui/Avatar";
import type { ForumPost } from "../types/forum";
import { timeAgo } from "../utils/time";

interface Props {
  post: ForumPost;
  onLike: (post: ForumPost) => void;
}

const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';

export default function PostCard({ post, onLike }: Props) {
  const author = post.userFullName ?? post.userEmail;

  return (
    <article className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={author} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{author}</p>
          <p className="text-xs text-on-surface-variant">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      <Link to={`/forum/${post.id}`} className="group block">
        <h2 className="font-semibold text-lg tracking-tight text-on-surface group-hover:text-primary-container transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-on-surface-variant line-clamp-3 whitespace-pre-line mt-1">
          {post.content}
        </p>
      </Link>

      {post.sharedRoomId && (
        <Link
          to={`/rooms/${post.sharedRoomId}`}
          className="mt-3 inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed-variant text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined !text-[16px]">home</span>
          Phòng được chia sẻ: {post.sharedRoomTitle}
        </Link>
      )}

      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-outline-variant/40">
        <button
          type="button"
          onClick={() => onLike(post)}
          className={`h-8 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${post.likedByMe
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
          <span className="tabular-nums">{post.likeCount}</span>
        </button>

        <Link
          to={`/forum/${post.id}`}
          className="h-8 px-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low inline-flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
          <span className="tabular-nums">{post.commentCount}</span>
        </Link>
      </div>
    </article>
  );
}
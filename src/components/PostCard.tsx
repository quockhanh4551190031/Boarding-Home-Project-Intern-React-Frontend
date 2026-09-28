import { Link } from "react-router-dom";
import type { ForumPost } from "../types/forum";
import { timeAgo } from "../utils/time";

interface Props {
  post: ForumPost;
  onLike: (post: ForumPost) => void;
}

export default function PostCard({ post, onLike }: Props) {
  const author = post.userFullName ?? post.userEmail;

  return (
    <article className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
          {author.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-medium">{author}</p>
          <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      <Link to={`/forum/${post.id}`} className="block">
        <h2 className="font-semibold text-lg mb-1 hover:text-blue-600">{post.title}</h2>
        <p className="text-gray-600 text-sm line-clamp-3 whitespace-pre-line">{post.content}</p>
      </Link>

      {post.sharedRoomId && (
        <Link
          to={`/rooms/${post.sharedRoomId}`}
          className="inline-block mt-3 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100"
        >
          🏠 Phòng được chia sẻ: {post.sharedRoomTitle}
        </Link>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t text-sm">
        <button
          onClick={() => onLike(post)}
          className={post.likedByMe ? "text-red-600 font-medium" : "text-gray-500 hover:text-red-600"}
        >
          {post.likedByMe ? "♥" : "♡"} {post.likeCount}
        </button>
        <Link to={`/forum/${post.id}`} className="text-gray-500 hover:text-blue-600">
          💬 {post.commentCount}
        </Link>
      </div>
    </article>
  );
}
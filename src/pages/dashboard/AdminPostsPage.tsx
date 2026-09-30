import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { PostStatus } from "../../types/admin";
import type { ForumPost } from "../../types/forum";

const statusLabel: Record<PostStatus, string> = { ACTIVE: "Hiển thị", HIDDEN: "Đã ẩn", DELETED: "Đã xóa" };
const statusColor: Record<PostStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    HIDDEN: "bg-gray-100 text-gray-500",
    DELETED: "bg-red-50 text-red-700",
};

export default function AdminPostsPage() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [status, setStatus] = useState<PostStatus | "">("");
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        adminApi
            .getPosts({ status: status || undefined, page: 0, size: 50 })
            .then(setPosts)
            .finally(() => setLoading(false));
    };

    useEffect(load, [status]);

    const changeStatus = async (id: number, next: PostStatus) => {
        await adminApi.updatePostStatus(id, next);
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Kiểm duyệt bài đăng</h1>
                <select
                    className="border rounded px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PostStatus | "")}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hiển thị</option>
                    <option value="HIDDEN">Đã ẩn</option>
                    <option value="DELETED">Đã xóa</option>
                </select>
            </div>

            {loading ? (
                <p className="text-gray-400">Đang tải...</p>
            ) : posts.length === 0 ? (
                <p className="text-gray-400">Không có bài đăng nào</p>
            ) : (
                <div className="space-y-3">
                    {posts.map((p) => (
                        <div key={p.id} className="bg-white border rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <Link to={`/forum/${p.id}`} target="_blank" className="font-semibold hover:text-blue-600">
                                        {p.title}
                                    </Link>
                                    <p className="text-sm text-gray-500">
                                        {p.userFullName ?? p.userEmail} · {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{p.content}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusColor[p.status]}`}>
                                    {statusLabel[p.status]}
                                </span>
                            </div>

                            <div className="flex gap-3 mt-3 text-sm">
                                {p.status !== "ACTIVE" && (
                                    <button onClick={() => changeStatus(p.id, "ACTIVE")} className="text-green-600 hover:underline">
                                        Khôi phục
                                    </button>
                                )}
                                {p.status !== "HIDDEN" && (
                                    <button onClick={() => changeStatus(p.id, "HIDDEN")} className="text-gray-600 hover:underline">
                                        Ẩn
                                    </button>
                                )}
                                {p.status !== "DELETED" && (
                                    <button onClick={() => changeStatus(p.id, "DELETED")} className="text-red-600 hover:underline">
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
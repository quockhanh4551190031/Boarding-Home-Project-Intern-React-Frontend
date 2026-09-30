import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { AdminUser, UserStatus } from "../../types/admin";

const roleLabel: Record<string, string> = { TENANT: "Người tìm trọ", LANDLORD: "Chủ trọ", ADMIN: "Admin" };

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        adminApi
            .getUsers({
                role: role || undefined,
                status: status || undefined,
                keyword: keyword || undefined,
                page: 0,
                size: 50,
            })
            .then(setUsers)
            .catch(() => setError("Không tải được danh sách người dùng"))
            .finally(() => setLoading(false));
    };

    useEffect(load, [role, status]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        load();
    };

    const toggleStatus = async (u: AdminUser) => {
        const next: UserStatus = u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
        if (!confirm(`${next === "BLOCKED" ? "Khóa" : "Mở khóa"} tài khoản ${u.email}?`)) return;
        try {
            const updated = await adminApi.updateUserStatus(u.id, next);
            setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
        } catch (err: any) {
            alert(err.response?.data?.message ?? "Thao tác thất bại");
        }
    };

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">Quản lý người dùng</h1>

            <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4">
                <input
                    placeholder="Tìm theo email..."
                    className="border rounded px-3 py-2 text-sm flex-1 min-w-[180px]"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <select className="border rounded px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="">Tất cả vai trò</option>
                    <option value="TENANT">Người tìm trọ</option>
                    <option value="LANDLORD">Chủ trọ</option>
                    <option value="ADMIN">Admin</option>
                </select>
                <select className="border rounded px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="BLOCKED">Đã khóa</option>
                </select>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                    Tìm
                </button>
            </form>

            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>}

            <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-left">
                        <tr>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Vai trò</th>
                            <th className="px-4 py-2">Trạng thái</th>
                            <th className="px-4 py-2">Hồ sơ</th>
                            <th className="px-4 py-2">Ngày tạo</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Đang tải...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Không có kết quả</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-4 py-2">{u.email}</td>
                                    <td className="px-4 py-2">{roleLabel[u.role] ?? u.role}</td>
                                    <td className="px-4 py-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                            }`}>
                                            {u.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{u.profileCompleted ? "✓" : "—"}</td>
                                    <td className="px-4 py-2 text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {u.role !== "ADMIN" && (
                                            <button
                                                onClick={() => toggleStatus(u)}
                                                className={u.status === "ACTIVE" ? "text-red-600 hover:underline" : "text-green-600 hover:underline"}
                                            >
                                                {u.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
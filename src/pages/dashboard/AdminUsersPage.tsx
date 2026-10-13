import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../../api/adminApi";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import type { BadgeTone } from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PageHeader from "../../components/ui/PageHeader";
import Pager from "../../components/ui/Pager";
import TableSkeleton from "../../components/ui/TableSkeleton";
import {
    alertErrorCls,
    btnPrimary,
    btnSmDanger,
    btnSmPrimary,
    inputCls,
    tableCardCls,
    thCls,
} from "../../components/ui/styles";
import type { AdminUser } from "../../types/admin";

const PAGE_SIZE = 20;

const roleLabel: Record<AdminUser["role"], string> = {
    TENANT: "Người tìm trọ",
    LANDLORD: "Chủ trọ",
    ADMIN: "Quản trị viên",
};
const roleTone: Record<AdminUser["role"], BadgeTone> = {
    TENANT: "neutral",
    LANDLORD: "info",
    ADMIN: "warning",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [target, setTarget] = useState<AdminUser | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        adminApi
            .getUsers({
                role: role || undefined,
                status: status || undefined,
                keyword: keyword || undefined,
                page,
                size: PAGE_SIZE,
            })
            .then((res) => {
                if (cancelled) return;
                setUsers(res);
                setHasMore(res.length === PAGE_SIZE);
            })
            .catch(() => {
                if (!cancelled) setError("Không tải được danh sách người dùng");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [role, status, keyword, page]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        setPage(0);
        setKeyword(keywordInput.trim());
    };

    const handleToggle = async () => {
        if (!target) return;
        const next = target.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
        const updated = await adminApi.updateUserStatus(target.id, next);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    };

    const blocking = target?.status === "ACTIVE";

    return (
        <div>
            <PageHeader
                eyebrow="Quản trị"
                note="Người dùng"
                title="Quản lý người dùng"
                description="Tìm kiếm, lọc theo vai trò và khóa hoặc mở khóa tài khoản."
            />

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[240px]">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined !text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                            search
                        </span>
                        <input
                            placeholder="Tìm theo email..."
                            className={`${inputCls} pl-9`}
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                        />
                    </div>
                    <button type="submit" className={btnPrimary}>
                        Tìm
                    </button>
                </form>

                <div className="w-full sm:w-44">
                    <select
                        className={inputCls}
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="TENANT">Người tìm trọ</option>
                        <option value="LANDLORD">Chủ trọ</option>
                        <option value="ADMIN">Quản trị viên</option>
                    </select>
                </div>

                <div className="w-full sm:w-44">
                    <select
                        className={inputCls}
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="">Mọi trạng thái</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="BLOCKED">Đã khóa</option>
                    </select>
                </div>
            </div>

            {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

            <div className={tableCardCls}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead className="bg-surface-container-low">
                            <tr>
                                <th className={`${thCls} text-left`}>Người dùng</th>
                                <th className={`${thCls} text-left`}>Vai trò</th>
                                <th className={`${thCls} text-left`}>Trạng thái</th>
                                <th className={`${thCls} text-left`}>Hồ sơ</th>
                                <th className={`${thCls} text-left`}>Ngày tạo</th>
                                <th className={`${thCls} text-right`}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40">
                            {loading ? (
                                <TableSkeleton cols={6} />
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-14 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined !text-[36px] text-outline block mb-1">
                                            person_off
                                        </span>
                                        Không có người dùng phù hợp
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-surface-container-low/60 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar name={u.email} size="sm" tone="muted" />
                                                <span className="font-medium text-on-surface truncate">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <Badge tone={roleTone[u.role]}>{roleLabel[u.role]}</Badge>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <Badge tone={u.status === "ACTIVE" ? "success" : "danger"} dot>
                                                {u.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {u.profileCompleted ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                                                    <span className="material-symbols-outlined !text-[16px]">check_circle</span>
                                                    Đầy đủ
                                                </span>
                                            ) : (
                                                <span className="text-xs text-on-surface-variant">Chưa hoàn thiện</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-on-surface-variant tabular-nums whitespace-nowrap">
                                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            {u.role !== "ADMIN" && (
                                                <button
                                                    onClick={() => setTarget(u)}
                                                    className={u.status === "ACTIVE" ? btnSmDanger : btnSmPrimary}
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
                <Pager page={page} hasMore={hasMore} disabled={loading} onChange={setPage} />
            </div>

            {target && (
                <ConfirmDialog
                    title={blocking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                    danger={blocking}
                    confirmLabel={blocking ? "Khóa tài khoản" : "Mở khóa"}
                    message={
                        blocking ? (
                            <>
                                Khóa <strong className="text-on-surface">{target.email}</strong>? Người dùng sẽ bị đăng xuất và
                                không thể đăng nhập cho đến khi được mở khóa.
                            </>
                        ) : (
                            <>
                                Mở khóa <strong className="text-on-surface">{target.email}</strong>? Người dùng có thể đăng nhập
                                trở lại.
                            </>
                        )
                    }
                    onConfirm={handleToggle}
                    onClose={() => setTarget(null)}
                />
            )}
        </div>
    );
}
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/ui/PageHeader";
import { btnPrimary, btnSecondary } from "../../components/ui/styles";
import type { AdminStats } from "../../types/admin";

const cardCls = "bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-5";

interface TileProps {
    icon: string;
    label: string;
    value: number;
    tone: string;
}

function StatTile({ icon, label, value, tone }: TileProps) {
    return (
        <div className={`${cardCls} flex flex-col gap-3 select-none`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>
                <span className="material-symbols-outlined !text-[20px]">{icon}</span>
            </div>
            <div>
                <p className="text-3xl font-bold tracking-tight text-on-surface tabular-nums">{value}</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
            </div>
        </div>
    );
}

function SectionTitle({ children }: { children: string }) {
    return (
        <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">{children}</h2>
    );
}

export default function AdminStatsPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(false);
        adminApi
            .getStats()
            .then(setStats)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const header = (
        <PageHeader
            eyebrow="Quản trị"
            note="Tổng quan hệ thống"
            title="Thống kê"
            description="Số liệu người dùng, nội dung và các báo cáo đang chờ xử lý."
        />
    );

    if (loading) {
        return (
            <div>
                {header}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="h-32 bg-surface-container rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div>
                {header}
                <div className={`${cardCls} flex flex-col items-center gap-3 py-12 text-center`}>
                    <span className="material-symbols-outlined !text-[40px] text-outline">cloud_off</span>
                    <p className="font-medium text-on-surface">Không tải được thống kê</p>
                    <button onClick={load} className={btnSecondary}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const userTotal = stats.totalUsers || 1;
    const pct = (n: number) => `${(n / userTotal) * 100}%`;
    const availablePct =
        stats.totalRooms > 0 ? Math.round((stats.totalAvailableRooms / stats.totalRooms) * 100) : 0;
    const hasPending = stats.pendingReports > 0;

    return (
        <div>
            {header}

            <div
                className={`rounded-xl border p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${hasPending ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasPending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                    >
                        <span className="material-symbols-outlined">{hasPending ? "flag" : "task_alt"}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-on-surface">
                            {hasPending ? (
                                <>
                                    <span className="tabular-nums">{stats.pendingReports}</span> báo cáo đang chờ xử lý
                                </>
                            ) : (
                                "Không có báo cáo nào đang chờ xử lý"
                            )}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                            {hasPending ? "Xem xét sớm để giữ cộng đồng an toàn." : "Mọi báo cáo đã được xử lý."}
                        </p>
                    </div>
                </div>
                {hasPending && (
                    <Link to="/dashboard/admin/reports" className={btnPrimary}>
                        Xử lý ngay
                    </Link>
                )}
            </div>

            <SectionTitle>Người dùng</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatTile icon="group" label="Tổng người dùng" value={stats.totalUsers} tone="bg-primary-fixed text-on-primary-fixed-variant" />
                <StatTile icon="person_search" label="Người tìm trọ" value={stats.totalTenants} tone="bg-secondary-container text-on-secondary-container" />
                <StatTile icon="real_estate_agent" label="Chủ trọ" value={stats.totalLandlords} tone="bg-emerald-100 text-emerald-700" />
                <StatTile icon="admin_panel_settings" label="Quản trị viên" value={stats.totalAdmins} tone="bg-amber-100 text-amber-700" />
            </div>

            <SectionTitle>Nội dung</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatTile icon="home_work" label="Nhà trọ" value={stats.totalBoardingHouses} tone="bg-primary-fixed text-on-primary-fixed-variant" />
                <StatTile icon="meeting_room" label="Tổng số phòng" value={stats.totalRooms} tone="bg-secondary-container text-on-secondary-container" />
                <StatTile icon="check_circle" label="Phòng còn trống" value={stats.totalAvailableRooms} tone="bg-emerald-100 text-emerald-700" />
                <StatTile icon="forum" label="Bài đăng diễn đàn" value={stats.totalForumPosts} tone="bg-amber-100 text-amber-700" />
            </div>

            <div className="grid lg:grid-cols-2 gap-4 select-none">
                <div className={cardCls}>
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-semibold text-on-surface">Cơ cấu người dùng</span>
                        <span className="text-on-surface-variant tabular-nums">{stats.totalUsers} tài khoản</span>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-container">
                        <div style={{ width: pct(stats.totalTenants) }} className="bg-primary-container" />
                        <div style={{ width: pct(stats.totalLandlords) }} className="bg-emerald-500" />
                        <div style={{ width: pct(stats.totalAdmins) }} className="bg-amber-500" />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary-container" /> Người tìm trọ
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Chủ trọ
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Quản trị viên
                        </span>
                    </div>
                </div>

                <div className={cardCls}>
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-semibold text-on-surface">Tỷ lệ phòng còn trống</span>
                        <span className="text-on-surface font-bold tabular-nums">{availablePct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden bg-surface-container">
                        <div style={{ width: `${availablePct}%` }} className="h-full bg-emerald-500" />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-3 tabular-nums">
                        {stats.totalAvailableRooms} / {stats.totalRooms} phòng đang có thể thuê
                    </p>
                </div>
            </div>
        </div>
    );
}
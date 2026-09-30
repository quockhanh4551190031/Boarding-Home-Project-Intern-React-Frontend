import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { AdminStats } from "../../types/admin";

interface Card {
    label: string;
    value: number;
    color: string;
}

export default function AdminStatsPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getStats().then(setStats).finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-gray-400">Đang tải...</p>;
    if (!stats) return <p className="text-red-600">Không tải được thống kê</p>;

    const cards: Card[] = [
        { label: "Tổng người dùng", value: stats.totalUsers, color: "bg-blue-50 text-blue-700" },
        { label: "Người tìm trọ", value: stats.totalTenants, color: "bg-sky-50 text-sky-700" },
        { label: "Chủ trọ", value: stats.totalLandlords, color: "bg-indigo-50 text-indigo-700" },
        { label: "Quản trị viên", value: stats.totalAdmins, color: "bg-purple-50 text-purple-700" },
        { label: "Nhà trọ", value: stats.totalBoardingHouses, color: "bg-emerald-50 text-emerald-700" },
        { label: "Tổng số phòng", value: stats.totalRooms, color: "bg-teal-50 text-teal-700" },
        { label: "Phòng còn trống", value: stats.totalAvailableRooms, color: "bg-green-50 text-green-700" },
        { label: "Bài đăng diễn đàn", value: stats.totalForumPosts, color: "bg-amber-50 text-amber-700" },
        { label: "Report chờ xử lý", value: stats.pendingReports, color: "bg-red-50 text-red-700" },
    ];

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">Thống kê hệ thống</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {cards.map((c) => (
                    <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
                        <p className="text-3xl font-bold">{c.value}</p>
                        <p className="text-sm mt-1">{c.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
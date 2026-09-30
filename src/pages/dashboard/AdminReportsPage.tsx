import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { AdminReport, ReportStatus } from "../../types/admin";

const statusLabel: Record<ReportStatus, string> = { PENDING: "Chờ xử lý", RESOLVED: "Đã xử lý", REJECTED: "Đã từ chối" };
const statusColor: Record<ReportStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-green-50 text-green-700",
    REJECTED: "bg-gray-100 text-gray-500",
};
const targetLabel: Record<string, string> = { ROOM: "Phòng trọ", POST: "Bài đăng", COMMENT: "Bình luận", USER: "Người dùng" };

function targetLink(type: string, id: number): string | null {
    if (type === "ROOM") return `/rooms/${id}`;
    if (type === "POST") return `/forum/${id}`;
    return null;
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [status, setStatus] = useState<ReportStatus | "">("PENDING");
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        adminApi
            .getReports({ status: status || undefined, page: 0, size: 50 })
            .then(setReports)
            .finally(() => setLoading(false));
    };

    useEffect(load, [status]);

    const resolve = async (id: number, next: ReportStatus) => {
        const updated = await adminApi.updateReportStatus(id, next);
        setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Báo cáo vi phạm</h1>
                <select
                    className="border rounded px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReportStatus | "")}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="RESOLVED">Đã xử lý</option>
                    <option value="REJECTED">Đã từ chối</option>
                </select>
            </div>

            {loading ? (
                <p className="text-gray-400">Đang tải...</p>
            ) : reports.length === 0 ? (
                <p className="text-gray-400">Không có report nào</p>
            ) : (
                <div className="bg-white border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-left">
                            <tr>
                                <th className="px-4 py-2">Người báo cáo</th>
                                <th className="px-4 py-2">Đối tượng</th>
                                <th className="px-4 py-2">Lý do</th>
                                <th className="px-4 py-2">Trạng thái</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => {
                                const link = targetLink(r.targetType, r.targetId);
                                return (
                                    <tr key={r.id} className="border-t align-top">
                                        <td className="px-4 py-2">{r.reporterEmail}</td>
                                        <td className="px-4 py-2">
                                            {targetLabel[r.targetType] ?? r.targetType} #{r.targetId}
                                            {link && (
                                                <>
                                                    {" — "}
                                                    <Link to={link} target="_blank" className="text-blue-600 hover:underline">
                                                        Xem
                                                    </Link>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 max-w-xs">{r.reason}</td>
                                        <td className="px-4 py-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>
                                                {statusLabel[r.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap">
                                            {r.status === "PENDING" && (
                                                <>
                                                    <button onClick={() => resolve(r.id, "RESOLVED")} className="text-green-600 hover:underline mr-3">
                                                        Đã xử lý
                                                    </button>
                                                    <button onClick={() => resolve(r.id, "REJECTED")} className="text-gray-500 hover:underline">
                                                        Từ chối
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
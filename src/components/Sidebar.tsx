import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const landlordLinks = [
    { to: "/dashboard/houses", label: "Nhà trọ của tôi", icon: "home_work" },
    { to: "/dashboard/rooms", label: "Phòng trọ", icon: "meeting_room" },
];

const adminLinks = [
    { to: "/dashboard/admin/stats", label: "Thống kê", icon: "bar_chart" },
    { to: "/dashboard/admin/users", label: "Người dùng", icon: "group" },
    { to: "/dashboard/admin/posts", label: "Bài đăng diễn đàn", icon: "forum" },
    { to: "/dashboard/admin/reports", label: "Báo cáo vi phạm", icon: "flag" },
    { to: "/dashboard/admin/reviews", label: "Đánh giá", icon: "star" },
];

export default function Sidebar() {
    const role = useAuthStore((state) => state.role);
    const links = role === "ADMIN" ? adminLinks : landlordLinks;

    return (
        <aside className="w-full lg:w-60 shrink-0 bg-surface-container-lowest border-b lg:border-b-0 lg:border-r border-outline-variant/60 lg:sticky lg:top-16 lg:self-start lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
            <div className="p-3 lg:p-4">
                <p className="hidden lg:block text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-3 mb-2">
                    {role === "ADMIN" ? "Quản trị hệ thống" : "Quản lý cho chủ trọ"}
                </p>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `shrink-0 whitespace-nowrap flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-primary-container text-on-primary-container"
                                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                }`
                            }
                        >
                            <span className="material-symbols-outlined !text-[20px]">{link.icon}</span>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
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
];

export default function Sidebar() {
    const role = useAuthStore((state) => state.role);
    const links = role === "ADMIN" ? adminLinks : landlordLinks;

    return (
        <aside className="w-56 shrink-0 bg-surface-container-lowest border-r border-outline-variant min-h-[calc(100vh-4rem)] p-4">
            <nav className="flex flex-col gap-1">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
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
        </aside>
    );
}
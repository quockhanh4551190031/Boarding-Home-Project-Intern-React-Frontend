import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const landlordLinks = [
    { to: "/dashboard/houses", label: "Nhà trọ của tôi" },
    { to: "/dashboard/rooms", label: "Phòng trọ" },
];

const adminLinks = [
    { to: "/dashboard/admin/stats", label: "Thống kê" },
    { to: "/dashboard/admin/users", label: "Người dùng" },
    { to: "/dashboard/admin/posts", label: "Bài đăng diễn đàn" },
    { to: "/dashboard/admin/reports", label: "Báo cáo vi phạm" },
];

export default function Sidebar() {
    const role = useAuthStore((state) => state.role);
    const links = role === "ADMIN" ? adminLinks : landlordLinks;

    return (
        <aside className="w-56 shrink-0 bg-white border-r min-h-[calc(100vh-4rem)] p-4">
            <nav className="space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-lg text-sm font-medium ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:bg-gray-50"
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
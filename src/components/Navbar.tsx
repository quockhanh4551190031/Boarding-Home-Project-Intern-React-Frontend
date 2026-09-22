import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const { isAuthenticated, email, role, logout } = useAuthStore();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate("/login");
    };

    return (
        <nav className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-blue-600">
                    BoardingHome
                </Link>

                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
                    <Link to="/" className="hover:text-blue-600">Tìm phòng</Link>
                    <Link to="/forum" className="hover:text-blue-600">Diễn đàn</Link>
                    {isAuthenticated && (
                        <Link to="/chat" className="hover:text-blue-600">Tin nhắn</Link>
                    )}
                </div>

                <div className="relative">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                            >
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {email?.charAt(0).toUpperCase()}
                </span>
                                <span className="hidden sm:inline">{email}</span>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-1 text-sm">
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 hover:bg-gray-50"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Hồ sơ cá nhân
                                    </Link>
                                    <Link
                                        to="/favorites"
                                        className="block px-4 py-2 hover:bg-gray-50"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Phòng yêu thích
                                    </Link>

                                    {role === "LANDLORD" && (
                                        <Link
                                            to="/dashboard/houses"
                                            className="block px-4 py-2 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Quản lý phòng trọ
                                        </Link>
                                    )}

                                    {role === "ADMIN" && (
                                        <Link
                                            to="/dashboard/admin"
                                            className="block px-4 py-2 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Trang quản trị
                                        </Link>
                                    )}

                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-700 hover:text-blue-600"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
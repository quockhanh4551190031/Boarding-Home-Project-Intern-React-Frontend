import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import LocationPickerModal from "./LocationPickerModal";

export default function Navbar() {
    const navigate = useNavigate();
    const { isAuthenticated, email, role, logout } = useAuthStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate("/login");
    };

    return (
        <>
            <nav className="sticky top-0 z-50 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant">
                <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-on-primary !text-[20px]">cottage</span>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-bold text-on-surface">BoardingHome</span>
                            <span className="text-[11px] text-on-surface-variant mt-0.5">Nền tảng tìm trọ</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-1 text-sm font-medium">
                        <Link to="/" className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                            Tìm phòng
                        </Link>
                        <Link to="/forum" className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                            Diễn đàn
                        </Link>
                        <button
                            onClick={() => setShowLocationModal(true)}
                            className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined !text-[18px]">location_on</span>
                            Định vị
                        </button>
                        {isAuthenticated && (
                            <Link to="/chat" className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                                Tin nhắn
                            </Link>
                        )}
                    </div>

                    <div className="relative">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => setMenuOpen((o) => !o)}
                                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-sm transition-colors"
                                >
                                    <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                                        {email?.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden sm:inline text-on-surface-variant">{email}</span>
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-1.5 text-sm overflow-hidden">
                                        <Link to="/profile" className="block px-4 py-2 hover:bg-surface-container-low" onClick={() => setMenuOpen(false)}>
                                            Hồ sơ cá nhân
                                        </Link>
                                        <Link to="/favorites" className="block px-4 py-2 hover:bg-surface-container-low" onClick={() => setMenuOpen(false)}>
                                            Phòng yêu thích
                                        </Link>
                                        {role === "LANDLORD" && (
                                            <Link to="/dashboard/houses" className="block px-4 py-2 hover:bg-surface-container-low" onClick={() => setMenuOpen(false)}>
                                                Quản lý phòng trọ
                                            </Link>
                                        )}
                                        {role === "ADMIN" && (
                                            <Link to="/dashboard/admin/stats" className="block px-4 py-2 hover:bg-surface-container-low" onClick={() => setMenuOpen(false)}>
                                                Trang quản trị
                                            </Link>
                                        )}
                                        <hr className="my-1 border-outline-variant" />
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-error hover:bg-error-container/40">
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-container">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>


            </nav>

            {showLocationModal && <LocationPickerModal onClose={() => setShowLocationModal(false)} />}
        </>
    );
}
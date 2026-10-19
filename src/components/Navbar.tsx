import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUnreadStore } from "../store/unreadStore";
import { useUnreadPolling } from "../hooks/useUnreadPolling";
import Avatar from "./ui/Avatar";
import LocationPickerModal from "./LocationPickerModal";
import SearchBox from "./SearchBox";

const baseLink = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5";
const linkCls = ({ isActive }: { isActive: boolean }) =>
    `${baseLink} ${isActive
        ? "bg-primary-fixed/60 text-primary-container"
        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
    }`;
const mobileLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-4 py-3 text-sm font-medium ${isActive ? "bg-primary-fixed/50 text-primary-container" : "text-on-surface hover:bg-surface-container-low"
    }`;
const menuItemCls = "flex items-center justify-between px-4 py-2 hover:bg-surface-container-low";

function UnreadBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <span
            aria-label={`${count} tin nhắn chưa đọc`}
            className="min-w-5 h-5 px-1.5 rounded-full bg-error text-on-error text-[11px] font-bold flex items-center justify-center tabular-nums"
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, email, role, logout } = useAuthStore();
    const unread = useUnreadStore((s) => s.count);

    useUnreadPolling(location.pathname.startsWith("/chat"));

    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const baseTitle = useRef(document.title);

    // Đổi trang thì đóng mọi menu
    useEffect(() => {
        setMenuOpen(false);
        setMobileOpen(false);
        setSearchOpen(false);
    }, [location.pathname]);

    // Bấm ra ngoài hoặc nhấn Esc thì đóng menu tài khoản
    useEffect(() => {
        if (!menuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    // Số tin chưa đọc hiện cả trên tiêu đề tab
    useEffect(() => {
        const base = baseTitle.current;
        document.title = unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${base}` : base;
        return () => {
            document.title = base;
        };
    }, [unread]);

    const handleLogout = () => {
        useUnreadStore.getState().setCount(0);
        logout();
        setMenuOpen(false);
        navigate("/login");
    };

    const toggleMobileMenu = () => {
        setMobileOpen((o) => !o);
        setSearchOpen(false);
    };

    const toggleSearch = () => {
        setSearchOpen((o) => !o);
        setMobileOpen(false);
    };

    const showUnread = isAuthenticated && unread > 0;

    return (
        <nav className="sticky top-0 z-50 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant">
            <div className="max-w-6xl mx-auto px-4 h-full flex items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={toggleMobileMenu}
                        aria-label="Mở menu"
                        aria-expanded={mobileOpen}
                        className="md:hidden relative w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
                    >
                        <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
                        {showUnread && !mobileOpen && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" />
                        )}
                    </button>

                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-on-primary !text-[20px]">cottage</span>
                        </div>
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className="font-bold text-on-surface">BoardingHome</span>
                            <span className="text-[11px] text-on-surface-variant mt-0.5">Nền tảng tìm trọ</span>
                        </div>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-1 shrink-0">
                    <NavLink to="/" end className={linkCls}>
                        Tìm phòng
                    </NavLink>
                    <NavLink to="/forum" className={linkCls}>
                        Diễn đàn
                    </NavLink>
                    <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className={`${baseLink} text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`}
                    >
                        <span className="material-symbols-outlined !text-[18px]">location_on</span>
                        Định vị
                    </button>
                    {isAuthenticated && (
                        <NavLink to="/chat" className={linkCls}>
                            Tin nhắn
                            <UnreadBadge count={unread} />
                        </NavLink>
                    )}
                </div>

                {/* Ô tìm kiếm trên màn hình rộng */}
                <div className="hidden lg:block flex-1 min-w-0 max-w-md">
                    <SearchBox />
                </div>

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={toggleSearch}
                        aria-label={searchOpen ? "Đóng tìm kiếm" : "Tìm kiếm"}
                        aria-expanded={searchOpen}
                        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
                    >
                        <span className="material-symbols-outlined">{searchOpen ? "close" : "search"}</span>
                    </button>

                    <div className="relative" ref={menuRef}>
                        {isAuthenticated ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((o) => !o)}
                                    aria-expanded={menuOpen}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-sm transition-colors"
                                >
                                    <Avatar name={email ?? "?"} size="sm" />
                                    <span className="hidden sm:inline text-on-surface-variant max-w-40 truncate">{email}</span>
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-1.5 text-sm overflow-hidden">
                                        <Link to="/profile" className={menuItemCls}>
                                            Hồ sơ cá nhân
                                        </Link>
                                        <Link to="/favorites" className={menuItemCls}>
                                            Phòng yêu thích
                                        </Link>
                                        {role === "LANDLORD" && (
                                            <Link to="/dashboard/houses" className={menuItemCls}>
                                                Quản lý phòng trọ
                                            </Link>
                                        )}
                                        {role === "ADMIN" && (
                                            <Link to="/dashboard/admin/stats" className={menuItemCls}>
                                                Trang quản trị
                                            </Link>
                                        )}
                                        <hr className="my-1 border-outline-variant" />
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-error hover:bg-error-container/40"
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    state={{ from: location }}
                                    className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    state={{ from: location }}
                                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-container"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Thanh tìm kiếm cho màn hình nhỏ */}
            {searchOpen && (
                <div className="lg:hidden absolute top-full inset-x-0 bg-surface-container-lowest border-b border-outline-variant shadow-md p-3">
                    <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
                </div>
            )}

            {/* Menu cho màn hình nhỏ */}
            {mobileOpen && (
                <div className="md:hidden absolute top-full inset-x-0 bg-surface-container-lowest border-b border-outline-variant shadow-md">
                    <NavLink to="/" end className={mobileLinkCls}>
                        Tìm phòng
                    </NavLink>
                    <NavLink to="/forum" className={mobileLinkCls}>
                        Diễn đàn
                    </NavLink>
                    {isAuthenticated && (
                        <NavLink to="/chat" className={mobileLinkCls}>
                            Tin nhắn
                            <UnreadBadge count={unread} />
                        </NavLink>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setMobileOpen(false);
                            setShowLocationModal(true);
                        }}
                        className="w-full flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-low"
                    >
                        <span className="material-symbols-outlined !text-[18px]">location_on</span>
                        Định vị
                    </button>
                    {!isAuthenticated && (
                        <Link
                            to="/login"
                            state={{ from: location }}
                            className="sm:hidden flex px-4 py-3 text-sm font-medium text-primary-container hover:bg-surface-container-low"
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>
            )}

            {showLocationModal && <LocationPickerModal onClose={() => setShowLocationModal(false)} />}
        </nav>
    );
}
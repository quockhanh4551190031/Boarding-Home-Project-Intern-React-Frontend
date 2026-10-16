import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { chatApi } from "../api/chatApi";
import { userApi } from "../api/userApi";
import CallButton from "../components/CallButton";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";
import { alertErrorCls, asideCardCls, btnPrimary, btnSecondary, sectionCardCls } from "../components/ui/styles";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import { apiErrorMessage } from "../utils/apiError";
import { formatMonthYear, formatPrice } from "../utils/format";
import type { PublicProfile } from "../types/user";

const roleLabel: Record<PublicProfile["role"], string> = {
    TENANT: "Người tìm trọ",
    LANDLORD: "Chủ trọ",
    ADMIN: "Quản trị viên",
};
const roleTone: Record<PublicProfile["role"], BadgeTone> = {
    TENANT: "neutral",
    LANDLORD: "info",
    ADMIN: "warning",
};

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const userId = Number(id);
    const navigate = useNavigate();
    const goLogin = useLoginRedirect();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [chatBusy, setChatBusy] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(userId)) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setNotFound(false);
        setLoadError(false);
        userApi
            .getPublicProfile(userId)
            .then((p) => {
                if (!cancelled) setProfile(p);
            })
            .catch((err) => {
                if (cancelled) return;
                if (err.response?.status === 404) setNotFound(true);
                else setLoadError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId, isAuthenticated, reloadKey]);

    const goBack = useCallback(() => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/");
    }, [navigate]);

    const startChat = async () => {
        if (!isAuthenticated) {
            goLogin();
            return;
        }
        setChatBusy(true);
        setChatError(null);
        try {
            const room = await chatApi.createOrGetRoom(userId);
            navigate(`/chat?roomId=${room.id}`);
        } catch (err) {
            setChatError(apiErrorMessage(err, "Không thể bắt đầu cuộc trò chuyện, thử lại sau"));
            setChatBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-4 w-24 bg-surface-container rounded mb-5" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="h-96 bg-surface-container rounded-xl" />
                    <div className="lg:col-span-2 h-96 bg-surface-container rounded-xl" />
                </div>
            </div>
        );
    }

    if (notFound || loadError || !profile) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined !text-[40px] text-outline">
                    {notFound ? "person_off" : "cloud_off"}
                </span>
                <p className="font-medium text-on-surface">
                    {notFound ? "Không tìm thấy người dùng này" : "Không tải được hồ sơ"}
                </p>
                <div className="flex gap-2">
                    {!notFound && (
                        <button onClick={() => setReloadKey((k) => k + 1)} className={btnSecondary}>
                            Thử lại
                        </button>
                    )}
                    <Link to="/" className={btnSecondary}>
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    const isLandlord = profile.role === "LANDLORD";

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary-container mb-5"
            >
                <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                Quay lại
            </button>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <aside className={`${asideCardCls} p-6 flex flex-col gap-5 lg:sticky lg:top-24`}>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Avatar name={profile.displayName} size="xl" />
                        <div className="min-w-0 max-w-full">
                            <h1 className="text-xl font-bold tracking-tight text-on-surface break-words">
                                {profile.displayName}
                            </h1>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                Tham gia từ {formatMonthYear(profile.memberSince)}
                            </p>
                        </div>
                        <Badge tone={roleTone[profile.role]}>{roleLabel[profile.role]}</Badge>
                    </div>

                    <div className={`grid gap-2 ${isLandlord ? "grid-cols-3" : "grid-cols-1"}`}>
                        {isLandlord && (
                            <>
                                <div className="bg-surface-container-low rounded-lg p-3 text-center">
                                    <p className="font-bold text-on-surface tabular-nums text-lg leading-tight">
                                        {profile.houses.length}
                                    </p>
                                    <p className="text-[11px] text-on-surface-variant">Nhà trọ</p>
                                </div>
                                <div className="bg-surface-container-low rounded-lg p-3 text-center">
                                    <p className="font-bold text-on-surface tabular-nums text-lg leading-tight">
                                        {profile.availableRoomCount}
                                    </p>
                                    <p className="text-[11px] text-on-surface-variant">Còn trống</p>
                                </div>
                            </>
                        )}
                        <div className="bg-surface-container-low rounded-lg p-3 text-center">
                            <p className="font-bold text-on-surface tabular-nums text-lg leading-tight">
                                {profile.forumPostCount}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">Bài viết</p>
                        </div>
                    </div>

                    {profile.self ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2.5">
                                Đây là hồ sơ công khai của bạn.
                            </p>
                            <Link to="/profile" className={`${btnPrimary} w-full`}>
                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                Chỉnh sửa hồ sơ
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {isLandlord && (
                                <div>
                                    <p className="text-xs text-on-surface-variant mb-1.5">Số điện thoại</p>
                                    <CallButton phone={profile.phone} masked={profile.phoneMasked} onLogin={goLogin} />
                                </div>
                            )}
                            {chatError && <div className={alertErrorCls}>{chatError}</div>}
                            <button onClick={startChat} disabled={chatBusy} className={`${btnPrimary} w-full`}>
                                <span className="material-symbols-outlined !text-[18px]">chat</span>
                                {chatBusy ? "Đang kết nối..." : "Nhắn tin"}
                            </button>
                        </div>
                    )}
                </aside>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <section className={sectionCardCls}>
                        <h2 className="font-semibold text-on-surface mb-2">Giới thiệu</h2>
                        {profile.bio ? (
                            <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed break-words">
                                {profile.bio}
                            </p>
                        ) : (
                            <p className="text-sm text-on-surface-variant">Người dùng này chưa viết giới thiệu.</p>
                        )}
                    </section>

                    {isLandlord && (
                        <section className={sectionCardCls}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-on-surface">Nhà trọ đang cho thuê</h2>
                                <span className="text-xs text-on-surface-variant tabular-nums">{profile.roomCount} phòng</span>
                            </div>

                            {profile.houses.length === 0 ? (
                                <p className="text-sm text-on-surface-variant text-center py-6">Chưa có nhà trọ nào.</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {profile.houses.map((h) => (
                                        <Link
                                            key={h.id}
                                            to={`/houses/${h.id}`}
                                            className="group flex gap-3 p-2.5 rounded-xl border border-outline-variant/50 hover:border-primary-container hover:shadow-sm transition-all"
                                        >
                                            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
                                                {h.thumbnail ? (
                                                    <img
                                                        src={h.thumbnail}
                                                        alt=""
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <span className="material-symbols-outlined text-outline">image</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex flex-col justify-center gap-0.5">
                                                <p className="font-semibold text-sm text-on-surface line-clamp-1">{h.name}</p>
                                                <p className="text-xs text-on-surface-variant line-clamp-1">{h.location}</p>
                                                <p className="text-xs text-on-surface-variant tabular-nums">
                                                    {h.roomCount} phòng · {h.availableRoomCount} còn trống
                                                </p>
                                                {h.minPrice !== null && (
                                                    <p className="text-sm font-bold text-primary-container tabular-nums">
                                                        Từ {formatPrice(h.minPrice)} đ
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
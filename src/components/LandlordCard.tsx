import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { chatApi } from "../api/chatApi";
import { userApi } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import CallButton from "./CallButton";
import { UserAvatarLink, UserNameLink } from "./ui/UserLink";
import { alertErrorCls, asideCardCls, btnPrimary, btnSecondary, btnSmSecondary } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import { formatMonthYear } from "../utils/format";
import type { PublicProfile } from "../types/user";

interface Props {
    landlordId: number;
    relatedRoomId?: number;
}

export default function LandlordCard({ landlordId, relatedRoomId }: Props) {
    const navigate = useNavigate();
    const goLogin = useLoginRedirect();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [chatBusy, setChatBusy] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        userApi
            .getPublicProfile(landlordId)
            .then((p) => {
                if (!cancelled) setProfile(p);
            })
            .catch((err) => {
                if (cancelled) return;
                setLoadError(
                    err.response?.status === 404
                        ? "Thông tin chủ trọ không còn khả dụng"
                        : "Không tải được thông tin chủ trọ"
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [landlordId, isAuthenticated, reloadKey]);

    const startChat = async () => {
        if (!isAuthenticated) {
            goLogin();
            return;
        }
        setChatBusy(true);
        setChatError(null);
        try {
            const room = await chatApi.createOrGetRoom(landlordId, relatedRoomId);
            navigate(`/chat?roomId=${room.id}`);
        } catch (err) {
            setChatError(apiErrorMessage(err, "Không thể bắt đầu cuộc trò chuyện, thử lại sau"));
            setChatBusy(false);
        }
    };

    const heading = (
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Chủ trọ</p>
    );

    if (loading) {
        return (
            <div className={`${asideCardCls} flex flex-col gap-4 animate-pulse`}>
                {heading}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 bg-surface-container rounded" />
                        <div className="h-3 w-1/3 bg-surface-container rounded" />
                    </div>
                </div>
                <div className="h-20 bg-surface-container rounded-lg" />
            </div>
        );
    }

    if (loadError || !profile) {
        return (
            <div className={`${asideCardCls} flex flex-col gap-3`}>
                {heading}
                <p className="text-sm text-on-surface-variant">{loadError ?? "Không tải được thông tin chủ trọ"}</p>
                <button onClick={() => setReloadKey((k) => k + 1)} className={`${btnSmSecondary} self-start`}>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className={`${asideCardCls} flex flex-col gap-4`}>
            {heading}

            <div className="flex items-center gap-3">
                <UserAvatarLink userId={profile.id} name={profile.displayName} size="lg" />
                <div className="min-w-0">
                    <UserNameLink userId={profile.id} className="block font-semibold text-on-surface truncate">
                        {profile.displayName}
                    </UserNameLink>
                    <p className="text-xs text-on-surface-variant">
                        {profile.memberSince ? `Tham gia từ ${formatMonthYear(profile.memberSince)} · ` : ""}
                        <span className="tabular-nums">{profile.houses.length}</span> nhà trọ
                    </p>
                </div>
            </div>

            {profile.self ? (
                <div className="bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface-variant">
                    Đây là nhà trọ của bạn.
                </div>
            ) : (
                <>
                    <div>
                        <p className="text-xs text-on-surface-variant mb-1.5">Số điện thoại</p>
                        <CallButton phone={profile.phone} masked={profile.phoneMasked} onLogin={goLogin} />
                    </div>

                    {chatError && <div className={alertErrorCls}>{chatError}</div>}

                    <button onClick={startChat} disabled={chatBusy} className={`${btnPrimary} w-full`}>
                        <span className="material-symbols-outlined !text-[18px]">chat</span>
                        {chatBusy ? "Đang kết nối..." : "Nhắn tin cho chủ trọ"}
                    </button>
                </>
            )}

            <Link to={`/users/${profile.id}`} className={`${btnSecondary} w-full`}>
                Xem hồ sơ chủ trọ
            </Link>
        </div>
    );
}
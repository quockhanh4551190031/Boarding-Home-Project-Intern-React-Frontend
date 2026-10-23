import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { chatApi } from "../api/chatApi";
import Badge from "./ui/Badge";
import { UserNameLink } from "./ui/UserLink";
import { btnSmDanger, btnSmPrimary, btnSmSecondary } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import { formatPhone } from "../utils/format";
import { formatSlotDate, formatSlotTime, statusInfo } from "../utils/viewing";
import type { Perspective, Viewing } from "../types/viewing";

interface Props {
    viewing: Viewing;
    perspective: Perspective;
    busy?: boolean;
    onAccept?: (v: Viewing) => void;
    onReject?: (v: Viewing) => void;
    onCancel?: (v: Viewing) => void;
}

export default function ViewingCard({ viewing: v, perspective, busy = false, onAccept, onReject, onCancel }: Props) {
    const navigate = useNavigate();
    const [chatBusy, setChatBusy] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    const tenantSide = perspective === "tenant";
    const info = statusInfo(v, perspective);
    const open = !v.past && (v.status === "PENDING" || v.status === "ACCEPTED");
    const counterpartId = tenantSide ? v.landlordId : v.tenantId;
    const counterpartName = tenantSide ? v.landlordName : v.tenantName;

    // Người viết lý do: người thuê khi tự hủy, còn lại là chủ trọ
    const noteByTenant = v.status === "CANCELLED_BY_TENANT";
    const noteLabel = noteByTenant === tenantSide ? "Lý do của bạn" : `Lý do từ ${noteByTenant ? "người thuê" : "chủ trọ"}`;

    const startChat = async () => {
        setChatBusy(true);
        setChatError(null);
        try {
            const room = await chatApi.createOrGetRoom(counterpartId, v.roomId);
            navigate(`/chat?roomId=${room.id}`);
        } catch (err) {
            setChatError(apiErrorMessage(err, "Không thể mở cuộc trò chuyện, thử lại sau"));
            setChatBusy(false);
        }
    };

    const titleCls = "font-semibold text-on-surface line-clamp-1";

    return (
        <article className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
                    {v.roomThumbnail ? (
                        <img src={v.roomThumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-outline">image</span>
                    )}
                </div>

                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            {v.roomVisible ? (
                                <Link to={`/rooms/${v.roomId}`} className={`${titleCls} hover:text-primary-container`}>
                                    {v.roomTitle}
                                </Link>
                            ) : (
                                <span className={titleCls}>{v.roomTitle}</span>
                            )}
                            <p className="text-xs text-on-surface-variant line-clamp-1">{v.houseName}</p>
                        </div>
                        <Badge tone={info.tone} dot>
                            {info.label}
                        </Badge>
                    </div>

                    <p className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
                        <span className="material-symbols-outlined !text-[18px] text-primary">event</span>
                        <span className="tabular-nums">{formatSlotTime(v.scheduledAt)}</span>
                        <span className="text-on-surface-variant font-normal">· {formatSlotDate(v.scheduledAt)}</span>
                    </p>
                    <p className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined !text-[16px] shrink-0">location_on</span>
                        <span className="line-clamp-2">{v.address}</span>
                    </p>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-on-surface-variant">{tenantSide ? "Chủ trọ" : "Người thuê"}</p>
                    <UserNameLink userId={counterpartId} className="font-medium text-on-surface">
                        {counterpartName}
                    </UserNameLink>
                </div>
                {v.contactPhone && (
                    <div>
                        <p className="text-xs text-on-surface-variant">
                            {tenantSide ? "Số liên hệ bạn đã gửi" : "Số điện thoại liên hệ"}
                        </p>
                        <a
                            href={`tel:${v.contactPhone}`}
                            className="font-medium text-primary-container hover:underline tabular-nums"
                        >
                            {formatPhone(v.contactPhone)}
                        </a>
                    </div>
                )}
            </div>

            {v.message && (
                <div className="bg-surface-container-low rounded-lg px-3 py-2 text-sm">
                    <p className="text-xs text-on-surface-variant">
                        {tenantSide ? "Ghi chú của bạn" : "Ghi chú của người thuê"}
                    </p>
                    <p className="whitespace-pre-line break-words text-on-surface">{v.message}</p>
                </div>
            )}

            {v.responseNote && (
                <div className="bg-surface-container-low rounded-lg px-3 py-2 text-sm">
                    <p className="text-xs text-on-surface-variant">{noteLabel}</p>
                    <p className="whitespace-pre-line break-words text-on-surface">{v.responseNote}</p>
                </div>
            )}

            {!tenantSide && v.conflict && open && (
                <div className="bg-amber-100 text-amber-700 text-sm px-3 py-2 rounded-lg flex items-start gap-2">
                    <span className="material-symbols-outlined !text-[18px] mt-0.5">warning</span>
                    Bạn đã có một lịch hẹn khác được xác nhận vào đúng giờ này.
                </div>
            )}

            {chatError && <p className="text-xs text-error">{chatError}</p>}

            <div className="flex flex-wrap gap-2">
                {!tenantSide && open && v.status === "PENDING" && (
                    <>
                        <button onClick={() => onAccept?.(v)} disabled={busy} className={btnSmPrimary}>
                            <span className="material-symbols-outlined !text-[16px]">check</span>
                            {busy ? "Đang xử lý..." : "Xác nhận"}
                        </button>
                        <button onClick={() => onReject?.(v)} disabled={busy} className={btnSmDanger}>
                            Từ chối
                        </button>
                    </>
                )}
                {open && (tenantSide || v.status === "ACCEPTED") && (
                    <button onClick={() => onCancel?.(v)} disabled={busy} className={btnSmDanger}>
                        Hủy lịch
                    </button>
                )}
                <button onClick={startChat} disabled={chatBusy} className={btnSmSecondary}>
                    <span className="material-symbols-outlined !text-[16px]">chat</span>
                    {chatBusy ? "Đang mở..." : "Nhắn tin"}
                </button>
            </div>
        </article>
    );
}
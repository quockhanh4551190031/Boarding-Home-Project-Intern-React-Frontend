import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Badge from "./ui/Badge";
import type { BadgeTone } from "./ui/Badge";
import type { Room } from "../types/room";

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}

const statusInfo: Record<Room["status"], { label: string; tone: BadgeTone }> = {
    AVAILABLE: { label: "Còn trống", tone: "success" },
    RENTED: { label: "Đã cho thuê", tone: "info" },
    HIDDEN: { label: "Không còn hiển thị", tone: "neutral" },
};

interface Props {
    room: Room;
    action?: ReactNode;
}

export default function RoomCard({ room, action }: Props) {
    const thumbnail = room.images.find((i) => i.thumbnail) ?? room.images[0];
    const status = statusInfo[room.status];
    const unavailable = room.status === "HIDDEN";
    const extraAmenities = room.amenities.length - 2;

    const body = (
        <>
            <div className="aspect-video bg-surface-container-low overflow-hidden relative">
                {thumbnail ? (
                    <img
                        src={thumbnail.imageUrl}
                        alt={room.title}
                        className={`w-full h-full object-cover ${unavailable ? "" : "group-hover:scale-105 transition-transform duration-300"
                            }`}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-outline">
                        <span className="material-symbols-outlined !text-[32px]">image</span>
                        <span className="text-xs">Chưa có ảnh</span>
                    </div>
                )}
                <div className="absolute top-2.5 left-2.5">
                    <Badge tone={status.tone} dot>
                        {status.label}
                    </Badge>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-2">
                <div>
                    <h3 className="font-semibold tracking-tight text-on-surface line-clamp-1">{room.title}</h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined !text-[14px]">home_work</span>
                        <span className="line-clamp-1">{room.houseName}</span>
                    </p>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-primary-container font-bold tabular-nums">{formatPrice(room.price)} đ</span>
                    <span className="text-xs text-on-surface-variant">/tháng</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                        <span className="material-symbols-outlined !text-[14px]">square_foot</span>
                        {room.area} m²
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                        <span className="material-symbols-outlined !text-[14px]">group</span>
                        {room.maxOccupants} người
                    </span>
                    {room.distanceKm !== null && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium tabular-nums">
                            <span className="material-symbols-outlined !text-[14px]">near_me</span>
                            {room.distanceKm} km
                        </span>
                    )}
                </div>

                {room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {room.amenities.slice(0, 2).map((a) => (
                            <span
                                key={a}
                                className="bg-surface-container-low text-on-surface-variant text-xs px-2 py-0.5 rounded-full"
                            >
                                {a}
                            </span>
                        ))}
                        {extraAmenities > 0 && (
                            <span className="bg-surface-container-low text-on-surface-variant text-xs px-2 py-0.5 rounded-full tabular-nums">
                                +{extraAmenities}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div
            className={`group relative bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden ${unavailable ? "" : "hover:shadow-md hover:-translate-y-0.5 transition-all"
                }`}
        >
            {unavailable ? (
                <div className="opacity-60">{body}</div>
            ) : (
                <Link to={`/rooms/${room.id}`} className="block">
                    {body}
                </Link>
            )}
            {action && <div className="absolute top-2.5 right-2.5">{action}</div>}
        </div>
    );
}
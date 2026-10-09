import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { houseApi } from "../api/houseApi";
import { roomApi } from "../api/roomApi";
import ImageGallery from "../components/ImageGallery";
import RoomDirectionsMap from "../components/RoomDirectionsMap";
import type { BoardingHouse } from "../types/house";
import type { Room } from "../types/room";

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}

function formatShort(price: number): string {
    if (price >= 1_000_000) {
        return (price / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
    }
    return Math.round(price / 1000) + "k";
}

const cardCls = "bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-5";

export default function HouseDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [house, setHouse] = useState<BoardingHouse | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRooms, setShowRooms] = useState(false);
    const roomsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        Promise.all([houseApi.getById(Number(id)), roomApi.getByHouse(Number(id))])
            .then(([h, r]) => {
                setHouse(h);
                setRooms(r);
            })
            .catch(() => setError("Không tìm thấy nhà trọ này"))
            .finally(() => setLoading(false));
    }, [id]);

    const toggleRooms = () => {
        const next = !showRooms;
        setShowRooms(next);
        if (next) {
            setTimeout(() => roomsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }
    };

    const avgPrice =
        rooms.length > 0 ? Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length) : null;
    const availableCount = rooms.filter((r) => r.status === "AVAILABLE").length;

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-5 w-40 bg-surface-container rounded mb-3" />
                <div className="h-9 w-72 bg-surface-container rounded mb-6" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 aspect-video bg-surface-container rounded-xl" />
                    <div className="h-64 bg-surface-container rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !house) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined !text-[40px] text-outline">error</span>
                <p className="text-on-surface font-medium">{error ?? "Không tìm thấy nhà trọ"}</p>
                <Link to="/" className="text-primary-container hover:underline text-sm">
                    Quay lại trang chủ
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary-container mb-5"
            >
                <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                Tất cả nhà trọ
            </Link>

            <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Nhà trọ</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <span className="text-xs text-on-surface-variant">{house.city}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-on-surface">{house.name}</h1>
                <p className="text-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[16px]">location_on</span>
                    {house.address}, {house.ward}, {house.city}
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <ImageGallery images={house.images} alt={house.name} />

                    {house.description && (
                        <section className={cardCls}>
                            <h2 className="font-semibold text-on-surface mb-2">Giới thiệu</h2>
                            <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                                {house.description}
                            </p>
                        </section>
                    )}

                    <section className={cardCls}>
                        <RoomDirectionsMap destLat={house.latitude} destLng={house.longitude} destLabel={house.name} />
                    </section>
                </div>

                <aside className={`${cardCls} lg:sticky lg:top-24 flex flex-col gap-4`}>
                    <div>
                        <p className="text-xs text-on-surface-variant mb-1">Giá trung bình</p>
                        {avgPrice !== null ? (
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-primary-container tabular-nums">
                                    {formatPrice(avgPrice)}
                                </span>
                                <span className="text-sm text-on-surface-variant">đ/tháng</span>
                            </div>
                        ) : (
                            <p className="text-on-surface-variant text-sm">Chưa có phòng để tính giá</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-surface-container-low rounded-lg p-3">
                            <span className="material-symbols-outlined !text-[18px] text-primary">meeting_room</span>
                            <p className="font-bold text-on-surface tabular-nums text-lg leading-tight mt-0.5">{rooms.length}</p>
                            <p className="text-[11px] text-on-surface-variant">Tổng số phòng</p>
                        </div>
                        <div className="bg-surface-container-low rounded-lg p-3">
                            <span className="material-symbols-outlined !text-[18px] text-emerald-600">check_circle</span>
                            <p className="font-bold text-on-surface tabular-nums text-lg leading-tight mt-0.5">
                                {availableCount}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">Còn trống</p>
                        </div>
                    </div>

                    <button
                        onClick={toggleRooms}
                        className="h-11 bg-primary-container text-on-primary font-medium rounded-lg hover:bg-primary transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined !text-[20px]">
                            {showRooms ? "expand_less" : "grid_view"}
                        </span>
                        {showRooms ? "Ẩn danh sách phòng" : `Xem phòng (${rooms.length})`}
                    </button>
                </aside>
            </div>

            {showRooms && (
                <section ref={roomsRef} className="mt-8 scroll-mt-24">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold tracking-tight text-on-surface">Danh sách phòng</h2>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Còn trống
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" /> Đã thuê/ẩn
                            </span>
                        </div>
                    </div>

                    {rooms.length === 0 ? (
                        <div className={`${cardCls} text-center text-on-surface-variant text-sm py-10`}>
                            Nhà trọ này chưa có phòng nào
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {rooms.map((room, idx) => {
                                const available = room.status === "AVAILABLE";
                                return (
                                    <Link
                                        key={room.id}
                                        to={`/rooms/${room.id}`}
                                        title={room.title}
                                        className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${available
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400"
                                            : "bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:border-outline"
                                            }`}
                                    >
                                        <span className="text-[11px] uppercase tracking-wide opacity-70">Phòng</span>
                                        <span className="text-2xl font-bold tabular-nums leading-none">{idx + 1}</span>
                                        <span className="text-[11px] font-medium tabular-nums mt-0.5">{formatShort(room.price)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
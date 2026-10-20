import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { houseApi } from "../api/houseApi";
import { roomApi } from "../api/roomApi";
import CopyLinkButton from "../components/CopyLinkButton";
import ImageGallery from "../components/ImageGallery";
import LandlordCard from "../components/LandlordCard";
import RatingLine from "../components/RatingLine";
import ReviewSection from "../components/ReviewSection";
import RoomDirectionsMap from "../components/RoomDirectionsMap";
import { asideCardCls, btnPrimary, sectionCardCls } from "../components/ui/styles";
import { formatPrice } from "../utils/format";
import type { BoardingHouse } from "../types/house";
import type { ReviewSummary } from "../types/review";
import type { Room } from "../types/room";

function formatShort(price: number): string {
    if (price >= 1_000_000) return (price / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
    return Math.round(price / 1000) + "k";
}

export default function HouseDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [house, setHouse] = useState<BoardingHouse | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRooms, setShowRooms] = useState(false);
    const [ratingSummary, setRatingSummary] = useState<ReviewSummary | null>(null);
    const roomsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setShowRooms(false);
        Promise.all([houseApi.getById(Number(id)), roomApi.getByHouse(Number(id))])
            .then(([h, r]) => {
                setHouse(h);
                setRooms(r);
            })
            .catch(() => setError("Không tìm thấy nhà trọ này"))
            .finally(() => setLoading(false));
    }, [id]);

    const openRooms = () => {
        setShowRooms(true);
        setTimeout(() => roomsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-4 w-48 bg-surface-container rounded mb-5" />
                <div className="h-9 w-72 bg-surface-container rounded mb-6" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 aspect-video bg-surface-container rounded-xl" />
                    <div className="h-72 bg-surface-container rounded-xl" />
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

    const prices = rooms.map((r) => r.price);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const availableCount = rooms.filter((r) => r.status === "AVAILABLE").length;
    const fullAddress = [house.address, house.ward, house.city].filter(Boolean).join(", ");

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-on-surface-variant mb-4 min-w-0">
                <Link to="/" className="hover:text-primary-container shrink-0">
                    Tìm phòng
                </Link>
                <span className="material-symbols-outlined !text-[16px] shrink-0">chevron_right</span>
                <span className="text-on-surface truncate">{house.name}</span>
            </nav>

            <header className="flex flex-col gap-2 mb-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Nhà trọ</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                            <span className="text-xs text-on-surface-variant">{house.city}</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-on-surface mt-1">{house.name}</h1>
                        <p className="text-sm text-on-surface-variant flex items-start gap-1 mt-1">
                            <span className="material-symbols-outlined !text-[16px] mt-0.5 shrink-0">location_on</span>
                            {fullAddress}
                        </p>
                    </div>
                    <CopyLinkButton />
                </div>
                {ratingSummary && <RatingLine summary={ratingSummary} />}
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
                    <ImageGallery images={house.images} alt={house.name} />
                </div>

                <aside className="lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-24 flex flex-col gap-4">
                    <div className={`${asideCardCls} flex flex-col gap-4`}>
                        <div>
                            <p className="text-xs text-on-surface-variant mb-1">Giá trung bình</p>
                            {avgPrice !== null ? (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-primary-container tabular-nums">
                                            {formatPrice(avgPrice)}
                                        </span>
                                        <span className="text-sm text-on-surface-variant">đ/tháng</span>
                                    </div>
                                    {minPrice !== maxPrice && minPrice !== null && maxPrice !== null && (
                                        <p className="text-xs text-on-surface-variant mt-1 tabular-nums">
                                            Từ {formatPrice(minPrice)} đến {formatPrice(maxPrice)} đ
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-on-surface-variant">Chưa có phòng để tính giá</p>
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

                        <button onClick={openRooms} disabled={rooms.length === 0} className={`${btnPrimary} w-full h-11`}>
                            <span className="material-symbols-outlined !text-[20px]">grid_view</span>
                            Xem phòng ({rooms.length})
                        </button>
                    </div>

                    <LandlordCard landlordId={house.landlordId} />
                </aside>

                <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 flex flex-col gap-6">
                    {house.description && (
                        <section className={sectionCardCls}>
                            <h2 className="font-semibold text-on-surface mb-2">Giới thiệu</h2>
                            <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                                {house.description}
                            </p>
                        </section>
                    )}

                    {showRooms && (
                        <section ref={roomsRef} className={`${sectionCardCls} scroll-mt-24`}>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <h2 className="font-semibold text-on-surface">Danh sách phòng</h2>
                                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Còn trống
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" /> Đã cho thuê
                                    </span>
                                </div>
                            </div>

                            {rooms.length === 0 ? (
                                <p className="text-sm text-on-surface-variant text-center py-6">Nhà trọ này chưa có phòng nào</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {rooms.map((room, idx) => {
                                        const available = room.status === "AVAILABLE";
                                        return (
                                            <Link
                                                key={room.id}
                                                to={`/rooms/${room.id}`}
                                                title={room.title}
                                                className={`rounded-xl border p-3 flex flex-col gap-0.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${available
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400"
                                                    : "bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:border-outline"
                                                    }`}
                                            >
                                                <span className="text-[11px] uppercase tracking-wide opacity-70">Phòng</span>
                                                <span className="text-2xl font-bold tabular-nums leading-none">{idx + 1}</span>
                                                <span className="text-sm font-semibold tabular-nums mt-1">{formatShort(room.price)}</span>
                                                <span className="text-[11px] opacity-80 tabular-nums">{room.area} m²</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    <section className={sectionCardCls}>
                        <RoomDirectionsMap destLat={house.latitude} destLng={house.longitude} destLabel={house.name} />
                    </section>

                    <div id="reviews" className="scroll-mt-24">
                        <ReviewSection
                            targetType="HOUSE"
                            targetId={house.id}
                            noun="nhà trọ"
                            onSummaryChange={setRatingSummary}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
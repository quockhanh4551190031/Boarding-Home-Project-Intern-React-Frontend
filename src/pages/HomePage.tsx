import { useEffect, useState } from "react";
import { roomApi } from "../api/roomApi";
import type { Room, RoomSearchParams } from "../types/room";
import HouseCard from "../components/HouseCard";
import type { HouseGroup } from "../components/HouseCard";
import RoomFilterSidebar from "../components/RoomFilterSidebar";

function groupByHouse(rooms: Room[]): HouseGroup[] {
    const map = new Map<number, HouseGroup>();
    for (const room of rooms) {
        const thumb = room.images.find((i) => i.thumbnail)?.imageUrl ?? room.images[0]?.imageUrl ?? null;
        const existing = map.get(room.houseId);
        if (!existing) {
            map.set(room.houseId, {
                houseId: room.houseId,
                houseName: room.houseName,
                thumbnail: thumb,
                roomCount: 1,
                minPrice: room.price,
                maxPrice: room.price,
            });
        } else {
            existing.roomCount += 1;
            existing.minPrice = Math.min(existing.minPrice, room.price);
            existing.maxPrice = Math.max(existing.maxPrice, room.price);
            if (!existing.thumbnail && thumb) existing.thumbnail = thumb;
        }
    }
    return Array.from(map.values());
}

function SkeletonCard() {
    return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-video bg-surface-container" />
            <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-container rounded w-3/4" />
                <div className="h-4 bg-surface-container rounded w-1/2" />
            </div>
        </div>
    );
}

export default function HomePage() {
    const [filters, setFilters] = useState<RoomSearchParams>({ page: 0, size: 12, sortBy: "NEWEST" });
    const [houses, setHouses] = useState<HouseGroup[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        roomApi
            .search(filters)
            .then((res) => {
                setHouses(groupByHouse(res.rooms));
                setTotalPages(res.totalPages);
                setTotalElements(res.totalElements);
            })
            .catch(() => setHouses([]))
            .finally(() => setLoading(false));
    }, [filters]);

    const goToPage = (page: number) => {
        setFilters({ ...filters, page });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Khám phá</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="text-xs text-on-surface-variant">Cập nhật theo thời gian thực</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-on-surface">Tìm nhà trọ</h1>
                    <p className="text-sm text-on-surface-variant max-w-xl">
                        Duyệt nhà trọ theo khu vực, mức giá và tiện ích — xem ảnh, bản đồ và chọn đúng phòng bạn cần.
                    </p>
                </div>

                <div className="bg-surface-container-lowest shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 self-start md:self-auto select-none">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined !text-[18px]">meeting_room</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-on-surface-variant">Phòng đang cho thuê</span>
                        <span className="font-bold text-on-surface tabular-nums">{totalElements}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <RoomFilterSidebar filters={filters} onChange={setFilters} />

                <div className="flex-1 w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }, (_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : houses.length === 0 ? (
                        <div className="bg-surface-container-lowest rounded-xl shadow-sm py-16 flex flex-col items-center gap-2 text-on-surface-variant select-none">
                            <span className="material-symbols-outlined !text-[40px] text-outline">search_off</span>
                            <p className="font-medium text-on-surface">Không tìm thấy nhà trọ phù hợp</p>
                            <p className="text-sm">Thử nới rộng bộ lọc hoặc bấm "Xóa lọc"</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {houses.map((h) => (
                                    <HouseCard key={h.houseId} house={h} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center gap-1.5 mt-8">
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToPage(i)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium tabular-nums transition-colors ${i === filters.page
                                                ? "bg-primary-container text-on-primary shadow-sm"
                                                : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low"
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
import { useEffect, useMemo, useState } from "react";
import { houseApi } from "../api/houseApi";
import { reviewApi } from "../api/reviewApi";
import HouseCard from "../components/HouseCard";
import HouseMap from "../components/HouseMap";
import NearMeControl from "../components/NearMeControl";
import RoomFilterSidebar from "../components/RoomFilterSidebar";
import PageHeader from "../components/ui/PageHeader";
import Segmented from "../components/ui/Segmented";
import StatPill from "../components/ui/StatPill";
import { alertErrorCls, btnSecondary } from "../components/ui/styles";
import { useBrowseStore } from "../store/browseStore";
import type { BrowseView } from "../store/browseStore";
import { getPosition } from "../utils/geo";
import type { HouseSearchResponse } from "../types/house";
import type { ReviewSummaryItem } from "../types/review";
import type { RoomSearchParams } from "../types/room";

const PAGE_SIZE = 12;
const MAP_LIMIT = 100;

function countActiveFilters(f: RoomSearchParams): number {
    let n = 0;
    if (f.keyword?.trim()) n++;
    if (f.minPrice !== undefined || f.maxPrice !== undefined) n++;
    if (f.minArea !== undefined || f.maxArea !== undefined) n++;
    if (f.city) n++;
    if (f.ward) n++;
    if (f.amenityIds && f.amenityIds.length > 0) n++;
    return n;
}

function pageWindow(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages = [...new Set([0, total - 1, current - 1, current, current + 1])]
        .filter((p) => p >= 0 && p < total)
        .sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    pages.forEach((p, i) => {
        if (i > 0 && p - pages[i - 1] > 1) out.push("…");
        out.push(p);
    });
    return out;
}

const pagerBtn = (active: boolean) =>
    `w-9 h-9 rounded-lg text-sm font-medium tabular-nums transition-colors inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${active
        ? "bg-primary-container text-on-primary shadow-sm"
        : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low"
    }`;

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
    const filters = useBrowseStore((s) => s.filters);
    const view = useBrowseStore((s) => s.view);
    const near = useBrowseStore((s) => s.near);
    const radiusKm = useBrowseStore((s) => s.radiusKm);
    const setFilters = useBrowseStore((s) => s.setFilters);
    const setView = useBrowseStore((s) => s.setView);
    const setNear = useBrowseStore((s) => s.setNear);
    const setRadiusKm = useBrowseStore((s) => s.setRadiusKm);

    const [result, setResult] = useState<HouseSearchResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [ratings, setRatings] = useState<Record<number, ReviewSummaryItem> | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    const mapMode = view === "map";
    const radius = near ? radiusKm : null;
    const page = filters.page ?? 0;
    const houses = useMemo(() => result?.houses ?? [], [result]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);

        houseApi
            .search({
                ...filters,
                page: mapMode ? 0 : page,
                size: mapMode ? MAP_LIMIT : PAGE_SIZE,
                sortBy: near ? "DISTANCE" : filters.sortBy,
                lat: near?.lat,
                lng: near?.lng,
                radiusKm: radius ?? undefined,
            })
            .then((res) => {
                if (cancelled) return;
                // Đang ở trang cuối của bộ lọc cũ, bộ lọc mới ít kết quả hơn: về trang đầu
                if (res.currentPage > 0 && res.houses.length === 0) {
                    setFilters({ ...filters, page: 0 });
                    return;
                }
                setResult(res);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [filters, mapMode, near, radius, page, reloadKey, setFilters]);

    useEffect(() => {
        if (mapMode || houses.length === 0) {
            setRatings({});
            return;
        }
        let cancelled = false;
        setRatings(null);
        reviewApi
            .getSummaries("HOUSE", houses.map((h) => h.id))
            .then((r) => {
                if (!cancelled) setRatings(r);
            })
            .catch(() => {
                if (!cancelled) setRatings({});
            });
        return () => {
            cancelled = true;
        };
    }, [houses, mapMode]);

    const handleLocate = async () => {
        setLocating(true);
        setGeoError(null);
        try {
            const pos = await getPosition();
            setNear(pos);
            setFilters({ ...filters, page: 0 });
        } catch (err) {
            setGeoError(err instanceof Error ? err.message : "Không lấy được vị trí, thử lại sau");
        } finally {
            setLocating(false);
        }
    };

    const handleClearNear = () => {
        setNear(null);
        setRadiusKm(null);
        setGeoError(null);
        setFilters({ ...filters, page: 0 });
    };

    const handleRadius = (km: number | null) => {
        setRadiusKm(km);
        setFilters({ ...filters, page: 0 });
    };

    const goToPage = (p: number) => {
        setFilters({ ...filters, page: p });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const totalHouses = result?.totalHouses ?? 0;
    const totalRooms = result?.totalRooms ?? 0;
    const truncated = mapMode && !!result && result.totalHouses > result.houses.length;
    const activeFilters = countActiveFilters(filters);

    const emptyState = (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm py-16 flex flex-col items-center gap-2 text-on-surface-variant text-center px-4">
            <span className="material-symbols-outlined !text-[40px] text-outline">search_off</span>
            <p className="font-medium text-on-surface">
                {radius ? `Không có nhà trọ nào trong bán kính ${radius} km` : "Không tìm thấy nhà trọ phù hợp"}
            </p>
            <p className="text-sm">
                {radius ? "Thử mở rộng bán kính hoặc nới bộ lọc." : 'Thử nới rộng bộ lọc hoặc bấm "Xóa lọc".'}
            </p>
            {radius && (
                <button onClick={() => handleRadius(null)} className={`${btnSecondary} mt-2`}>
                    Mở rộng bán kính
                </button>
            )}
        </div>
    );

    let content;
    if (error) {
        content = (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm py-14 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined !text-[40px] text-outline">cloud_off</span>
                <p className="font-medium text-on-surface">Không tải được danh sách nhà trọ</p>
                <button onClick={() => setReloadKey((k) => k + 1)} className={btnSecondary}>
                    Thử lại
                </button>
            </div>
        );
    } else if (loading && !result) {
        content = (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    } else if (mapMode) {
        content =
            houses.length === 0 && !near ? (
                emptyState
            ) : (
                <>
                    <HouseMap houses={houses} user={near} radiusKm={radius} />
                    <p className="text-xs text-on-surface-variant mt-2">
                        {houses.length === 0
                            ? "Không có nhà trọ nào khớp trong khu vực này."
                            : `Hiển thị ${houses.length}/${totalHouses} nhà trọ trên bản đồ.`}
                        {truncated && ' Thu hẹp bộ lọc hoặc dùng "Gần tôi" để xem các nhà trọ khác.'}
                    </p>
                </>
            );
    } else if (houses.length === 0) {
        content = emptyState;
    } else {
        content = (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {houses.map((h) => (
                        <HouseCard
                            key={h.id}
                            house={h}
                            rating={ratings ? ratings[h.id] ?? { average: 0, count: 0 } : undefined}
                        />
                    ))}
                </div>

                {result && result.totalPages > 1 && (
                    <nav aria-label="Phân trang" className="flex justify-center items-center gap-1.5 mt-8">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => goToPage(page - 1)}
                            aria-label="Trang trước"
                            className={pagerBtn(false)}
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        {pageWindow(page, result.totalPages).map((p, i) =>
                            p === "…" ? (
                                <span key={`gap-${i}`} className="px-1 text-on-surface-variant">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => goToPage(p)}
                                    aria-current={p === page ? "page" : undefined}
                                    className={pagerBtn(p === page)}
                                >
                                    {p + 1}
                                </button>
                            )
                        )}
                        <button
                            type="button"
                            disabled={page >= result.totalPages - 1}
                            onClick={() => goToPage(page + 1)}
                            aria-label="Trang sau"
                            className={pagerBtn(false)}
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </nav>
                )}
            </>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <PageHeader
                eyebrow="Khám phá"
                note="Cập nhật theo thời gian thực"
                title="Tìm nhà trọ"
                description="Duyệt nhà trọ theo khu vực, mức giá và tiện ích, xem trên danh sách hoặc bản đồ."
                actions={
                    <>
                        <StatPill icon="home_work" label="Nhà trọ" value={totalHouses} />
                        <StatPill icon="meeting_room" label="Phòng đang cho thuê" value={totalRooms} />
                    </>
                }
            />

            <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                className={`${btnSecondary} lg:hidden w-full mb-4`}
            >
                <span className="material-symbols-outlined !text-[18px]">tune</span>
                Bộ lọc
                {activeFilters > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center tabular-nums">
                        {activeFilters}
                    </span>
                )}
            </button>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className={`${filterOpen ? "block" : "hidden"} lg:block w-full lg:w-72 shrink-0`}>
                    <RoomFilterSidebar
                        filters={filters}
                        sortLocked={!!near}
                        onChange={(f) => {
                            setFilters(f);
                            setFilterOpen(false);
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <NearMeControl
                            active={!!near}
                            locating={locating}
                            radiusKm={radiusKm}
                            onLocate={handleLocate}
                            onClear={handleClearNear}
                            onRadiusChange={handleRadius}
                        />
                        <div className="ml-auto">
                            <Segmented<BrowseView>
                                options={[
                                    { value: "list", label: "Danh sách" },
                                    { value: "map", label: "Bản đồ" },
                                ]}
                                value={view}
                                onChange={setView}
                            />
                        </div>
                    </div>

                    <p className="text-xs text-on-surface-variant mb-4 tabular-nums">
                        {result ? `${totalHouses} nhà trọ phù hợp` : "Đang tải..."}
                        {near && " · gần bạn nhất xếp trước"}
                    </p>

                    {geoError && (
                        <div role="alert" className={`${alertErrorCls} mb-4`}>
                            {geoError}
                        </div>
                    )}

                    <div className={loading && result ? "opacity-60 transition-opacity" : ""}>{content}</div>
                </div>
            </div>
        </div>
    );
}
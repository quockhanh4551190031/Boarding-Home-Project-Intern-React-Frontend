import { useEffect, useState } from "react";
import { roomApi } from "../api/roomApi";
import { locationApi } from "../api/houseApi";
import type { Amenity, RoomSearchParams } from "../types/room";

interface Props {
    filters: RoomSearchParams;
    onChange: (filters: RoomSearchParams) => void;
}

const inputCls =
    "w-full h-10 px-3 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed";
const labelCls = "text-sm font-medium text-on-surface block mb-1.5";

export default function RoomFilterSidebar({ filters, onChange }: Props) {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [wards, setWards] = useState<string[]>([]);
    const [loadingWards, setLoadingWards] = useState(false);
    const [local, setLocal] = useState<RoomSearchParams>(filters);

    useEffect(() => {
        roomApi.getAmenities().then(setAmenities).catch(() => { });
        locationApi.getProvinces().then(setProvinces).catch(() => { });
    }, []);

    useEffect(() => {
        if (!local.city) {
            setWards([]);
            return;
        }
        setLoadingWards(true);
        locationApi
            .getWards(local.city)
            .then(setWards)
            .finally(() => setLoadingWards(false));
    }, [local.city]);

    const handleCityChange = (city: string) => {
        setLocal({ ...local, city: city || undefined, ward: undefined });
    };

    const toggleAmenity = (id: number) => {
        const current = local.amenityIds ?? [];
        const next = current.includes(id) ? current.filter((a) => a !== id) : [...current, id];
        setLocal({ ...local, amenityIds: next });
    };

    const handleApply = () => onChange({ ...local, page: 0 });

    const handleReset = () => {
        const cleared: RoomSearchParams = { page: 0, size: 12, sortBy: "NEWEST" };
        setLocal(cleared);
        onChange(cleared);
    };

    const num = (v: string) => (v ? Number(v) : undefined);

    return (
        <aside className="w-full lg:w-72 shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 select-none">
                <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                    <span className="material-symbols-outlined !text-[16px]">tune</span>
                </div>
                <h2 className="font-semibold text-on-surface">Bộ lọc</h2>
            </div>

            <div>
                <label className={`${labelCls} select-none`}>Từ khóa</label>
                <div className="relative">
                    <span className="material-symbols-outlined !text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Tên phòng, khu vực..."
                        className={`${inputCls} pl-9`}
                        value={local.keyword ?? ""}
                        onChange={(e) => setLocal({ ...local, keyword: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className={`${labelCls} select-none`}>Khoảng giá (đ/tháng)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Từ"
                        className={`${inputCls} tabular-nums`}
                        value={local.minPrice ?? ""}
                        onChange={(e) => setLocal({ ...local, minPrice: num(e.target.value) })}
                    />
                    <input
                        type="number"
                        placeholder="Đến"
                        className={`${inputCls} tabular-nums`}
                        value={local.maxPrice ?? ""}
                        onChange={(e) => setLocal({ ...local, maxPrice: num(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <label className={`${labelCls} select-none`}>Diện tích (m²)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Từ"
                        className={`${inputCls} tabular-nums`}
                        value={local.minArea ?? ""}
                        onChange={(e) => setLocal({ ...local, minArea: num(e.target.value) })}
                    />
                    <input
                        type="number"
                        placeholder="Đến"
                        className={`${inputCls} tabular-nums`}
                        value={local.maxArea ?? ""}
                        onChange={(e) => setLocal({ ...local, maxArea: num(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <label className={`${labelCls} select-none`}>Tỉnh/Thành phố</label>
                <select className={inputCls} value={local.city ?? ""} onChange={(e) => handleCityChange(e.target.value)}>
                    <option value="">Tất cả</option>
                    {provinces.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className={`${labelCls} select-none`}>Phường/Xã</label>
                <select
                    disabled={!local.city || loadingWards}
                    className={inputCls}
                    value={local.ward ?? ""}
                    onChange={(e) => setLocal({ ...local, ward: e.target.value || undefined })}
                >
                    <option value="">
                        {!local.city ? "Chọn tỉnh/thành trước" : loadingWards ? "Đang tải..." : "Tất cả"}
                    </option>
                    {wards.map((w) => (
                        <option key={w} value={w}>
                            {w}
                        </option>
                    ))}
                </select>
            </div>

            {amenities.length > 0 && (
                <div>
                    <label className={`${labelCls} select-none`}>Tiện ích</label>
                    <div className="flex flex-wrap gap-2">
                        {amenities.map((a) => {
                            const active = local.amenityIds?.includes(a.id) ?? false;
                            return (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => toggleAmenity(a.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active
                                        ? "bg-primary-container text-on-primary shadow-sm"
                                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                                        }`}
                                >
                                    {a.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <label className={`${labelCls} select-none`}>Sắp xếp</label>
                <select
                    className={inputCls}
                    value={local.sortBy ?? "NEWEST"}
                    onChange={(e) => setLocal({ ...local, sortBy: e.target.value as RoomSearchParams["sortBy"] })}
                >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="PRICE_ASC">Giá thấp đến cao</option>
                    <option value="PRICE_DESC">Giá cao đến thấp</option>
                    <option value="AREA_ASC">Diện tích nhỏ đến lớn</option>
                    <option value="AREA_DESC">Diện tích lớn đến nhỏ</option>
                </select>
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    onClick={handleApply}
                    className="flex-1 h-10 bg-primary-container text-on-primary text-sm font-medium rounded-lg hover:bg-primary transition-colors shadow-sm cursor-pointer"
                >
                    Áp dụng
                </button>
                <button
                    onClick={handleReset}
                    className="h-10 px-4 bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-sm font-medium rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                    Xóa lọc
                </button>
            </div>
        </aside>
    );
}
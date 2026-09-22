import { useEffect, useState } from "react";
import { roomApi } from "../api/roomApi";
import type { Amenity, RoomSearchParams } from "../types/room";

interface Props {
    filters: RoomSearchParams;
    onChange: (filters: RoomSearchParams) => void;
}

export default function RoomFilterSidebar({ filters, onChange }: Props) {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [local, setLocal] = useState<RoomSearchParams>(filters);

    useEffect(() => {
        roomApi.getAmenities().then(setAmenities).catch(() => {});
    }, []);

    const toggleAmenity = (id: number) => {
        const current = local.amenityIds ?? [];
        const next = current.includes(id)
            ? current.filter((a) => a !== id)
            : [...current, id];
        setLocal({ ...local, amenityIds: next });
    };

    const handleApply = () => {
        onChange({ ...local, page: 0 });
    };

    const handleReset = () => {
        const cleared: RoomSearchParams = { page: 0, size: 12, sortBy: "NEWEST" };
        setLocal(cleared);
        onChange(cleared);
    };

    return (
        <aside className="w-64 shrink-0 bg-white rounded-xl border p-4 space-y-5 h-fit">
            <div>
                <label className="text-sm font-semibold block mb-1">Từ khóa</label>
                <input
                    type="text"
                    placeholder="Tên phòng, khu vực..."
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={local.keyword ?? ""}
                    onChange={(e) => setLocal({ ...local, keyword: e.target.value })}
                />
            </div>

            <div>
                <label className="text-sm font-semibold block mb-1">Khoảng giá (đ/tháng)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Từ"
                        className="w-1/2 border rounded px-2 py-2 text-sm"
                        value={local.minPrice ?? ""}
                        onChange={(e) =>
                            setLocal({ ...local, minPrice: e.target.value ? Number(e.target.value) : undefined })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Đến"
                        className="w-1/2 border rounded px-2 py-2 text-sm"
                        value={local.maxPrice ?? ""}
                        onChange={(e) =>
                            setLocal({ ...local, maxPrice: e.target.value ? Number(e.target.value) : undefined })
                        }
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-semibold block mb-1">Diện tích (m²)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Từ"
                        className="w-1/2 border rounded px-2 py-2 text-sm"
                        value={local.minArea ?? ""}
                        onChange={(e) =>
                            setLocal({ ...local, minArea: e.target.value ? Number(e.target.value) : undefined })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Đến"
                        className="w-1/2 border rounded px-2 py-2 text-sm"
                        value={local.maxArea ?? ""}
                        onChange={(e) =>
                            setLocal({ ...local, maxArea: e.target.value ? Number(e.target.value) : undefined })
                        }
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-semibold block mb-1">Tỉnh/Thành phố</label>
                <input
                    type="text"
                    placeholder="VD: Thành phố Hồ Chí Minh"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={local.city ?? ""}
                    onChange={(e) => setLocal({ ...local, city: e.target.value })}
                />
            </div>

            {amenities.length > 0 && (
                <div>
                    <label className="text-sm font-semibold block mb-1">Tiện ích</label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {amenities.map((a) => (
                            <label key={a.id} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={local.amenityIds?.includes(a.id) ?? false}
                                    onChange={() => toggleAmenity(a.id)}
                                />
                                {a.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label className="text-sm font-semibold block mb-1">Sắp xếp</label>
                <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={local.sortBy ?? "NEWEST"}
                    onChange={(e) =>
                        setLocal({ ...local, sortBy: e.target.value as RoomSearchParams["sortBy"] })
                    }
                >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="PRICE_ASC">Giá thấp đến cao</option>
                    <option value="PRICE_DESC">Giá cao đến thấp</option>
                    <option value="AREA_ASC">Diện tích nhỏ đến lớn</option>
                    <option value="AREA_DESC">Diện tích lớn đến nhỏ</option>
                </select>
            </div>

            <div className="flex gap-2 pt-2">
                <button
                    onClick={handleApply}
                    className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700"
                >
                    Áp dụng
                </button>
                <button
                    onClick={handleReset}
                    className="px-3 text-sm border rounded hover:bg-gray-50"
                >
                    Xóa lọc
                </button>
            </div>
        </aside>
    );
}
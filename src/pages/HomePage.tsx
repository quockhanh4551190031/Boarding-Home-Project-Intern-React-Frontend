import { useEffect, useState } from "react";
import { roomApi } from "../api/roomApi";
import type { Room, RoomSearchParams } from "../types/room";
import RoomCard from "../components/RoomCard";
import RoomFilterSidebar from "../components/RoomFilterSidebar";

export default function HomePage() {
    const [filters, setFilters] = useState<RoomSearchParams>({
        page: 0,
        size: 12,
        sortBy: "NEWEST",
    });
    const [rooms, setRooms] = useState<Room[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        roomApi
            .search(filters)
            .then((res) => {
                setRooms(res.rooms);
                setTotalPages(res.totalPages);
                setTotalElements(res.totalElements);
            })
            .catch(() => setRooms([]))
            .finally(() => setLoading(false));
    }, [filters]);

    const goToPage = (page: number) => {
        setFilters({ ...filters, page });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-1">Tìm phòng trọ</h1>
            <p className="text-gray-500 text-sm mb-6">
                {totalElements} phòng đang cho thuê
            </p>

            <div className="flex gap-6">
                <RoomFilterSidebar filters={filters} onChange={setFilters} />

                <div className="flex-1">
                    {loading ? (
                        <div className="text-center py-16 text-gray-400">Đang tải...</div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            Không tìm thấy phòng nào phù hợp
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rooms.map((room) => (
                                    <RoomCard key={room.id} room={room} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-8">
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToPage(i)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium ${
                                                i === filters.page
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white border hover:bg-gray-50"
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
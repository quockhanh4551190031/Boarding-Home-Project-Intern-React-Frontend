import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { houseApi } from "../api/houseApi";
import { roomApi } from "../api/roomApi";
import RoomDirectionsMap from "../components/RoomDirectionsMap";
import type { BoardingHouse } from "../types/house";
import type { Room } from "../types/room";

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ/tháng";
}

export default function HouseDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [house, setHouse] = useState<BoardingHouse | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [showRooms, setShowRooms] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([houseApi.getById(Number(id)), roomApi.getByHouse(Number(id))])
            .then(([h, r]) => {
                setHouse(h);
                setRooms(r);
            })
            .catch(() => setError("Không tìm thấy nhà trọ này"))
            .finally(() => setLoading(false));
    }, [id]);

    const avgPrice =
        rooms.length > 0 ? Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length) : null;

    if (loading) {
        return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">Đang tải...</div>;
    }

    if (error || !house) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <p className="text-gray-500 mb-4">{error ?? "Không tìm thấy nhà trọ"}</p>
                <Link to="/" className="text-blue-600 hover:underline">Quay lại trang chủ</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    {house.images.length > 0 ? (
                        <img src={house.images[activeImage]} alt={house.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có ảnh</div>
                    )}
                </div>

                {house.images.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                        {house.images.map((url, idx) => (
                            <button
                                key={url}
                                onClick={() => setActiveImage(idx)}
                                className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${idx === activeImage ? "border-blue-600" : "border-transparent"
                                    }`}
                            >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <h1 className="text-2xl font-bold mb-1">{house.name}</h1>
            <p className="text-gray-500 mb-4">
                {house.address}, {house.ward}, {house.city}
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
                {avgPrice !== null && (
                    <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(avgPrice)}{" "}
                        <span className="text-sm font-normal text-gray-500">(giá trung bình)</span>
                    </span>
                )}
                <span className="text-gray-600 self-center">{rooms.length} phòng</span>
            </div>

            {house.description && (
                <div className="mb-8">
                    <h2 className="font-semibold mb-2">Mô tả</h2>
                    <p className="text-gray-700 whitespace-pre-line">{house.description}</p>
                </div>
            )}

            <div className="mb-8 pb-8 border-b">
                <RoomDirectionsMap destLat={house.latitude} destLng={house.longitude} destLabel={house.name} />
            </div>

            <button
                onClick={() => setShowRooms((s) => !s)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
                {showRooms ? "Ẩn danh sách phòng" : `Xem phòng (${rooms.length})`}
            </button>

            {showRooms && (
                <div className="mt-6">
                    {rooms.length === 0 ? (
                        <p className="text-gray-400">Nhà trọ này chưa có phòng nào</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                {rooms.map((room, idx) => (
                                    <Link
                                        key={room.id}
                                        to={`/rooms/${room.id}`}
                                        title={room.title}
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium border-2 hover:border-blue-500 ${room.status === "AVAILABLE"
                                            ? "bg-green-50 text-green-700 border-green-100"
                                            : "bg-gray-100 text-gray-400 border-gray-100"
                                            }`}
                                    >
                                        <span className="text-xs">Phòng</span>
                                        <span className="text-lg">{idx + 1}</span>
                                    </Link>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Xanh: còn trống · Xám: đã cho thuê/ẩn</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
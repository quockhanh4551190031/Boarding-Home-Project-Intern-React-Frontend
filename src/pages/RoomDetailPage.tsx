import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { roomApi } from "../api/roomApi";
import { favoriteApi } from "../api/favoriteApi";
import { chatApi } from "../api/chatApi";
import { useAuthStore } from "../store/authStore";
import type { Room } from "../types/room";
import RoomDirectionsMap from "../components/RoomDirectionsMap";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + " đ/tháng";
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    roomApi
      .getById(Number(id))
      .then((data) => setRoom(data))
      .catch(() => setError("Không tìm thấy phòng trọ này"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    favoriteApi.checkStatus(Number(id)).then(setIsFavorited).catch(() => {});
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!room) return;
    setFavLoading(true);
    try {
      if (isFavorited) {
        await favoriteApi.remove(room.id);
        setIsFavorited(false);
      } else {
        await favoriteApi.add(room.id);
        setIsFavorited(true);
      }
    } catch {
      // im lặng bỏ qua, có thể thêm toast báo lỗi sau
    } finally {
      setFavLoading(false);
    }
  };

  const handleContact = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!room) return;
    setContactLoading(true);
    try {
      const chatRoom = await chatApi.createOrGetRoom(room.landlordId, room.id);
      navigate(`/chat?roomId=${chatRoom.id}`);
    } catch {
      setError("Không thể bắt đầu cuộc trò chuyện, thử lại sau");
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">Đang tải...</div>;
  }

  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error ?? "Không tìm thấy phòng trọ"}</p>
        <Link to="/" className="text-blue-600 hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Gallery ảnh */}
      <div className="mb-6">
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
          {room.images.length > 0 ? (
            <img
              src={room.images[activeImage].imageUrl}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Chưa có ảnh
            </div>
          )}
        </div>

        {room.images.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {room.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(idx)}
                className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${
                  idx === activeImage ? "border-blue-600" : "border-transparent"
                }`}
              >
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thông tin chính */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold">{room.title}</h1>
        <button
          onClick={toggleFavorite}
          disabled={favLoading}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border ${
            isFavorited
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {isFavorited ? "♥ Đã lưu" : "♡ Lưu tin"}
        </button>
      </div>

      <p className="text-gray-500 mb-4">{room.houseName}</p>

      <div className="flex flex-wrap gap-4 mb-6">
        <span className="text-2xl font-bold text-blue-600">{formatPrice(room.price)}</span>
        <span className="text-gray-600 self-center">{room.area} m²</span>
        <span className="text-gray-600 self-center">Tối đa {room.maxOccupants} người</span>
        {room.distanceKm !== null && (
          <span className="text-green-700 bg-green-50 px-2 py-1 rounded-full text-sm self-center">
            Cách bạn {room.distanceKm} km
          </span>
        )}
      </div>

      {room.amenities.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Tiện ích</h2>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((a) => (
              <span key={a} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-semibold mb-2">Mô tả</h2>
        <p className="text-gray-700 whitespace-pre-line">{room.description}</p>
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <button
        onClick={handleContact}
        disabled={contactLoading}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {contactLoading ? "Đang kết nối..." : "Nhắn tin cho chủ trọ"}
      </button>
      <div className="mt-8 pt-8 border-t">
        <RoomDirectionsMap
          destLat={room.houseLatitude}
          destLng={room.houseLongitude}
          destLabel={room.houseName}
        />
      </div>
    </div>
  );
}
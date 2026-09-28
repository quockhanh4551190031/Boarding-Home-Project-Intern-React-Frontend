import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { favoriteApi } from "../api/favoriteApi";
import RoomCard from "../components/RoomCard";
import type { Favorite } from "../types/favorite";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    favoriteApi
      .getMine()
      .then(setFavorites)
      .catch(() => setError("Không tải được danh sách yêu thích"))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (roomId: number) => {
    try {
      await favoriteApi.remove(roomId);
      // Cập nhật giao diện ngay, không cần gọi lại API lấy danh sách
      setFavorites((prev) => prev.filter((f) => f.room.id !== roomId));
    } catch {
      setError("Bỏ lưu thất bại, thử lại sau");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Phòng yêu thích</h1>
      <p className="text-gray-500 text-sm mb-6">{favorites.length} phòng đã lưu</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-3">Bạn chưa lưu phòng nào</p>
          <Link to="/" className="text-blue-600 hover:underline text-sm">
            Đi tìm phòng ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div key={fav.favoriteId} className="relative">
              <RoomCard room={fav.room} />
              <button
                onClick={() => handleRemove(fav.room.id)}
                className="absolute top-2 right-2 bg-white/90 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full shadow hover:bg-red-50"
              >
                ♥ Bỏ lưu
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
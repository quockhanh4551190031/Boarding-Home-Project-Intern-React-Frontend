import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { roomApi } from "../api/roomApi";
import { favoriteApi } from "../api/favoriteApi";
import { chatApi } from "../api/chatApi";
import { useAuthStore } from "../store/authStore";
import ImageGallery from "../components/ImageGallery";
import RoomDirectionsMap from "../components/RoomDirectionsMap";
import type { Room } from "../types/room";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price);
}

const cardCls = "bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-5";

const statusStyle: Record<Room["status"], { label: string; cls: string }> = {
  AVAILABLE: { label: "Còn trống", cls: "bg-emerald-100 text-emerald-700" },
  RENTED: { label: "Đã cho thuê", cls: "bg-secondary-container text-on-secondary-container" },
  HIDDEN: { label: "Đã ẩn", cls: "bg-surface-container text-on-surface-variant" },
};

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    roomApi
      .getById(Number(id))
      .then((data) => setRoom(data))
      .catch(() => setLoadError("Không tìm thấy phòng trọ này"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    favoriteApi.checkStatus(Number(id)).then(setIsFavorited).catch(() => { });
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!room) return;
    setFavLoading(true);
    setActionError(null);
    try {
      if (isFavorited) {
        await favoriteApi.remove(room.id);
        setIsFavorited(false);
      } else {
        await favoriteApi.add(room.id);
        setIsFavorited(true);
      }
    } catch {
      setActionError("Không thể cập nhật danh sách yêu thích, thử lại sau");
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
    setActionError(null);
    try {
      const chatRoom = await chatApi.createOrGetRoom(room.landlordId, room.id);
      navigate(`/chat?roomId=${chatRoom.id}`);
    } catch {
      setActionError("Không thể bắt đầu cuộc trò chuyện, thử lại sau");
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-5 w-40 bg-surface-container rounded mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 aspect-video bg-surface-container rounded-xl" />
          <div className="h-72 bg-surface-container rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError || !room) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-center">
        <span className="material-symbols-outlined !text-[40px] text-outline">error</span>
        <p className="text-on-surface font-medium">{loadError ?? "Không tìm thấy phòng trọ"}</p>
        <Link to="/" className="text-primary-container hover:underline text-sm">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const status = statusStyle[room.status];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to={`/houses/${room.houseId}`}
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary-container mb-5"
      >
        <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
        {room.houseName}
      </Link>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Cột trái: nội dung */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ImageGallery images={room.images.map((i) => i.imageUrl)} alt={room.title} />

          <section className={cardCls}>
            <h2 className="font-semibold text-on-surface mb-2">Mô tả</h2>
            <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
              {room.description || "Chủ trọ chưa thêm mô tả cho phòng này."}
            </p>
          </section>

          {room.amenities.length > 0 && (
            <section className={cardCls}>
              <h2 className="font-semibold text-on-surface mb-3">Tiện ích</h2>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((a) => (
                  <span
                    key={a}
                    className="bg-primary-fixed text-on-primary-fixed-variant text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className={cardCls}>
            <RoomDirectionsMap
              destLat={room.houseLatitude}
              destLng={room.houseLongitude}
              destLabel={room.houseName}
            />
          </section>
        </div>

        {/* Cột phải: card thông tin dính */}
        <aside className={`${cardCls} lg:sticky lg:top-24 flex flex-col gap-4`}>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight text-on-surface leading-snug">{room.title}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.cls}`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary-container tabular-nums">
              {formatPrice(room.price)}
            </span>
            <span className="text-sm text-on-surface-variant">đ/tháng</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-0.5">
              <span className="material-symbols-outlined !text-[18px] text-primary">square_foot</span>
              <span className="font-semibold text-on-surface tabular-nums text-sm">{room.area} m²</span>
              <span className="text-[11px] text-on-surface-variant">Diện tích</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-0.5">
              <span className="material-symbols-outlined !text-[18px] text-primary">group</span>
              <span className="font-semibold text-on-surface tabular-nums text-sm">{room.maxOccupants}</span>
              <span className="text-[11px] text-on-surface-variant">Tối đa</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-0.5">
              <span className="material-symbols-outlined !text-[18px] text-primary">visibility</span>
              <span className="font-semibold text-on-surface tabular-nums text-sm">{room.viewCount}</span>
              <span className="text-[11px] text-on-surface-variant">Lượt xem</span>
            </div>
          </div>

          {room.distanceKm !== null && (
            <span className="self-start bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Cách bạn {room.distanceKm} km
            </span>
          )}

          {actionError && (
            <div className="bg-error-container text-on-error-container text-sm px-3 py-2 rounded-lg">
              {actionError}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleContact}
              disabled={contactLoading}
              className="h-11 bg-primary-container text-on-primary font-medium rounded-lg hover:bg-primary transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-[20px]">chat</span>
              {contactLoading ? "Đang kết nối..." : "Nhắn tin cho chủ trọ"}
            </button>

            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`h-11 font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${isFavorited
                ? "bg-error-container/50 text-error border-error/20 hover:bg-error-container"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                }`}
            >
              <span
                className="material-symbols-outlined !text-[20px]"
                style={{ fontVariationSettings: `"FILL" ${isFavorited ? 1 : 0}` }}
              >
                favorite
              </span>
              {isFavorited ? "Đã lưu" : "Lưu tin"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
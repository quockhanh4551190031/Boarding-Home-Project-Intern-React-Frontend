import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { favoriteApi } from "../api/favoriteApi";
import { roomApi } from "../api/roomApi";
import CopyLinkButton from "../components/CopyLinkButton";
import ImageGallery from "../components/ImageGallery";
import LandlordCard from "../components/LandLordCard";
import RatingLine from "../components/RatingLine";
import ReviewSection from "../components/ReviewSection";
import RoomDirectionsMap from "../components/RoomDirectionsMap";
import Badge from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";
import { alertErrorCls, asideCardCls, sectionCardCls } from "../components/ui/styles";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import { apiErrorMessage } from "../utils/apiError";
import { formatPrice } from "../utils/format";
import type { ReviewSummary } from "../types/review";
import type { Room } from "../types/room";

const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';

const statusInfo: Record<Room["status"], { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: "Còn trống", tone: "success" },
  RENTED: { label: "Đã cho thuê", tone: "info" },
  HIDDEN: { label: "Đã ẩn", tone: "neutral" },
};

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goLogin = useLoginRedirect();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ratingSummary, setRatingSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    roomApi
      .getById(Number(id))
      .then(setRoom)
      .catch(() => setLoadError("Không tìm thấy phòng trọ này"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) {
      setIsFavorited(false);
      return;
    }
    favoriteApi.checkStatus(Number(id)).then(setIsFavorited).catch(() => { });
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      goLogin();
      return;
    }
    if (!room) return;
    setFavBusy(true);
    setActionError(null);
    try {
      if (isFavorited) {
        await favoriteApi.remove(room.id);
        setIsFavorited(false);
      } else {
        await favoriteApi.add(room.id);
        setIsFavorited(true);
      }
    } catch (err) {
      setActionError(apiErrorMessage(err, "Không thể cập nhật danh sách yêu thích, thử lại sau"));
    } finally {
      setFavBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 w-56 bg-surface-container rounded mb-5" />
        <div className="h-9 w-80 bg-surface-container rounded mb-6" />
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

  const status = statusInfo[room.status];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-on-surface-variant mb-4 min-w-0">
        <Link to="/" className="hover:text-primary-container shrink-0">
          Tìm phòng
        </Link>
        <span className="material-symbols-outlined !text-[16px] shrink-0">chevron_right</span>
        <Link to={`/houses/${room.houseId}`} className="hover:text-primary-container truncate">
          {room.houseName}
        </Link>
        <span className="material-symbols-outlined !text-[16px] shrink-0">chevron_right</span>
        <span className="text-on-surface truncate">{room.title}</span>
      </nav>

      <header className="flex flex-col gap-2 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Phòng trọ</span>
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface mt-1">{room.title}</h1>
            <p className="text-sm text-on-surface-variant flex items-start gap-1 mt-1">
              <span className="material-symbols-outlined !text-[16px] mt-0.5 shrink-0">location_on</span>
              <span>
                {room.houseAddress}{" "}
                <Link to={`/houses/${room.houseId}`} className="text-primary-container font-medium hover:underline">
                  · Xem nhà trọ
                </Link>
              </span>
            </p>
          </div>
          <CopyLinkButton />
        </div>
        {ratingSummary && <RatingLine summary={ratingSummary} />}
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <ImageGallery images={room.images.map((i) => i.imageUrl)} alt={room.title} />
        </div>

        <aside className="lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-24 flex flex-col gap-4">
          <div className={`${asideCardCls} flex flex-col gap-4`}>
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
              <span className="self-start bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums">
                Cách bạn {room.distanceKm} km
              </span>
            )}

            {actionError && <div className={alertErrorCls}>{actionError}</div>}

            <button
              onClick={toggleFavorite}
              disabled={favBusy}
              className={`h-11 font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${isFavorited
                ? "bg-error-container/50 text-error border-error/20 hover:bg-error-container"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                }`}
            >
              <span
                className="material-symbols-outlined !text-[20px]"
                style={isFavorited ? { fontVariationSettings: FILLED } : undefined}
              >
                favorite
              </span>
              {isFavorited ? "Đã lưu" : "Lưu tin"}
            </button>
          </div>

          <LandlordCard landlordId={room.landlordId} relatedRoomId={room.id} />
        </aside>

        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 flex flex-col gap-6">
          <section className={sectionCardCls}>
            <h2 className="font-semibold text-on-surface mb-2">Mô tả</h2>
            <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
              {room.description || "Chủ trọ chưa thêm mô tả cho phòng này."}
            </p>
          </section>

          {room.amenities.length > 0 && (
            <section className={sectionCardCls}>
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

          <section className={sectionCardCls}>
            <RoomDirectionsMap
              destLat={room.houseLatitude}
              destLng={room.houseLongitude}
              destLabel={room.houseName}
            />
          </section>

          <div id="reviews" className="scroll-mt-24">
            <ReviewSection
              targetType="ROOM"
              targetId={room.id}
              noun="phòng"
              onSummaryChange={setRatingSummary}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
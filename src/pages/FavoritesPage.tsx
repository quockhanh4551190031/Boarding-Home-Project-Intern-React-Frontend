import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { favoriteApi } from "../api/favoriteApi";
import RoomCard from "../components/RoomCard";
import PageHeader from "../components/ui/PageHeader";
import Segmented from "../components/ui/Segmented";
import StatPill from "../components/ui/StatPill";
import { alertErrorCls, btnPrimary, btnSecondary, inputCls } from "../components/ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import type { Favorite } from "../types/favorite";

const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';

type Filter = "all" | "available";
type Sort = "recent" | "priceAsc" | "priceDesc";

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-video bg-surface-container" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-surface-container rounded w-3/4" />
        <div className="h-3.5 bg-surface-container rounded w-1/2" />
        <div className="h-4 bg-surface-container rounded w-1/3" />
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    favoriteApi
      .getMine()
      .then(setFavorites)
      .catch((err) => setLoadError(apiErrorMessage(err, "Không tải được danh sách yêu thích")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleRemove = async (roomId: number) => {
    setError(null);
    setRemovingId(roomId);
    try {
      await favoriteApi.remove(roomId);
      setFavorites((prev) => prev.filter((f) => f.room.id !== roomId));
    } catch (err) {
      setError(apiErrorMessage(err, "Bỏ lưu thất bại, thử lại sau"));
    } finally {
      setRemovingId(null);
    }
  };

  const availableCount = favorites.filter((f) => f.room.status === "AVAILABLE").length;

  const visible = useMemo(() => {
    let list = filter === "available" ? favorites.filter((f) => f.room.status === "AVAILABLE") : favorites;
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.room.price - b.room.price);
    else if (sort === "priceDesc") list = [...list].sort((a, b) => b.room.price - a.room.price);
    return list;
  }, [favorites, filter, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        eyebrow="Của bạn"
        note="Danh sách đã lưu"
        title="Phòng yêu thích"
        description="Những phòng bạn đã lưu để xem lại và so sánh khi cần."
        actions={
          <>
            <StatPill icon="favorite" label="Đã lưu" value={favorites.length} />
            <StatPill icon="check_circle" label="Còn trống" value={availableCount} />
          </>
        }
      />

      {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm py-14 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined !text-[40px] text-outline">cloud_off</span>
          <p className="font-medium text-on-surface">{loadError}</p>
          <button onClick={load} className={btnSecondary}>
            Thử lại
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm py-16 flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined !text-[40px] text-outline">favorite</span>
          <div className="text-center">
            <p className="font-medium text-on-surface">Bạn chưa lưu phòng nào</p>
            <p className="text-sm">Bấm "Lưu tin" ở trang chi tiết phòng để thêm vào đây.</p>
          </div>
          <Link to="/" className={btnPrimary}>
            Đi tìm phòng
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <Segmented<Filter>
              options={[
                { value: "all", label: `Tất cả (${favorites.length})` },
                { value: "available", label: `Còn trống (${availableCount})` },
              ]}
              value={filter}
              onChange={setFilter}
            />
            <div className="w-full sm:w-48">
              <select
                className={inputCls}
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sắp xếp"
              >
                <option value="recent">Mới lưu gần đây</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm py-14 flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined !text-[36px] text-outline">search_off</span>
              <p className="font-medium text-on-surface">Không có phòng nào còn trống trong danh sách đã lưu</p>
              <button onClick={() => setFilter("all")} className={btnSecondary}>
                Xem tất cả
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((fav) => (
                <RoomCard
                  key={fav.favoriteId}
                  room={fav.room}
                  action={
                    <button
                      type="button"
                      onClick={() => handleRemove(fav.room.id)}
                      disabled={removingId === fav.room.id}
                      className="h-8 px-2.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm shadow-sm text-error text-xs font-medium inline-flex items-center gap-1 hover:bg-error-container transition-colors disabled:opacity-60"
                    >
                      <span
                        className="material-symbols-outlined !text-[16px]"
                        style={{ fontVariationSettings: FILLED }}
                      >
                        favorite
                      </span>
                      Bỏ lưu
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
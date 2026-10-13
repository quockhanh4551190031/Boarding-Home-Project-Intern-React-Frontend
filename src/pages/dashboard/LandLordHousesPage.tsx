import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { houseApi } from "../../api/houseApi";
import HouseFormModal from "../../components/HouseFormModal";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PageHeader from "../../components/ui/PageHeader";
import StatPill from "../../components/ui/StatPill";
import {
  alertErrorCls,
  btnPrimary,
  btnSmDanger,
  btnSmPrimary,
  btnSmSecondary,
} from "../../components/ui/styles";
import type { BoardingHouse, HouseFormData } from "../../types/house";

function SkeletonHouse() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden flex animate-pulse">
      <div className="w-44 h-40 bg-surface-container shrink-0" />
      <div className="flex-1 p-4 space-y-2.5">
        <div className="h-4 w-1/2 bg-surface-container rounded" />
        <div className="h-3.5 w-3/4 bg-surface-container rounded" />
        <div className="h-3.5 w-1/4 bg-surface-container rounded" />
      </div>
    </div>
  );
}

export default function LandlordHousesPage() {
  const [houses, setHouses] = useState<BoardingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingHouse, setEditingHouse] = useState<BoardingHouse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingHouse, setDeletingHouse] = useState<BoardingHouse | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHouses(await houseApi.getMine());
      setError(null);
    } catch {
      setError("Không tải được danh sách nhà trọ");
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const openCreate = () => {
    setEditingHouse(null);
    setShowForm(true);
  };

  const openEdit = (house: BoardingHouse) => {
    setEditingHouse(house);
    setShowForm(true);
  };

  const handleSubmit = async (data: HouseFormData) => {
    if (editingHouse) {
      await houseApi.update(editingHouse.id, data);
    } else {
      await houseApi.create(data);
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!deletingHouse) return;
    await houseApi.remove(deletingHouse.id);
    await refresh();
  };

  const totalRooms = houses.reduce((sum, h) => sum + h.roomCount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Quản lý"
        note="Chủ trọ"
        title="Nhà trọ của tôi"
        description="Thêm nhà trọ, cập nhật thông tin và vị trí, rồi chuyển sang quản lý từng phòng."
        actions={
          <>
            <StatPill icon="home_work" label="Nhà trọ" value={houses.length} />
            <StatPill icon="meeting_room" label="Tổng số phòng" value={totalRooms} />
            <button onClick={openCreate} className={`${btnPrimary} cursor-pointer`}>
              <span className="material-symbols-outlined !text-[18px]">add</span>
              Thêm nhà trọ
            </button>
          </>
        }
      />

      {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonHouse key={i} />
          ))}
        </div>
      ) : houses.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm py-16 flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined !text-[40px] text-outline">home_work</span>
          <div className="text-center">
            <p className="font-medium text-on-surface">Bạn chưa có nhà trọ nào</p>
            <p className="text-sm">Tạo nhà trọ đầu tiên để bắt đầu đăng phòng cho thuê.</p>
          </div>
          <button onClick={openCreate} className={`${btnPrimary} cursor-pointer`}>
            Thêm nhà trọ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {houses.map((house) => {
            const cover = house.images[0];
            const active = house.status === "ACTIVE";
            return (
              <article
                key={house.id}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row"
              >
                <div className="sm:w-44 h-40 sm:h-auto sm:min-h-40 shrink-0 bg-surface-container-low">
                  {cover ? (
                    <img src={cover} alt={house.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-outline">
                      <span className="material-symbols-outlined !text-[28px]">image</span>
                      <span className="text-xs">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold tracking-tight text-on-surface truncate">{house.name}</h3>
                    <Badge tone={active ? "success" : "neutral"} dot>
                      {active ? "Đang hoạt động" : "Đã ẩn"}
                    </Badge>
                  </div>

                  <p className="text-sm text-on-surface-variant flex items-start gap-1">
                    <span className="material-symbols-outlined !text-[16px] mt-0.5 shrink-0">location_on</span>
                    <span className="line-clamp-2">
                      {house.address}, {house.ward}, {house.city}
                    </span>
                  </p>

                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[16px] text-primary">meeting_room</span>
                    <span className="tabular-nums">{house.roomCount}</span> phòng
                  </p>

                  <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                    <Link to={`/dashboard/rooms?houseId=${house.id}`} className={btnSmPrimary}>
                      Xem phòng
                    </Link>
                    {active && (
                      <Link to={`/houses/${house.id}`} target="_blank" className={btnSmSecondary}>
                        Xem công khai
                      </Link>
                    )}
                    <button onClick={() => openEdit(house)} className={btnSmSecondary}>
                      Sửa
                    </button>
                    <button onClick={() => setDeletingHouse(house)} className={btnSmDanger}>
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <HouseFormModal house={editingHouse} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />
      )}

      {deletingHouse && (
        <ConfirmDialog
          title="Xóa nhà trọ"
          danger
          confirmLabel="Xóa nhà trọ"
          message={
            <>
              Xóa <strong className="text-on-surface">{deletingHouse.name}</strong>? Nhà trọ cùng các phòng
              thuộc nhà này sẽ không còn hiển thị công khai.
            </>
          }
          onConfirm={handleDelete}
          onClose={() => setDeletingHouse(null)}
        />
      )}
    </div>
  );
}
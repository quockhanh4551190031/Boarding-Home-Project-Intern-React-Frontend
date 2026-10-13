import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { roomApi } from "../../api/roomApi";
import { houseApi } from "../../api/houseApi";
import RoomFormModal from "../../components/RoomFormModal";
import RoomImageManager from "../../components/RoomImageManager";
import PageHeader from "../../components/ui/PageHeader";
import StatPill from "../../components/ui/StatPill";
import TableSkeleton from "../../components/ui/TableSkeleton";
import {
  alertErrorCls,
  btnPrimary,
  iconBtn,
  inputCls,
  tableCardCls,
  thCls,
} from "../../components/ui/styles";
import type { Room, RoomFormData } from "../../types/room";
import type { BoardingHouse } from "../../types/house";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price);
}

const statusOptions: { value: Room["status"]; label: string }[] = [
  { value: "AVAILABLE", label: "Còn trống" },
  { value: "RENTED", label: "Đã cho thuê" },
  { value: "HIDDEN", label: "Đã ẩn" },
];

const statusSelectCls: Record<Room["status"], string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RENTED: "bg-secondary-container text-on-secondary-container",
  HIDDEN: "bg-surface-container text-on-surface-variant",
};

export default function LandlordRoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const houseIdParam = searchParams.get("houseId");
  const filterHouseId = houseIdParam ? Number(houseIdParam) : null;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [houses, setHouses] = useState<BoardingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageRoomId, setImageRoomId] = useState<number | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [r, h] = await Promise.all([roomApi.getMine(), houseApi.getMine()]);
      setRooms(r);
      setHouses(h);
      setError(null);
    } catch {
      setError("Không tải được dữ liệu phòng trọ");
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const houseIds = new Set(houses.map((h) => h.id));
  const ownedRooms = rooms.filter((r) => houseIds.has(r.houseId));
  const displayed = filterHouseId ? ownedRooms.filter((r) => r.houseId === filterHouseId) : ownedRooms;
  const availableCount = displayed.filter((r) => r.status === "AVAILABLE").length;
  const managingRoom = rooms.find((r) => r.id === imageRoomId) ?? null;

  const openCreate = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleSubmit = async (data: RoomFormData) => {
    if (editingRoom) {
      await roomApi.update(editingRoom.id, data);
    } else {
      await roomApi.create(data);
    }
    await refresh();
  };

  const handleStatusChange = async (room: Room, status: Room["status"]) => {
    if (status === room.status) return;
    setStatusBusyId(room.id);
    setError(null);
    try {
      const updated = await roomApi.updateStatus(room.id, status);
      setRooms((prev) => prev.map((r) => (r.id === room.id ? updated : r)));
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Không thể đổi trạng thái phòng, thử lại sau");
    } finally {
      setStatusBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Quản lý"
        note="Chủ trọ"
        title="Phòng trọ"
        description="Cập nhật giá, ảnh và trạng thái từng phòng. Phòng đã cho thuê hoặc đã ẩn sẽ không xuất hiện trong kết quả tìm kiếm."
        actions={
          <>
            <StatPill icon="meeting_room" label="Số phòng" value={displayed.length} />
            <StatPill icon="check_circle" label="Còn trống" value={availableCount} />
          </>
        }
      />

      {!loading && houses.length === 0 && (
        <div className="bg-amber-100 text-amber-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined !text-[18px]">info</span>
          <span>
            Bạn cần tạo nhà trọ trước khi thêm phòng.{" "}
            <Link to="/dashboard/houses" className="font-semibold underline">
              Đến trang nhà trọ
            </Link>
          </span>
        </div>
      )}

      {error && <div className={`${alertErrorCls} mb-4`}>{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-64">
          <select
            className={inputCls}
            value={filterHouseId ?? ""}
            onChange={(e) => setSearchParams(e.target.value ? { houseId: e.target.value } : {})}
          >
            <option value="">Tất cả nhà trọ</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={openCreate} disabled={houses.length === 0} className={btnPrimary}>
          <span className="material-symbols-outlined !text-[18px]">add</span>
          Thêm phòng
        </button>
      </div>

      <div className={tableCardCls}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={`${thCls} text-left`}>Phòng</th>
                <th className={`${thCls} text-right`}>Giá</th>
                <th className={`${thCls} text-right`}>Diện tích</th>
                <th className={`${thCls} text-right`}>Lượt xem</th>
                <th className={`${thCls} text-left`}>Trạng thái</th>
                <th className={`${thCls} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <TableSkeleton cols={6} />
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined !text-[36px] text-outline block mb-1">
                      meeting_room
                    </span>
                    Chưa có phòng nào
                  </td>
                </tr>
              ) : (
                displayed.map((room) => {
                  const thumb = room.images.find((i) => i.thumbnail)?.imageUrl ?? room.images[0]?.imageUrl;
                  return (
                    <tr
                      key={room.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${room.status === "HIDDEN" ? "opacity-70" : ""
                        }`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined !text-[18px] text-outline">image</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-on-surface line-clamp-1">{room.title}</p>
                            <p className="text-xs text-on-surface-variant line-clamp-1">
                              {room.houseName} · <span className="tabular-nums">{room.images.length}</span> ảnh
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-on-surface tabular-nums whitespace-nowrap">
                        {formatPrice(room.price)} đ
                      </td>
                      <td className="px-4 py-2.5 text-right text-on-surface-variant tabular-nums whitespace-nowrap">
                        {room.area} m²
                      </td>
                      <td className="px-4 py-2.5 text-right text-on-surface-variant tabular-nums">
                        {room.viewCount}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={room.status}
                          disabled={statusBusyId === room.id}
                          onChange={(e) => handleStatusChange(room, e.target.value as Room["status"])}
                          aria-label="Trạng thái phòng"
                          className={`h-8 pl-3 pr-2 rounded-full text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${statusSelectCls[room.status]
                            }`}
                        >
                          {statusOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setImageRoomId(room.id)}
                          title="Quản lý ảnh"
                          aria-label="Quản lý ảnh"
                          className={iconBtn}
                        >
                          <span className="material-symbols-outlined">photo_library</span>
                        </button>
                        <button
                          onClick={() => openEdit(room)}
                          title="Sửa phòng"
                          aria-label="Sửa phòng"
                          className={iconBtn}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <RoomFormModal
          room={editingRoom}
          houses={houses}
          defaultHouseId={filterHouseId ?? undefined}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      {managingRoom && (
        <RoomImageManager room={managingRoom} onClose={() => setImageRoomId(null)} onUpdated={refresh} />
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { roomApi } from "../../api/roomApi";
import { houseApi } from "../../api/houseApi";
import RoomFormModal from "../../components/RoomFormModal";
import RoomImageManager from "../../components/RoomImageManager";
import type { Room, RoomFormData } from "../../types/room";
import type { BoardingHouse } from "../../types/house";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

const statusLabel: Record<Room["status"], string> = {
  AVAILABLE: "Còn trống",
  RENTED: "Đã cho thuê",
  HIDDEN: "Đã ẩn",
};

const statusColor: Record<Room["status"], string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  RENTED: "bg-blue-50 text-blue-700",
  HIDDEN: "bg-gray-100 text-gray-500",
};

export default function LandlordRoomsPage() {
  const [searchParams] = useSearchParams();
  const filterHouseId = searchParams.get("houseId");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [houses, setHouses] = useState<BoardingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [managingImagesRoom, setManagingImagesRoom] = useState<Room | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([roomApi.getMine(), houseApi.getMine()])
      .then(([roomsData, housesData]) => {
        setRooms(roomsData);
        setHouses(housesData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const displayedRooms = filterHouseId
    ? rooms.filter((r) => r.houseId === Number(filterHouseId))
    : rooms;

  const openCreate = () => {
    setEditingRoom(null);
    setShowFormModal(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setShowFormModal(true);
  };

  const handleSubmit = async (data: RoomFormData) => {
    if (editingRoom) {
      await roomApi.update(editingRoom.id, data);
    } else {
      await roomApi.create(data);
    }
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ẩn phòng này khỏi danh sách công khai?")) return;
    await roomApi.remove(id);
    loadData();
  };

  const refreshManagingRoom = () => {
    roomApi.getMine().then((data) => {
      setRooms(data);
      const updated = data.find((r) => r.id === managingImagesRoom?.id);
      if (updated) setManagingImagesRoom(updated);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          Phòng trọ {filterHouseId && houses.length > 0 && (
            <span className="text-gray-400 font-normal text-base">
              — {houses.find((h) => h.id === Number(filterHouseId))?.name}
            </span>
          )}
        </h1>
        <button
          onClick={openCreate}
          disabled={houses.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          + Thêm phòng
        </button>
      </div>

      {houses.length === 0 && !loading && (
        <p className="text-amber-600 text-sm mb-4 bg-amber-50 p-3 rounded-lg">
          Bạn cần tạo nhà trọ trước khi thêm phòng — vào mục "Nhà trọ của tôi".
        </p>
      )}

      {loading ? (
        <p className="text-gray-400">Đang tải...</p>
      ) : displayedRooms.length === 0 ? (
        <p className="text-gray-400">Chưa có phòng trọ nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRooms.map((room) => (
            <div key={room.id} className="bg-white border rounded-xl overflow-hidden">
              <div className="aspect-video bg-gray-100">
                {room.images[0] ? (
                  <img src={room.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{room.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor[room.status]}`}>
                    {statusLabel[room.status]}
                  </span>
                </div>
                <p className="text-blue-600 font-bold text-sm mt-1">{formatPrice(room.price)}</p>
                <p className="text-xs text-gray-400">{room.area} m² · {room.viewCount} lượt xem</p>

                <div className="flex gap-3 mt-3 text-xs">
                  <button onClick={() => setManagingImagesRoom(room)} className="text-blue-600 hover:underline">
                    Ảnh
                  </button>
                  <button onClick={() => openEdit(room)} className="text-gray-600 hover:underline">
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:underline">
                    Ẩn
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <RoomFormModal
          room={editingRoom}
          houses={houses}
          defaultHouseId={filterHouseId ? Number(filterHouseId) : undefined}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {managingImagesRoom && (
        <RoomImageManager
          room={managingImagesRoom}
          onClose={() => setManagingImagesRoom(null)}
          onUpdated={refreshManagingRoom}
        />
      )}
    </div>
  );
}
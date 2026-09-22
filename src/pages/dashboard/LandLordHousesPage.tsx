import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { houseApi } from "../../api/houseApi";
import HouseFormModal from "../../components/HouseFormModal";
import type { BoardingHouse, HouseFormData } from "../../types/house";

export default function LandlordHousesPage() {
  const [houses, setHouses] = useState<BoardingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHouse, setEditingHouse] = useState<BoardingHouse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadHouses = () => {
    setLoading(true);
    houseApi.getMine().then(setHouses).finally(() => setLoading(false));
  };

  useEffect(loadHouses, []);

  const openCreate = () => {
    setEditingHouse(null);
    setShowModal(true);
  };

  const openEdit = (house: BoardingHouse) => {
    setEditingHouse(house);
    setShowModal(true);
  };

  const handleSubmit = async (data: HouseFormData) => {
    if (editingHouse) {
      await houseApi.update(editingHouse.id, data);
    } else {
      await houseApi.create(data);
    }
    loadHouses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa nhà trọ này? Các phòng thuộc nhà trọ cũng sẽ bị ẩn.")) return;
    await houseApi.remove(id);
    loadHouses();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Nhà trọ của tôi</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Thêm nhà trọ
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Đang tải...</p>
      ) : houses.length === 0 ? (
        <p className="text-gray-400">Chưa có nhà trọ nào. Bấm "Thêm nhà trọ" để bắt đầu.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {houses.map((house) => (
            <div key={house.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{house.name}</h3>
                  <p className="text-sm text-gray-500">
                    {house.address}, {house.ward}, {house.city}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                    house.status === "ACTIVE"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {house.status === "ACTIVE" ? "Đang hoạt động" : "Đã ẩn"}
                </span>
              </div>

              <p className="text-sm text-gray-600 mt-2">{house.roomCount} phòng</p>

              <div className="flex gap-2 mt-4">
                <Link
                  to={`/dashboard/rooms?houseId=${house.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Xem phòng
                </Link>
                <button
                  onClick={() => openEdit(house)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(house.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <HouseFormModal
          house={editingHouse}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
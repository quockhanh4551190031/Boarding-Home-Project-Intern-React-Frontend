import { useState, FormEvent, useEffect } from "react";
import { roomApi } from "../api/roomApi";
import type { Amenity, BoardingHouse } from "../types/room";
import type { Room, RoomFormData } from "../types/room";

interface Props {
  room: Room | null; // null = tạo mới
  houses: BoardingHouse[];
  defaultHouseId?: number;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => Promise<void>;
}

const emptyForm: RoomFormData = {
  houseId: 0, title: "", price: 0, area: 0,
  maxOccupants: 1, description: "", amenityIds: [],
};

export default function RoomFormModal({ room, houses, defaultHouseId, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<RoomFormData>(emptyForm);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roomApi.getAmenities().then(setAmenities).catch(() => {});
  }, []);

  useEffect(() => {
    if (room) {
      setForm({
        houseId: room.houseId,
        title: room.title,
        price: room.price,
        area: room.area,
        maxOccupants: room.maxOccupants,
        description: room.description,
        amenityIds: [], // BE không trả amenityIds trực tiếp, chỉ tên — để trống khi sửa, user tick lại nếu cần đổi
      });
    } else {
      setForm({ ...emptyForm, houseId: defaultHouseId ?? houses[0]?.id ?? 0 });
    }
  }, [room, defaultHouseId, houses]);

  const toggleAmenity = (id: number) => {
    setForm((f) => ({
      ...f,
      amenityIds: f.amenityIds.includes(id)
        ? f.amenityIds.filter((a) => a !== id)
        : [...f.amenityIds, id],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Có lỗi xảy ra, thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">{room ? "Sửa phòng trọ" : "Thêm phòng trọ mới"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Thuộc nhà trọ</label>
            <select
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.houseId}
              onChange={(e) => setForm({ ...form, houseId: Number(e.target.value) })}
            >
              <option value={0} disabled>-- Chọn nhà trọ --</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề phòng</label>
            <input
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Giá (đ/tháng)</label>
              <input
                required type="number" min={0}
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
              <input
                required type="number" min={0}
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.area || ""}
                onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số người tối đa</label>
              <input
                required type="number" min={1}
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.maxOccupants || ""}
                onChange={(e) => setForm({ ...form, maxOccupants: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {amenities.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Tiện ích {room && <span className="text-xs text-gray-400">(tick lại nếu muốn thay đổi)</span>}
              </label>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded p-2">
                {amenities.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.amenityIds.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || form.houseId === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Modal from "./ui/Modal";
import { roomApi } from "../api/roomApi";
import { btnPrimary, btnSecondary, inputCls, labelCls, textareaCls } from "./ui/styles";
import type { Amenity, Room, RoomFormData } from "../types/room";
import type { BoardingHouse } from "../types/house";

interface Props {
  room: Room | null; // null = tạo mới
  houses: BoardingHouse[];
  defaultHouseId?: number;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => Promise<void>;
}

export default function RoomFormModal({ room, houses, defaultHouseId, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<RoomFormData>(() =>
    room
      ? {
        houseId: room.houseId,
        title: room.title,
        price: room.price,
        area: room.area,
        maxOccupants: room.maxOccupants,
        description: room.description ?? "",
        amenityIds: [],
      }
      : {
        houseId: defaultHouseId ?? houses[0]?.id ?? 0,
        title: "",
        price: 0,
        area: 0,
        maxOccupants: 1,
        description: "",
        amenityIds: [],
      }
  );
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roomApi.getAmenities().then(setAmenities).catch(() => { });
  }, []);

  // Khi sửa phòng: backend chỉ trả tên tiện ích, ghép với danh sách để tick sẵn đúng các ô
  useEffect(() => {
    if (!room || amenities.length === 0) return;
    const ids = amenities.filter((a) => room.amenities.includes(a.name)).map((a) => a.id);
    setForm((f) => ({ ...f, amenityIds: ids }));
  }, [room, amenities]);

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
    <Modal
      title={room ? "Sửa phòng trọ" : "Thêm phòng trọ mới"}
      subtitle={room ? room.title : "Nhập thông tin phòng và chọn tiện ích"}
      icon="meeting_room"
      onClose={onClose}
      footer={
        <>
          {error && <p className="flex-1 text-sm text-error">{error}</p>}
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button
            type="submit"
            form="room-form"
            disabled={saving || form.houseId === 0}
            className={btnPrimary}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Thuộc nhà trọ</label>
          <select
            required
            className={inputCls}
            value={form.houseId}
            onChange={(e) => setForm({ ...form, houseId: Number(e.target.value) })}
          >
            <option value={0} disabled>
              Chọn nhà trọ
            </option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Tiêu đề phòng</label>
          <input
            required
            className={inputCls}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Giá (đ/tháng)</label>
            <input
              required
              type="number"
              min={0}
              className={`${inputCls} tabular-nums`}
              value={form.price || ""}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Diện tích (m²)</label>
            <input
              required
              type="number"
              min={0}
              className={`${inputCls} tabular-nums`}
              value={form.area || ""}
              onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Số người tối đa</label>
            <input
              required
              type="number"
              min={1}
              className={`${inputCls} tabular-nums`}
              value={form.maxOccupants || ""}
              onChange={(e) => setForm({ ...form, maxOccupants: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            rows={3}
            className={textareaCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {amenities.length > 0 && (
          <div>
            <label className={labelCls}>Tiện ích</label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const active = form.amenityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active
                        ? "bg-primary-container text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                      }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
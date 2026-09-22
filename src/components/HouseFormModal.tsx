import { useState, FormEvent, useEffect } from "react";
import LocationSelect from "./LocationSelect";
import type { BoardingHouse, HouseFormData } from "../types/house";

interface Props {
  house: BoardingHouse | null; // null = tạo mới
  onClose: () => void;
  onSubmit: (data: HouseFormData) => Promise<void>;
}

const emptyForm: HouseFormData = {
  name: "", address: "", ward: "", city: "",
  latitude: 0, longitude: 0, description: "",
};

export default function HouseFormModal({ house, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<HouseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (house) {
      setForm({
        name: house.name, address: house.address, ward: house.ward, city: house.city,
        latitude: house.latitude, longitude: house.longitude, description: house.description,
      });
    } else {
      setForm(emptyForm);
    }
  }, [house]);

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
        <h2 className="text-lg font-bold mb-4">
          {house ? "Sửa nhà trọ" : "Thêm nhà trọ mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Tên nhà trọ</label>
            <input
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết (số nhà, đường)</label>
            <input
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <LocationSelect
            province={form.city}
            ward={form.ward}
            onChange={(city, ward) => setForm({ ...form, city, ward })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Vĩ độ (latitude)</label>
              <input
                required type="number" step="any"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.latitude || ""}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kinh độ (longitude)</label>
              <input
                required type="number" step="any"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.longitude || ""}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Mẹo: mở Google Maps, chuột phải vào vị trí nhà trọ, copy toạ độ (VD: 10.7756, 106.7019)
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
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
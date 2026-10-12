import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "./ui/Modal";
import LocationSelect from "./LocationSelect";
import MapPicker from "./MapPicker";
import { geocodeApi } from "../api/geocodeApi";
import { btnPrimary, btnSecondary, inputCls, labelCls, textareaCls } from "./ui/styles";
import type { BoardingHouse, HouseFormData } from "../types/house";

interface Props {
  house: BoardingHouse | null; // null = tạo mới
  onClose: () => void;
  onSubmit: (data: HouseFormData) => Promise<void>;
}

const emptyForm: HouseFormData = {
  name: "",
  address: "",
  ward: "",
  city: "",
  latitude: 0,
  longitude: 0,
  description: "",
};

export default function HouseFormModal({ house, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<HouseFormData>(() =>
    house
      ? {
        name: house.name,
        address: house.address,
        ward: house.ward,
        city: house.city,
        latitude: house.latitude,
        longitude: house.longitude,
        description: house.description ?? "",
      }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoNote, setGeoNote] = useState<{ ok: boolean; text: string } | null>(null);

  const handleGeocode = async () => {
    if (!form.address || !form.ward || !form.city) {
      setGeoNote({ ok: false, text: "Nhập đủ địa chỉ, tỉnh/thành và phường/xã trước khi tìm tọa độ" });
      return;
    }
    setGeocoding(true);
    setGeoNote(null);
    try {
      const result = await geocodeApi.search(`${form.address}, ${form.ward}, ${form.city}, Việt Nam`);
      if (result) {
        setForm((f) => ({ ...f, latitude: result.lat, longitude: result.lng }));
        setGeoNote({ ok: true, text: "Đã tìm thấy vị trí. Kiểm tra lại trên bản đồ, bấm vào bản đồ để chỉnh nếu lệch." });
      } else {
        setGeoNote({ ok: false, text: "Không tìm thấy vị trí khớp địa chỉ này, hãy chọn tay trên bản đồ." });
      }
    } catch {
      setGeoNote({ ok: false, text: "Lỗi khi tìm tọa độ, thử lại sau hoặc chọn tay trên bản đồ." });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.latitude === 0 && form.longitude === 0) {
      setError("Chưa chọn vị trí. Hãy bấm vào bản đồ hoặc dùng nút tự động tìm tọa độ.");
      return;
    }

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
      title={house ? "Sửa nhà trọ" : "Thêm nhà trọ mới"}
      subtitle={house ? house.name : "Điền thông tin và chọn vị trí trên bản đồ"}
      icon="home_work"
      size="lg"
      onClose={onClose}
      footer={
        <>
          {error && <p className="flex-1 text-sm text-error">{error}</p>}
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="house-form" disabled={saving} className={btnPrimary}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      <form id="house-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Tên nhà trọ</label>
          <input
            required
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>
            Địa chỉ chi tiết{" "}
            <span className="font-normal text-on-surface-variant">(số nhà, tên đường)</span>
          </label>
          <input
            required
            className={inputCls}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <LocationSelect
          province={form.city}
          ward={form.ward}
          onChange={(city, ward) => setForm({ ...form, city, ward })}
        />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGeocode}
            disabled={geocoding}
            className="self-start h-9 px-3 text-sm font-medium text-primary-container bg-primary-fixed/60 hover:bg-primary-fixed rounded-lg inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            <span className="material-symbols-outlined !text-[18px]">travel_explore</span>
            {geocoding ? "Đang tìm..." : "Tự động tìm tọa độ từ địa chỉ"}
          </button>
          {geoNote && (
            <p className={`text-xs ${geoNote.ok ? "text-emerald-700" : "text-on-surface-variant"}`}>
              {geoNote.text}
            </p>
          )}
        </div>

        <MapPicker
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
        />

        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            rows={3}
            className={textareaCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
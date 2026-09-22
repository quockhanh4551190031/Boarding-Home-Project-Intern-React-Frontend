import { useEffect, useState } from "react";
import { locationApi } from "../api/houseApi";

interface Props {
  province: string;
  ward: string;
  onChange: (province: string, ward: string) => void;
}

export default function LocationSelect({ province, ward, onChange }: Props) {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    locationApi.getProvinces().then(setProvinces).catch(() => {});
  }, []);

  useEffect(() => {
    if (!province) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    locationApi
      .getWards(province)
      .then(setWards)
      .finally(() => setLoadingWards(false));
  }, [province]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
        <select
          required
          className="w-full border rounded px-3 py-2 text-sm"
          value={province}
          onChange={(e) => onChange(e.target.value, "")}
        >
          <option value="">-- Chọn --</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phường/Xã</label>
        <select
          required
          disabled={!province || loadingWards}
          className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
          value={ward}
          onChange={(e) => onChange(province, e.target.value)}
        >
          <option value="">{loadingWards ? "Đang tải..." : "-- Chọn --"}</option>
          {wards.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
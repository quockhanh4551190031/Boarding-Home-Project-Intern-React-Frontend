import { useEffect, useState } from "react";
import { locationApi } from "../api/houseApi";
import { inputCls, labelCls } from "./ui/styles";

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
    locationApi.getProvinces().then(setProvinces).catch(() => { });
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={labelCls}>Tỉnh/Thành phố</label>
        <select
          required
          className={inputCls}
          value={province}
          onChange={(e) => onChange(e.target.value, "")}
        >
          <option value="">Chọn tỉnh/thành</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Phường/Xã</label>
        <select
          required
          disabled={!province || loadingWards}
          className={inputCls}
          value={ward}
          onChange={(e) => onChange(province, e.target.value)}
        >
          <option value="">{loadingWards ? "Đang tải..." : "Chọn phường/xã"}</option>
          {wards.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
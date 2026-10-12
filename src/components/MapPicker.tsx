import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { alertErrorCls } from "./ui/styles";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [16.0544, 108.2022];

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function describeGeoError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Bạn đã từ chối quyền định vị. Vào cài đặt trình duyệt để cấp lại quyền cho trang này.";
    case err.POSITION_UNAVAILABLE:
      return "Không xác định được vị trí. Kiểm tra GPS hoặc kết nối mạng của thiết bị.";
    case err.TIMEOUT:
      return "Lấy vị trí quá thời gian chờ, thử lại.";
    default:
      return "Không lấy được vị trí, thử lại sau.";
  }
}

export default function MapPicker({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const hasPosition = latitude !== 0 && longitude !== 0;
  const center: [number, number] = hasPosition ? [latitude, longitude] : DEFAULT_CENTER;

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt của bạn không hỗ trợ định vị");
      return;
    }
    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error("[MapPicker] getCurrentPosition lỗi:", err.code, err.message);
        setGeoError(describeGeoError(err));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-on-surface">Vị trí trên bản đồ</label>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="text-xs font-medium text-primary-container hover:underline disabled:opacity-60 inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined !text-[16px]">my_location</span>
          {locating ? "Đang định vị..." : "Dùng vị trí hiện tại"}
        </button>
      </div>

      {geoError && <div className={`${alertErrorCls} text-xs mb-2`}>{geoError}</div>}

      <div
        className="isolate rounded-xl overflow-hidden border border-outline-variant/60"
        style={{ height: 280 }}
      >
        <MapContainer
          center={center}
          zoom={hasPosition ? 16 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <InvalidateSizeOnMount />
          {hasPosition && (
            <>
              <Marker position={[latitude, longitude]} />
              <RecenterOnChange lat={latitude} lng={longitude} />
            </>
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-on-surface-variant mt-1.5">
        Bấm vào bản đồ để chọn vị trí chính xác.
        {hasPosition && (
          <span className="tabular-nums">
            {" "}
            Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        )}
      </p>
    </div>
  );
}
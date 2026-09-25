import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

// Dùng CDN thay vì import cục bộ — tránh lỗi Vite bundling marker icon của Leaflet
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
      return "Bạn đã từ chối quyền định vị — vào cài đặt trình duyệt để cấp lại quyền cho localhost:5173";
    case err.POSITION_UNAVAILABLE:
      return "Không xác định được vị trí — kiểm tra GPS/kết nối mạng của thiết bị";
    case err.TIMEOUT:
      return "Lấy vị trí quá thời gian chờ, thử lại";
    default:
      return "Không lấy được vị trí, thử lại sau";
  }
}

export default function MapPicker({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const hasPosition = latitude !== 0 && longitude !== 0;
  const center: [number, number] = hasPosition ? [latitude, longitude] : DEFAULT_CENTER;

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      console.warn("[MapPicker] Trình duyệt không hỗ trợ navigator.geolocation");
      setGeoError("Trình duyệt của bạn không hỗ trợ định vị");
      return;
    }

    setLocating(true);
    setGeoError(null);
    console.log("[MapPicker] Bắt đầu gọi getCurrentPosition...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[MapPicker] Lấy vị trí thành công:", pos.coords.latitude, pos.coords.longitude);
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error("[MapPicker] Lỗi getCurrentPosition — code:", err.code, "message:", err.message);
        setGeoError(describeGeoError(err));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Vị trí trên bản đồ</label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {locating ? "Đang định vị..." : "📍 Dùng vị trí hiện tại"}
        </button>
      </div>

      {geoError && <p className="text-xs text-red-600 mb-2">{geoError}</p>}

      <div className="rounded-lg overflow-hidden border" style={{ height: 280 }}>
        <MapContainer center={center} zoom={hasPosition ? 16 : 6} style={{ height: "100%", width: "100%" }}>
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

      <p className="text-xs text-gray-400 mt-1">
        Bấm vào bản đồ để chọn vị trí chính xác, hoặc dùng "Vị trí hiện tại" nếu bạn đang ở tại nhà trọ.
      </p>
      {hasPosition && (
        <p className="text-xs text-gray-500 mt-1">
          Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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

// Component mới — bắt buộc để sửa lỗi map bị sai kích thước trong modal
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function MapPicker({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const hasPosition = latitude !== 0 && longitude !== 0;
  const center: [number, number] = hasPosition ? [latitude, longitude] : DEFAULT_CENTER;

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
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
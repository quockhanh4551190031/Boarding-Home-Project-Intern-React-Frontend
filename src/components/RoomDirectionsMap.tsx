import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  destLat: number;
  destLng: number;
  destLabel: string;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [30, 30] });
    }
  }, [positions, map]);
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

export default function RoomDirectionsMap({ destLat, destLng }: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination: [number, number] = [destLat, destLng];

  const findRoute = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(origin);

        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destLng},${destLat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.code !== "Ok" || !data.routes?.[0]) {
            setError("Không tìm được đường đi, thử lại sau");
            setLoading(false);
            return;
          }

          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setRouteCoords(coords);
          setDistanceKm(route.distance / 1000);
          setDurationMin(route.duration / 60);
        } catch {
          setError("Không tính được tuyến đường, thử lại sau");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("Không lấy được vị trí của bạn — kiểm tra quyền định vị trình duyệt");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const boundsPositions: [number, number][] =
    routeCoords.length > 0 ? routeCoords : userPos ? [userPos, destination] : [destination];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Vị trí & đường đi</h2>
        <button
          onClick={findRoute}
          disabled={loading}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang tìm đường..." : "🧭 Chỉ đường từ vị trí của tôi"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="rounded-lg overflow-hidden border" style={{ height: 320 }}>
        <MapContainer center={destination} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateSizeOnMount />
          <Marker position={destination} />
          {userPos && <Marker position={userPos} />}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#2563eb" weight={4} />}
          <FitBounds positions={boundsPositions} />
        </MapContainer>
      </div>

      {distanceKm !== null && durationMin !== null && (
        <p className="text-sm text-gray-600 mt-2">
          Khoảng cách: {distanceKm.toFixed(1)} km — Thời gian: {Math.round(durationMin)} phút
        </p>
      )}
    </div>
  );
}
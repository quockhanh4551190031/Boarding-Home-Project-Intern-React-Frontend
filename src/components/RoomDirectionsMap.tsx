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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
            <span className="material-symbols-outlined !text-[16px]">map</span>
          </div>
          <h2 className="font-semibold text-on-surface">Vị trí và đường đi</h2>
        </div>

        <button
          onClick={findRoute}
          disabled={loading}
          className="h-9 px-4 bg-primary-container text-on-primary text-sm font-medium rounded-lg hover:bg-primary transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined !text-[18px]">directions</span>
          {loading ? "Đang tìm đường..." : "Chỉ đường từ vị trí của tôi"}
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container text-sm px-3 py-2 rounded-lg mb-3">
          {error}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-outline-variant/60" style={{ height: 320 }}>
        <MapContainer center={destination} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateSizeOnMount />
          <Marker position={destination} />
          {userPos && <Marker position={userPos} />}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#4f46e5" weight={5} />}
          <FitBounds positions={boundsPositions} />
        </MapContainer>
      </div>

      {distanceKm !== null && durationMin !== null && (
        <div className="flex gap-2 mt-3">
          <span className="bg-surface-container-low text-on-surface text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 tabular-nums">
            <span className="material-symbols-outlined !text-[16px] text-primary">route</span>
            {distanceKm.toFixed(1)} km
          </span>
          <span className="bg-surface-container-low text-on-surface text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 tabular-nums">
            <span className="material-symbols-outlined !text-[16px] text-primary">schedule</span>
            {Math.round(durationMin)} phút
          </span>
        </div>
      )}
    </div>
  );
}
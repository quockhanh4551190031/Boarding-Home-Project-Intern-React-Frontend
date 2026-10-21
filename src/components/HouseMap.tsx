import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDistance, formatPrice } from "../utils/format";
import type { GeoPoint } from "../utils/geo";
import type { HouseSearchItem } from "../types/house";

const DEFAULT_CENTER: [number, number] = [16.0544, 108.2022];

function shortPrice(price: number): string {
    if (price >= 1_000_000) return (price / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
    return Math.round(price / 1000) + "k";
}

/** Ghim hiện giá. Nhãn chỉ gồm chữ số nên an toàn khi đưa vào HTML. */
function createPin(label: string) {
    return L.divIcon({
        className: "house-pin-wrap",
        html: `<div class="house-pin">${label}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -34],
    });
}

function FitView({ houses, user, radiusKm }: { houses: HouseSearchItem[]; user: GeoPoint | null; radiusKm: number | null }) {
    const map = useMap();
    const key = `${houses.map((h) => h.id).join(",")}|${user ? `${user.lat},${user.lng}` : ""}|${radiusKm ?? ""}`;

    useEffect(() => {
        let bounds: L.LatLngBounds | null = null;

        if (user && radiusKm) {
            const dLat = radiusKm / 111.32;
            const dLng = radiusKm / (111.32 * Math.max(Math.cos((user.lat * Math.PI) / 180), 0.01));
            bounds = L.latLngBounds([user.lat - dLat, user.lng - dLng], [user.lat + dLat, user.lng + dLng]);
        } else {
            const points: L.LatLngExpression[] = [];
            if (user) points.push([user.lat, user.lng]);
            // Đang bật "Gần tôi" thì chỉ thu phóng theo vài nhà gần nhất, không kéo ra cả nước
            (user ? houses.slice(0, 5) : houses).forEach((h) => points.push([h.latitude, h.longitude]));
            if (points.length > 0) bounds = L.latLngBounds(points);
        }

        if (bounds && bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, map]);

    return null;
}

function InvalidateSizeOnMount() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

interface Props {
    houses: HouseSearchItem[];
    user: GeoPoint | null;
    radiusKm: number | null;
}

export default function HouseMap({ houses, user, radiusKm }: Props) {
    const pins = useMemo(() => houses.map((h) => createPin(shortPrice(h.minPrice))), [houses]);

    return (
        <div
            className="isolate rounded-xl overflow-hidden border border-outline-variant/60 shadow-sm"
            style={{ height: "min(72vh, 680px)", minHeight: 380 }}
        >
            <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <InvalidateSizeOnMount />
                <FitView houses={houses} user={user} radiusKm={radiusKm} />

                {user && radiusKm && (
                    <Circle
                        center={[user.lat, user.lng]}
                        radius={radiusKm * 1000}
                        pathOptions={{ weight: 1.5, fillOpacity: 0.08, className: "map-radius" }}
                    />
                )}

                {user && (
                    <CircleMarker
                        center={[user.lat, user.lng]}
                        radius={8}
                        pathOptions={{ weight: 3, fillOpacity: 1, className: "user-dot" }}
                    >
                        <Popup closeButton={false}>Vị trí của bạn</Popup>
                    </CircleMarker>
                )}

                {houses.map((h, i) => (
                    <Marker
                        key={h.id}
                        position={[h.latitude, h.longitude]}
                        icon={pins[i]}
                        zIndexOffset={houses.length - i}
                    >
                        <Popup minWidth={230} maxWidth={260} closeButton={false}>
                            <div className="house-popup">
                                {h.thumbnail && (
                                    <img src={h.thumbnail} alt="" className="w-full aspect-[16/10] object-cover rounded-lg mb-2" />
                                )}
                                <div className="font-semibold text-sm leading-snug">{h.name}</div>
                                <div className="text-xs opacity-70 mt-0.5">{h.location}</div>
                                <div className="mt-1.5 font-bold text-sm tabular-nums text-primary-container">
                                    {h.minPrice === h.maxPrice
                                        ? `${formatPrice(h.minPrice)} đ`
                                        : `${formatPrice(h.minPrice)} - ${formatPrice(h.maxPrice)} đ`}
                                </div>
                                <div className="text-xs opacity-70 mt-0.5 tabular-nums">
                                    {h.roomCount} phòng
                                    {h.distanceKm !== null && ` · cách bạn ${formatDistance(h.distanceKm)}`}
                                </div>
                                <Link to={`/houses/${h.id}`} className="inline-flex items-center gap-1 mt-2 text-sm font-semibold">
                                    Xem nhà trọ
                                    <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
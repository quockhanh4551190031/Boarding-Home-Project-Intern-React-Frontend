import { Link } from "react-router-dom";
import type {Room} from "../types/room";

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ/tháng";
}

export default function RoomCard({ room }: { room: Room }) {
    const thumbnail = room.images.find((img) => img.thumbnail) ?? room.images[0];

    return (
        <Link
            to={`/rooms/${room.id}`}
            className="block bg-white rounded-xl border hover:shadow-md transition overflow-hidden"
        >
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {thumbnail ? (
                    <img
                        src={thumbnail.imageUrl}
                        alt={room.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-gray-400 text-sm">Chưa có ảnh</span>
                )}
            </div>

            <div className="p-4 space-y-1">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{room.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{room.houseName}</p>

                <div className="flex items-center justify-between pt-2">
                    <span className="text-blue-600 font-bold">{formatPrice(room.price)}</span>
                    <span className="text-sm text-gray-500">{room.area} m²</span>
                </div>

                {room.distanceKm !== null && (
                    <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
            Cách {room.distanceKm} km
          </span>
                )}

                {room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {room.amenities.slice(0, 3).map((a) => (
                            <span
                                key={a}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                {a}
              </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
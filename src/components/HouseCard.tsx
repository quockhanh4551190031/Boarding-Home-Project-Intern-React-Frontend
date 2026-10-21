import { Link } from "react-router-dom";
import RatingBadge from "./RatingBadge";
import { formatDistance, formatPrice } from "../utils/format";
import type { HouseSearchItem } from "../types/house";
import type { ReviewSummaryItem } from "../types/review";

interface Props {
    house: HouseSearchItem;
    rating?: ReviewSummaryItem;
}

export default function HouseCard({ house, rating }: Props) {
    const priceLabel =
        house.minPrice === house.maxPrice
            ? `${formatPrice(house.minPrice)} đ`
            : `${formatPrice(house.minPrice)} - ${formatPrice(house.maxPrice)} đ`;

    return (
        <Link
            to={`/houses/${house.id}`}
            className="group block bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
        >
            <div className="aspect-video bg-surface-container-low overflow-hidden relative">
                {house.thumbnail ? (
                    <img
                        src={house.thumbnail}
                        alt={house.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-outline gap-1">
                        <span className="material-symbols-outlined !text-[32px]">image</span>
                        <span className="text-xs">Chưa có ảnh</span>
                    </div>
                )}

                <span className="absolute top-2.5 left-2.5 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined !text-[14px] text-primary">meeting_room</span>
                    {house.roomCount} phòng
                </span>

                {house.distanceKm !== null && (
                    <span className="absolute bottom-2.5 left-2.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm tabular-nums">
                        <span className="material-symbols-outlined !text-[14px]">near_me</span>
                        Cách bạn {formatDistance(house.distanceKm)}
                    </span>
                )}
            </div>

            <div className="p-4 flex flex-col gap-1.5">
                <h3 className="font-semibold text-on-surface line-clamp-1 tracking-tight">{house.name}</h3>
                <p className="text-xs text-on-surface-variant line-clamp-1 -mt-1">{house.location}</p>

                <div className="h-4 flex items-center">
                    {rating ? (
                        <RatingBadge average={rating.average} count={rating.count} />
                    ) : (
                        <span className="h-3 w-24 rounded bg-surface-container animate-pulse" />
                    )}
                </div>

                <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-primary-container font-bold tabular-nums">{priceLabel}</span>
                    <span className="text-xs text-on-surface-variant">/tháng</span>
                </div>
            </div>
        </Link>
    );
}
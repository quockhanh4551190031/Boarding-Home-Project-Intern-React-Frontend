import { Link } from "react-router-dom";

export interface HouseGroup {
    houseId: number;
    houseName: string;
    thumbnail: string | null;
    roomCount: number;
    minPrice: number;
    maxPrice: number;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

export default function HouseCard({ house }: { house: HouseGroup }) {
    const priceLabel =
        house.minPrice === house.maxPrice
            ? formatPrice(house.minPrice)
            : `${formatPrice(house.minPrice)} - ${formatPrice(house.maxPrice)}`;

    return (
        <Link
            to={`/houses/${house.houseId}`}
            className="group block bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
        >
            <div className="aspect-video bg-surface-container-low overflow-hidden relative">
                {house.thumbnail ? (
                    <img
                        src={house.thumbnail}
                        alt={house.houseName}
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
            </div>

            <div className="p-4 flex flex-col gap-1.5">
                <h3 className="font-semibold text-on-surface line-clamp-1 tracking-tight">{house.houseName}</h3>

                <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-primary-container font-bold tabular-nums">{priceLabel}</span>
                    <span className="text-xs text-on-surface-variant">/tháng</span>
                </div>
            </div>
        </Link>
    );
}
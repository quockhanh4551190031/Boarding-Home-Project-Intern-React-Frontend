import { Link } from "react-router-dom";

interface HouseGroup {
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
            ? `${formatPrice(house.minPrice)}/tháng`
            : `${formatPrice(house.minPrice)} - ${formatPrice(house.maxPrice)}/tháng`;

    return (
        <Link
            to={`/houses/${house.houseId}`}
            className="block bg-white rounded-xl border hover:shadow-md transition overflow-hidden"
        >
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {house.thumbnail ? (
                    <img src={house.thumbnail} alt={house.houseName} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400 text-sm">Chưa có ảnh</span>
                )}
            </div>

            <div className="p-4 space-y-1">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{house.houseName}</h3>
                <p className="text-sm text-gray-500">{house.roomCount} phòng phù hợp</p>
                <p className="text-blue-600 font-bold">{priceLabel}</p>
            </div>
        </Link>
    );
}
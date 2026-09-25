export interface RoomImage {
    id: number;
    imageUrl: string;
    thumbnail: boolean;
}

export interface Room {
    id: number;
    houseId: number;
    houseName: string;
    landlordId: number;
    houseLatitude: number;
    houseLongitude: number;
    title: string;
    price: number;
    area: number;
    maxOccupants: number;
    description: string;
    status: "AVAILABLE" | "RENTED" | "HIDDEN";
    viewCount: number;
    amenities: string[];
    images: RoomImage[];
    createdAt: string;
    distanceKm: number | null;
}

export interface RoomSearchResponse {
    rooms: Room[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
}

export interface Amenity {
    id: number;
    name: string;
    icon: string | null;
}

export interface RoomSearchParams {
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    city?: string;
    amenityIds?: number[];
    sortBy?: "PRICE_ASC" | "PRICE_DESC" | "AREA_ASC" | "AREA_DESC" | "NEWEST";
    page?: number;
    size?: number;
}

export interface RoomFormData {
    houseId: number;
    title: string;
    price: number;
    area: number;
    maxOccupants: number;
    description: string;
    amenityIds: number[];
}
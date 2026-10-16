export interface PublicHouseItem {
    id: number;
    name: string;
    location: string;
    roomCount: number;
    availableRoomCount: number;
    minPrice: number | null;
    thumbnail: string | null;
}

export interface PublicProfile {
    id: number;
    displayName: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    avatarUrl: string | null;
    bio: string | null;
    memberSince: string;
    phone: string | null;
    phoneMasked: boolean;
    self: boolean;
    forumPostCount: number;
    roomCount: number;
    availableRoomCount: number;
    houses: PublicHouseItem[];
}
import type { PublicHouseItem } from "./user";

export interface UserSearchItem {
    id: number;
    name: string;
    role: "TENANT" | "LANDLORD";
}

export interface SearchResult {
    houses: PublicHouseItem[];
    users: UserSearchItem[];
}
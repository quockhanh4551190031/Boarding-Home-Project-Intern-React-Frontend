export type ViewingStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED_BY_TENANT"
    | "CANCELLED_BY_LANDLORD";

export type Perspective = "tenant" | "landlord";
export type TenantScope = "upcoming" | "history";
export type LandlordScope = "pending" | "upcoming" | "history";

export interface Viewing {
    id: number;
    status: ViewingStatus;
    past: boolean;
    conflict: boolean;
    scheduledAt: string;
    message: string | null;
    contactPhone: string | null;
    responseNote: string | null;
    respondedAt: string | null;
    createdAt: string;
    roomId: number;
    roomTitle: string;
    roomThumbnail: string | null;
    roomVisible: boolean;
    houseId: number;
    houseName: string;
    address: string;
    tenantId: number;
    tenantName: string;
    landlordId: number;
    landlordName: string;
}

export interface ViewingList {
    items: Viewing[];
    currentPage: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
}

export interface ViewingRoomState {
    canRequest: boolean;
    reason: string | null;
    active: Viewing | null;
}
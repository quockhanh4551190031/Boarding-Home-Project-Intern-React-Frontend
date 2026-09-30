export type UserStatus = "ACTIVE" | "BLOCKED";
export type ReportStatus = "PENDING" | "RESOLVED" | "REJECTED";
export type ReportStatusType = "ROOM" | "POST" | "COMMENT" | "USER";
export type PostStatus = "ACTIVE" | "HIDDEN" | "DELETED";

export interface AdminUser {
    id: number;
    email: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    status: UserStatus;
    profileCompleted: boolean;
    createdAt: string;
}

export interface AdminReport {
    id: number;
    reporterEmail: string;
    targetType: ReportStatusType;
    targetId: number;
    reason: String;
    status: ReportStatus;
    createdAt: string;
}

export interface AdminStats {
    totalUsers: number;
    totalTenants: number;
    totalLandlords: number;
    totalAdmins: number;
    totalBoardingHouses: number;
    totalRooms: number;
    totalAvailableRooms: number;
    totalForumPosts: number;
    pendingReports: number;
}
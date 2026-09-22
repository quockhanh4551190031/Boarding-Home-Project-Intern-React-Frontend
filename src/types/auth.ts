export type Role = "TENANT" | "LANDLORD" | "ADMIN";

export interface RegisterRequest {
    email: string;
    password: string;
    role: "TENANT" | "LANDLORD";
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    email: string;
    role: Role;
}
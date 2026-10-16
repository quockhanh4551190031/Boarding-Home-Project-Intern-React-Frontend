import type { Profile, ProfileFormData } from "../types/profile";

export const PHONE_RE = /^0\d{9}$/;

/** Bỏ dấu cách, chấm, gạch ngang: "0912 345 678" thành "0912345678". */
export function normalizePhone(raw: string): string {
    return raw.replace(/[\s.\-]/g, "");
}

export const emptyProfileForm: ProfileFormData = {
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    identityNumber: "",
    bio: "",
};

export function toProfileForm(p: Profile): ProfileFormData {
    return {
        fullName: p.fullName ?? "",
        phone: p.phone ?? "",
        gender: p.gender ?? "",
        dateOfBirth: p.dateOfBirth ?? "",
        address: p.address ?? "",
        identityNumber: p.identityNumber ?? "",
        bio: p.bio ?? "",
    };
}
export const hasPhone = (phone: string | null | undefined): boolean => !!phone && phone.trim() !== "";
export function maskEmail(email: string): string {
    const at = email.indexOf("@");
    const local = at > 0 ? email.slice(0, at) : email;
    const domain = at > 0 ? email.slice(at) : "";
    return `${local.slice(0, 2)}***${domain}`;
}

/** Họ tên nếu có, nếu không thì email đã che. */
export function displayName(fullName: string | null | undefined, email: string): string {
    return fullName && fullName.trim() ? fullName.trim() : maskEmail(email);
}

export function formatPhone(phone: string): string {
    const s = phone.replace(/\s+/g, "");
    return s.length === 10 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : s;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}

export function formatMonthYear(iso: string): string {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
}

export const roleLabel: Record<string, string> = {
    TENANT: "Người tìm trọ",
    LANDLORD: "Chủ trọ",
    ADMIN: "Quản trị viên",
};

export function formatDistance(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function formatCountdown(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}
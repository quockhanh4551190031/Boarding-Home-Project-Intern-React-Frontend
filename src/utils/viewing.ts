import type { BadgeTone } from "../components/ui/Badge";
import type { Perspective, Viewing } from "../types/viewing";

export const MIN_LEAD_MINUTES = 60;
export const MAX_DAYS_AHEAD = 30;

const pad = (n: number) => String(n).padStart(2, "0");

export const TIME_SLOTS: string[] = Array.from({ length: 28 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    return `${pad(hour)}:${i % 2 === 0 ? "00" : "30"}`;
});

export function toDateInput(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
}

/** Các khung giờ còn đặt được trong ngày đã chọn (cách hiện tại tối thiểu MIN_LEAD_MINUTES). */
export function availableSlots(date: string, now = new Date()): string[] {
    if (!date) return TIME_SLOTS;
    const [y, mo, d] = date.split("-").map(Number);
    const earliest = now.getTime() + MIN_LEAD_MINUTES * 60_000;
    return TIME_SLOTS.filter((t) => {
        const [h, m] = t.split(":").map(Number);
        return new Date(y, mo - 1, d, h, m).getTime() >= earliest;
    });
}

export function formatSlotTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatSlotDate(iso: string): string {
    return new Date(iso).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function statusInfo(v: Viewing, perspective: Perspective): { label: string; tone: BadgeTone } {
    const tenant = perspective === "tenant";
    switch (v.status) {
        case "PENDING":
            return v.past ? { label: "Quá hạn", tone: "neutral" } : { label: "Chờ xác nhận", tone: "warning" };
        case "ACCEPTED":
            return v.past ? { label: "Đã diễn ra", tone: "neutral" } : { label: "Đã xác nhận", tone: "success" };
        case "REJECTED":
            return { label: tenant ? "Bị từ chối" : "Đã từ chối", tone: "danger" };
        case "CANCELLED_BY_TENANT":
            return { label: tenant ? "Bạn đã hủy" : "Người thuê đã hủy", tone: "neutral" };
        case "CANCELLED_BY_LANDLORD":
            return { label: tenant ? "Chủ trọ đã hủy" : "Bạn đã hủy", tone: "neutral" };
    }
}
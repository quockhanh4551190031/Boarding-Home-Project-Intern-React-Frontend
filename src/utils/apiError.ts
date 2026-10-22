import type { AxiosError } from "axios";

export function apiErrorMessage(err: unknown, fallback: string): string {
    const e = err as AxiosError<{ message?: string }>;
    if (!e?.response) {
        return "Không kết nối được tới máy chủ. Kiểm tra kết nối mạng rồi thử lại.";
    }
    return e.response.data?.message ?? fallback;
}

/** Số giây phải chờ do máy chủ trả về cùng lỗi 429 (nếu có). */
export function apiRetryAfter(err: unknown): number | null {
    const e = err as AxiosError<{ retryAfterSeconds?: number }>;
    const n = e?.response?.data?.retryAfterSeconds;
    return typeof n === "number" && n > 0 ? n : null;
}
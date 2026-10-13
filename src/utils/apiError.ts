import type { AxiosError } from "axios";

export function apiErrorMessage(err: unknown, fallback: string): string {
    const e = err as AxiosError<{ message?: string }>;
    if (!e?.response) {
        return "Không kết nối được tới máy chủ. Kiểm tra kết nối mạng rồi thử lại.";
    }
    return e.response.data?.message ?? fallback;
}
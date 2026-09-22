import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import type {AuthResponse} from "../types/auth";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (token) resolve(token);
        else reject(error);
    });
    pendingQueue = [];
}

axiosClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            const refreshToken = useAuthStore.getState().refreshToken;

            if (!refreshToken) {
                useAuthStore.getState().logout();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Đã có 1 lần refresh đang chạy — xếp hàng đợi thay vì gọi refresh trùng lặp
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (newToken: string) => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            resolve(axiosClient(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post<AuthResponse>(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
                    { refreshToken }
                );

                useAuthStore.getState().setAuth(response.data);
                processQueue(null, response.data.accessToken);

                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().logout();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
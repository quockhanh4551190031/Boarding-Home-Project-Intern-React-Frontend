import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuthStore } from "../store/authStore";
import type {AuthResponse, LoginRequest} from "../types/auth";
import { AxiosError } from "axios";

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await axiosClient.post<AuthResponse>("/auth/login", form);
            setAuth(response.data);
            navigate("/");
        } catch (err) {
            const axiosErr = err as AxiosError<{ message: string }>;
            setError(axiosErr.response?.data?.message || "Email hoặc mật khẩu không đúng");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
            >
                <h1 className="text-2xl font-bold text-center">Đăng nhập</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full border rounded px-3 py-2"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                    <input
                        type="password"
                        required
                        className="w-full border rounded px-3 py-2"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>

                <p className="text-sm text-center text-gray-600">
                    Chưa có tài khoản?{" "}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Đăng ký
                    </Link>
                </p>
            </form>
        </div>
    );
}
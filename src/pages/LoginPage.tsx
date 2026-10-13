import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuthStore } from "../store/authStore";
import AuthShell from "../components/auth/AuthShell";
import AuthInput from "../components/auth/AuthInput";
import PasswordField from "../components/auth/PasswordField";
import { alertErrorCls, btnPrimaryLg } from "../components/ui/styles";
import { useAuthRedirectTarget } from "../hooks/useAuthRedirect";
import { apiErrorMessage } from "../utils/apiError";
import type { AuthResponse, LoginRequest } from "../types/auth";

export default function LoginPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const target = useAuthRedirectTarget();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setAuth = useAuthStore((s) => s.setAuth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) return <Navigate to={target} replace />;

    const sessionEnded = searchParams.get("reason") === "session";
    const needsLogin = target !== "/";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const payload: LoginRequest = { email: email.trim(), password };
        try {
            const res = await axiosClient.post<AuthResponse>("/auth/login", payload);
            setAuth(res.data); // isAuthenticated đổi, trang tự chuyển hướng
        } catch (err) {
            setError(apiErrorMessage(err, "Email hoặc mật khẩu không đúng"));
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Đăng nhập"
            subtitle={needsLogin ? "Vui lòng đăng nhập để tiếp tục." : "Chào mừng bạn quay lại BoardingHome."}
            footer={
                <>
                    Chưa có tài khoản?{" "}
                    <Link
                        to="/register"
                        state={location.state}
                        className="font-semibold text-primary-container hover:underline"
                    >
                        Đăng ký
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {sessionEnded && !error && (
                    <div className="bg-amber-100 text-amber-700 text-sm px-3 py-2 rounded-lg flex items-start gap-2">
                        <span className="material-symbols-outlined !text-[18px] mt-0.5">info</span>
                        Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.
                    </div>
                )}

                {error && (
                    <div role="alert" className={alertErrorCls}>
                        {error}
                    </div>
                )}

                <AuthInput
                    id="email"
                    label="Email"
                    icon="mail"
                    type="email"
                    autoComplete="email"
                    placeholder="ban@example.com"
                    value={email}
                    onChange={setEmail}
                />

                <PasswordField
                    id="password"
                    label="Mật khẩu"
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                />

                <button type="submit" disabled={loading} className={btnPrimaryLg}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>
        </AuthShell>
    );
}
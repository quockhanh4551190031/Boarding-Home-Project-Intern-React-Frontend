import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuthStore } from "../store/authStore";
import AuthShell from "../components/auth/AuthShell";
import AuthInput from "../components/auth/AuthInput";
import PasswordField from "../components/auth/PasswordField";
import { alertErrorCls, btnPrimaryLg, labelCls } from "../components/ui/styles";
import { useAuthRedirectTarget } from "../hooks/useAuthRedirect";
import { apiErrorMessage } from "../utils/apiError";
import type { AuthResponse, RegisterRequest } from "../types/auth";

const roleOptions: { value: RegisterRequest["role"]; icon: string; title: string; text: string }[] = [
    {
        value: "TENANT",
        icon: "person_search",
        title: "Người tìm trọ",
        text: "Tìm phòng, nhắn tin với chủ trọ và lưu phòng yêu thích.",
    },
    {
        value: "LANDLORD",
        icon: "real_estate_agent",
        title: "Chủ trọ",
        text: "Đăng nhà trọ, quản lý phòng và nhận liên hệ từ người thuê.",
    },
];

export default function RegisterPage() {
    const location = useLocation();
    const target = useAuthRedirectTarget();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setAuth = useAuthStore((s) => s.setAuth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [role, setRole] = useState<RegisterRequest["role"]>("TENANT");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) return <Navigate to={target} replace />;

    const longEnough = password.length >= 6;
    const mismatch = confirm.length > 0 && confirm !== password;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirm) {
            setError("Mật khẩu nhập lại không khớp");
            return;
        }

        setLoading(true);
        const payload: RegisterRequest = { email: email.trim(), password, role };
        try {
            const res = await axiosClient.post<AuthResponse>("/auth/register", payload);
            setAuth(res.data); // đăng ký xong tự đăng nhập, trang tự chuyển hướng
        } catch (err) {
            setError(apiErrorMessage(err, "Đăng ký thất bại, thử lại sau"));
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Tạo tài khoản"
            subtitle="Chỉ mất một phút để bắt đầu."
            footer={
                <>
                    Đã có tài khoản?{" "}
                    <Link
                        to="/login"
                        state={location.state}
                        className="font-semibold text-primary-container hover:underline"
                    >
                        Đăng nhập
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div role="alert" className={alertErrorCls}>
                        {error}
                    </div>
                )}

                <div>
                    <span id="role-label" className={labelCls}>
                        Bạn là
                    </span>
                    <div
                        role="radiogroup"
                        aria-labelledby="role-label"
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                        {roleOptions.map((o) => {
                            const active = role === o.value;
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setRole(o.value)}
                                    className={`text-left p-3.5 rounded-xl border transition-all ${active
                                        ? "border-primary-container bg-primary-fixed/50 ring-2 ring-primary-container/20"
                                        : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`material-symbols-outlined !text-[20px] ${active ? "text-primary-container" : "text-on-surface-variant"
                                                }`}
                                        >
                                            {o.icon}
                                        </span>
                                        <span className="font-semibold text-sm text-on-surface">{o.title}</span>
                                        {active && (
                                            <span className="material-symbols-outlined !text-[18px] text-primary-container ml-auto">
                                                check_circle
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-snug">{o.text}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

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

                <div>
                    <PasswordField
                        id="password"
                        label="Mật khẩu"
                        autoComplete="new-password"
                        minLength={6}
                        value={password}
                        onChange={setPassword}
                    />
                    <p
                        className={`mt-1.5 text-xs flex items-center gap-1 ${longEnough ? "text-emerald-700" : "text-on-surface-variant"
                            }`}
                    >
                        <span className="material-symbols-outlined !text-[14px]">
                            {longEnough ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        Tối thiểu 6 ký tự
                    </p>
                </div>

                <div>
                    <PasswordField
                        id="confirm"
                        label="Nhập lại mật khẩu"
                        autoComplete="new-password"
                        invalid={mismatch}
                        value={confirm}
                        onChange={setConfirm}
                    />
                    {mismatch && <p className="mt-1.5 text-xs text-error">Mật khẩu nhập lại không khớp</p>}
                </div>

                <button type="submit" disabled={loading} className={btnPrimaryLg}>
                    {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                </button>
            </form>
        </AuthShell>
    );
}
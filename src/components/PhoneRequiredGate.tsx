import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { profileApi } from "../api/profileApi";
import { useAuthStore } from "../store/authStore";
import { usePhoneGateStore } from "../store/phoneGateStore";
import { useUnreadStore } from "../store/unreadStore";
import Modal from "./ui/Modal";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import { PHONE_RE, hasPhone, normalizePhone, toProfileForm } from "../utils/profile";
import type { Profile } from "../types/profile";

export default function PhoneRequiredGate() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const role = useAuthStore((s) => s.role);
    const logout = useAuthStore((s) => s.logout);
    const needsPhone = usePhoneGateStore((s) => s.needsPhone);
    const setNeedsPhone = usePhoneGateStore((s) => s.setNeedsPhone);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLandlord = isAuthenticated && role === "LANDLORD";
    const visible = isLandlord && needsPhone === true && !pathname.startsWith("/profile");

    // 1. Kiểm tra một lần sau khi chủ trọ đăng nhập
    useEffect(() => {
        if (!isLandlord) {
            setNeedsPhone(null);
            setProfile(null);
            return;
        }
        if (needsPhone !== null) return;

        let cancelled = false;
        profileApi
            .getMine()
            .then((p) => {
                if (cancelled) return;
                setProfile(p);
                setNeedsPhone(!hasPhone(p.phone));
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [isLandlord, needsPhone, setNeedsPhone]);

    // 2. Cần hiện khung nhưng chưa có hồ sơ (cờ do trang hồ sơ đặt)
    useEffect(() => {
        if (!visible || profile) return;
        let cancelled = false;
        profileApi
            .getMine()
            .then((p) => {
                if (!cancelled) setProfile(p);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [visible, profile]);

    // 3. Điền sẵn form khi có hồ sơ
    useEffect(() => {
        if (!profile) return;
        setFullName(profile.fullName ?? "");
        setPhone(profile.phone ?? "");
    }, [profile]);

    if (!visible) return null;

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setError(null);

        const phoneNorm = normalizePhone(phone);
        if (!fullName.trim()) {
            setError("Vui lòng nhập họ và tên");
            return;
        }
        if (phoneNorm === "") {
            setError("Chủ trọ bắt buộc phải nhập số điện thoại để người thuê liên hệ");
            return;
        }
        if (!PHONE_RE.test(phoneNorm)) {
            setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
            return;
        }

        setSaving(true);
        try {
            const updated = await profileApi.update({
                ...toProfileForm(profile),
                fullName: fullName.trim(),
                phone: phoneNorm,
            });
            setProfile(updated);
            setNeedsPhone(false);
        } catch (err) {
            setError(apiErrorMessage(err, "Lưu thất bại, thử lại sau"));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        useUnreadStore.getState().setCount(0);
        logout();
        navigate("/login");
    };

    return (
        <Modal
            title="Cập nhật số điện thoại"
            subtitle="Bắt buộc đối với chủ trọ"
            icon="call"
            size="sm"
            dismissible={false}
            onClose={() => { }}
            footer={
                <>
                    {error && <p className="flex-1 text-sm text-error">{error}</p>}
                    <button type="button" onClick={handleLogout} disabled={saving} className={btnSecondary}>
                        Đăng xuất
                    </button>
                    <button type="submit" form="phone-gate-form" disabled={saving || !profile} className={btnPrimary}>
                        {saving ? "Đang lưu..." : "Lưu và tiếp tục"}
                    </button>
                </>
            }
        >
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                Người thuê sẽ dùng số điện thoại này để tìm đến liên hệ với bạn. Bạn cần cập nhật trước khi tiếp tục sử dụng.
            </p>

            {!profile ? (
                <p className="text-sm text-on-surface-variant py-6 text-center">Đang tải hồ sơ...</p>
            ) : (
                <form id="phone-gate-form" onSubmit={handleSave} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="gate-name" className={labelCls}>
                            Họ và tên <span className="text-error">*</span>
                        </label>
                        <input
                            id="gate-name"
                            name="fullName"
                            autoComplete="name"
                            className={inputCls}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="gate-phone" className={labelCls}>
                            Số điện thoại <span className="text-error">*</span>
                        </label>
                        <input
                            id="gate-phone"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            autoFocus
                            placeholder="0912345678"
                            className={`${inputCls} tabular-nums`}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <p className="mt-1.5 text-xs text-on-surface-variant">10 số, bắt đầu bằng 0</p>
                    </div>
                </form>
            )}
        </Modal>
    );
}
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { profileApi } from "../api/profileApi";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import Segmented from "../components/ui/Segmented";
import {
  alertErrorCls,
  btnPrimary,
  btnSecondary,
  inputCls,
  labelCls,
  textareaCls,
} from "../components/ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import type { Gender, Profile, ProfileFormData } from "../types/profile";

const PHONE_RE = /^0\d{9}$/;

const emptyForm: ProfileFormData = {
  fullName: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  identityNumber: "",
  bio: "",
};

function toForm(p: Profile): ProfileFormData {
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

const roleLabel: Record<string, string> = {
  TENANT: "Người tìm trọ",
  LANDLORD: "Chủ trọ",
  ADMIN: "Quản trị viên",
};
const roleTone: Record<string, BadgeTone> = { TENANT: "neutral", LANDLORD: "info", ADMIN: "warning" };

const genderOptions: { value: Gender | ""; label: string }[] = [
  { value: "", label: "Không nêu" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const completionFields: { key: keyof ProfileFormData; label: string }[] = [
  { key: "fullName", label: "Họ tên" },
  { key: "phone", label: "Số điện thoại" },
  { key: "gender", label: "Giới tính" },
  { key: "dateOfBirth", label: "Ngày sinh" },
  { key: "address", label: "Địa chỉ" },
  { key: "identityNumber", label: "Số CCCD" },
  { key: "bio", label: "Giới thiệu" },
];

const cardCls = "bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm";
const sectionTitleCls = "text-xs font-semibold uppercase tracking-wider text-on-surface-variant";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    profileApi
      .getMine()
      .then((p) => {
        setProfile(p);
        setForm(toForm(p));
      })
      .catch((err) => setLoadError(apiErrorMessage(err, "Không tải được hồ sơ, thử lại sau")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    const base = toForm(profile);
    return (Object.keys(base) as (keyof ProfileFormData)[]).some((k) => base[k] !== form[k]);
  }, [profile, form]);

  const phoneInvalid = form.phone.trim() !== "" && !PHONE_RE.test(form.phone.trim());

  const set = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (phoneInvalid) {
      setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
      return;
    }

    setSaving(true);
    try {
      const updated = await profileApi.update(form);
      setProfile(updated);
      setForm(toForm(updated));
      setSuccess(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Lưu hồ sơ thất bại, thử lại sau"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!profile) return;
    setForm(toForm(profile));
    setError(null);
    setSuccess(false);
  };

  const header = (
    <PageHeader
      eyebrow="Tài khoản"
      note="Cá nhân"
      title="Hồ sơ cá nhân"
      description="Cập nhật thông tin để chủ trọ và cộng đồng nhận ra bạn dễ hơn."
    />
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {header}
        <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-80 bg-surface-container rounded-xl" />
          <div className="lg:col-span-2 h-[32rem] bg-surface-container rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {header}
        <div className={`${cardCls} py-14 flex flex-col items-center gap-3 text-center`}>
          <span className="material-symbols-outlined !text-[40px] text-outline">cloud_off</span>
          <p className="font-medium text-on-surface">{loadError ?? "Không tải được hồ sơ"}</p>
          <button onClick={load} className={btnSecondary}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const saved = toForm(profile);
  const missing = completionFields.filter((f) => saved[f.key].trim() === "");
  const filled = completionFields.length - missing.length;
  const percent = Math.round((filled / completionFields.length) * 100);
  const displayName = profile.fullName?.trim() || profile.email;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {header}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Thẻ danh tính */}
        <aside className={`${cardCls} p-6 flex flex-col gap-5 lg:sticky lg:top-24`}>
          <div className="flex flex-col items-center text-center gap-2">
            <Avatar name={displayName} size="xl" />
            <div className="min-w-0 max-w-full">
              <p className="font-semibold text-on-surface truncate">{displayName}</p>
              <p className="text-sm text-on-surface-variant truncate">{profile.email}</p>
            </div>
            <Badge tone={roleTone[profile.role] ?? "neutral"}>{roleLabel[profile.role] ?? profile.role}</Badge>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-on-surface">Mức độ hoàn thiện</span>
              <span className="font-bold text-on-surface tabular-nums">{percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                style={{ width: `${percent}%` }}
                className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-primary-container"
                  }`}
              />
            </div>
            {missing.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-on-surface-variant mb-1.5">Còn thiếu:</p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((m) => (
                    <span
                      key={m.key}
                      className="bg-surface-container-low text-on-surface-variant text-xs px-2 py-0.5 rounded-full"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined !text-[16px]">check_circle</span>
                Hồ sơ của bạn đã đầy đủ
              </p>
            )}
          </div>

          <div className="bg-surface-container-low rounded-lg p-3 flex gap-2 text-xs text-on-surface-variant leading-relaxed">
            <span className="material-symbols-outlined !text-[18px] text-primary shrink-0">lock</span>
            <p>
              Họ tên hiển thị trên diễn đàn và khi nhắn tin. Các thông tin còn lại chỉ mình bạn xem được.
            </p>
          </div>
        </aside>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${cardCls} lg:col-span-2 p-6 flex flex-col gap-6`}>
          {!profile.profileCompleted && (
            <div className="bg-amber-100 text-amber-700 text-sm px-3 py-2.5 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined !text-[18px] mt-0.5">info</span>
              Bạn chưa lưu hồ sơ lần nào. Điền họ tên và bấm lưu để hoàn tất.
            </div>
          )}

          {error && (
            <div role="alert" className={alertErrorCls}>
              {error}
            </div>
          )}

          <section className="flex flex-col gap-4">
            <h2 className={sectionTitleCls}>Thông tin cơ bản</h2>

            <div>
              <label htmlFor="fullName" className={labelCls}>
                Họ và tên <span className="text-error">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                autoComplete="name"
                className={inputCls}
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className={labelCls}>
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0912345678"
                  aria-invalid={phoneInvalid}
                  className={`${inputCls} tabular-nums ${phoneInvalid ? "ring-2 ring-error/40" : ""}`}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
                <p className={`mt-1.5 text-xs ${phoneInvalid ? "text-error" : "text-on-surface-variant"}`}>
                  {phoneInvalid ? "Số điện thoại không hợp lệ" : "10 số, bắt đầu bằng 0"}
                </p>
              </div>

              <div>
                <label htmlFor="dob" className={labelCls}>
                  Ngày sinh
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  max={today}
                  autoComplete="bday"
                  className={inputCls}
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Giới tính</span>
              <Segmented<Gender | "">
                options={genderOptions}
                value={form.gender}
                onChange={(v) => set("gender", v)}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 pt-6 border-t border-outline-variant/40">
            <h2 className={sectionTitleCls}>Liên hệ và giấy tờ</h2>

            <div>
              <label htmlFor="address" className={labelCls}>
                Địa chỉ
              </label>
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                className={inputCls}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="identity" className={labelCls}>
                Số CCCD
              </label>
              <input
                id="identity"
                name="identity"
                inputMode="numeric"
                maxLength={20}
                className={`${inputCls} tabular-nums`}
                value={form.identityNumber}
                onChange={(e) => set("identityNumber", e.target.value)}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 pt-6 border-t border-outline-variant/40">
            <h2 className={sectionTitleCls}>Giới thiệu</h2>
            <div>
              <label htmlFor="bio" className={labelCls}>
                Vài dòng về bạn
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                className={textareaCls}
                placeholder="Ví dụ: sinh viên năm cuối, đang tìm phòng gần trường..."
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-outline-variant/40">
            <div className="min-h-5 text-sm">
              {success && (
                <span className="text-emerald-700 inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                  Đã lưu hồ sơ
                </span>
              )}
              {!success && dirty && <span className="text-on-surface-variant">Có thay đổi chưa lưu</span>}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={handleReset} disabled={!dirty || saving} className={btnSecondary}>
                Hoàn tác
              </button>
              <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
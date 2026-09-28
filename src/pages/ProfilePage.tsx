import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { profileApi } from "../api/profileApi";
import type { Profile, ProfileFormData } from "../types/profile";

const emptyForm: ProfileFormData = {
  fullName: "", phone: "", gender: "", dateOfBirth: "",
  address: "", identityNumber: "", bio: "",
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    profileApi
      .getMine()
      .then((p) => {
        setProfile(p);
        setForm(toForm(p));
      })
      .catch(() => setError("Không tải được hồ sơ, thử lại sau"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await profileApi.update(form);
      setProfile(updated);
      setForm(toForm(updated));
      setSuccess(true);
    } catch (err: any) {
      const data = err.response?.data;
      // Lỗi validate (VD sai định dạng số điện thoại) hoặc lỗi nghiệp vụ (trùng SĐT)
      setError(data?.message ?? "Lưu hồ sơ thất bại, thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Hồ sơ cá nhân</h1>
      <p className="text-sm text-gray-500 mb-6">
        {profile?.email} · {roleLabel[profile?.role ?? ""] ?? profile?.role}
      </p>

      {profile && !profile.profileCompleted && (
        <div className="bg-amber-50 text-amber-700 text-sm p-3 rounded-lg mb-4">
          Bạn chưa hoàn thiện hồ sơ. Điền thông tin bên dưới để người khác dễ liên hệ và tin tưởng bạn hơn.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded">Đã lưu hồ sơ thành công</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên *</label>
          <input
            required
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input
              inputMode="tel"
              placeholder="0912345678"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">10 số, bắt đầu bằng 0</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giới tính</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as ProfileFormData["gender"] })}
            >
              <option value="">-- Không chọn --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ngày sinh</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số CCCD</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.identityNumber}
              onChange={(e) => setForm({ ...form, identityNumber: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Địa chỉ</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Giới thiệu bản thân</label>
          <textarea
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </form>
    </div>
  );
}
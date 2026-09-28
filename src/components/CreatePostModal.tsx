import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { favoriteApi } from "../api/favoriteApi";
import type { Favorite } from "../types/favorite";
import type { PostFormData } from "../types/forum";

interface Props {
  onClose: () => void;
  onSubmit: (data: PostFormData) => Promise<void>;
}

export default function CreatePostModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState<PostFormData>({ title: "", content: "", sharedRoomId: null });
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    favoriteApi.getMine().then(setFavorites).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Đăng bài thất bại, thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">Đăng bài mới</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề</label>
            <input
              required
              maxLength={200}
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nội dung</label>
            <textarea
              required
              rows={6}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Chia sẻ kinh nghiệm thuê trọ, hỏi đáp, review khu vực..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Chia sẻ kèm một phòng <span className="text-gray-400 font-normal">(không bắt buộc)</span>
            </label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.sharedRoomId ?? ""}
              onChange={(e) =>
                setForm({ ...form, sharedRoomId: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">-- Không chia sẻ phòng --</option>
              {favorites.map((f) => (
                <option key={f.room.id} value={f.room.id}>
                  {f.room.title} — {f.room.houseName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Danh sách lấy từ các phòng bạn đã lưu yêu thích.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
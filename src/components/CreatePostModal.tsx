import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Modal from "./ui/Modal";
import { favoriteApi } from "../api/favoriteApi";
import { btnPrimary, btnSecondary, inputCls, labelCls, textareaCls } from "./ui/styles";
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
    favoriteApi.getMine().then(setFavorites).catch(() => { });
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
    <Modal
      title="Đăng bài mới"
      subtitle="Chia sẻ kinh nghiệm thuê trọ với cộng đồng"
      icon="edit_square"
      onClose={onClose}
      footer={
        <>
          {error && <p className="flex-1 text-sm text-error">{error}</p>}
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="post-form" disabled={saving} className={btnPrimary}>
            {saving ? "Đang đăng..." : "Đăng bài"}
          </button>
        </>
      }
    >
      <form id="post-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-on-surface">Tiêu đề</label>
            <span className="text-xs text-on-surface-variant tabular-nums">{form.title.length}/200</span>
          </div>
          <input
            required
            maxLength={200}
            className={inputCls}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>Nội dung</label>
          <textarea
            required
            rows={6}
            className={textareaCls}
            placeholder="Chia sẻ kinh nghiệm thuê trọ, hỏi đáp, review khu vực..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>
            Chia sẻ kèm một phòng{" "}
            <span className="font-normal text-on-surface-variant">(không bắt buộc)</span>
          </label>
          <select
            disabled={favorites.length === 0}
            className={inputCls}
            value={form.sharedRoomId ?? ""}
            onChange={(e) =>
              setForm({ ...form, sharedRoomId: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Không chia sẻ phòng</option>
            {favorites.map((f) => (
              <option key={f.room.id} value={f.room.id}>
                {f.room.title} · {f.room.houseName}
              </option>
            ))}
          </select>
          <p className="text-xs text-on-surface-variant mt-1.5">
            {favorites.length === 0
              ? "Bạn chưa lưu phòng nào. Lưu phòng yêu thích để chia sẻ kèm bài đăng."
              : "Danh sách lấy từ các phòng bạn đã lưu yêu thích."}
          </p>
        </div>
      </form>
    </Modal>
  );
}
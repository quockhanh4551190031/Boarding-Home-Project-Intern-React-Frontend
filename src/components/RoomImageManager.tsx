import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Modal from "./ui/Modal";
import { roomApi } from "../api/roomApi";
import { uploadApi } from "../api/uploadApi";
import { alertErrorCls, btnPrimary, btnSecondary, inputCls } from "./ui/styles";
import type { Room } from "../types/room";

interface Props {
  room: Room;
  onClose: () => void;
  onUpdated: () => void;
}

type Tab = "upload" | "url";

export default function RoomImageManager({ room, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh vượt quá 5MB, vui lòng chọn ảnh nhỏ hơn");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const uploadedUrl = await uploadApi.uploadImage(file);
      await roomApi.addImage(room.id, uploadedUrl, room.images.length === 0);
      onUpdated();
    } catch {
      setError("Tải ảnh lên thất bại, thử lại sau");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setBusy(true);
    try {
      await roomApi.addImage(room.id, url.trim(), room.images.length === 0);
      setUrl("");
      onUpdated();
    } catch {
      setError("Thêm ảnh từ URL thất bại, kiểm tra lại đường dẫn");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    setError(null);
    try {
      await roomApi.deleteImage(room.id, imageId);
      onUpdated();
    } catch {
      setError("Xóa ảnh thất bại, thử lại sau");
    }
  };

  const tabCls = (active: boolean) =>
    `flex-1 h-8 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors ${active
      ? "bg-surface-container-lowest text-on-surface shadow-sm"
      : "text-on-surface-variant hover:text-on-surface"
    }`;

  return (
    <Modal
      title="Quản lý ảnh"
      subtitle={room.title}
      icon="photo_library"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={btnSecondary}>
          Đóng
        </button>
      }
    >
      {room.images.length === 0 ? (
        <div className="border border-dashed border-outline-variant rounded-lg py-8 mb-5 flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined !text-[32px] text-outline">image</span>
          <span className="text-sm">Phòng này chưa có ảnh nào</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {room.images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-surface-container-low"
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
              {img.thumbnail && (
                <span className="absolute top-1.5 left-1.5 bg-primary-container text-on-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  Ảnh chính
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                aria-label="Xóa ảnh"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-scrim/70 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-error"
              >
                <span className="material-symbols-outlined !text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className={`${alertErrorCls} mb-3`}>{error}</div>}

      <div className="bg-surface-container-low rounded-lg p-1 flex gap-1 mb-3">
        <button type="button" onClick={() => setTab("upload")} className={tabCls(tab === "upload")}>
          <span className="material-symbols-outlined !text-[16px]">upload</span>
          Tải từ máy
        </button>
        <button type="button" onClick={() => setTab("url")} className={tabCls(tab === "url")}>
          <span className="material-symbols-outlined !text-[16px]">link</span>
          Dán URL
        </button>
      </div>

      {tab === "upload" ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={busy}
            className="hidden"
            id="room-image-input"
          />
          <label
            htmlFor="room-image-input"
            className={`flex flex-col items-center gap-1 border-2 border-dashed border-outline-variant rounded-lg py-6 text-sm text-on-surface-variant transition-colors ${busy
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:border-primary-container hover:bg-primary-fixed/30"
              }`}
          >
            <span className="material-symbols-outlined !text-[28px] text-primary-container">
              add_photo_alternate
            </span>
            {busy ? "Đang tải lên..." : "Chọn ảnh từ máy tính"}
            <span className="text-xs text-outline">JPG, PNG, tối đa 5MB</span>
          </label>
        </>
      ) : (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="url"
            required
            placeholder="https://..."
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" disabled={busy} className={`${btnPrimary} shrink-0`}>
            {busy ? "Đang thêm..." : "Thêm"}
          </button>
        </form>
      )}
    </Modal>
  );
}
import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { roomApi } from "../api/roomApi";
import { uploadApi } from "../api/uploadApi";
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
  const [uploading, setUploading] = useState(false);
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
    setUploading(true);
    try {
      const uploadedUrl = await uploadApi.uploadImage(file);
      await roomApi.addImage(room.id, uploadedUrl, room.images.length === 0);
      onUpdated();
    } catch {
      setError("Tải ảnh lên thất bại, thử lại sau");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setUploading(true);
    try {
      await roomApi.addImage(room.id, url.trim(), room.images.length === 0);
      setUrl("");
      onUpdated();
    } catch {
      setError("Thêm ảnh từ URL thất bại, kiểm tra lại đường dẫn");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    await roomApi.deleteImage(room.id, imageId);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Quản lý ảnh — {room.title}</h2>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {room.images.map((img) => (
            <div key={img.id} className="relative aspect-square rounded overflow-hidden bg-gray-100">
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
              {img.thumbnail && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Ảnh chính
                </span>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-xs leading-none"
              >
                ×
              </button>
            </div>
          ))}
          {room.images.length === 0 && (
            <p className="col-span-3 text-sm text-gray-400 text-center py-4">Chưa có ảnh nào</p>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}

        {/* Chuyển tab */}
        <div className="flex border rounded-lg overflow-hidden mb-3 text-sm">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 py-2 font-medium ${tab === "upload" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
          >
            📁 Tải từ máy
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 py-2 font-medium ${tab === "url" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
          >
            🔗 Dán URL
          </button>
        </div>

        {tab === "upload" ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="room-image-input"
            />
            <label
              htmlFor="room-image-input"
              className={`block text-center border-2 border-dashed rounded-lg py-4 text-sm cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-blue-400 hover:bg-blue-50"
                }`}
            >
              {uploading ? "Đang tải lên..." : "📷 Chọn ảnh từ máy tính"}
            </label>
            <p className="text-xs text-gray-400 mt-1 text-center">JPG, PNG, tối đa 5MB</p>
          </>
        ) : (
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              required
              placeholder="https://..."
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {uploading ? "Đang thêm..." : "Thêm"}
            </button>
          </form>
        )}

        <button onClick={onClose} className="mt-4 w-full text-sm border rounded py-2 hover:bg-gray-50">
          Đóng
        </button>
      </div>
    </div>
  );
}
import { useState, FormEvent } from "react";
import { roomApi } from "../api/roomApi";
import type { Room } from "../types/room";

interface Props {
  room: Room;
  onClose: () => void;
  onUpdated: () => void;
}

export default function RoomImageManager({ room, onClose, onUpdated }: Props) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    try {
      await roomApi.addImage(room.id, url.trim(), room.images.length === 0);
      setUrl("");
      onUpdated();
    } finally {
      setSaving(false);
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

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="url"
            required
            placeholder="Dán URL ảnh (https://...)"
            className="flex-1 border rounded px-3 py-2 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            Thêm
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1">
          Chưa hỗ trợ upload file trực tiếp — dùng link ảnh có sẵn (VD từ Imgur, Google Drive public link).
        </p>

        <button onClick={onClose} className="mt-4 w-full text-sm border rounded py-2 hover:bg-gray-50">
          Đóng
        </button>
      </div>
    </div>
  );
}
import { useState } from "react";
import MapPicker from "./MapPicker";

interface Props {
  onClose: () => void;
}

export default function LocationPickerModal({ onClose }: Props) {
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Định vị / Chọn vị trí</h2>

        <MapPicker
          latitude={lat}
          longitude={lng}
          onChange={(la, lo) => {
            setLat(la);
            setLng(lo);
          }}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            disabled={lat === 0}
            className="flex-1 text-sm border rounded py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            {copied ? "Đã copy!" : "Copy tọa độ"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-sm bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
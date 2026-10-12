import { useState } from "react";
import Modal from "./ui/Modal";
import MapPicker from "./MapPicker";
import { btnPrimary, btnSecondary } from "./ui/styles";

export default function LocationPickerModal({ onClose }: { onClose: () => void }) {
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [copied, setCopied] = useState(false);
  const hasPosition = lat !== 0 && lng !== 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard: bỏ qua, người dùng vẫn đọc được tọa độ dưới bản đồ
    }
  };

  return (
    <Modal
      title="Định vị / Chọn vị trí"
      subtitle="Chọn một điểm trên bản đồ hoặc dùng vị trí hiện tại"
      icon="location_on"
      closeOnBackdrop
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={handleCopy} disabled={!hasPosition} className={btnSecondary}>
            <span className="material-symbols-outlined !text-[18px]">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Đã sao chép" : "Sao chép tọa độ"}
          </button>
          <button type="button" onClick={onClose} className={btnPrimary}>
            Đóng
          </button>
        </>
      }
    >
      <MapPicker
        latitude={lat}
        longitude={lng}
        onChange={(la, lo) => {
          setLat(la);
          setLng(lo);
        }}
      />
    </Modal>
  );
}
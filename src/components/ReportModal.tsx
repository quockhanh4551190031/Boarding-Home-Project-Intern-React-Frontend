import { useState } from "react";
import type { FormEvent } from "react";
import Modal from "./ui/Modal";
import { btnDanger, btnPrimary, btnSecondary, labelCls, textareaCls } from "./ui/styles";

interface Props {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const quickReasons = ["Spam / quảng cáo", "Lừa đảo", "Nội dung không phù hợp", "Thông tin sai sự thật"];

export default function ReportModal({ title, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setError(null);
    setSending(true);
    try {
      await onSubmit(reason.trim());
      setDone(true);
    } catch {
      setError("Gửi báo cáo thất bại, thử lại sau");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title="Báo cáo vi phạm"
      subtitle={title}
      icon="flag"
      size="sm"
      onClose={onClose}
      footer={
        done ? (
          <button type="button" onClick={onClose} className={btnPrimary}>
            Đóng
          </button>
        ) : (
          <>
            {error && <p className="flex-1 text-sm text-error">{error}</p>}
            <button type="button" onClick={onClose} className={btnSecondary}>
              Hủy
            </button>
            <button
              type="submit"
              form="report-form"
              disabled={sending || !reason.trim()}
              className={btnDanger}
            >
              {sending ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center text-center gap-2 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined !text-[28px]">check</span>
          </div>
          <p className="font-semibold text-on-surface">Đã gửi báo cáo</p>
          <p className="text-sm text-on-surface-variant">Cảm ơn bạn. Quản trị viên sẽ xem xét sớm.</p>
        </div>
      ) : (
        <form id="report-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Lý do báo cáo</label>
            <div className="flex flex-wrap gap-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${reason === r
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <textarea
              required
              rows={4}
              maxLength={255}
              placeholder="Mô tả thêm chi tiết (tối đa 255 ký tự)..."
              className={textareaCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-on-surface-variant text-right mt-1 tabular-nums">
              {reason.length}/255
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
}
import { useState } from "react";
import type { FormEvent } from "react";

interface Props {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function ReportModal({ title, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-1">Báo cáo vi phạm</h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{title}</p>

        {done ? (
          <>
            <p className="text-green-700 bg-green-50 text-sm p-3 rounded mb-4">
              Đã gửi báo cáo. Cảm ơn bạn, quản trị viên sẽ xem xét sớm.
            </p>
            <button onClick={onClose} className="w-full border rounded py-2 text-sm hover:bg-gray-50">
              Đóng
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}
            <textarea
              required
              rows={4}
              maxLength={255}
              placeholder="Mô tả lý do báo cáo (spam, lừa đảo, nội dung không phù hợp...)"
              className="w-full border rounded px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                Hủy
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {sending ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
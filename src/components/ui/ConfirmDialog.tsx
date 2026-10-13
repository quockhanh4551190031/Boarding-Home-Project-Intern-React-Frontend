import { useState } from "react";
import type { ReactNode } from "react";
import Modal from "./Modal";
import { btnDanger, btnPrimary, btnSecondary } from "./styles";

interface Props {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = "Xác nhận",
    danger = false,
    onConfirm,
    onClose,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setBusy(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Thao tác thất bại, thử lại sau");
            setBusy(false);
        }
    };

    return (
        <Modal
            title={title}
            icon={danger ? "warning" : "help"}
            size="sm"
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    {error && <p className="flex-1 text-sm text-error">{error}</p>}
                    <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className={danger ? btnDanger : btnPrimary}
                    >
                        {busy ? "Đang xử lý..." : confirmLabel}
                    </button>
                </>
            }
        >
            <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        </Modal>
    );
}
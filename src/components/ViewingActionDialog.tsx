import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Modal from "./ui/Modal";
import { btnDanger, btnSecondary, labelCls, textareaCls } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";

interface Props {
    title: string;
    description: ReactNode;
    noteLabel: string;
    placeholder: string;
    confirmLabel: string;
    onConfirm: (note: string) => Promise<void>;
    onClose: () => void;
}

export default function ViewingActionDialog({
    title,
    description,
    noteLabel,
    placeholder,
    confirmLabel,
    onConfirm,
    onClose,
}: Props) {
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await onConfirm(note);
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, "Thao tác thất bại, thử lại sau"));
            setBusy(false);
        }
    };

    return (
        <Modal
            title={title}
            icon="event_busy"
            size="sm"
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    {error && <p className="flex-1 text-sm text-error">{error}</p>}
                    <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
                        Quay lại
                    </button>
                    <button type="submit" form="viewing-action-form" disabled={busy} className={btnDanger}>
                        {busy ? "Đang xử lý..." : confirmLabel}
                    </button>
                </>
            }
        >
            <form id="viewing-action-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
                <div>
                    <label htmlFor="viewing-note" className={labelCls}>
                        {noteLabel} <span className="font-normal text-on-surface-variant">(không bắt buộc)</span>
                    </label>
                    <textarea
                        id="viewing-note"
                        rows={3}
                        maxLength={300}
                        autoFocus
                        className={textareaCls}
                        placeholder={placeholder}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <p className="text-xs text-on-surface-variant text-right mt-1 tabular-nums">{note.length}/300</p>
                </div>
            </form>
        </Modal>
    );
}
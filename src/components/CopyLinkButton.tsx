import { useState } from "react";

export default function CopyLinkButton() {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Trình duyệt chặn clipboard: bỏ qua, người dùng vẫn sao chép từ thanh địa chỉ được
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 h-9 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors inline-flex items-center gap-1.5"
        >
            <span className="material-symbols-outlined !text-[18px]">{copied ? "check" : "share"}</span>
            {copied ? "Đã sao chép" : "Chia sẻ"}
        </button>
    );
}
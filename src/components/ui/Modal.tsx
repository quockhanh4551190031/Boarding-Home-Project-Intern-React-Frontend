import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
    title: string;
    subtitle?: string;
    icon?: string;
    size?: "sm" | "md" | "lg";
    closeOnBackdrop?: boolean;
    /** false: không có nút đóng, không đóng bằng Esc hay bấm nền (khung bắt buộc). */
    dismissible?: boolean;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export default function Modal({
    title,
    subtitle,
    icon,
    size = "md",
    closeOnBackdrop = false,
    dismissible = true,
    onClose,
    children,
    footer,
}: Props) {
    const closeRef = useRef(onClose);
    useEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && dismissible) closeRef.current();
        };
        document.addEventListener("keydown", onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [dismissible]);

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-[2px]"
            onMouseDown={(e) => {
                if (closeOnBackdrop && dismissible && e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`w-full ${widths[size]} max-h-[90vh] flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-xl`}
            >
                <header className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/40">
                    {icon && (
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant shrink-0">
                            <span className="material-symbols-outlined !text-[18px]">{icon}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-on-surface leading-tight">{title}</h2>
                        {subtitle && <p className="text-xs text-on-surface-variant truncate mt-0.5">{subtitle}</p>}
                    </div>
                    {dismissible && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Đóng"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">{children}</div>

                {footer && (
                    <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-outline-variant/40">
                        {footer}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
}
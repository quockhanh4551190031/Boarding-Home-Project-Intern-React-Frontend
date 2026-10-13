import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneCls: Record<BadgeTone, string> = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-primary-fixed text-on-primary-fixed-variant",
    neutral: "bg-surface-container text-on-surface-variant",
};

interface Props {
    tone?: BadgeTone;
    dot?: boolean;
    children: ReactNode;
}

export default function Badge({ tone = "neutral", dot = false, children }: Props) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${toneCls[tone]}`}
        >
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            {children}
        </span>
    );
}
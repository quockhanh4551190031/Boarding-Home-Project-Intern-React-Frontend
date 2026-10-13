import type { ReactNode } from "react";

interface Props {
    icon: string;
    label: string;
    value: ReactNode;
}

export default function StatPill({ icon, label, value }: Props) {
    return (
        <div className="bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/40 px-4 py-2.5 flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined !text-[18px]">{icon}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant">{label}</span>
                <span className="font-bold text-on-surface tabular-nums leading-tight">{value}</span>
            </div>
        </div>
    );
}
import type { ReactNode } from "react";

interface Props {
    eyebrow: string;
    note?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export default function PageHeader({ eyebrow, note, title, description, actions }: Props) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</span>
                    {note && (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                            <span className="text-xs text-on-surface-variant">{note}</span>
                        </>
                    )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-on-surface">{title}</h1>
                {description && <p className="text-sm text-on-surface-variant max-w-xl">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    );
}
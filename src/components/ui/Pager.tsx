import { btnSmSecondary } from "./styles";

interface Props {
    page: number;
    hasMore: boolean;
    disabled?: boolean;
    onChange: (page: number) => void;
}

export default function Pager({ page, hasMore, disabled, onChange }: Props) {
    if (page === 0 && !hasMore) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/40 text-sm">
            <span className="text-on-surface-variant tabular-nums">Trang {page + 1}</span>
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={disabled || page === 0}
                    onClick={() => onChange(page - 1)}
                    className={btnSmSecondary}
                >
                    <span className="material-symbols-outlined !text-[16px]">chevron_left</span>
                    Trước
                </button>
                <button
                    type="button"
                    disabled={disabled || !hasMore}
                    onClick={() => onChange(page + 1)}
                    className={btnSmSecondary}
                >
                    Sau
                    <span className="material-symbols-outlined !text-[16px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}
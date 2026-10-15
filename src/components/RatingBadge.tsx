const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';

export default function RatingBadge({ average, count }: { average: number; count: number }) {
    if (count === 0) return <span className="text-xs text-on-surface-variant">Chưa có đánh giá</span>;

    return (
        <span className="inline-flex items-center gap-1 text-xs">
            <span
                className="material-symbols-outlined text-amber-500"
                style={{ fontSize: 16, fontVariationSettings: FILLED }}
            >
                star
            </span>
            <span className="font-semibold text-on-surface tabular-nums">{average.toFixed(1)}</span>
            <span className="text-on-surface-variant tabular-nums">({count})</span>
        </span>
    );
}
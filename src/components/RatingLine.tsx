import StarRating from "./ui/StarRating";
import type { ReviewSummary } from "../types/review";

export default function RatingLine({ summary }: { summary: ReviewSummary }) {
    const goReviews = () =>
        document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <button
            type="button"
            onClick={goReviews}
            className="self-start inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        >
            {summary.count > 0 ? (
                <>
                    <StarRating value={summary.average} size={18} />
                    <span className="font-semibold text-on-surface tabular-nums">{summary.average.toFixed(1)}</span>
                    <span className="text-on-surface-variant tabular-nums">({summary.count} đánh giá)</span>
                </>
            ) : (
                <span className="text-on-surface-variant">Chưa có đánh giá</span>
            )}
        </button>
    );
}
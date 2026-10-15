interface Props {
    value: number;
    size?: number;
}

const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';

export default function StarRating({ value, size = 18 }: Props) {
    return (
        <span className="inline-flex" role="img" aria-label={`${value.toFixed(1)} trên 5 sao`}>
            {[1, 2, 3, 4, 5].map((i) => {
                const filled = value >= i - 0.75;
                const icon = value >= i - 0.25 ? "star" : value >= i - 0.75 ? "star_half" : "star";
                return (
                    <span
                        key={i}
                        className={`material-symbols-outlined ${filled ? "text-amber-500" : "text-outline-variant"}`}
                        style={{ fontSize: size, fontVariationSettings: filled ? FILLED : undefined }}
                    >
                        {icon}
                    </span>
                );
            })}
        </span>
    );
}
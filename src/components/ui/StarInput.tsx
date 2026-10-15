import { useState } from "react";

const FILLED = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20';
const labels = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"];

interface Props {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export default function StarInput({ value, onChange, disabled }: Props) {
    const [hover, setHover] = useState(0);
    const shown = hover || value;

    return (
        <div className="flex items-center gap-3">
            <div role="radiogroup" aria-label="Chọn số sao" className="flex" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={value === i}
                        aria-label={`${i} sao`}
                        disabled={disabled}
                        onClick={() => onChange(i)}
                        onMouseEnter={() => setHover(i)}
                        className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                    >
                        <span
                            className={`material-symbols-outlined ${i <= shown ? "text-amber-500" : "text-outline-variant"}`}
                            style={{ fontSize: 32, fontVariationSettings: i <= shown ? FILLED : undefined }}
                        >
                            star
                        </span>
                    </button>
                ))}
            </div>
            <span className="text-sm text-on-surface-variant">{shown ? labels[shown - 1] : "Chọn số sao"}</span>
        </div>
    );
}
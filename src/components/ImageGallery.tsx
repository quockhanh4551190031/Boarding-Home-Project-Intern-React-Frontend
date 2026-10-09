import { useState } from "react";

interface Props {
    images: string[];
    alt: string;
}

export default function ImageGallery({ images, alt }: Props) {
    const [active, setActive] = useState(0);
    const current = Math.min(active, Math.max(images.length - 1, 0));

    const prev = () => setActive((current - 1 + images.length) % images.length);
    const next = () => setActive((current + 1) % images.length);

    if (images.length === 0) {
        return (
            <div className="aspect-video bg-surface-container-low rounded-xl flex flex-col items-center justify-center gap-1 text-outline">
                <span className="material-symbols-outlined !text-[40px]">image</span>
                <span className="text-sm">Chưa có ảnh</span>
            </div>
        );
    }

    return (
        <div>
            <div className="relative aspect-video bg-surface-container-low rounded-xl overflow-hidden group">
                <img src={images[current]} alt={alt} className="w-full h-full object-cover" />

                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="Ảnh trước"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-container-lowest"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Ảnh sau"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-container-lowest"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>

                        <span className="absolute bottom-3 right-3 bg-inverse-surface/70 text-white text-xs font-medium px-2.5 py-1 rounded-full tabular-nums">
                            {current + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {images.map((url, idx) => (
                        <button
                            key={url + idx}
                            type="button"
                            onClick={() => setActive(idx)}
                            className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === current
                                    ? "border-primary-container"
                                    : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                        >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
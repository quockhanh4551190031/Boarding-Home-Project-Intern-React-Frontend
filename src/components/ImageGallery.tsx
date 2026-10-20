import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
    images: string[];
    alt: string;
}

const navBtn =
    "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container-lowest transition-colors";

export default function ImageGallery({ images, alt }: Props) {
    const [active, setActive] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const count = images.length;
    const current = Math.min(active, Math.max(count - 1, 0));

    const prev = useCallback(() => setActive((i) => (Math.min(i, count - 1) - 1 + count) % count), [count]);
    const next = useCallback(() => setActive((i) => (Math.min(i, count - 1) + 1) % count), [count]);

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightbox(false);
            else if (e.key === "ArrowLeft") prev();
            else if (e.key === "ArrowRight") next();
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [lightbox, prev, next]);

    if (count === 0) {
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
                <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    aria-label="Xem ảnh lớn"
                    className="w-full h-full block cursor-zoom-in"
                >
                    <img src={images[current]} alt={alt} className="w-full h-full object-cover" />
                </button>

                <span className="pointer-events-none absolute top-3 right-3 bg-scrim/60 text-white text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined !text-[14px]">zoom_in</span>
                    Xem ảnh lớn
                </span>

                {count > 1 && (
                    <>
                        <button type="button" onClick={prev} aria-label="Ảnh trước" className={`${navBtn} left-3`}>
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button type="button" onClick={next} aria-label="Ảnh sau" className={`${navBtn} right-3`}>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                        <span className="absolute bottom-3 right-3 bg-scrim/70 text-white text-xs font-medium px-2.5 py-1 rounded-full tabular-nums">
                            {current + 1} / {count}
                        </span>
                    </>
                )}
            </div>

            {count > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {images.map((url, idx) => (
                        <button
                            key={url + idx}
                            type="button"
                            onClick={() => setActive(idx)}
                            aria-label={`Xem ảnh ${idx + 1}`}
                            className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === current ? "border-primary-container" : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                        >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {lightbox &&
                createPortal(
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Xem ảnh"
                        className="fixed inset-0 z-[110] bg-scrim/90 flex items-center justify-center p-4"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setLightbox(false);
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setLightbox(false)}
                            aria-label="Đóng"
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-on-primary/15 text-white hover:bg-on-primary/25 flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <img
                            src={images[current]}
                            alt={alt}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
                        />

                        {count > 1 && (
                            <>
                                <button type="button" onClick={prev} aria-label="Ảnh trước" className={`${navBtn} left-4`}>
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button type="button" onClick={next} aria-label="Ảnh sau" className={`${navBtn} right-4`}>
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-sm tabular-nums bg-on-primary/15 px-3 py-1 rounded-full">
                                    {current + 1} / {count}
                                </span>
                            </>
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
}
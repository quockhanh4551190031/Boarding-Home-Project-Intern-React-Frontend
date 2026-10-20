interface Props {
    text: string;
    query: string;
}

/** Tô nổi từ khóa trong văn bản (không dùng innerHTML). */
export default function Highlight({ text, query }: Props) {
    const q = query.trim();
    if (!q) return <>{text}</>;

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));

    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="bg-primary-fixed text-on-primary-fixed-variant rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}
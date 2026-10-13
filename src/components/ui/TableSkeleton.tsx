interface Props {
    rows?: number;
    cols: number;
}

export default function TableSkeleton({ rows = 5, cols }: Props) {
    return (
        <>
            {Array.from({ length: rows }, (_, r) => (
                <tr key={r} className="animate-pulse">
                    {Array.from({ length: cols }, (_, c) => (
                        <td key={c} className="px-4 py-4">
                            <div className="h-4 bg-surface-container rounded w-full max-w-[8rem]" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
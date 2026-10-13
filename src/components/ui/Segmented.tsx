interface Option<T extends string> {
    value: T;
    label: string;
}

interface Props<T extends string> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
}

export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
    return (
        <div className="bg-surface-container-low rounded-lg p-1 inline-flex gap-1 max-w-full overflow-x-auto">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`h-8 px-3 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${value === o.value
                            ? "bg-surface-container-lowest text-on-surface shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
interface Props {
    name: string;
    size?: "sm" | "md" | "lg" | "xl";
    tone?: "primary" | "muted";
}

const sizeCls = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-20 h-20 text-3xl",
};
const toneCls = {
    primary: "bg-primary-container text-on-primary",
    muted: "bg-surface-container-high text-on-surface-variant",
};

export default function Avatar({ name, size = "md", tone = "primary" }: Props) {
    return (
        <span
            className={`${sizeCls[size]} ${toneCls[tone]} rounded-full shrink-0 flex items-center justify-center font-bold select-none`}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}
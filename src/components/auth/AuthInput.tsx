import { inputCls, labelCls } from "../ui/styles";

interface Props {
    id: string;
    label: string;
    icon: string;
    type?: "text" | "email";
    value: string;
    onChange: (value: string) => void;
    autoComplete?: string;
    placeholder?: string;
}

export default function AuthInput({
    id,
    label,
    icon,
    type = "text",
    value,
    onChange,
    autoComplete,
    placeholder,
}: Props) {
    return (
        <div>
            <label htmlFor={id} className={labelCls}>
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined !text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    {icon}
                </span>
                <input
                    id={id}
                    name={id}
                    type={type}
                    required
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className={`${inputCls} pl-10`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
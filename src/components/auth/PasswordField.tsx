import { useState } from "react";
import { inputCls, labelCls } from "../ui/styles";

interface Props {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: "current-password" | "new-password";
    minLength?: number;
    placeholder?: string;
    invalid?: boolean;
}

export default function PasswordField({
    id,
    label,
    value,
    onChange,
    autoComplete,
    minLength,
    placeholder,
    invalid = false,
}: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className={labelCls}>
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined !text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    lock
                </span>
                <input
                    id={id}
                    name={id}
                    type={visible ? "text" : "password"}
                    required
                    minLength={minLength}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    aria-invalid={invalid}
                    className={`${inputCls} pl-10 pr-11 ${invalid ? "ring-2 ring-error/40" : ""}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                    <span className="material-symbols-outlined !text-[18px]">
                        {visible ? "visibility_off" : "visibility"}
                    </span>
                </button>
            </div>
        </div>
    );
}
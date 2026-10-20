import { useThemeStore } from "../store/themeStore";

export default function ThemeToggle() {
    const theme = useThemeStore((s) => s.theme);
    const toggle = useThemeStore((s) => s.toggle);
    const dark = theme === "dark";
    const label = dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={label}
            title={label}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
        >
            <span className="material-symbols-outlined">{dark ? "light_mode" : "dark_mode"}</span>
        </button>
    );
}
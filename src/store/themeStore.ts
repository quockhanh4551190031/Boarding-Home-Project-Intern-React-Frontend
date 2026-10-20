import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_COLOR: Record<Theme, string> = { light: "#faf8ff", dark: "#0f111a" };

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)");

function getSaved(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);

  // Màu thanh trạng thái trên trình duyệt di động
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLOR[theme];
}

function initialTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return getSaved() ?? (prefersDark().matches ? "dark" : "light");
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Trình duyệt chặn localStorage: vẫn đổi được trong phiên này, chỉ không nhớ lại
    }
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));

applyTheme(useThemeStore.getState().theme);

// Chưa tự chọn thì đổi theo hệ điều hành khi người dùng đổi giao diện máy
const mq = prefersDark();
if (typeof mq.addEventListener === "function") {
  mq.addEventListener("change", (e) => {
    if (getSaved() !== null) return;
    const theme: Theme = e.matches ? "dark" : "light";
    applyTheme(theme);
    useThemeStore.setState({ theme });
  });
}

// Tab khác vừa đổi giao diện thì tab này đổi theo
window.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY) return;
  const theme: Theme =
    e.newValue === "dark" || e.newValue === "light" ? e.newValue : prefersDark().matches ? "dark" : "light";
  applyTheme(theme);
  useThemeStore.setState({ theme });
}); 
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const highlights = [
    { icon: "map", title: "Tìm theo khu vực và bản đồ", text: "Lọc theo giá, diện tích, tiện ích và xem đường đi tới nhà trọ." },
    { icon: "chat", title: "Nhắn tin trực tiếp", text: "Trao đổi nhanh với chủ trọ ngay trên nền tảng." },
    { icon: "forum", title: "Cộng đồng chia sẻ", text: "Đọc kinh nghiệm thuê trọ và hỏi đáp cùng mọi người." },
    { icon: "smart_toy", title: "Trợ lý AI", text: "Hỏi cách dùng web hoặc nhờ gợi ý phòng phù hợp." },
];

function Logo({ onDark = false }: { onDark?: boolean }) {
    return (
        <Link to="/" className="inline-flex items-center gap-2.5">
            <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${onDark ? "bg-surface-container-lowest text-primary-container" : "bg-primary text-on-primary"
                    }`}
            >
                <span className="material-symbols-outlined !text-[20px]">cottage</span>
            </div>
            <div className="flex flex-col leading-none">
                <span className={`font-bold ${onDark ? "text-on-primary" : "text-on-surface"}`}>BoardingHome</span>
                <span className={`text-[11px] mt-0.5 ${onDark ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                    Nền tảng tìm trọ
                </span>
            </div>
        </Link>
    );
}

interface Props {
    title: string;
    subtitle: string;
    footer: ReactNode;
    children: ReactNode;
}

export default function AuthShell({ title, subtitle, footer, children }: Props) {
    return (
        <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-background">
            <aside className="hidden lg:flex relative overflow-hidden bg-primary-container text-on-primary p-12 flex-col justify-between">
                <div aria-hidden className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
                <div aria-hidden className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />

                <div className="relative z-10">
                    <Logo onDark />
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight leading-tight">
                            Tìm trọ nhanh hơn,
                            <br />
                            quản lý trọ dễ hơn.
                        </h2>
                        <p className="mt-3 text-on-primary-container max-w-md">
                            Nơi người tìm trọ và chủ trọ gặp nhau, với đầy đủ công cụ từ tìm kiếm đến trò chuyện.
                        </p>
                    </div>

                    <ul className="flex flex-col gap-4">
                        {highlights.map((h) => (
                            <li key={h.icon} className="flex items-start gap-3">
                                <div className="w-9 h-9 shrink-0 rounded-lg bg-white/15 flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[20px]">{h.icon}</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{h.title}</p>
                                    <p className="text-sm text-on-primary-container">{h.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 text-xs text-on-primary-container">
                    Nền tảng kết nối người tìm trọ và chủ trọ
                </p>
            </aside>

            <main className="flex flex-col">
                <div className="lg:hidden px-6 pt-6">
                    <Logo />
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
                            <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>
                        </div>

                        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm p-6 sm:p-8">
                            {children}
                        </div>

                        <p className="text-center text-sm text-on-surface-variant mt-5">{footer}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
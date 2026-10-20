import { formatPhone } from "../utils/format";

interface Props {
    phone: string | null;
    masked: boolean;
    onLogin: () => void;
}

const boxCls = "flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2.5";

export default function CallButton({ phone, masked, onLogin }: Props) {
    if (!phone) {
        return (
            <div className={`${boxCls} text-sm text-on-surface-variant`}>
                <span className="material-symbols-outlined !text-[18px]">phone_disabled</span>
                Chủ trọ chưa cập nhật số điện thoại
            </div>
        );
    }

    if (masked) {
        return (
            <div className="flex flex-col gap-2">
                <div className={boxCls}>
                    <span className="material-symbols-outlined !text-[18px] text-on-surface-variant">call</span>
                    <span className="font-semibold tabular-nums tracking-wide text-on-surface">{phone}</span>
                </div>
                <button
                    type="button"
                    onClick={onLogin}
                    className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                    Đăng nhập để xem số
                </button>
            </div>
        );
    }

    // TODO: chức năng gọi sẽ làm sau. Hiện tại mở ứng dụng gọi của thiết bị.
    const dial = phone.replace(/\s+/g, "");
    return (
        <div className="flex flex-col gap-2">
            <div className={boxCls}>
                <span className="material-symbols-outlined !text-[18px] text-on-surface-variant">call</span>
                <span className="font-semibold tabular-nums text-on-surface">{formatPhone(phone)}</span>
            </div>
            <a
                href={`tel:${dial}`}
                className="h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:brightness-110 transition shadow-sm inline-flex items-center justify-center gap-1.5"
            >
                <span className="material-symbols-outlined !text-[18px]">call</span>
                Gọi ngay
            </a>
        </div>
    );
}
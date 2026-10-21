import { btnSecondary } from "./ui/styles";

const RADIUS_OPTIONS = [2, 5, 10, 20, 50];

interface Props {
    active: boolean;
    locating: boolean;
    radiusKm: number | null;
    onLocate: () => void;
    onClear: () => void;
    onRadiusChange: (km: number | null) => void;
}

const iconBtn =
    "w-8 h-8 rounded-md flex items-center justify-center hover:bg-primary-fixed disabled:opacity-60 transition-colors";

export default function NearMeControl({
    active,
    locating,
    radiusKm,
    onLocate,
    onClear,
    onRadiusChange,
}: Props) {
    if (!active) {
        return (
            <button type="button" onClick={onLocate} disabled={locating} className={btnSecondary}>
                <span className="material-symbols-outlined !text-[18px]">my_location</span>
                {locating ? "Đang định vị..." : "Gần tôi"}
            </button>
        );
    }

    return (
        <div className="inline-flex items-center gap-1 h-10 pl-3 pr-1 rounded-lg bg-primary-fixed/60 text-on-primary-fixed-variant">
            <span className="material-symbols-outlined !text-[18px]">my_location</span>
            <span className="text-sm font-medium mr-1">Gần tôi</span>

            <select
                aria-label="Bán kính tìm kiếm"
                value={radiusKm ?? ""}
                onChange={(e) => onRadiusChange(e.target.value ? Number(e.target.value) : null)}
                className="h-8 pl-2 pr-1 rounded-md bg-surface-container-lowest text-on-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                <option value="">Mọi khoảng cách</option>
                {RADIUS_OPTIONS.map((km) => (
                    <option key={km} value={km}>
                        Trong {km} km
                    </option>
                ))}
            </select>

            <button
                type="button"
                onClick={onLocate}
                disabled={locating}
                title="Cập nhật vị trí"
                aria-label="Cập nhật vị trí"
                className={iconBtn}
            >
                <span className={`material-symbols-outlined !text-[18px] ${locating ? "animate-spin" : ""}`}>
                    {locating ? "progress_activity" : "refresh"}
                </span>
            </button>
            <button type="button" onClick={onClear} title="Tắt Gần tôi" aria-label="Tắt Gần tôi" className={iconBtn}>
                <span className="material-symbols-outlined !text-[18px]">close</span>
            </button>
        </div>
    );
}
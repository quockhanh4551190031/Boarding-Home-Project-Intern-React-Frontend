import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchApi } from "../api/searchApi";
import Badge from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import { UserAvatarLink, UserNameLink } from "../components/ui/UserLink";
import { btnSecondary, btnSmSecondary, sectionCardCls } from "../components/ui/styles";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import { formatPrice, roleLabel } from "../utils/format";
import type { SearchResult } from "../types/search";

const LIMIT = 20;
const MIN_LENGTH = 2;

const roleTone: Record<string, BadgeTone> = { TENANT: "neutral", LANDLORD: "info" };

function SectionTitle({ icon, title, count }: { icon: string; title: string; count: number }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                <span className="material-symbols-outlined !text-[16px]">{icon}</span>
            </div>
            <h2 className="font-semibold text-on-surface">{title}</h2>
            <span className="bg-surface-container-low text-on-surface-variant text-xs font-medium px-2 py-0.5 rounded-full tabular-nums">
                {count}
            </span>
        </div>
    );
}

export default function SearchPage() {
    const [params] = useSearchParams();
    const q = (params.get("q") ?? "").trim();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const goLogin = useLoginRedirect();

    const [result, setResult] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (q.length < MIN_LENGTH) {
            setResult(null);
            setLoading(false);
            setError(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(false);
        searchApi
            .search(q, LIMIT)
            .then((r) => {
                if (!cancelled) setResult(r);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [q, isAuthenticated, reloadKey]);

    const header = (
        <PageHeader
            eyebrow="Tìm kiếm"
            note={q.length >= MIN_LENGTH ? "Theo tên" : undefined}
            title={q.length >= MIN_LENGTH ? `Kết quả cho "${q}"` : "Tìm kiếm"}
            description="Tìm nhà trọ và người dùng theo tên."
        />
    );

    if (q.length < MIN_LENGTH) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                {header}
                <div className={`${sectionCardCls} py-14 flex flex-col items-center gap-2 text-center`}>
                    <span className="material-symbols-outlined !text-[40px] text-outline">search</span>
                    <p className="font-medium text-on-surface">Nhập từ khóa để bắt đầu tìm kiếm</p>
                    <p className="text-sm text-on-surface-variant">Dùng ô tìm kiếm trên thanh điều hướng, tối thiểu {MIN_LENGTH} ký tự.</p>
                </div>
            </div>
        );
    }

    if (loading && !result) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                {header}
                <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="h-28 bg-surface-container rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                {header}
                <div className={`${sectionCardCls} py-14 flex flex-col items-center gap-3 text-center`}>
                    <span className="material-symbols-outlined !text-[40px] text-outline">cloud_off</span>
                    <p className="font-medium text-on-surface">Không tìm kiếm được</p>
                    <button onClick={() => setReloadKey((k) => k + 1)} className={btnSecondary}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const { houses, users } = result;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {header}

            <div className={`flex flex-col gap-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
                {houses.length === 0 && users.length === 0 && (
                    <div className={`${sectionCardCls} py-14 flex flex-col items-center gap-2 text-center`}>
                        <span className="material-symbols-outlined !text-[40px] text-outline">search_off</span>
                        <p className="font-medium text-on-surface">Không tìm thấy kết quả cho "{q}"</p>
                        <p className="text-sm text-on-surface-variant">Thử từ khóa ngắn hơn hoặc kiểm tra lại chính tả.</p>
                    </div>
                )}

                {houses.length > 0 && (
                    <section className={sectionCardCls}>
                        <SectionTitle icon="home_work" title="Nhà trọ" count={houses.length} />
                        <div className="grid sm:grid-cols-2 gap-3">
                            {houses.map((h) => (
                                <Link
                                    key={h.id}
                                    to={`/houses/${h.id}`}
                                    className="group flex gap-3 p-2.5 rounded-xl border border-outline-variant/50 hover:border-primary-container hover:shadow-sm transition-all"
                                >
                                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
                                        {h.thumbnail ? (
                                            <img
                                                src={h.thumbnail}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-outline">image</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex flex-col justify-center gap-0.5">
                                        <p className="font-semibold text-sm text-on-surface line-clamp-1">{h.name}</p>
                                        <p className="text-xs text-on-surface-variant line-clamp-1">{h.location}</p>
                                        <p className="text-xs text-on-surface-variant tabular-nums">
                                            {h.roomCount} phòng · {h.availableRoomCount} còn trống
                                        </p>
                                        {h.minPrice !== null && (
                                            <p className="text-sm font-bold text-primary-container tabular-nums">
                                                Từ {formatPrice(h.minPrice)} đ
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {users.length > 0 && (
                    <section className={sectionCardCls}>
                        <SectionTitle icon="group" title="Người dùng" count={users.length} />
                        <ul className="divide-y divide-outline-variant/40">
                            {users.map((u) => (
                                <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <UserAvatarLink userId={u.id} name={u.name} size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <UserNameLink userId={u.id} className="block font-semibold text-on-surface truncate">
                                            {u.name}
                                        </UserNameLink>
                                        <Badge tone={roleTone[u.role] ?? "neutral"}>{roleLabel[u.role]}</Badge>
                                    </div>
                                    <Link to={`/users/${u.id}`} className={`${btnSmSecondary} shrink-0`}>
                                        Xem hồ sơ
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {!isAuthenticated && (
                    <div className="bg-surface-container-low rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-on-surface-variant">
                        <span>Khách chỉ tìm được chủ trọ. Đăng nhập để tìm cả những người dùng khác.</span>
                        <button onClick={goLogin} className={`${btnSmSecondary} self-start sm:self-auto shrink-0`}>
                            Đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchApi } from "../api/searchApi";
import Badge from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";
import Highlight from "../components/ui/Highlight";
import PageHeader from "../components/ui/PageHeader";
import { UserAvatarLink, UserNameLink } from "../components/ui/UserLink";
import { btnSecondary, btnSmSecondary, sectionCardCls } from "../components/ui/styles";
import { useAuthStore } from "../store/authStore";
import { useLoginRedirect } from "../hooks/useAuthRedirect";
import { roleLabel } from "../utils/format";
import { timeAgo } from "../utils/time";
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
            note={q.length >= MIN_LENGTH ? "Bài viết và người dùng" : undefined}
            title={q.length >= MIN_LENGTH ? `Kết quả cho "${q}"` : "Tìm kiếm"}
            description="Tìm bài viết trên diễn đàn (theo tiêu đề, nội dung) và người dùng (theo tên)."
        />
    );

    if (q.length < MIN_LENGTH) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                {header}
                <div className={`${sectionCardCls} py-14 flex flex-col items-center gap-2 text-center`}>
                    <span className="material-symbols-outlined !text-[40px] text-outline">search</span>
                    <p className="font-medium text-on-surface">Nhập từ khóa để bắt đầu tìm kiếm</p>
                    <p className="text-sm text-on-surface-variant">
                        Dùng ô tìm kiếm trên thanh điều hướng, tối thiểu {MIN_LENGTH} ký tự.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && !result) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                {header}
                <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="h-24 bg-surface-container rounded-xl" />
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

    const { posts, users } = result;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {header}

            <div className={`flex flex-col gap-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
                {posts.length === 0 && users.length === 0 && (
                    <div className={`${sectionCardCls} py-14 flex flex-col items-center gap-2 text-center`}>
                        <span className="material-symbols-outlined !text-[40px] text-outline">search_off</span>
                        <p className="font-medium text-on-surface">Không tìm thấy kết quả cho "{q}"</p>
                        <p className="text-sm text-on-surface-variant">Thử từ khóa ngắn hơn hoặc kiểm tra lại chính tả.</p>
                    </div>
                )}

                {posts.length > 0 && (
                    <section className={sectionCardCls}>
                        <SectionTitle icon="forum" title="Bài viết" count={posts.length} />
                        <ul className="flex flex-col gap-3">
                            {posts.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        to={`/forum/${p.id}`}
                                        className="block p-4 rounded-xl border border-outline-variant/50 hover:border-primary-container hover:shadow-sm transition-all"
                                    >
                                        <h3 className="font-semibold text-on-surface break-words">
                                            <Highlight text={p.title} query={q} />
                                        </h3>
                                        {p.snippet && (
                                            <p className="text-sm text-on-surface-variant line-clamp-2 mt-1 break-words">
                                                <Highlight text={p.snippet} query={q} />
                                            </p>
                                        )}
                                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-on-surface-variant">
                                            <span>{p.authorName}</span>
                                            <span>{timeAgo(p.createdAt)}</span>
                                            <span className="inline-flex items-center gap-1 tabular-nums">
                                                <span className="material-symbols-outlined !text-[14px]">favorite</span>
                                                {p.likeCount}
                                            </span>
                                            <span className="inline-flex items-center gap-1 tabular-nums">
                                                <span className="material-symbols-outlined !text-[14px]">chat_bubble</span>
                                                {p.commentCount}
                                            </span>
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
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
                                            <Highlight text={u.name} query={q} />
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
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { searchApi } from "../api/searchApi";
import Avatar from "./ui/Avatar";
import { roleLabel } from "../utils/format";
import type { SearchResult } from "../types/search";

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

interface Props {
    autoFocus?: boolean;
    onNavigate?: () => void;
}

const rowCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 transition-colors ${active ? "bg-primary-fixed/50" : "hover:bg-surface-container-low"
    }`;
const headingCls =
    "px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant";
const noteCls = "px-4 py-6 text-center text-sm text-on-surface-variant";

export default function SearchBox({ autoFocus = false, onNavigate }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const listId = useId();
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [active, setActive] = useState(-1);
    const [retryKey, setRetryKey] = useState(0);

    // Ở trang kết quả: hiện từ khóa đang tìm. Sang trang khác: xóa ô tìm kiếm.
    useEffect(() => {
        const q =
            location.pathname === "/search" ? new URLSearchParams(location.search).get("q") ?? "" : "";
        setQuery(q);
        setDebounced(q.trim());
        setOpen(false);
        setActive(-1);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
        return () => window.clearTimeout(t);
    }, [query]);

    useEffect(() => {
        if (!open || debounced.length < MIN_LENGTH) {
            setResult(null);
            setLoading(false);
            setError(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(false);
        searchApi
            .search(debounced, 5)
            .then((r) => {
                if (cancelled) return;
                setResult(r);
                setActive(-1);
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
    }, [debounced, open, retryKey]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const items = useMemo(() => {
        if (!result) return [];
        return [
            ...result.houses.map((h) => ({ key: `h-${h.id}`, to: `/houses/${h.id}` })),
            ...result.users.map((u) => ({ key: `u-${u.id}`, to: `/users/${u.id}` })),
        ];
    }, [result]);

    const trimmed = query.trim();
    const tooShort = trimmed.length < MIN_LENGTH;
    const busy = loading || trimmed !== debounced;
    const hasItems = items.length > 0;
    const showPanel = open && trimmed.length > 0;
    const activeId = active >= 0 && items[active] ? `${listId}-${items[active].key}` : undefined;
    const allHref = `/search?q=${encodeURIComponent(trimmed)}`;

    const finish = () => {
        setOpen(false);
        setActive(-1);
        inputRef.current?.blur();
        onNavigate?.();
    };

    const goTo = (to: string) => {
        navigate(to);
        finish();
    };

    const goAll = () => {
        if (tooShort) return;
        navigate(allHref);
        finish();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            if (items.length) setActive((i) => (i + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (items.length) setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
        } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            // isComposing: đang gõ dở dấu tiếng Việt (Telex/VNI) thì Enter chưa phải lệnh tìm
            e.preventDefault();
            if (open && active >= 0 && items[active]) goTo(items[active].to);
            else goAll();
        }
    };

    const houseCount = result?.houses.length ?? 0;

    return (
        <div ref={wrapRef} className="relative w-full">
            <span className="material-symbols-outlined !text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                search
            </span>
            <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={showPanel}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                aria-label="Tìm nhà trọ hoặc người dùng"
                autoComplete="off"
                enterKeyHint="search"
                maxLength={50}
                autoFocus={autoFocus}
                placeholder="Tìm nhà trọ, người dùng..."
                className="w-full h-10 pl-9 pr-9 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
            />
            {query && (
                <button
                    type="button"
                    aria-label="Xóa từ khóa"
                    onClick={() => {
                        setQuery("");
                        inputRef.current?.focus();
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                    <span className="material-symbols-outlined !text-[16px]">close</span>
                </button>
            )}

            {showPanel && (
                <div
                    id={listId}
                    className="absolute left-0 top-full mt-2 w-full xl:min-w-[22rem] max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-10"
                >
                    {tooShort ? (
                        <p className={noteCls}>Nhập ít nhất {MIN_LENGTH} ký tự để tìm kiếm</p>
                    ) : error ? (
                        <div className={noteCls}>
                            Không tìm kiếm được.{" "}
                            <button
                                type="button"
                                onClick={() => setRetryKey((k) => k + 1)}
                                className="font-semibold text-primary-container hover:underline"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : result && hasItems ? (
                        <div className={busy ? "opacity-60 transition-opacity" : ""}>
                            <ul role="listbox" aria-label="Kết quả tìm kiếm" className="max-h-[24rem] overflow-y-auto py-1">
                                {result.houses.length > 0 && (
                                    <li role="presentation" className={headingCls}>
                                        Nhà trọ
                                    </li>
                                )}
                                {result.houses.map((h, i) => (
                                    <li key={h.id} role="option" id={`${listId}-h-${h.id}`} aria-selected={active === i}>
                                        <Link
                                            to={`/houses/${h.id}`}
                                            onClick={finish}
                                            onMouseEnter={() => setActive(i)}
                                            className={rowCls(active === i)}
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                                                {h.thumbnail ? (
                                                    <img src={h.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined !text-[20px] text-outline">home_work</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-on-surface truncate">{h.name}</p>
                                                <p className="text-xs text-on-surface-variant truncate">
                                                    {h.location} · {h.roomCount} phòng
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}

                                {result.users.length > 0 && (
                                    <li role="presentation" className={headingCls}>
                                        Người dùng
                                    </li>
                                )}
                                {result.users.map((u, j) => {
                                    const idx = houseCount + j;
                                    return (
                                        <li key={u.id} role="option" id={`${listId}-u-${u.id}`} aria-selected={active === idx}>
                                            <Link
                                                to={`/users/${u.id}`}
                                                onClick={finish}
                                                onMouseEnter={() => setActive(idx)}
                                                className={rowCls(active === idx)}
                                            >
                                                <Avatar name={u.name} size="md" tone="muted" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-on-surface truncate">{u.name}</p>
                                                    <p className="text-xs text-on-surface-variant">{roleLabel[u.role]}</p>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>

                            <Link
                                to={allHref}
                                onClick={finish}
                                className="flex items-center justify-between px-3 py-2.5 border-t border-outline-variant/50 text-sm font-medium text-primary-container hover:bg-surface-container-low"
                            >
                                <span className="truncate">Xem tất cả kết quả cho "{trimmed}"</span>
                                <span className="material-symbols-outlined !text-[18px] shrink-0">arrow_forward</span>
                            </Link>
                        </div>
                    ) : busy ? (
                        <p className={noteCls}>Đang tìm...</p>
                    ) : (
                        <p className={noteCls}>Không tìm thấy kết quả cho "{trimmed}"</p>
                    )}
                </div>
            )}
        </div>
    );
}
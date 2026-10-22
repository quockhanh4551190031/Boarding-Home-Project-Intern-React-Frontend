import { useCallback, useEffect, useState } from "react";

export function useCountdown() {
    const [until, setUntil] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (until <= Date.now()) return;
        setNow(Date.now());
        const timer = window.setInterval(() => {
            const current = Date.now();
            setNow(current);
            if (current >= until) window.clearInterval(timer);
        }, 250);
        return () => window.clearInterval(timer);
    }, [until]);

    const start = useCallback((seconds: number) => setUntil(Date.now() + seconds * 1000), []);
    const remaining = Math.max(0, Math.ceil((until - now) / 1000));

    return { remaining, start };
}
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";

interface AvatarLinkProps {
    userId: number;
    name: string;
    size?: "sm" | "md" | "lg" | "xl";
    tone?: "primary" | "muted";
}

export function UserAvatarLink({ userId, name, size = "md", tone = "primary" }: AvatarLinkProps) {
    return (
        <Link
            to={`/users/${userId}`}
            aria-label={`Xem hồ sơ của ${name}`}
            className="shrink-0 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
            <Avatar name={name} size={size} tone={tone} />
        </Link>
    );
}

interface NameLinkProps {
    userId: number;
    className?: string;
    children: ReactNode;
}

export function UserNameLink({ userId, className = "", children }: NameLinkProps) {
    return (
        <Link
            to={`/users/${userId}`}
            className={`hover:text-primary-container hover:underline transition-colors ${className}`}
        >
            {children}
        </Link>
    );
}
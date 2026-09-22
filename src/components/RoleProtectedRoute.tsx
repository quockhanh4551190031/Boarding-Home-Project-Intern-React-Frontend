import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type {Role} from "../types/auth";

interface Props {
    allowedRoles: Role[];
}

export default function RoleProtectedRoute({ allowedRoles }: Props) {
    const { isAuthenticated, role } = useAuthStore();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!role || !allowedRoles.includes(role)) return <Navigate to="/" replace />;

    return <Outlet />;
}
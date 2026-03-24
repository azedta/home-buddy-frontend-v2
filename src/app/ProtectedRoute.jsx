import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/authStore.js";

export default function ProtectedRoute() {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/authStore";

export default function ProtectedRoute() {
    const user = useAuthStore((s) => s.user);
    const location = useLocation();

    // logged in ✅
    if (user) return <Outlet />;

    // not logged in ❌
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

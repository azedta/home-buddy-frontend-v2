import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../features/authStore.js";

function extractJwt(raw) {
    if (!raw) return null;
    const s = String(raw).trim();

    if (s.split(".").length === 3) return s;

    const m1 = s.match(/Bearer\s+(.+)/i);
    if (m1?.[1]) return m1[1].trim();

    const m2 = s.match(/(?:^|;\s*)jwtToken=([^;]+)/i);
    if (m2?.[1]) return m2[1].trim();

    return null;
}

export default function ProtectedRoute() {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);

    const token =
        extractJwt(user?.token) ||
        extractJwt(user?.rawJwtToken) ||
        null;

    if (!user || !token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
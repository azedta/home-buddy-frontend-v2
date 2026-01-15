import { useAuthStore } from "../../features/authStore.js";
import DosesSchedulesAdminPage from "../dose/DosesSchedulesAdminPage.jsx";
import DosesSchedulesUserPage from "../dose/DosesSchedulesUserPage.jsx";

export default function DosesSchedulesPage() {
    const user = useAuthStore((s) => s.user);
    const roles = user?.roles || [];

    const isAdminLike = roles.some((r) => {
        const rr = String(r).toUpperCase();
        return rr.includes("ADMIN") || rr.includes("CAREGIVER");
    });

    return isAdminLike ? <DosesSchedulesAdminPage /> : <DosesSchedulesUserPage />;
}

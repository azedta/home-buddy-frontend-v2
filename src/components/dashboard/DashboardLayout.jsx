import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function DashboardLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const pageMeta = useMemo(() => {
        const p = location.pathname;
        if (p.includes("/medication")) return { title: "Medication", subtitle: "Schedules, dispensing, adherence" };
        if (p.includes("/notifications")) return { title: "Notifications", subtitle: "Reminders & delivery preferences" };
        if (p.includes("/analytics")) return { title: "Analytics", subtitle: "Insights, trends, daily activity" };
        if (p.includes("/settings")) return { title: "Settings", subtitle: "Profile, preferences and access" };
        return { title: "Robot", subtitle: "Live status, control and monitoring" };
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* subtle SaaS background */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(59,130,246,0.14)_0%,transparent_40%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.10)_0%,transparent_45%)]" />
                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:80px_80px]" />
            </div>

            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            <div className="lg:pl-[288px]">
                <Topbar pageMeta={pageMeta} onOpenSidebar={() => setMobileOpen(true)} />

                <main className="px-4 pb-10 pt-4 sm:px-6 lg:px-10">
                    <div className="mx-auto max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

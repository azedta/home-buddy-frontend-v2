import { NavLink } from "react-router-dom";
import {
    X,
    Bot,
    Pill,
    Bell,
    Settings2,
    CalendarClock,
} from "lucide-react";
import { useAuthStore } from "../../features/authStore.js";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const user = useAuthStore((s) => s.user);
    const roles = user?.roles || [];

    const isAdminLike = roles.some((r) => {
        const rr = String(r).toUpperCase();
        return rr.includes("ADMIN") || rr.includes("CAREGIVER");
    });

    const nav = [
        { to: "/dashboard/robot", label: "Robot", icon: Bot, accent: "text-blue-600" },

        // ✅ only caregiver/admin
        ...(isAdminLike
            ? [
                { to: "/dashboard/medication", label: "Medication", icon: Pill, accent: "text-amber-600" }
            ]
            : []),

        { to: "/dashboard/doses", label: "Doses & Schedules", icon: CalendarClock, accent: "text-emerald-600",},
        { to: "/dashboard/notifications", label: "Notifications", icon: Bell, accent: "text-violet-600" },
        { to: "/dashboard/settings", label: "Settings", icon: Settings2, accent: "text-slate-600" },
    ];

    return (
        <>
            {/* Desktop */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[288px]">
                <div className="flex w-full flex-col border-r border-slate-200 bg-white/80 backdrop-blur">
                    <BrandHeader />
                    <Nav items={nav} />
                    <FooterHint />
                </div>
            </aside>

            {/* Mobile */}
            <div className={`lg:hidden ${mobileOpen ? "block" : "hidden"}`}>
                <div
                    className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
                <aside className="fixed inset-y-0 left-0 z-50 w-[288px] border-r border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4">
                        <BrandMini />
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                            aria-label="Close sidebar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-3 pb-4">
                        <Nav items={nav} onNavigate={() => setMobileOpen(false)} />
                    </div>

                    <FooterHint />
                </aside>
            </div>
        </>
    );
}

function Nav({ items, onNavigate }) {
    return (
        <nav className="px-3 pb-4">
            <p className="px-3 pt-2 text-[11px] font-bold tracking-widest text-slate-500">
                DASHBOARD
            </p>

            <div className="mt-3 space-y-1">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            [
                                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                                isActive
                                    ? "bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 text-slate-900 ring-1 ring-slate-200"
                                    : "text-slate-700 hover:bg-slate-100",
                            ].join(" ")
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={[
                                        "h-5 w-5 transition",
                                        isActive ? item.accent : "text-slate-500 group-hover:text-slate-700",
                                    ].join(" ")}
                                />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

function BrandHeader() {
    return (
        <div className="px-5 py-6">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/15 blur-lg" />
                    <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white">
                        <img
                            src="/robot.png"
                            alt="HomeBuddy"
                            className="h-9 w-9 drop-shadow-[0_10px_18px_rgba(59,130,246,0.18)]"
                        />
                    </div>
                </div>

                <div>
                    <p className="text-lg font-semibold tracking-tight text-slate-900">
                        Home
                        <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
              Buddy
            </span>
                    </p>
                    <p className="text-xs font-medium text-slate-500">Assistant Console</p>
                </div>
            </div>
        </div>
    );
}

function BrandMini() {
    return (
        <p className="text-lg font-semibold tracking-tight text-slate-900">
            Home
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
        Buddy
      </span>
        </p>
    );
}

function FooterHint() {
    return (
        <div className="mt-auto border-t border-slate-200 px-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Quick tip</p>
                <p className="mt-1 text-xs text-slate-600">
                    Start on Robot for live status, then set schedules in Medication.
                </p>
            </div>
        </div>
    );
}

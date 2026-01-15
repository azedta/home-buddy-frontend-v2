import { Bell, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function NotificationOverviewCard() {
    // Backend not wired yet — this is a polished placeholder that feels real.
    const demo = [
        { id: 1, title: "Dose reminder", detail: "Amoxicillin — scheduled for 08:00", time: "5 min ago", severity: "INFO" },
        { id: 2, title: "Dispenser status", detail: "Compartment day 23 is low", time: "2 hours ago", severity: "WARN" },
    ];

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">NOTIFICATIONS</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Medication overview</h3>
                    <p className="mt-1 text-sm text-slate-600">Latest one or two medication-related messages.</p>
                </div>

                <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-indigo-50 grid place-items-center">
                    <Bell className="h-5 w-5 text-violet-700" />
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {demo.map((n) => (
                    <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                                <p className="mt-1 text-sm text-slate-600">{n.detail}</p>
                                <p className="mt-2 text-xs font-semibold text-slate-500">{n.time}</p>
                            </div>

                            <span
                                className={[
                                    "shrink-0 rounded-2xl border px-2.5 py-1 text-[11px] font-bold",
                                    n.severity === "WARN"
                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                        : "border-slate-200 bg-slate-50 text-slate-700",
                                ].join(" ")}
                            >
                {n.severity}
              </span>
                        </div>
                    </div>
                ))}
            </div>

            <NavLink
                to="/dashboard/notifications"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
                Go to Notifications
                <ChevronRight className="h-4 w-4" />
            </NavLink>
        </div>
    );
}

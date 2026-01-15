import { Link } from "react-router-dom";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

function fmtTime(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return String(iso);
    }
}

function severityMeta(sev) {
    const s = String(sev || "").toUpperCase();
    if (s === "WARN" || s === "WARNING")
        return { icon: AlertTriangle, pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
    if (s === "CRITICAL" || s === "ERROR")
        return { icon: ShieldAlert, pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
    return { icon: Info, pill: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
}

export default function RecentActivityCard({ activities, loading, robotId }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">RECENT ACTIVITY</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Last 10 events</h3>
                    <p className="mt-1 text-sm text-slate-600">See the most recent actions and movements of your robot as they happen.</p>
                </div>

                <Link
                    to={robotId ? `/dashboard/robot/activity?robotId=${encodeURIComponent(robotId)}` : "/dashboard/robot/activity"}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:brightness-110"
                >
                    View all
                </Link>
            </div>

            <div className="mt-6 space-y-2">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                    ))
                ) : activities?.length ? (
                    activities.map((a) => {
                        const meta = severityMeta(a?.severity);
                        const Icon = meta.icon;

                        return (
                            <div
                                key={a?.id}
                                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${meta.pill}`}>
                      <Icon className="h-4 w-4" />
                        {String(a?.severity || "INFO")}
                    </span>

                                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {String(a?.activityType || "—")}
                    </span>
                                    </div>

                                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                                        {a?.activityDescription || "—"}
                                    </p>
                                </div>

                                <div className="shrink-0 text-xs font-semibold text-slate-500">{fmtTime(a?.activityTime)}</div>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">No activity yet.</div>
                )}
            </div>
        </div>
    );
}

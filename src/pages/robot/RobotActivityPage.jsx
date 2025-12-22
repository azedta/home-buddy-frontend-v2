// src/pages/RobotActivityPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getRobotActivities } from "../../features/robotApi.js";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

function fmtTime(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return String(iso);
    }
}

function severityMeta(sev) {
    const s = String(sev || "").toUpperCase();
    if (s === "WARN" || s === "WARNING") return { icon: AlertTriangle, pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
    if (s === "CRITICAL" || s === "ERROR") return { icon: ShieldAlert, pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
    return { icon: Info, pill: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
}

export default function RobotActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load() {
        try {
            setLoading(true);
            const a = await getRobotActivities(75);
            setActivities(Array.isArray(a) ? a : []);
            setErr("");
        } catch (e) {
            setErr(e?.message || "Failed to load activity");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        const t = setInterval(load, 8000);
        return () => clearInterval(t);
    }, []);

    const grouped = useMemo(() => {
        // Simple grouping by date label
        const map = new Map();
        for (const a of activities) {
            const d = a?.activityTime ? new Date(a.activityTime) : null;
            const key = d ? d.toLocaleDateString() : "Unknown date";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(a);
        }
        return Array.from(map.entries());
    }, [activities]);

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT</p>
                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Recent Activity</h2>
                        <p className="mt-2 text-slate-600">
                            Live feed of system, movement, battery and dispensing events.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/dashboard/robot"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Back to Robot
                        </Link>
                        <button
                            onClick={load}
                            className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {err ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {err}
                    </div>
                ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
                {loading ? (
                    <div className="p-6">
                        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        {grouped.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                                No activity yet.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {grouped.map(([date, items]) => (
                                    <div key={date}>
                                        <p className="text-xs font-bold tracking-widest text-slate-500">{date}</p>
                                        <div className="mt-3 space-y-2">
                                            {items.map((a) => {
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

                                                        <div className="shrink-0 text-xs font-semibold text-slate-500">
                                                            {fmtTime(a?.activityTime)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

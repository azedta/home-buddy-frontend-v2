import { useMemo } from "react";
import { CheckCircle2, Clock, RefreshCw, Wand2, XCircle } from "lucide-react";

function formatTime(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleString([], { weekday: "short", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
}

function statusPill(status) {
    const s = String(status || "").toUpperCase();
    if (s === "TAKEN") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (s === "MISSED") return "border-rose-200 bg-rose-50 text-rose-800";
    if (s === "SKIPPED") return "border-amber-200 bg-amber-50 text-amber-800";
    return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function ScheduleWindowCard({
                                               loading,
                                               from,
                                               to,
                                               setFrom,
                                               setTo,
                                               items,
                                               onRefresh,
                                               onGenerate,
                                               onMarkTaken,
                                               onSetStatus,
                                               canLoad,
                                           }) {
    const groups = useMemo(() => {
        const list = Array.isArray(items) ? items : [];
        const map = new Map();
        list.forEach((o) => {
            const day = String(o?.scheduledAt || "").slice(0, 10) || "unknown";
            if (!map.has(day)) map.set(day, []);
            map.get(day).push(o);
        });
        for (const [, v] of map.entries()) {
            v.sort((a, b) => String(a?.scheduledAt).localeCompare(String(b?.scheduledAt)));
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [items]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">SCHEDULE</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Upcoming dose occurrences</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        This is where “Taken / Missed” becomes real history. One click → updates Dose History later.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={!canLoad}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                    <button
                        onClick={onGenerate}
                        disabled={!canLoad}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-cyan-50 to-blue-50 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <Wand2 className="h-4 w-4" />
                        Generate schedule
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TimeBox label="From" value={from} onChange={(d) => setFrom(d)} />
                <TimeBox label="To" value={to} onChange={(d) => setTo(d)} />
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                {loading ? (
                    <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
                ) : !canLoad ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        Couldn’t detect your userId from auth store. Once your auth payload includes it, this becomes fully live.
                    </div>
                ) : groups.length ? (
                    <div className="space-y-5">
                        {groups.map(([day, list]) => (
                            <div key={day}>
                                <p className="text-[11px] font-bold tracking-widest text-slate-500">
                                    {day}
                                </p>

                                <div className="mt-3 space-y-3">
                                    {list.map((o) => {
                                        const st = String(o?.status || "").toUpperCase();
                                        return (
                                            <div key={o?.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-extrabold text-slate-900">
                                                            Scheduled: {formatTime(o?.scheduledAt)}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            Dose ID: <span className="font-semibold">{o?.doseId}</span>
                                                            {o?.takenAt ? (
                                                                <>
                                                                    {" "}• Taken: <span className="font-semibold">{formatTime(o?.takenAt)}</span>
                                                                </>
                                                            ) : null}
                                                        </p>
                                                        {!!o?.note && <p className="mt-2 text-sm text-slate-600">{o.note}</p>}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-2xl border px-3 py-2 text-xs font-bold ${statusPill(o?.status)}`}>
                              {st || "SCHEDULED"}
                            </span>

                                                        <button
                                                            onClick={() => onMarkTaken(o.id)}
                                                            disabled={st === "TAKEN"}
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Mark taken
                                                        </button>

                                                        <button
                                                            onClick={() => onSetStatus(o.id, "MISSED")}
                                                            disabled={st === "TAKEN" || st === "MISSED"}
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Missed
                                                        </button>

                                                        <button
                                                            onClick={() => onSetStatus(o.id, "SKIPPED")}
                                                            disabled={st === "TAKEN" || st === "SKIPPED"}
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                            Skipped
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        No occurrences in this window. Try <span className="font-semibold">Generate schedule</span>.
                    </div>
                )}
            </div>
        </div>
    );
}

function TimeBox({ label, value, onChange }) {
    // value is a Date
    const isoLocalInput = (() => {
        const d = value instanceof Date ? value : new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    })();

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
            <input
                type="datetime-local"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                value={isoLocalInput}
                onChange={(e) => {
                    const v = e.target.value;
                    const dt = new Date(v);
                    onChange(dt);
                }}
            />
        </div>
    );
}

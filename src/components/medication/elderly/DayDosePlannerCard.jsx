import { useMemo, useState } from "react";
import { CalendarDays, Pill, Sparkles } from "lucide-react";

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function fmtDay(d) {
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "2-digit" });
}

export default function DayDosePlannerCard({ doses, loading }) {
    const [selected, setSelected] = useState(() => startOfDay(new Date()));

    const days = useMemo(() => {
        const base = startOfDay(new Date());
        return Array.from({ length: 7 }, (_, i) => addDays(base, i));
    }, []);

    const scheduledToday = useMemo(() => {
        // Your Dose DTO includes: timeFrequency, daysOfWeek, times, startDate, endDate, instructions...
        // We’ll keep this “smart” but safe; as your enums stabilize, we can tighten the logic.
        const list = Array.isArray(doses) ? doses : [];
        const dayName = selected.toLocaleDateString([], { weekday: "long" }).toUpperCase();

        return list
            .filter((d) => {
                const start = d?.startDate ? new Date(d.startDate) : null;
                const end = d?.endDate ? new Date(d.endDate) : null;
                if (start && selected < startOfDay(start)) return false;
                if (end && selected > startOfDay(end)) return false;

                const dow = d?.daysOfWeek || [];
                if (Array.isArray(dow) && dow.length) {
                    return dow.map(String).map((x) => x.toUpperCase()).includes(dayName);
                }
                return true;
            })
            .map((d) => ({
                id: d?.id,
                medicationName: d?.medicationName || "Medication",
                times: Array.isArray(d?.times) ? d.times : [],
                qty: `${d?.quantityAmount ?? "—"} ${d?.quantityUnit ?? ""}`.trim(),
                instructions: d?.instructions || "",
                freq: d?.timeFrequency || "—",
            }));
    }, [doses, selected]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">TREATMENT DETAILS</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Your week at a glance</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Pick a day → see the planned doses (bonus calendar-style view).
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    <Sparkles className="h-4 w-4" />
                    Planner
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-7">
                {days.map((d) => {
                    const active = d.getTime() === selected.getTime();
                    return (
                        <button
                            key={d.toISOString()}
                            onClick={() => setSelected(startOfDay(d))}
                            className={[
                                "rounded-2xl border px-3 py-3 text-left transition",
                                active
                                    ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-cyan-50 to-blue-50 ring-2 ring-indigo-100"
                                    : "border-slate-200 bg-white hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <p className="text-[11px] font-bold tracking-widest text-slate-500">
                                {d.toLocaleDateString([], { weekday: "short" }).toUpperCase()}
                            </p>
                            <p className="mt-1 text-sm font-extrabold text-slate-900">{d.getDate()}</p>
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <CalendarDays className="h-4 w-4 text-slate-500" />
                        {fmtDay(selected)}
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Pill className="h-4 w-4" />
                        {loading ? "Loading…" : `${scheduledToday.length} scheduled`}
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    {loading ? (
                        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                    ) : scheduledToday.length ? (
                        scheduledToday.map((x) => (
                            <div key={x.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-extrabold text-slate-900">{x.medicationName}</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {x.qty} • {String(x.freq)}
                                        </p>
                                        {!!x.instructions && (
                                            <p className="mt-2 text-sm text-slate-600">{x.instructions}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                                        {x.times?.length ? x.times.join(", ") : "time —"}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            No doses detected for this day yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

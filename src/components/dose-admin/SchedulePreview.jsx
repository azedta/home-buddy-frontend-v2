import { useMemo } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { buildPreview } from "../../utils/schedulePreview.js";

const ALL_DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

function isEveryDay(daysOfWeek) {
    const arr = Array.isArray(daysOfWeek) ? daysOfWeek : [];
    if (arr.length === 0) return true;

    const set = new Set(arr);
    return ALL_DAYS.every((d) => set.has(d));
}

function Chip({ children, tone = "neutral" }) {
    const toneMap = {
        neutral: "border-slate-200 bg-white text-slate-700",
        sky: "border-sky-200 bg-sky-50 text-sky-900",
    };

    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                toneMap[tone] || toneMap.neutral,
            ].join(" ")}
        >
      {children}
    </span>
    );
}

export default function SchedulePreview({
                                            medicationName,
                                            daysOfWeek,
                                            times,
                                            startDate,
                                            endDate,
                                            quantityAmount,
                                            quantityUnit,
                                        }) {
    const everyDay = useMemo(() => isEveryDay(daysOfWeek), [daysOfWeek]);

    // ✅ Normalize for preview logic:
    // - empty => treat as ALL_DAYS
    // - all selected => treat as ALL_DAYS
    const normalizedDays = useMemo(() => {
        return everyDay ? ALL_DAYS : (Array.isArray(daysOfWeek) ? daysOfWeek : []);
    }, [everyDay, daysOfWeek]);

    const groups = useMemo(() => {
        return buildPreview({
            daysOfWeek: normalizedDays,
            times,
            startDate,
            endDate,
            quantityAmount,
            quantityUnit,
            lookaheadDays: 7,
        });
    }, [normalizedDays, times, startDate, endDate, quantityAmount, quantityUnit]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-widest text-slate-500">SMART PREVIEW</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">
                        Upcoming schedule (next 7 days)
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        Based on days + times + date range. No backend calls.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700">
                    <Sparkles className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock className="h-4 w-4" />
              {medicationName || "Medication not selected"}
          </span>

                    <span className="text-slate-400">•</span>
                    <Chip>{quantityAmount || "—"} {quantityUnit || ""}</Chip>

                    <span className="text-slate-400">•</span>
                    <Chip>
                        {startDate || "no start"} → {endDate || "no end"}
                    </Chip>

                    <span className="text-slate-400">•</span>
                    <Chip tone="sky">{everyDay ? "Every day" : "Selected days"}</Chip>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {groups.length ? (
                    groups.map((g) => (
                        <div key={g.dayKey} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                                <p className="text-sm font-extrabold text-slate-900">{g.dayLabel}</p>
                                <p className="text-xs text-slate-500">{g.items.length} dose(s)</p>
                            </div>

                            <div className="flex flex-wrap gap-2 px-4 py-4">
                                {g.items.map((it, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                                    >
                    <span className="font-extrabold">{it.time}</span>
                    <span className="text-slate-400">•</span>
                    <span>{it.label}</span>
                  </span>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                        No upcoming items based on your current selection.
                        <div className="mt-2 text-xs text-slate-500">
                            Tip: Add times, or adjust start/end dates.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

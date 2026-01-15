import { Pencil, Trash2, Hash, Clock, CalendarDays, Pill } from "lucide-react";

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function Chip({ children, tone = "slate", className = "" }) {
    const tones = {
        slate: "border-slate-200 bg-white text-slate-700",
        indigo: "border-indigo-200 bg-indigo-50/60 text-indigo-700",
        emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
        amber: "border-amber-200 bg-amber-50/60 text-amber-700",
        rose: "border-rose-200 bg-rose-50/60 text-rose-700",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                tones[tone] ?? tones.slate,
                className
            )}
        >
      {children}
    </span>
    );
}

/** --- Pretty formatting helpers (no more LocalTime / enum-y noise) --- */
const dayShort = {
    MONDAY: "Mon",
    TUESDAY: "Tue",
    WEDNESDAY: "Wed",
    THURSDAY: "Thu",
    FRIDAY: "Fri",
    SATURDAY: "Sat",
    SUNDAY: "Sun",
};

function formatTime12h(t) {
    // supports "08:00", "08:00:00", "8:00", etc.
    if (!t || typeof t !== "string") return "—";
    const parts = t.split(":").map((x) => Number(x));
    if (!Number.isFinite(parts[0])) return t;

    let h = parts[0];
    const m = Number.isFinite(parts[1]) ? parts[1] : 0;

    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;

    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function normalizeEnumLabel(s) {
    // "TWICE_A_DAY" -> "Twice a day"
    if (!s) return "—";
    const str = String(s);
    return str
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFrequency(tf) {
    // If your backend sends numeric per-day (like 2), show "2× / day"
    // If it sends enum-ish, make it pretty.
    const n = Number(tf);
    if (Number.isFinite(n) && tf !== "" && tf !== null && tf !== undefined) {
        return `${n}× / day`;
    }
    const pretty = normalizeEnumLabel(tf);
    // small cleanup: "Once A Day" -> "Once / day"
    return pretty.replace(/\bA Day\b/i, "/ day");
}

function summarizeDays(days) {
    if (!days || !Array.isArray(days) || days.length === 0) return { label: "—", tone: "slate", list: [] };

    const set = new Set(days);
    const all = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
    const weekdays = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
    const weekends = ["SATURDAY","SUNDAY"];

    const isAll = all.every((d) => set.has(d));
    const isWeekdays = weekdays.every((d) => set.has(d)) && !weekends.some((d) => set.has(d));
    const isWeekends = weekends.every((d) => set.has(d)) && !weekdays.some((d) => set.has(d));

    if (isAll) return { label: "Daily", tone: "emerald", list: all.map((d) => dayShort[d]) };
    if (isWeekdays) return { label: "Weekdays", tone: "indigo", list: weekdays.map((d) => dayShort[d]) };
    if (isWeekends) return { label: "Weekends", tone: "amber", list: weekends.map((d) => dayShort[d]) };

    const ordered = all.filter((d) => set.has(d));
    const compact = ordered.map((d) => dayShort[d]);

    return { label: compact.join(", "), tone: "slate", list: compact };
}

function formatDose(amount, unit) {
    const a = amount ?? "—";
    const u = unit ? String(unit).toLowerCase() : "";
    // you can customize unit formatting here (mg, ml, tab(s), etc.)
    return u ? `${a} ${u}` : `${a}`;
}

export default function DosesTable({ rows = [], onDelete, onEdit }) {
    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-widest text-slate-500">DOSES</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {rows.length} item{rows.length === 1 ? "" : "s"}
                    </p>
                </div>
            </div>

            {/* table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs font-bold uppercase tracking-wider text-slate-500 backdrop-blur">
                    <tr>
                        <th className="px-5 py-3">
                            <div className="inline-flex items-center gap-2">
                                <Hash className="h-4 w-4" /> ID
                            </div>
                        </th>
                        <th className="px-5 py-3">Medication</th>
                        <th className="px-5 py-3">
                            <div className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" /> Schedule
                            </div>
                        </th>
                        <th className="px-5 py-3">
                            <div className="inline-flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Times
                            </div>
                        </th>
                        <th className="px-5 py-3">
                            <div className="inline-flex items-center gap-2">
                                <Pill className="h-4 w-4" /> Dose
                            </div>
                        </th>
                        <th className="px-5 py-3 text-right" />
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                    {rows.length ? (
                        rows.map((d, idx) => {
                            const days = summarizeDays(Array.from(d.daysOfWeek || []));
                            const times = Array.from(d.times || []).map(formatTime12h);
                            const freq = formatFrequency(d.timeFrequency);
                            const dose = formatDose(d.quantityAmount, d.quantityUnit);

                            return (
                                <tr
                                    key={d.id}
                                    className={cn(
                                        "transition-colors hover:bg-slate-50/70",
                                        idx % 2 === 1 ? "bg-white" : "bg-slate-50/30"
                                    )}
                                >
                                    {/* ID */}
                                    <td className="px-5 py-4 font-semibold text-slate-900">
                                        {d.id}
                                    </td>

                                    {/* Medication */}
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-slate-950">{d.medicationName ?? "—"}</div>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                        </div>
                                    </td>

                                    {/* Schedule (freq + days) */}
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Chip tone="indigo">{freq}</Chip>
                                            <Chip tone={days.tone}>
                                                {days.label}
                                            </Chip>
                                        </div>

                                        {/* optional: show full days list when not compact labels */}

                                    </td>

                                    {/* Times */}
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {times.length ? (
                                                times.map((t) => (
                                                    <Chip key={t} tone="emerald">
                                                        {t}
                                                    </Chip>
                                                ))
                                            ) : (
                                                <span className="text-slate-500">—</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Dose */}
                                    <td className="px-5 py-4">
                                        <div className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                            <span>{dose}</span>
                                        </div>

                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                onClick={() => onEdit?.(d)}
                                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => onDelete?.(d.id)}
                                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td className="px-5 py-12 text-center" colSpan={6}>
                                <div className="mx-auto max-w-md">
                                    <p className="text-sm font-semibold text-slate-800">No doses loaded yet</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Enter a User ID and hit <span className="font-semibold">Refresh</span>.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* footer note */}
            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
                To create a dose, first select a medication from the <span className="font-semibold">Medication</span> module.
            </div>

        </div>
    );
}

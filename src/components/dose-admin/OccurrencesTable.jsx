import { useMemo, useState } from "react";
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    RotateCcw,
    CalendarDays,
    MessageSquareText,
} from "lucide-react";
import Modal from "../general/Modal.jsx";
import Input from "../general/Input.jsx";

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

/** Your backend returns LocalDateTime -> JSON string like "2025-12-30T09:10:36" */
function parseMaybeDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatDayHeader(d) {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const day = startOfDay(d);

    if (isSameDay(day, today)) return "Today";
    if (isSameDay(day, tomorrow)) return "Tomorrow";

    return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "short",
        day: "2-digit",
    }).format(d);
}

function formatDateTime(v) {
    const d = parseMaybeDate(v);
    if (!d) return v ? String(v) : "—";
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
}

function formatTimeOnly(v) {
    const d = parseMaybeDate(v);
    if (!d) return v ? String(v) : "—";
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
}

function prettyStatus(s) {
    if (!s) return "Scheduled";
    return String(s)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_META = {
    SCHEDULED: {
        icon: Clock,
        pill: "border-slate-200 bg-white text-slate-700",
        rail: "bg-slate-300",
        dot: "bg-slate-400",
    },
    DUE: {
        icon: AlertTriangle,
        pill: "border-amber-200 bg-amber-50/70 text-amber-800",
        rail: "bg-amber-400",
        dot: "bg-amber-500",
    },
    MISSED: {
        icon: AlertTriangle,
        pill: "border-rose-200 bg-rose-50/70 text-rose-700",
        rail: "bg-rose-400",
        dot: "bg-rose-500",
    },
    TAKEN: {
        icon: CheckCircle2,
        pill: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
        rail: "bg-emerald-400",
        dot: "bg-emerald-500",
    },
};

function StatusPill({ status }) {
    const meta = STATUS_META[status] || STATUS_META.SCHEDULED;
    const Icon = meta.icon;

    return (
        <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", meta.pill)}>
      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
      <Icon className="h-4 w-4" />
            {prettyStatus(status)}
    </span>
    );
}

function SmallChip({ icon: Icon, children }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
            {children}
    </span>
    );
}

function formatRelativeTime(value) {
    const d = parseMaybeDate(value);
    if (!d) return null;

    const diffMs = d.getTime() - Date.now(); // future = positive
    const abs = Math.abs(diffMs);

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (abs < hour) {
        const mins = Math.round(diffMs / minute);
        return rtf.format(mins, "minute");
    }
    if (abs < day) {
        const hrs = Math.round(diffMs / hour);
        return rtf.format(hrs, "hour");
    }
    const days = Math.round(diffMs / day);
    return rtf.format(days, "day");
}


export default function OccurrencesTable({ rows = [], onSetStatus }) {
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState({ id: null, status: "SCHEDULED", note: "" });

    const grouped = useMemo(() => {
        const arr = Array.isArray(rows) ? [...rows] : [];

        arr.sort((a, b) => {
            const da = parseMaybeDate(a?.scheduledAt);
            const db = parseMaybeDate(b?.scheduledAt);
            const ta = da ? da.getTime() : String(a?.scheduledAt ?? "");
            const tb = db ? db.getTime() : String(b?.scheduledAt ?? "");
            return ta > tb ? 1 : ta < tb ? -1 : 0;
        });

        const groups = [];
        const map = new Map();

        for (const o of arr) {
            const d = parseMaybeDate(o?.scheduledAt);
            const key = d ? startOfDay(d).toISOString().slice(0, 10) : "unknown";
            if (!map.has(key)) {
                const header = d ? formatDayHeader(d) : "Unscheduled";
                const group = { key, header, date: d, items: [] };
                map.set(key, group);
                groups.push(group);
            }
            map.get(key).items.push(o);
        }

        return groups;
    }, [rows]);

    const total = useMemo(() => (Array.isArray(rows) ? rows.length : 0), [rows]);

    return (
        <>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {/* header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-xs font-bold tracking-widest text-slate-500">OCCURRENCES</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {total} item{total === 1 ? "" : "s"}
                        </p>
                    </div>

                    {/* legend */}
                    <div className="flex flex-wrap items-center gap-2">
                        <SmallChip icon={Clock}>Scheduled</SmallChip>
                        <SmallChip icon={AlertTriangle}>Due / Missed</SmallChip>
                        <SmallChip icon={CheckCircle2}>Taken</SmallChip>
                    </div>
                </div>

                {/* grouped table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs font-bold uppercase tracking-wider text-slate-500 backdrop-blur">
                        <tr>
                            <th className="px-5 py-3">Scheduled</th>
                            <th className="px-5 py-3">Dose</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Taken</th>
                            <th className="px-5 py-3">Note</th>
                            <th className="px-5 py-3 text-right" />
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">

                        {grouped.length ? (
                            grouped.map((g) => (
                                <FragmentGroup
                                    key={g.key}
                                    group={g}
                                    onEdit={(o) => {
                                        setEdit({ id: o.id, status: o.status || "SCHEDULED", note: o.note || "" });
                                        setOpen(true);
                                    }}
                                />
                            ))
                        ) : (
                            <tr>
                                <td className="px-5 py-12 text-center" colSpan={6}>
                                    <div className="mx-auto max-w-md">
                                        <p className="text-sm font-semibold text-slate-800">No occurrences in this window</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Generate a window to populate schedule items.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
                    Supported statuses: <span className="font-semibold">Scheduled, Due, Missed, Taken</span>.
                </div>
            </div>

            {/* modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={`Update Occurrence #${edit.id ?? ""}`}
                widthClass="max-w-2xl"
                backdropClass="bg-slate-900/40"
                rootClass="fixed inset-4 z-[80] overflow-hidden rounded-3xl"
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-800">Status</label>
                            <select
                                value={edit.status}
                                onChange={(e) => setEdit((p) => ({ ...p, status: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="MISSED">Missed</option>
                                <option value="TAKEN">Taken</option>
                            </select>
                        </div>

                        <Input
                            label="Note (optional)"
                            name="note"
                            value={edit.note}
                            onChange={(e) => setEdit((p) => ({ ...p, note: e.target.value }))}
                            placeholder="e.g. Patient asleep, delayed"
                        />
                    </div>

                    <button
                        onClick={async () => {
                            if (!edit.id) return;
                            await onSetStatus?.({ id: edit.id, status: edit.status, note: edit.note });
                            setOpen(false);
                        }}
                        className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-sm hover:brightness-105"
                    >
                        Save
                    </button>
                </div>
            </Modal>
        </>
    );
}

/** extracted group renderer to keep main component clean */
function FragmentGroup({ group, onEdit }) {
    const { header, items } = group;

    return (
        <>
            {/* group header row */}
            <tr className="bg-slate-50/70">
                <td colSpan={6} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                                <CalendarDays className="h-4 w-4" />
                            </span>
                            <div>
                                <div className="text-sm font-extrabold text-slate-900">{header}</div>
                                <div className="text-xs text-slate-500">
                                    {items.length} occurrence{items.length === 1 ? "" : "s"}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>

            {items.map((o, idx) => {
                const meta = STATUS_META[o.status] || STATUS_META.SCHEDULED;
                const rel = formatRelativeTime(o.scheduledAt); // ✅ FIX: scoped correctly

                return (
                    <tr
                        key={o.id}
                        className={cn(
                            "relative transition-colors hover:bg-slate-50/70",
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        )}
                    >
                        {/* scheduled */}
                        <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                                <div className={cn("mt-1 h-10 w-1.5 rounded-full", meta.rail)} />
                                <div>
                                    <div className="font-semibold text-slate-950">
                                        {formatDateTime(o.scheduledAt)}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {formatTimeOnly(o.scheduledAt)}
                                    </div>
                                    {rel && (
                                        <div className="mt-1 text-[11px] text-slate-400">
                                            {rel}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>

                        {/* dose */}
                        <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950">Dose #{o.doseId}</div>
                            <div className="mt-1 text-xs text-slate-500">Occurrence #{o.id}</div>
                        </td>

                        {/* status */}
                        <td className="px-5 py-4">
                            <StatusPill status={o.status} />
                        </td>

                        {/* taken */}
                        <td className="px-5 py-4">
                            {o.takenAt ? (
                                <>
                                    <div className="text-slate-800">{formatDateTime(o.takenAt)}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {formatTimeOnly(o.takenAt)}
                                    </div>
                                </>
                            ) : (
                                <span className="text-slate-500">—</span>
                            )}
                        </td>

                        {/* note */}
                        <td className="px-5 py-4">
                            {o.note ? (
                                <div className="max-w-[520px]">
                                    <div className="inline-flex items-start gap-2 text-slate-700">
                                        <MessageSquareText className="mt-0.5 h-4 w-4 text-slate-400" />
                                        <p className="line-clamp-2">{o.note}</p>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-slate-500">—</span>
                            )}
                        </td>

                        {/* action */}
                        <td className="px-5 py-4 text-right">
                            <button
                                onClick={() => onEdit(o)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Set status
                            </button>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}


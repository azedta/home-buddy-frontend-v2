// src/pages/dose/components/WindowBar.jsx
import { useMemo, useRef } from "react";
import { RefreshCcw, Wand2, Sparkles} from "lucide-react";
import PresetBtn from "./PresetBtn.jsx";

function pad2(n) {
    return String(n).padStart(2, "0");
}

function formatDatetimeLocal(d) {
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function roundUpTo15Min(date) {
    const d = new Date(date);
    d.setSeconds(0, 0);
    const m = d.getMinutes();
    const r = Math.ceil(m / 15) * 15;
    if (r === 60) {
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
    } else {
        d.setMinutes(r);
    }
    return d;
}

function toDatetimeLocalStrict(v) {
    const s = String(v || "").trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 16);
    const m1 = s.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})/);
    if (m1) return `${m1[1]}T${m1[2]}`;
    const m2 = s.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (m2) return `${m2[1]}T00:00`;
    return "";
}

function toBackendIsoSeconds(dtLocal) {
    const s = String(dtLocal || "").trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s;
    return "";
}

function isValidRange(fromUi, toUi) {
    if (!fromUi || !toUi) return false;
    const a = Date.parse(fromUi);
    const b = Date.parse(toUi);
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    return a < b;
}

function startOfWeekMonday(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
}

function endOfWeekSunday(d) {
    const mon = startOfWeekMonday(d);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 0, 0);
    return sun;
}

function DateTimeField({ label, value, onChange, inputRef }) {
    const openPicker = () => {
        const el = inputRef?.current;
        if (!el) return;
        if (typeof el.showPicker === "function") el.showPicker();
        else el.focus();
    };

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">{label}</label>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:ring-4 focus-within:ring-blue-100">
                <input
                    ref={inputRef}
                    type="datetime-local"
                    value={value}
                    onChange={onChange}
                    onKeyDown={(e) => e.preventDefault()} // blocks manual typing
                    inputMode="none"
                    onClick={openPicker} // click anywhere opens picker
                    className="w-full rounded-xl bg-transparent px-4 py-3 text-slate-900 outline-none"
                />
            </div>
        </div>
    );
}


export default function WindowBar({
                                      from,
                                      setFrom,
                                      to,
                                      setTo,
                                      loading,
                                      onGenerate,
                                      onRefresh,
                                  }) {
    const fromRef = useRef(null);
    const toRef = useRef(null);

    const fromUi = useMemo(() => toDatetimeLocalStrict(from), [from]);
    const toUi = useMemo(() => toDatetimeLocalStrict(to), [to]);

    const rangeOk = useMemo(() => isValidRange(fromUi, toUi), [fromUi, toUi]);

    function applyNextDays(days) {
        const start = roundUpTo15Min(new Date());
        const end = new Date(start);
        end.setDate(end.getDate() + days);

        const s = formatDatetimeLocal(start);
        const e = formatDatetimeLocal(end);

        setFrom(toBackendIsoSeconds(s));
        setTo(toBackendIsoSeconds(e));
    }

    function applyThisWeek() {
        const mon = startOfWeekMonday(new Date());
        const sun = endOfWeekSunday(new Date());

        const s = formatDatetimeLocal(mon);
        const e = formatDatetimeLocal(sun);

        setFrom(toBackendIsoSeconds(s));
        setTo(toBackendIsoSeconds(e));
    }

    const hint = useMemo(() => {
        if (!fromUi || !toUi) return "Pick a range, or use a quick preset.";
        if (!rangeOk) return "End must be after start.";
        return "Generate creates scheduled items in this range. Refresh reloads what already exists.";
    }, [fromUi, toUi, rangeOk]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold tracking-widest text-slate-500">
        QUICK RANGE
      </span>

                    <PresetBtn
                        label="Next 7 days"
                        variant="emerald"
                        onClick={() => applyNextDays(7)}
                    />

                    <PresetBtn
                        label="Next 14 days"
                        variant="indigo"
                        onClick={() => applyNextDays(14)}
                    />

                    <PresetBtn
                        label="This week"
                        variant="amber"
                        onClick={applyThisWeek}
                    />
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                        <DateTimeField
                            label="Start"
                            value={fromUi}
                            inputRef={fromRef}
                            onChange={(e) => setFrom(toBackendIsoSeconds(e.target.value))}
                        />
                        <DateTimeField
                            label="End"
                            value={toUi}
                            inputRef={toRef}
                            onChange={(e) => setTo(toBackendIsoSeconds(e.target.value))}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                        <button
                            onClick={onGenerate}
                            disabled={loading || !rangeOk}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                        >
                            <Wand2 className="h-4 w-4" />
                            Generate schedule
                        </button>

                        <button
                            onClick={onRefresh}
                            disabled={loading || !rangeOk}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                <p className="text-sm text-slate-600">{hint}</p>
            </div>
        </div>
    );
}

import { useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

function clampFreq(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(24, Math.floor(n)));
}

function normalizeHHMM(t) {
    const s = String(t || "").trim();
    if (!s) return "";
    if (/^\d{2}:\d{2}$/.test(s)) return s;          // HH:mm
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5); // HH:mm:ss -> HH:mm
    return s;
}

export default function TimesEditor({ frequency, times = [], onChange }) {
    const f = clampFreq(frequency);

    const timesNorm = useMemo(() => (times || []).map(normalizeHHMM), [times]);

    useEffect(() => {
        // ✅ strictly shape array length to match frequency
        const next = [...timesNorm];

        while (next.length < f) next.push("");
        while (next.length > f) next.pop();

        // Only update parent if changed
        if (JSON.stringify(next) !== JSON.stringify(timesNorm)) onChange(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f]);

    function setAt(idx, v) {
        const next = [...timesNorm];
        next[idx] = normalizeHHMM(v);
        onChange(next);
    }

    const filled = timesNorm.filter(Boolean).length;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <Clock className="h-4 w-4 text-slate-600" />
                        Enter {f} time(s) for today
                    </div>

                    <span className="text-xs font-semibold text-slate-500">
            {filled}/{f} filled
          </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                    Strict entry: frequency determines the exact number of times.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: f }).map((_, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                    >
                        <div className="w-10 text-center text-xs font-extrabold text-slate-500">
                            #{idx + 1}
                        </div>

                        <input
                            type="time"
                            value={timesNorm[idx] || ""}
                            onChange={(e) => setAt(idx, e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-sky-100"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
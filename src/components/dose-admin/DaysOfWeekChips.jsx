// src/components/dose-admin/DaysOfWeekChips.jsx
const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

function abbr(d) {
    return d.slice(0, 3);
}

export default function DaysOfWeekChips({ value = [], onChange }) {
    const set = new Set(value || []);

    function toggle(d) {
        const next = new Set(set);
        if (next.has(d)) next.delete(d);
        else next.add(d);
        onChange(Array.from(next));
    }

    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Days of week</p>

            <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => {
                    const active = set.has(d);
                    return (
                        <button
                            key={d}
                            type="button"
                            onClick={() => toggle(d)}
                            className={[
                                "rounded-2xl px-4 py-2 text-xs font-extrabold tracking-widest transition shadow-sm",
                                active
                                    ? "bg-sky-600 text-white hover:bg-sky-700"
                                    : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
                            ].join(" ")}
                            title={d}
                        >
                            {abbr(d)}
                        </button>
                    );
                })}
            </div>

            <p className="text-xs font-semibold text-slate-500">
                Leave empty to mean “every day”
            </p>
        </div>
    );
}

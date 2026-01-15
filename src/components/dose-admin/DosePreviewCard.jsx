// src/components/dose-admin/DosePreviewCard.jsx

const DAY_ABBR = {
    MONDAY: "Mon",
    TUESDAY: "Tue",
    WEDNESDAY: "Wed",
    THURSDAY: "Thu",
    FRIDAY: "Fri",
    SATURDAY: "Sat",
    SUNDAY: "Sun",
};

const ALL_DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

function isEveryDay(days) {
    const arr = Array.isArray(days) ? days : [];
    if (arr.length === 0) return true;

    const set = new Set(arr);
    return ALL_DAYS.every((d) => set.has(d));
}

function formatTimes(times) {
    const arr = Array.isArray(times) ? times : [];
    const cleaned = arr
        .map((t) => String(t || "").trim())
        .filter(Boolean)
        .map((t) => (t.length >= 5 ? t.slice(0, 5) : t)); // HH:mm:ss -> HH:mm
    return cleaned.length ? cleaned.join(", ") : "—";
}

function formatDays(days) {
    const arr = Array.isArray(days) ? days : [];
    if (!arr.length) return null;
    return arr;
}

export default function DosePreviewCard({
                                            userFullName,
                                            medicationName,
                                            payload,
                                        }) {
    const rawDays = payload?.daysOfWeek || [];
    const everyDay = isEveryDay(rawDays);

    const days = everyDay ? null : formatDays(rawDays);
    const timesText = formatTimes(payload?.times || []);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-bold tracking-widest text-slate-500">PREVIEW</p>

            <p className="mt-2 text-lg font-extrabold text-slate-900">
                {medicationName || "No medication selected"}
            </p>

            <div className="mt-3 space-y-3 text-sm">
                <Row label="User" value={userFullName || "—"} />
                <Row
                    label="Frequency"
                    value={payload?.timeFrequency ? `${payload.timeFrequency}/day` : "—"}
                />

                <div className="flex items-start justify-between gap-4">
                    <div className="text-xs font-bold tracking-widest text-slate-500">
                        Days
                    </div>
                    <div className="min-w-0 text-right">
                        {days ? (
                            <div className="flex flex-wrap justify-end gap-2">
                                {days.map((d) => (
                                    <span
                                        key={d}
                                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
                                    >
                    {DAY_ABBR[d] || d}
                  </span>
                                ))}
                            </div>
                        ) : (
                            <span className="font-semibold text-slate-900">Every day</span>
                        )}
                    </div>
                </div>

                <Row label="Times" value={timesText} />
                <Row
                    label="Dose"
                    value={
                        payload?.quantityAmount
                            ? `${payload.quantityAmount} ${payload.quantityUnit || ""}`
                            : "—"
                    }
                />
                <Row
                    label="Date range"
                    value={`${payload?.startDate || "—"} → ${payload?.endDate || "—"}`}
                />
                <Row label="Instructions" value={payload?.instructions || "—"} />
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="text-xs font-bold tracking-widest text-slate-500">
                {label}
            </div>
            <div className="min-w-0 text-right font-semibold text-slate-900">
                {value}
            </div>
        </div>
    );
}

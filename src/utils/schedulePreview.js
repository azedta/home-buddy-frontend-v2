function parseDate(yyyyMmDd) {
    if (!yyyyMmDd) return null;
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
}

function normalizeTime(t) {
    const s = String(t || "").trim();
    if (!s) return null;
    if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
    return null;
}

function dayEnumFromDate(dateObj) {
    // JS: 0 Sun ... 6 Sat
    const map = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    return map[dateObj.getDay()];
}

function formatDayKey(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function fmtPrettyDay(yyyyMmDd) {
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function buildPreview({
                                 daysOfWeek,   // array of DayOfWeek strings, or empty for "every day"
                                 times,        // array of "HH:mm:ss"
                                 startDate,    // "YYYY-MM-DD" or null
                                 endDate,      // "YYYY-MM-DD" or null
                                 quantityAmount,
                                 quantityUnit,
                                 lookaheadDays = 7,
                             }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = parseDate(startDate) || today;
    const end = parseDate(endDate) || null;

    const daysSet = new Set((daysOfWeek || []).filter(Boolean));
    const constrainDays = daysSet.size > 0;

    const tList = (times || [])
        .map(normalizeTime)
        .filter(Boolean)
        .slice()
        .sort(); // "HH:mm:ss" sorts lexicographically correctly

    const items = [];

    for (let i = 0; i < lookaheadDays; i++) {
        const d = addDays(today, i);
        if (d < start) continue;
        if (end && d > end) continue;

        const dayEnum = dayEnumFromDate(d);
        if (constrainDays && !daysSet.has(dayEnum)) continue;

        for (const t of tList) {
            items.push({
                dayKey: formatDayKey(d),
                time: t,
                label: `${quantityAmount || "—"} ${quantityUnit || ""}`.trim(),
            });
        }
    }

    // group by day
    const byDay = new Map();
    for (const it of items) {
        if (!byDay.has(it.dayKey)) byDay.set(it.dayKey, []);
        byDay.get(it.dayKey).push(it);
    }

    const groups = Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dayKey, arr]) => ({
            dayKey,
            dayLabel: fmtPrettyDay(dayKey),
            items: arr.sort((a, b) => a.time.localeCompare(b.time)),
        }));

    return groups;
}

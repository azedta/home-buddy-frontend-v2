export function toLocalIso(d) {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

export function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 0);
    return x;
}

export function parseIsoMaybe(s) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

export function fmtTime(iso) {
    const d = parseIsoMaybe(iso);
    if (!d) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateShort(iso) {
    const d = parseIsoMaybe(iso);
    if (!d) return "—";
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function dayKey(iso) {
    const d = parseIsoMaybe(iso);
    if (!d) return "1970-01-01";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export function prettyDayLabel(yyyyMmDd) {
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    const today = new Date();
    const a = new Date(d); a.setHours(0,0,0,0);
    const b = new Date(today); b.setHours(0,0,0,0);
    const diff = Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

    const base = d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    if (diff === 0) return `Today • ${base}`;
    if (diff === 1) return `Tomorrow • ${base}`;
    if (diff === -1) return `Yesterday • ${base}`;
    return base;
}

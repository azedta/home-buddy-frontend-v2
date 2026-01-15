import { Pill, CalendarClock, AlertTriangle, CheckCircle2 } from "lucide-react";

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function Tile({
                  label,
                  value,
                  icon: Icon,
                  tone = "indigo",
                  sub,
              }) {
    const tones = {
        indigo: {
            ring: "ring-indigo-500/10",
            border: "border-indigo-200/30",
            glow: "shadow-indigo-500/5",
            chip: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20",
            blob1: "bg-indigo-400/15",
            blob2: "bg-violet-400/12",
        },
        emerald: {
            ring: "ring-emerald-500/10",
            border: "border-emerald-200/30",
            glow: "shadow-emerald-500/5",
            chip: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
            blob1: "bg-emerald-400/15",
            blob2: "bg-teal-400/12",
        },
        amber: {
            ring: "ring-amber-500/10",
            border: "border-amber-200/30",
            glow: "shadow-amber-500/5",
            chip: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
            blob1: "bg-amber-400/15",
            blob2: "bg-orange-400/12",
        },
        rose: {
            ring: "ring-rose-500/10",
            border: "border-rose-200/30",
            glow: "shadow-rose-500/5",
            chip: "bg-rose-500/10 text-rose-700 ring-rose-500/20",
            blob1: "bg-rose-400/15",
            blob2: "bg-fuchsia-400/12",
        },
    };

    const t = tones[tone];

    return (
        <div
            className={[
                "group relative overflow-hidden rounded-3xl border bg-white/70 p-5 backdrop-blur",
                "ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                t.border,
                t.ring,
                t.glow,
            ].join(" ")}
        >
            {/* soft aurora blobs (reduced) */}
            <div
                className={`pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 ${t.blob1} opacity-70 group-hover:opacity-90`}
            />
            <div
                className={`pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full blur-2xl ${t.blob2} opacity-60`}
            />

            {/* ultra-subtle grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.12) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-950">
                        {value}
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                        {sub ?? "Updated in real-time"}
                    </p>
                </div>

                <div
                    className={[
                        "rounded-2xl p-2.5 ring-1 shadow-sm",
                        "transition-transform duration-300 group-hover:scale-105",
                        t.chip,
                    ].join(" ")}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function StatTiles({ stats }) {
    const total = Number(stats?.totalOcc ?? 0);
    const due = Number(stats?.due ?? 0);
    const missed = Number(stats?.missed ?? 0);
    const rate = Number(stats?.rate ?? 0);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Tile
                label="Active Doses"
                value={stats?.totalDoses ?? 0}
                icon={Pill}
                tone="indigo"
                sub="Current active dose definitions"
            />

            <Tile
                label="Scheduled (Window)"
                value={total}
                icon={CalendarClock}
                tone="emerald"
                sub="Occurrences in the selected window"
            />

            <Tile
                label="Due / Missed"
                value={`${due} / ${missed}`}
                icon={AlertTriangle}
                tone="amber"
                sub={missed > 0 ? "Some doses need attention" : "All good — no misses"}
            />

            <Tile
                label="Taken Rate"
                value={`${rate}%`}
                icon={CheckCircle2}
                tone="rose"
                sub={rate >= 90 ? "Excellent adherence" : "Room to improve"}
            />
        </div>
    );
}
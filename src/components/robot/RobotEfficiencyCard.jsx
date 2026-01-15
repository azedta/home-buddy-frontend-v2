import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
    Scatter,
} from "recharts";
import { Sparkles, Activity, ShieldAlert, Timer } from "lucide-react";

const MAX_POINTS = 22;

const BUCKET_PRESETS = [
    { key: "1m", ms: 60_000, label: "1m" },
    { key: "2m", ms: 2 * 60_000, label: "2m" },
    { key: "5m", ms: 5 * 60_000, label: "5m" },
];

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function toTs(iso) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : null;
}

function fmtTime(ts) {
    try {
        return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

// more volatile penalties
function severityPenalty(sev) {
    const s = String(sev || "").toUpperCase();
    if (s === "CRITICAL" || s === "ERROR") return 14;
    if (s === "WARN" || s === "WARNING") return 6;
    return 0;
}

function severityRank(sev) {
    const s = String(sev || "").toUpperCase();
    if (s === "CRITICAL" || s === "ERROR") return 2;
    if (s === "WARN" || s === "WARNING") return 1;
    return 0;
}

function typeGain(type) {
    const t = String(type || "").toUpperCase();
    if (t === "MOVEMENT") return 2.2;
    if (t === "DISPENSING") return 2.8;
    if (t === "TRAY") return 1.0;
    if (t === "BATTERY") return 0.7;
    if (t === "SYSTEM") return 0.5;
    if (t === "SENSORS") return 0.8;
    if (t === "COMMAND") return 0.9;
    return 0.6;
}

// slightly stronger drift (still bounded + deterministic)
function drift(tick) {
    const a = Math.sin(tick * 0.8) * 0.55;
    const b = Math.cos(tick * 0.33) * 0.35;
    return a + b;
}

function bucketizeEvents(events, bucketMs) {
    // events: [{ ts, delta, sevRank }]
    const map = new Map();

    for (const e of events) {
        const b = Math.floor(e.ts / bucketMs) * bucketMs;
        const cur = map.get(b);

        if (!cur) {
            map.set(b, {
                x: b,
                sumDelta: e.delta,
                count: 1,
                maxSev: e.sevRank,
            });
        } else {
            cur.sumDelta += e.delta;
            cur.count += 1;
            if (e.sevRank > cur.maxSev) cur.maxSev = e.sevRank;
        }
    }

    return Array.from(map.values())
        .map((b) => ({
            x: b.x,
            avgDelta: b.sumDelta / Math.max(1, b.count),
            maxSev: b.maxSev, // 0 none, 1 warn, 2 critical/error
        }))
        .sort((a, b) => a.x - b.x);
}

function Toggle({ options, value, onChange }) {
    return (
        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {options.map((o) => {
                const active = value === o.ms;
                return (
                    <button
                        key={o.key}
                        type="button"
                        onClick={() => onChange(o.ms)}
                        className={[
                            "rounded-2xl px-3 py-1 text-xs font-semibold transition",
                            active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function RobotEfficiencyCard({ activities, loading }) {
    const [tick, setTick] = useState(0);
    const [bucketMs, setBucketMs] = useState(BUCKET_PRESETS[1].ms); // default 2m

    useEffect(() => {
        const t = setInterval(() => setTick((x) => x + 1), 1200);
        return () => clearInterval(t);
    }, []);

    // Base chart from activities only (history stays stable)
    const { baseData, spikeDots, baseLatest, healthHint } = useMemo(() => {
        const arr = Array.isArray(activities) ? activities : [];

        const ordered = arr
            .map((a) => {
                const ts = toTs(a?.activityTime);
                if (typeof ts !== "number") return null;

                const sev = String(a?.severity || "");
                return {
                    ts,
                    delta: typeGain(a?.activityType) - severityPenalty(sev),
                    sevRank: severityRank(sev),
                    sevText: String(sev || "").toUpperCase(),
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.ts - b.ts);

        // Bucket deltas + track worst severity inside bucket
        let bucketSeries = ordered.length ? bucketizeEvents(ordered, bucketMs) : [];

        // Fallback baseline series (still spaced by bucketMs)
        if (bucketSeries.length < 8) {
            const now = Date.now();
            bucketSeries = Array.from({ length: MAX_POINTS }, (_, i) => {
                const x = now - (MAX_POINTS - 1 - i) * bucketMs;
                const avgDelta = Math.sin(i * 0.55) * 0.2 + Math.cos(i * 0.22) * 0.15;
                return { x, avgDelta, maxSev: 0 };
            });
        } else {
            bucketSeries = bucketSeries.slice(-MAX_POINTS);
        }

        // Convert avgDelta → efficiency (more volatile, faster response)
        const BASE = 72;
        const DELTA_SCALE = 4.2; // bigger swings
        const ALPHA = 0.55; // faster reaction

        let s = BASE;
        const out = bucketSeries.map((p) => {
            const target = BASE + p.avgDelta * DELTA_SCALE;
            s = s + (target - s) * ALPHA;
            s = clamp(s, 35, 98);
            return {
                x: p.x,
                efficiency: Math.round(s * 10) / 10,
                maxSev: p.maxSev,
            };
        });

        // Spike markers: only show if bucket had WARN or CRITICAL/ERROR
        const spikes = out
            .filter((p) => p.maxSev > 0)
            .map((p) => ({
                x: p.x,
                efficiency: p.efficiency,
                maxSev: p.maxSev,
            }));

        // health hint from last 10 raw activities
        const lastFew = arr.slice(0, 10);
        const warnCount = lastFew.filter((x) => String(x?.severity || "").toUpperCase() === "WARN").length;
        const critCount = lastFew.filter((x) =>
            ["CRITICAL", "ERROR"].includes(String(x?.severity || "").toUpperCase())
        ).length;

        let hint = "Stable";
        if (critCount > 0) hint = "Critical alerts detected";
        else if (warnCount >= 3) hint = "Warnings trending";
        else if (warnCount > 0) hint = "Minor warnings";

        return {
            baseData: out,
            spikeDots: spikes,
            baseLatest: out.length ? out[out.length - 1].efficiency : null,
            healthHint: hint,
        };
    }, [activities, bucketMs]);

    // Only last point “breathes”
    const data = useMemo(() => {
        if (!baseData?.length) return baseData;
        const last = baseData[baseData.length - 1];
        const bumped = clamp(last.efficiency + drift(tick), 35, 98);
        return [
            ...baseData.slice(0, -1),
            { ...last, efficiency: Math.round(bumped * 10) / 10 },
        ];
    }, [baseData, tick]);

    const latest = data?.length ? data[data.length - 1].efficiency : baseLatest;

    // Split spikes into warn vs critical for different marker colors
    const warnSpikes = spikeDots?.filter((s) => s.maxSev === 1) ?? [];
    const critSpikes = spikeDots?.filter((s) => s.maxSev === 2) ?? [];

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT EFFICIENCY</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Operational performance</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        A stable performance trend with gentle live movement.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
              {loading ? "—" : latest != null ? `${latest}%` : "—"}
          </span>

                    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            {healthHint.includes("Critical") ? <ShieldAlert className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                        {loading ? "—" : healthHint}
          </span>

                    <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <Timer className="h-4 w-4" />
              Bucket
            </span>
                        <Toggle options={BUCKET_PRESETS} value={bucketMs} onChange={setBucketMs} />
                    </div>
                </div>
            </div>

            {/* Mobile bucket toggle */}
            <div className="mt-3 flex sm:hidden items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
          <Timer className="h-4 w-4" />
          Bucket
        </span>
                <Toggle options={BUCKET_PRESETS} value={bucketMs} onChange={setBucketMs} />
            </div>

            <div className="mt-6 h-[260px] rounded-3xl border border-slate-200 bg-white p-3">
                {loading ? (
                    <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <defs>
                                <linearGradient id="effFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(15 23 42)" stopOpacity={0.18} />
                                    <stop offset="100%" stopColor="rgb(15 23 42)" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="x"
                                type="number"
                                scale="time"
                                domain={["dataMin", "dataMax"]}
                                tickMargin={8}
                                tickFormatter={fmtTime}
                                interval="preserveStartEnd"
                                minTickGap={28}
                            />

                            <YAxis domain={[30, 100]} tickMargin={8} />

                            <Tooltip
                                labelFormatter={(v) => fmtTime(v)}
                                formatter={(val, name, item) => {
                                    if (name === "Efficiency") return [`${val}%`, "Efficiency"];
                                    return [`${val}`, name];
                                }}
                            />

                            {/* Subtle fill under line */}
                            <Area
                                type="monotone"
                                dataKey="efficiency"
                                name="Efficiency"
                                stroke="none"
                                fill="url(#effFill)"
                                fillOpacity={1}
                                isAnimationActive={false}
                            />

                            {/* Trend line */}
                            <Line
                                type="monotone"
                                dataKey="efficiency"
                                name="Efficiency"
                                stroke="rgb(15 23 42)"
                                strokeWidth={3}
                                dot={false}
                                isAnimationActive={false}
                            />

                            {/* Spike markers */}
                            <Scatter
                                data={warnSpikes}
                                fill="rgb(245 158 11)" // amber
                                shape="circle"
                                isAnimationActive={false}
                            />
                            <Scatter
                                data={critSpikes}
                                fill="rgb(239 68 68)" // red
                                shape="circle"
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Sudden spikes draw attention to warning or critical moments, helping you spot issues quickly.
            </div>
        </div>
    );
}

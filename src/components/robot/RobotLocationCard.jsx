import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Target } from "lucide-react";
import labelizeEnum from "../../utils/labelizeEnum.js";

/**
 * Percent-based layout. Each HouseLocation MUST be mapped here.
 */
const ROOMS = [
    { key: "LIVING_ROOM", x: 4, y: 8, w: 44, h: 36 },
    { key: "KITCHEN", x: 52, y: 8, w: 44, h: 22 },
    { key: "DINING_ROOM", x: 52, y: 32, w: 44, h: 12 },

    { key: "HALLWAY", x: 4, y: 46, w: 92, h: 16 },

    { key: "BEDROOM", x: 4, y: 64, w: 44, h: 32 },
    { key: "BATHROOM", x: 52, y: 64, w: 22, h: 28 },
    { key: "DOCK", x: 78, y: 64, w: 18, h: 32 },
];

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function roomBottomLeft(room) {
    // padding inside the room (percent-space), clamped so small rooms still look good
    const padX = clamp(room.w * 0.14, 2.6, 5.4);
    const padY = clamp(room.h * 0.18, 2.8, 6.2);

    return {
        cx: room.x + padX,
        cy: room.y + room.h - padY,
    };
}

function pillClass(kind) {
    if (kind === "good") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    if (kind === "warn") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    if (kind === "bad") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

/**
 * Smooth animation helper
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function RobotLocationCard({ status, loading }) {
    const current = status?.currentLocation ? String(status.currentLocation) : null;
    const target = status?.targetLocation ? String(status.targetLocation) : null;

    const map = useMemo(() => {
        const byKey = new Map(ROOMS.map((r) => [r.key, r]));
        const currentRoom = current ? byKey.get(current) : null;
        const targetRoom = target ? byKey.get(target) : null;

        const c = currentRoom ? roomBottomLeft(currentRoom) : null;
        const t = targetRoom ? roomBottomLeft(targetRoom) : null;

        return { byKey, currentRoom, targetRoom, c, t };
    }, [current, target]);

    // Animated robot position (jaw-drop travel)
    const [animPos, setAnimPos] = useState(() => (map.c ? { x: map.c.cx, y: map.c.cy } : null));
    const lastStablePos = useRef(null);
    const rafRef = useRef(null);

    // When current location changes, travel smoothly from previous center to new center
    useEffect(() => {
        if (loading) return;
        if (!map.c) return;

        const to = { x: map.c.cx, y: map.c.cy };
        const from =
            animPos ??
            lastStablePos.current ??
            to; // first render fallback

        // If no movement, just set it
        const dx = Math.abs((from?.x ?? to.x) - to.x);
        const dy = Math.abs((from?.y ?? to.y) - to.y);
        const moved = dx > 0.01 || dy > 0.01;

        if (!moved) {
            setAnimPos(to);
            lastStablePos.current = to;
            return;
        }

        // cancel any in-flight animation
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const duration = 900; // ms
        const start = performance.now();

        const step = (now) => {
            const t = clamp((now - start) / duration, 0, 1);
            const e = easeInOutCubic(t);

            // Linear interpolation in percent-space (deterministic)
            const x = from.x + (to.x - from.x) * e;
            const y = from.y + (to.y - from.y) * e;

            setAnimPos({ x, y });

            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
                lastStablePos.current = to;
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map.c?.cx, map.c?.cy, loading]);

    const currentLabel = current ? labelizeEnum(current) : "—";
    const targetLabel = target ? labelizeEnum(target) : "—";

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            {/* Small local CSS for the route beam animation */}
            <style>{`
        @keyframes dashMove {
          to { stroke-dashoffset: -100; }
        }
        @keyframes sweep {
          0% { transform: translateX(-40%); opacity: 0; }
          20% { opacity: .55; }
          80% { opacity: .55; }
          100% { transform: translateX(140%); opacity: 0; }
        }
      `}</style>

            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">LOCATION</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Live position</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        See the robot move naturally from one room to another on the home map, with smooth transitions that reflect its real-time location.
                    </p>
                </div>


            </div>

            {loading ? (
                <div className="mt-6 h-[320px] animate-pulse rounded-3xl bg-slate-100" />
            ) : (
                <div className="mt-6">
                    <div className="relative h-[320px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-sm">
                        {/* subtle grid */}
                        <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
                        </div>

                        {/* sweeping light beam (jaw-drop polish) */}
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.12) 35%, rgba(99,102,241,0.10) 55%, transparent 100%)",
                                width: "45%",
                                height: "100%",
                                filter: "blur(2px)",
                                animation: "sweep 3.2s ease-in-out infinite",
                            }}
                        />

                        {/* Rooms with centered labels */}
                        {ROOMS.map((r) => {
                            const isCurrent = current === r.key;
                            const isTarget = target === r.key;

                            return (
                                <div
                                    key={r.key}
                                    className={[
                                        "absolute z-10 rounded-3xl border shadow-sm transition",
                                        isCurrent
                                            ? "border-blue-300 bg-blue-50/70"
                                            : isTarget
                                                ? "border-indigo-300 bg-indigo-50/60"
                                                : "border-slate-200 bg-white/70",
                                    ].join(" ")}
                                    style={{
                                        left: `${clamp(r.x, 0, 100)}%`,
                                        top: `${clamp(r.y, 0, 100)}%`,
                                        width: `${clamp(r.w, 0, 100)}%`,
                                        height: `${clamp(r.h, 0, 100)}%`,
                                    }}
                                >
                                    <div className="absolute inset-0 grid place-items-center px-3">
                                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm">
                                            <span className="truncate">{labelizeEnum(r.key)}</span>
                                        </div>
                                    </div>

                                    <div className="absolute right-3 top-3 text-[10px] font-bold text-slate-400">
                                        {isCurrent ? "CURRENT" : isTarget ? "TARGET" : ""}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Current marker (animated travel) */}
                        {animPos ? (
                            <Marker
                                kind="current"
                                x={animPos.x}
                                y={animPos.y}
                                label={currentLabel}
                                subLabel={status?.robotStatus ? labelizeEnum(String(status.robotStatus)) : null}
                                disableTransition
                            />
                        ) : null}


                        {/* Target marker (fixed) */}
                        {map.t ? <Marker kind="target" x={map.t.cx} y={map.t.cy} label={targetLabel} /> : null}

                        {/* Fallback warnings */}
                        {current && !map.byKey.get(current) ? (
                            <div className="absolute left-4 top-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                                Unknown currentLocation: <span className="font-extrabold">{current}</span> (not mapped on UI)
                            </div>
                        ) : null}

                        {target && !map.byKey.get(target) ? (
                            <div className="absolute left-4 top-14 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                                Unknown targetLocation: <span className="font-extrabold">{target}</span> (not mapped on UI)
                            </div>
                        ) : null}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Current position (animated)
            </span>
                        <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              Target destination
            </span>

                    </div>
                </div>
            )}
        </div>
    );
}

function Marker({ kind, x, y, label, subLabel = null, disableTransition = false }) {
    const isCurrent = kind === "current";
    const Icon = isCurrent ? MapPin : Target;

    const dotClass = isCurrent ? "bg-blue-600 ring-blue-200" : "bg-indigo-600 ring-indigo-200";
    const glowClass = isCurrent ? "bg-blue-500/25" : "bg-indigo-500/25";

    return (
        <div
            className="absolute z-20"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-10%, -90%)",
                transition: disableTransition ? "none" : "left 600ms ease, top 600ms ease",
                willChange: "left, top, transform",
            }}
            title={`${isCurrent ? "Current" : "Target"}: ${label}`}
        >
            <div className={`absolute -inset-3 rounded-full ${glowClass} blur-lg`} />
            <div className={`absolute -inset-1.5 rounded-full ${glowClass} animate-ping opacity-60`} />
            <div className={`relative grid h-7 w-7 place-items-center rounded-full ${dotClass} ring-2 shadow-md`}>
                <Icon className="h-4 w-4 text-white" />
            </div>
        </div>
    );
}

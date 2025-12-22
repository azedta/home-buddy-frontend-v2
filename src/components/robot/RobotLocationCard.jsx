import { useMemo } from "react";
import { Crosshair, Navigation } from "lucide-react";

const ROOM_COORDS = {
    DOCK: { x: 10, y: 82 },
    HALLWAY: { x: 45, y: 58 },
    LIVING_ROOM: { x: 70, y: 30 },
    KITCHEN: { x: 78, y: 70 },
    BEDROOM: { x: 28, y: 24 },
    BATHROOM: { x: 22, y: 52 },
    DINING_ROOM: { x: 60, y: 72 },
};

function normLocation(loc) {
    const k = String(loc || "").toUpperCase();
    return ROOM_COORDS[k] ? k : "HALLWAY";
}

function statusHint(robotStatus) {
    const s = String(robotStatus || "").toUpperCase();
    if (s.includes("MOVING") || s.includes("RETURNING") || s.includes("DELIVER")) return "moving";
    if (s.includes("CHARG")) return "charging";
    return "idle";
}

export default function RobotLocationCard({ status, loading }) {
    const currentKey = useMemo(() => normLocation(status?.currentLocation), [status?.currentLocation]);
    const targetKey = useMemo(() => normLocation(status?.targetLocation), [status?.targetLocation]);
    const cur = ROOM_COORDS[currentKey];
    const tgt = ROOM_COORDS[targetKey];

    const mode = useMemo(() => statusHint(status?.robotStatus), [status?.robotStatus]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">LOCATION</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Live room map</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        This dot moves based on backend robot location updates.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    {loading ? "Loading..." : `${currentKey} → ${targetKey}`}
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="relative">
                    {/* Floorplan SVG (no external image needed) */}
                    <svg viewBox="0 0 100 100" className="h-[320px] w-full">
                        <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(59,130,246,0.10)" />
                                <stop offset="55%" stopColor="rgba(34,211,238,0.10)" />
                                <stop offset="100%" stopColor="rgba(99,102,241,0.10)" />
                            </linearGradient>
                        </defs>

                        {/* Outer */}
                        <rect x="4" y="6" width="92" height="88" rx="6" fill="url(#g1)" stroke="rgba(15,23,42,0.12)" />

                        {/* Rooms */}
                        <Room x="8" y="12" w="32" h="30" label="BEDROOM" active={currentKey === "BEDROOM"} />
                        <Room x="44" y="12" w="48" h="22" label="LIVING ROOM" active={currentKey === "LIVING_ROOM"} />
                        <Room x="8" y="46" w="26" h="20" label="BATHROOM" active={currentKey === "BATHROOM"} />
                        <Room x="36" y="40" w="26" h="26" label="HALLWAY" active={currentKey === "HALLWAY"} />
                        <Room x="64" y="40" w="28" h="22" label="KITCHEN" active={currentKey === "KITCHEN"} />
                        <Room x="44" y="68" w="48" h="22" label="DINING" active={currentKey === "DINING_ROOM"} />
                        <Room x="8" y="72" w="30" h="18" label="DOCK" active={currentKey === "DOCK"} />

                        {/* Route hint line */}
                        {!loading && cur && tgt ? (
                            <line
                                x1={cur.x}
                                y1={cur.y}
                                x2={tgt.x}
                                y2={tgt.y}
                                stroke="rgba(59,130,246,0.35)"
                                strokeWidth="1.6"
                                strokeDasharray="3 3"
                            />
                        ) : null}

                        {/* Robot dot */}
                        {!loading && cur ? (
                            <g style={{ transition: "transform 900ms cubic-bezier(.2,.9,.2,1)" }} transform={`translate(${cur.x} ${cur.y})`}>
                                <circle r="3.2" fill="rgba(59,130,246,0.95)" />
                                <circle r="6.5" fill="rgba(59,130,246,0.18)">
                                    <animate attributeName="r" values="5.5;7.8;5.5" dur="1.8s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.18;0.08;0.18" dur="1.8s" repeatCount="indefinite" />
                                </circle>
                            </g>
                        ) : null}
                    </svg>

                    {/* Legend overlay */}
                    <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
                        <Crosshair className="h-4 w-4" />
                        Live position
                        <span className="ml-2 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
              {mode === "moving" ? "EN ROUTE" : mode.toUpperCase()}
            </span>
                    </div>

                    <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
                        <Navigation className="h-4 w-4" />
                        Target: {targetKey}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Room({ x, y, w, h, label, active }) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="4"
                fill={active ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.75)"}
                stroke={active ? "rgba(59,130,246,0.55)" : "rgba(15,23,42,0.12)"}
            />
            <text
                x={x + 2.5}
                y={y + 6.8}
                fontSize="3.6"
                fontWeight="800"
                fill="rgba(15,23,42,0.62)"
                style={{ letterSpacing: "0.5px" }}
            >
                {label}
            </text>
        </g>
    );
}

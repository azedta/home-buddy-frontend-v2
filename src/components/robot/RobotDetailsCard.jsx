import { Battery, Cpu, Activity, PackageOpen, Radar } from "lucide-react";
import labelizeEnum from "../../utils/labelizeEnum.js";

function pillClass(kind) {
    if (kind === "good") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    if (kind === "warn") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    if (kind === "bad") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

function batteryKind(level) {
    if (level == null) return "neutral";
    if (level >= 60) return "good";
    if (level >= 25) return "warn";
    return "bad";
}

function fmtTime(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return String(iso);
    }
}

function isRobotStatus(value) {
    return (
        value === "RESTING" ||
        value === "DELIVERING" ||
        value === "CHARGING" ||
        value === "MOVING_TO_LOCATION" ||
        value === "RETURNING_TO_DOCK"
    );
}


export default function RobotDetailsCard({ status, loading }) {
    const battery = status?.batteryLevel;
    const bKind = batteryKind(battery);
    const bPill = pillClass(bKind);

    const robotStatusLabel = status?.robotStatus ? labelizeEnum(status.robotStatus) : "—";
    const currentLocationLabel = status?.currentLocation ? labelizeEnum(status.currentLocation) : "—";
    const targetLocationLabel = status?.targetLocation ? labelizeEnum(status.targetLocation) : "—";

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT DETAILS</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Live status snapshot</h3>
                    <p className="mt-1 text-sm text-slate-600">Shows the robot’s current status with live updates.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    Last update: {fmtTime(status?.lastUpdatedAt)}
                </div>
            </div>

            {loading ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Metric
                            icon={Battery}
                            label="Battery level"
                            value={battery != null ? `${battery}%` : "—"}
                            pill={bPill}
                            subtitle={status?.robotStatus ? labelizeEnum(status.robotStatus) : "—"}
                        />

                        <Metric
                            icon={Activity}
                            label="Robot status"
                            value={labelizeEnum(status.robotStatus).toUpperCase()}
                            pill={pillClass("neutral")}
                            subtitle={`Target: ${labelizeEnum(status.targetLocation)}`}
                            compactValue
                        />


                        <Metric
                            icon={PackageOpen}
                            label="Tray status"
                            value={status?.trayStatus ? labelizeEnum(status.trayStatus) : "—"}
                            pill={pillClass(status?.trayStatus === "UP" ? "good" : "warn")}
                            subtitle="Handoff safety system"
                        />

                        <Metric
                            icon={Radar}
                            label="Sensor status"
                            value={status?.sensorStatus ? labelizeEnum(status.sensorStatus) : "—"}
                            pill={pillClass(status?.sensorStatus === "ON" ? "good" : "warn")}
                            subtitle={status?.sensorMessage || "—"}
                        />

                        <Metric
                            icon={Cpu}
                            label="Dispenser status"
                            value={status?.dispenserStatus ? labelizeEnum(status.dispenserStatus) : "—"}
                            pill={pillClass(status?.dispenserStatus === "ON" ? "good" : "warn")}
                            subtitle={
                                status?.dispenserPillsRemaining != null
                                    ? `Pills remaining: ${status.dispenserPillsRemaining}`
                                    : "—"
                            }
                        />

                        <Metric
                            icon={Cpu}
                            label="Dispenser fill"
                            value={status?.dispenserFillLevel ? labelizeEnum(status.dispenserFillLevel) : "—"}
                            pill={pillClass(status?.dispenserFillLevel === "FULL" ? "good" : "warn")}
                            subtitle={status?.currentLocation ? `Current: ${labelizeEnum(status.currentLocation)}` : "—"}
                        />
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                            Live location: <span className="font-extrabold">{currentLocationLabel}</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            Target: <span className="font-semibold">{targetLocationLabel}</span>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

function Metric({ icon: Icon, label, value, pill, subtitle, compactValue = false }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-lg" />
                    <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white">
                        <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-widest text-slate-500">{label}</p>

                    <div className="mt-1 flex items-center gap-2 min-w-0">
                        <p
                            className={`
                min-w-0 flex-1 whitespace-nowrap
                ${compactValue ? "text-sm font-extrabold tracking-wide" : "text-base font-extrabold"}
                text-slate-900
              `}
                        >
                            {value}
                        </p>

                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${pill}`}>
              live
            </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-medium text-slate-600">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}


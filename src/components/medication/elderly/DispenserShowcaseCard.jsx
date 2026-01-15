import { useMemo, useState } from "react";
import { Boxes, Droplets, Sparkles } from "lucide-react";
import Modal from "../../general/Modal.jsx";

function formatDateTime(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
        return "—";
    }
}

export default function DispenserShowcaseCard({ loading, dispenser, robotId }) {
    const [open, setOpen] = useState(false);

    const compartments = dispenser?.compartments || [];

    const summary = useMemo(() => {
        if (!Array.isArray(compartments) || !compartments.length) return { filled: 0, cap: 0 };
        const filled = compartments.reduce((a, c) => a + (c?.pillsCount || 0), 0);
        const cap = compartments.reduce((a, c) => a + (c?.pillCapacity || 0), 0);
        return { filled, cap };
    }, [compartments]);

    const pct = summary.cap > 0 ? Math.round((summary.filled / summary.cap) * 100) : 0;

    return (
        <>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-slate-500">DISPENSER</p>
                        <h3 className="mt-2 text-lg font-extrabold text-slate-900">Smart compartment system</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Click to open a “product-demo” view of every compartment — feels like a real device UI.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        <Sparkles className="h-4 w-4" />
                        {loading ? "Loading" : `${pct}%`}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <Mini label="Robot" value={robotId} icon={Boxes} />
                    <Mini label="Syrup holder" value={dispenser?.hasSyrupHolder ? "Yes" : "No"} icon={Droplets} />
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">Last refilled</span>
                        <span className="text-slate-600">{formatDateTime(dispenser?.lastRefilledAt)}</span>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-white ring-1 ring-slate-200 overflow-hidden">
                        <div className="h-full w-full origin-left scale-x-100 bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200" />
                    </div>

                    <div className="mt-3">
                        <button
                            onClick={() => setOpen(true)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                            View all compartments (🔥)
                        </button>
                    </div>
                </div>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title="Dispenser compartments — month view" widthClass="max-w-5xl">
                <DispenserCompartmentGrid compartments={compartments} />
            </Modal>
        </>
    );
}

function Mini({ label, value, icon: Icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value ?? "—"}</p>
        </div>
    );
}

function DispenserCompartmentGrid({ compartments }) {
    const today = new Date().getDate();

    const map = new Map((compartments || []).map((c) => [c?.dayOfMonth, c]));
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="space-y-5">
            {/* “device header” */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 p-5">
                <p className="text-xs font-bold tracking-widest text-slate-600">DEVICE VIEW</p>
                <h4 className="mt-2 text-xl font-extrabold text-slate-900">Compartment map</h4>
                <p className="mt-1 text-sm text-slate-600">
                    Each day has its own compartment. You’ll later link “dispense” actions to dose occurrences.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {days.map((d) => {
                    const c = map.get(d);
                    const count = c?.pillsCount ?? 0;
                    const cap = c?.pillCapacity ?? 0;
                    const pct = cap > 0 ? Math.round((count / cap) * 100) : 0;

                    const isToday = d === today;

                    return (
                        <div
                            key={d}
                            className={[
                                "relative overflow-hidden rounded-3xl border bg-white p-4 shadow-sm",
                                isToday ? "border-indigo-200 ring-2 ring-indigo-100" : "border-slate-200",
                            ].join(" ")}
                        >
                            {/* glow */}
                            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl" />
                            <div className="pointer-events-none absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-cyan-200/30 blur-2xl" />

                            <div className="relative">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-bold tracking-widest text-slate-500">DAY</p>
                                        <p className="mt-1 text-lg font-extrabold text-slate-900">{d}</p>
                                    </div>
                                    {isToday ? (
                                        <span className="rounded-2xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      TODAY
                    </span>
                                    ) : (
                                        <span className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                      SLOT
                    </span>
                                    )}
                                </div>

                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-700">Pills</span>
                                        <span className="text-slate-600">
                      {count}/{cap || "—"}
                    </span>
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200"
                                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-[12px] text-slate-600">
                                        {cap ? (pct >= 75 ? "Loaded" : pct >= 30 ? "Partially loaded" : "Low") : "No capacity set"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Later: clicking a compartment can show the exact doses scheduled for that day (and highlight what was taken).
            </div>
        </div>
    );
}

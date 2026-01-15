import { useEffect, useState } from "react";
import { RefreshCw, Wand2 } from "lucide-react";
import { medicationApi, toLocalIso } from "../../features/medicationApi.js";

export default function PatientScheduleCard({ userId, from, to, setFrom, setTo }) {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    async function refresh() {
        setLoading(true);
        try {
            const res = await medicationApi.listWindow({
                userId,
                from: toLocalIso(from),
                to: toLocalIso(to),
            });
            setItems(res?.items || []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    async function generate() {
        setLoading(true);
        try {
            const res = await medicationApi.generateWindow({
                userId,
                from: toLocalIso(from),
                to: toLocalIso(to),
            });
            setItems(res?.items || []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, from, to]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">OCCURRENCES</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Patient schedule window</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Generate/list occurrences for user #{userId}.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                    <button
                        onClick={generate}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-cyan-50 to-blue-50 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                        <Wand2 className="h-4 w-4" />
                        Generate
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TimeBox label="From" value={from} onChange={setFrom} />
                <TimeBox label="To" value={to} onChange={setTo} />
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                {loading ? (
                    <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                ) : items.length ? (
                    <div className="space-y-3">
                        {items.slice(0, 10).map((o) => (
                            <div key={o.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-900">
                                            {String(o.scheduledAt || "").replace("T", " ")}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Dose #{o.doseId} • {String(o.status || "SCHEDULED")}
                                        </p>
                                    </div>
                                    <span className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                    #{o.id}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        No occurrences found. Generate a window.
                    </div>
                )}
            </div>
        </div>
    );
}

function TimeBox({ label, value, onChange }) {
    const isoLocalInput = (() => {
        const d = value instanceof Date ? value : new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    })();

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
            <input
                type="datetime-local"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                value={isoLocalInput}
                onChange={(e) => onChange(new Date(e.target.value))}
            />
        </div>
    );
}

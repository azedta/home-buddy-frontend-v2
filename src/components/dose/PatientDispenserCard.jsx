import { useEffect, useState } from "react";
import { Boxes, RefreshCw } from "lucide-react";
import { medicationApi } from "../../features/medicationApi.js";

export default function PatientDispenserCard({ robotId }) {
    const [loading, setLoading] = useState(true);
    const [d, setD] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await medicationApi.getDispenser(robotId);
            setD(res);
        } catch {
            setD(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [robotId]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">PATIENT DISPENSER</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Device snapshot</h3>
                    <p className="mt-1 text-sm text-slate-600">Quick glance for caregivers.</p>
                </div>
                <button
                    onClick={load}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
                {loading ? (
                    <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                ) : d ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Robot</span>
                            <span className="font-semibold text-slate-900">{d.robotId}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Syrup holder</span>
                            <span className="font-semibold text-slate-900">{d.hasSyrupHolder ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Compartments</span>
                            <span className="font-semibold text-slate-900">{d.compartments?.length ?? 0}</span>
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            Later we can link “refill actions” to notifications and adherence prediction.
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        Could not load dispenser for robotId: <span className="font-semibold">{robotId}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

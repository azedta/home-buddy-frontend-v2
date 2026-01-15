import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Clock, Pill, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../features/authStore.js";
import { medicationApi } from "../../features/medicationApi.js";
import {toLocalIso, apiFetch} from "../../features/apiFetch.js"
import DispenserShowcaseCard from "../../components/medication/elderly/DispenserShowcaseCard.jsx";
import NotificationOverviewCard from "../../components/medication/elderly/NotificationOverviewCard.jsx";
import DayDosePlannerCard from "../../components/medication/elderly/DayDosePlannerCard.jsx";
import ScheduleWindowCard from "../../components/medication/elderly/ScheduleWindowCard.jsx";


function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

export default function ElderlyMedicationView() {
    const user = useAuthStore((s) => s.user);

    const userId = user?.id || user?.userId || user?.userid || null;

    // If you store robotId on user, use it; else we do a safe default demo id.
    const robotId = user?.robotId || user?.robot?.id || "ROBOT-1";

    const [loading, setLoading] = useState(true);
    const [dispenser, setDispenser] = useState(null);

    const [occLoading, setOccLoading] = useState(true);
    const [windowFrom, setWindowFrom] = useState(() => startOfDay(new Date()));
    const [windowTo, setWindowTo] = useState(() => addDays(startOfDay(new Date()), 3)); // next 3 days
    const [occurrences, setOccurrences] = useState([]);

    const [dosesLoading, setDosesLoading] = useState(true);
    const [doses, setDoses] = useState([]);

    const canLoad = Boolean(userId);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                const d = await medicationApi.getDispenser(robotId);
                if (!alive) return;
                setDispenser(d);
            } catch (e) {
                if (!alive) return;
                setDispenser(null);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [robotId]);

    useEffect(() => {
        let alive = true;

        async function loadDoses() {
            if (!canLoad) {
                setDoses([]);
                setDosesLoading(false);
                return;
            }
            setDosesLoading(true);
            try {
                const list = await medicationApi.getUserDoses(userId);
                if (!alive) return;
                setDoses(Array.isArray(list) ? list : []);
            } catch {
                if (!alive) return;
                setDoses([]);
            } finally {
                if (alive) setDosesLoading(false);
            }
        }

        loadDoses();
        return () => (alive = false);
    }, [canLoad, userId]);

    async function loadWindow({ generate = false } = {}) {
        if (!canLoad) return;
        setOccLoading(true);
        const from = toLocalIso(windowFrom);
        const to = toLocalIso(windowTo);

        try {
            const data = generate
                ? await medicationApi.generateWindow({ userId, from, to })
                : await medicationApi.listWindow({ userId, from, to });

            setOccurrences(data?.items || []);
        } catch {
            setOccurrences([]);
        } finally {
            setOccLoading(false);
        }
    }

    useEffect(() => {
        loadWindow({ generate: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canLoad, userId, windowFrom, windowTo]);

    const upcoming = useMemo(() => {
        const list = Array.isArray(occurrences) ? occurrences.slice() : [];
        list.sort((a, b) => String(a?.scheduledAt).localeCompare(String(b?.scheduledAt)));
        return list;
    }, [occurrences]);

    const adherence = useMemo(() => {
        const list = Array.isArray(upcoming) ? upcoming : [];
        const total = list.length || 0;
        const taken = list.filter((x) => String(x?.status || "").toUpperCase() === "TAKEN").length;
        const missed = list.filter((x) => String(x?.status || "").toUpperCase() === "MISSED").length;
        return { total, taken, missed };
    }, [upcoming]);

    return (
        <div className="space-y-6">
            {/* Top row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <NotificationOverviewCard />

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <p className="text-xs font-bold tracking-widest text-slate-500">ADHERENCE SNAPSHOT</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Today’s reliability</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        This becomes your “Dose History” truth later (taken/missed/status notes).
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <Stat label="Total" value={adherence.total} icon={CalendarDays} />
                        <Stat label="Taken" value={adherence.taken} icon={CheckCircle2} />
                        <Stat label="Missed" value={adherence.missed} icon={Clock} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        If you can’t load occurrences yet, hit <span className="font-semibold">Generate schedule</span> below.
                    </div>
                </div>

                <DispenserShowcaseCard loading={loading} dispenser={dispenser} robotId={robotId} />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DayDosePlannerCard doses={doses} loading={dosesLoading} />
                <ScheduleWindowCard
                    loading={occLoading}
                    from={windowFrom}
                    to={windowTo}
                    setFrom={setWindowFrom}
                    setTo={setWindowTo}
                    items={upcoming}
                    onRefresh={() => loadWindow({ generate: false })}
                    onGenerate={() => loadWindow({ generate: true })}
                    onMarkTaken={async (id) => {
                        const takenAt = toLocalIso(new Date());
                        await medicationApi.markTaken({ id, takenAt, note: "" });
                        await loadWindow({ generate: false });
                    }}
                    onSetStatus={async (id, status) => {
                        await medicationApi.setStatus({ id, status, note: "" });
                        await loadWindow({ generate: false });
                    }}
                    canLoad={canLoad}
                />
            </div>
        </div>
    );
}

function Stat({ label, value, icon: Icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{value ?? "—"}</p>
        </div>
    );
}

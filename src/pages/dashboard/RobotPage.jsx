import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/authStore.js";
import {
    getRobotActivities,
    getRobotStatus,
} from "../../features/robotApi.js";

import RobotDetailsCard from "../../components/robot/RobotDetailsCard.jsx";
import RobotControlCard from "../../components/robot/RobotControlCard.jsx";
import RobotLocationCard from "../../components/robot/RobotLocationCard.jsx";
import RobotEfficiencyCard from "../../components/robot/RobotEfficiencyCard.jsx";
import RecentActivityCard from "../../components/robot/RecentActivityCard.jsx";

export default function RobotPage() {
    const user = useAuthStore((s) => s.user);

    const roles = useMemo(() => {
        const r = user?.roles || [];
        return Array.isArray(r) ? r.map(String) : [];
    }, [user]);

    const isCaregiverOrAdmin = useMemo(() => {
        const set = new Set(roles.map((x) => x.toUpperCase()));
        return set.has("ADMIN") || set.has("CAREGIVER");
    }, [roles]);

    const [status, setStatus] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingActs, setLoadingActs] = useState(true);
    const [err, setErr] = useState("");

    const mounted = useRef(true);

    async function refreshStatus() {
        try {
            const s = await getRobotStatus();
            if (!mounted.current) return;
            setStatus(s);
            setErr("");
        } catch (e) {
            if (!mounted.current) return;
            setErr(e?.message || "Failed to load robot status");
        } finally {
            if (mounted.current) setLoadingStatus(false);
        }
    }

    async function refreshActivities(limit = 35) {
        try {
            const a = await getRobotActivities(limit);
            if (!mounted.current) return;
            setActivities(Array.isArray(a) ? a : []);
            setErr("");
        } catch (e) {
            if (!mounted.current) return;
            setErr(e?.message || "Failed to load activities");
        } finally {
            if (mounted.current) setLoadingActs(false);
        }
    }

    useEffect(() => {
        mounted.current = true;
        refreshStatus();
        refreshActivities(35);

        const t1 = setInterval(refreshStatus, 2500);
        const t2 = setInterval(() => refreshActivities(35), 6000);

        return () => {
            mounted.current = false;
            clearInterval(t1);
            clearInterval(t2);
        };
    }, []);

    const recent10 = useMemo(() => activities.slice(0, 10), [activities]);

    return (
        <div className="space-y-6">
            {/* Hero / header */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT</p>
                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                            Live status, monitoring {isCaregiverOrAdmin ? "& control" : ""}
                        </h2>
                        <p className="mt-2 max-w-2xl text-slate-600">
                            This dashboard is fed by real backend simulation ticks — battery, movement, dispensing,
                            and activity feed update continuously.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/dashboard/robot/activity"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            View all activity
                        </Link>

                        <button
                            onClick={() => {
                                setLoadingStatus(true);
                                setLoadingActs(true);
                                refreshStatus();
                                refreshActivities(35);
                            }}
                            className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {err ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {err}
                    </div>
                ) : null}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left column */}
                <div className="col-span-12 xl:col-span-7 space-y-6">
                    <RobotDetailsCard status={status} loading={loadingStatus} />

                    {isCaregiverOrAdmin ? (
                        <RobotControlCard
                            status={status}
                            onCommandIssued={async () => {
                                // After issuing a command, the backend updates robot status + logs activities
                                setLoadingStatus(true);
                                setLoadingActs(true);
                                await Promise.all([refreshStatus(), refreshActivities(35)]);
                            }}
                        />
                    ) : null}

                    <RecentActivityCard activities={recent10} loading={loadingActs} />
                </div>

                {/* Right column */}
                <div className="col-span-12 xl:col-span-5 space-y-6">
                    <RobotLocationCard status={status} loading={loadingStatus} />
                    <RobotEfficiencyCard activities={activities} loading={loadingActs} />
                </div>
            </div>
        </div>
    );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/authStore.js";
import { api } from "../../utils/axios.js";

import RobotDetailsCard from "../../components/robot/RobotDetailsCard.jsx";
import RobotControlCard from "../../components/robot/RobotControlCard.jsx";
import RobotLocationCard from "../../components/robot/RobotLocationCard.jsx";
import RobotEfficiencyCard from "../../components/robot/RobotEfficiencyCard.jsx";
import RecentActivityCard from "../../components/robot/RecentActivityCard.jsx";

import { ShieldCheck, ChevronDown, Search, Check } from "lucide-react";

export function RobotPage() {
    const user = useAuthStore((s) => s.user);

    const roles = useMemo(() => {
        const r = user?.roles || [];
        return Array.isArray(r) ? r.map(String) : [];
    }, [user]);

    const roleSet = useMemo(() => new Set(roles.map((x) => String(x).toUpperCase())), [roles]);

    const isCaregiverOrAdmin = useMemo(() => {
        return (
            roleSet.has("ADMIN") ||
            roleSet.has("CAREGIVER") ||
            roleSet.has("ROLE_ADMIN") ||
            roleSet.has("ROLE_CAREGIVER")
        );
    }, [roleSet]);

    const userId = useMemo(() => user?.id ?? user?.userId ?? null, [user]);

    // -----------------------------
    // Admin "Selected user / Target user" (instead of filters)
    // -----------------------------
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const [targetUserId, setTargetUserId] = useState(""); // string id of selected ROLE_USER
    const [userQuery, setUserQuery] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuWrapRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedUser = useMemo(() => {
        if (!targetUserId) return null;
        return users.find((u) => String(u.id) === String(targetUserId)) || null;
    }, [users, targetUserId]);

    const filteredUsers = useMemo(() => {
        const q = String(userQuery || "").trim().toLowerCase();
        if (!q) return users;

        return users.filter((u) => {
            const a = String(u.displayName || "").toLowerCase();
            const b = String(u.email || "").toLowerCase();
            const c = String(u.username || "").toLowerCase();
            return a.includes(q) || b.includes(q) || c.includes(q);
        });
    }, [users, userQuery]);

    function initialsFromName(name) {
        const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "U";
        const first = parts[0]?.[0] || "U";
        const second = parts.length > 1 ? (parts[1]?.[0] || "") : "";
        return (first + second).toUpperCase();
    }

    // Load users for admin/caregiver (ROLE_USER only)
    useEffect(() => {
        if (!isCaregiverOrAdmin) return;

        let cancelled = false;

        async function loadUsers() {
            try {
                setUsersLoading(true);
                const res = await api.get("/api/users/pick", { withCredentials: true });
                if (cancelled) return;

                const data = res?.data;
                const mapped = (Array.isArray(data) ? data : []).map((u) => ({
                    id: u.id,
                    fullName: (u.fullname || "").trim(),
                    username: (u.username || "").trim(),
                    displayName: (String(u.fullname || "").trim() ||
                        String(u.username || "").trim() ||
                        `User ${u.id}`),
                    email: u.email || "",
                }));

                setUsers(mapped);

                // Default to first user if none selected
                if (!targetUserId && mapped.length > 0) {
                    setTargetUserId(String(mapped[0].id));
                }
            } catch (e) {
                console.error("[RobotPage] Failed to load users /api/users/pick", e);
            } finally {
                if (!cancelled) setUsersLoading(false);
            }
        }

        loadUsers();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCaregiverOrAdmin]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!isCaregiverOrAdmin) return;

        function onDocMouseDown(e) {
            if (!menuWrapRef.current) return;
            if (!menuWrapRef.current.contains(e.target)) setUserMenuOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [isCaregiverOrAdmin]);

    // Focus search when opening
    useEffect(() => {
        if (userMenuOpen) setTimeout(() => searchInputRef.current?.focus(), 0);
    }, [userMenuOpen]);

    // Escape closes dropdown
    useEffect(() => {
        function onKeyDown(e) {
            if (!userMenuOpen) return;
            if (e.key === "Escape") setUserMenuOpen(false);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [userMenuOpen]);

    // -----------------------------
    // Robot telemetry state
    // -----------------------------
    const [robotId, setRobotId] = useState(null);

    const [status, setStatus] = useState(null);
    const [activities, setActivities] = useState([]);

    const [initialLoadingStatus, setInitialLoadingStatus] = useState(true);
    const [initialLoadingActs, setInitialLoadingActs] = useState(true);

    const [isUpdating, setIsUpdating] = useState(false);

    const [err, setErr] = useState("");
    const [lastSyncAt, setLastSyncAt] = useState(null);

    const mounted = useRef(true);
    const inFlight = useRef(false);

    // Keep latest selection so polling doesn't re-create intervals
    const selectionRef = useRef({
        isCaregiverOrAdmin: false,
        userId: null,
        targetUserId: "",
        robotId: null,
    });

    useEffect(() => {
        selectionRef.current = {
            isCaregiverOrAdmin,
            userId,
            targetUserId,
            robotId,
        };
    }, [isCaregiverOrAdmin, userId, targetUserId, robotId]);

    const sameJSON = (a, b) => {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    };

    // Backend StatusResponse first field is id = robotId
    const pickRobotIdFromStatus = (s) => s?.id ?? null;

    const fetchFirstRobotId = useCallback(async () => {
        const res = await api.get("/api/robot", { withCredentials: true });
        const list = Array.isArray(res.data) ? res.data : [];
        if (!list.length) throw new Error("No robots found.");
        const rid = list[0]?.robotId ?? list[0]?.id ?? null;
        if (!rid) throw new Error("Robot id missing in /api/robot response.");
        return rid;
    }, []);

    const fetchStatus = useCallback(async () => {
        const sel = selectionRef.current;

        // USER flow: resolve robot by own userId
        if (!sel.isCaregiverOrAdmin) {
            if (!sel.userId) throw new Error("Missing userId.");
            const res = await api.get(`/api/robot/by-user/${sel.userId}/status`, { withCredentials: true });
            return res.data;
        }

        // ADMIN/CAREGIVER flow: resolve by TARGET USER (ID)
        const tuid = String(sel.targetUserId || "").trim();
        if (tuid) {
            const res = await api.get(`/api/robot/by-user/${encodeURIComponent(tuid)}/status`, {
                withCredentials: true,
            });
            return res.data;
        }

        // Fallback (should rarely happen): pick first robot
        const rid = await fetchFirstRobotId();
        const res = await api.get(`/api/robot/${encodeURIComponent(rid)}/status`, { withCredentials: true });
        return res.data;
    }, [fetchFirstRobotId]);

    const fetchActivities = useCallback(async (limit = 35, ridOverride = null) => {
        const sel = selectionRef.current;
        const rid = ridOverride ?? sel.robotId;
        if (!rid) return [];

        const res = await api.get(`/api/robot/${encodeURIComponent(rid)}/activities`, {
            params: { limit },
            withCredentials: true,
        });

        const data = res?.data;
        return Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
    }, []);

    const syncOnce = useCallback(
        async ({ initial = false } = {}) => {
            if (inFlight.current) return;
            inFlight.current = true;

            try {
                if (initial) {
                    setInitialLoadingStatus(true);
                    setInitialLoadingActs(true);
                } else {
                    setIsUpdating(true);
                }

                const s = await fetchStatus();
                if (!mounted.current) return;

                setStatus((prev) => (sameJSON(prev, s) ? prev : s));
                setErr("");

                const ridFromStatus = pickRobotIdFromStatus(s);

                // For admin, always trust the robotId from the resolved user status
                let effectiveRid = ridFromStatus;

                // Fallback: if somehow status didn't carry id, pick first robot
                if (isCaregiverOrAdmin && !effectiveRid) {
                    effectiveRid = await fetchFirstRobotId();
                }

                if (!mounted.current) return;

                if (effectiveRid) {
                    setRobotId((prev) => (prev === effectiveRid ? prev : effectiveRid));
                    selectionRef.current.robotId = effectiveRid;
                } else {
                    setRobotId(null);
                    selectionRef.current.robotId = null;
                }

                if (!effectiveRid) {
                    setActivities([]);
                } else {
                    const a = await fetchActivities(initial ? 35 : 20, effectiveRid);
                    if (!mounted.current) return;
                    setActivities((prev) => (sameJSON(prev, a) ? prev : a));
                }

                setLastSyncAt(new Date());
            } catch (e) {
                if (!mounted.current) return;
                console.error("[RobotPage] syncOnce failed:", e);

                const msg =
                    e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    e?.message ||
                    "Failed to load robot data";

                setErr(msg);

                if (initial) {
                    setStatus(null);
                    setActivities([]);
                    setRobotId(null);
                    selectionRef.current.robotId = null;
                }
            } finally {
                if (mounted.current) {
                    if (initial) {
                        setInitialLoadingStatus(false);
                        setInitialLoadingActs(false);
                    }
                    setIsUpdating(false);
                }
                inFlight.current = false;
            }
        },
        [fetchActivities, fetchFirstRobotId, fetchStatus, isCaregiverOrAdmin]
    );

    // Initial load + polling
    useEffect(() => {
        mounted.current = true;

        syncOnce({ initial: true });

        const statusTick = setInterval(() => syncOnce({ initial: false }), 6000);

        const activityTick = setInterval(async () => {
            if (inFlight.current) return;
            const rid = selectionRef.current.robotId;
            if (!rid) return;

            try {
                setIsUpdating(true);
                const a = await fetchActivities(20, rid);
                if (!mounted.current) return;
                setActivities((prev) => (sameJSON(prev, a) ? prev : a));
                setLastSyncAt(new Date());
            } catch (e) {
                console.warn("[RobotPage] activity tick failed:", e?.message || e);
            } finally {
                if (mounted.current) setIsUpdating(false);
            }
        }, 12000);

        return () => {
            mounted.current = false;
            clearInterval(statusTick);
            clearInterval(activityTick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncOnce, fetchActivities]);

    // Re-sync when identity/role changes
    useEffect(() => {
        syncOnce({ initial: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCaregiverOrAdmin, userId]);

    const recent10 = useMemo(() => activities.slice(0, 10), [activities]);

    const applyTargetUser = useCallback(async (nextUserId) => {
        setTargetUserId(String(nextUserId));
        setRobotId(null);
        selectionRef.current.robotId = null;
        await syncOnce({ initial: true });
    }, [syncOnce]);

    const refreshNow = useCallback(async () => {
        await syncOnce({ initial: false });
    }, [syncOnce]);

    return (
        <div className="space-y-6">
            {/* Header / hero — SAME style, upgraded admin controls */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
                {/* Row 1: badges */}
                <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-widest text-sky-700">
            {isCaregiverOrAdmin ? "ADMIN / CAREGIVER" : "USER"}
          </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-900 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-sky-700" />
            Robot Monitoring
          </span>
                </div>

                {/* Row 2: title + actions */}
                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT :</p>
                            {robotId ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  <span className="font-extrabold">{robotId}</span>
                </span>
                            ) : null}
                        </div>

                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                            Live status, monitoring & control
                        </h2>

                        <p className="mt-2 max-w-2xl text-slate-600">
                            The dashboard updates smoothly in real time, showing movement, battery level, dispensing, and recent activity without distracting refreshes.
                        </p>
                    </div>

                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <Link
                            to={robotId ? `/dashboard/robot/activity?robotId=${encodeURIComponent(robotId)}` : "/dashboard/robot/activity"}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            View all activity
                        </Link>

                        <button
                            onClick={refreshNow}
                            className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Admin-only: Selected user + Target user dropdown (replaces filter block) */}
                {isCaregiverOrAdmin ? (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Selected user */}
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-extrabold text-white">
                                {initialsFromName(selectedUser?.displayName)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                    Selected user
                                </p>
                                <p className="truncate text-sm font-extrabold text-slate-900">
                                    {selectedUser?.displayName || (usersLoading ? "Loading…" : "—")}
                                </p>
                            </div>
                        </div>

                        {/* Target user dropdown */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div
                                ref={menuWrapRef}
                                className="relative w-full sm:w-[340px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                            >
                                <p className="text-[11px] font-bold tracking-widest text-slate-500">
                                    TARGET USER
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
                                >
                  <span className="truncate">
                    {usersLoading ? "Loading…" : (selectedUser?.displayName ?? "Select a user")}
                  </span>
                                    <ChevronDown className="h-4 w-4 text-slate-500" />
                                </button>

                                {userMenuOpen ? (
                                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                        {/* search */}
                                        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
                                            <Search className="h-4 w-4 text-slate-400" />
                                            <input
                                                ref={searchInputRef}
                                                value={userQuery}
                                                onChange={(e) => setUserQuery(e.target.value)}
                                                placeholder="Search name, username, or email…"
                                                className="w-full bg-transparent text-sm outline-none"
                                            />
                                            {userQuery ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setUserQuery("")}
                                                    className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                                                >
                                                    Clear
                                                </button>
                                            ) : null}
                                        </div>

                                        {/* list */}
                                        <div className="max-h-72 overflow-auto p-1">
                                            {usersLoading ? (
                                                <div className="px-3 py-2 text-sm text-slate-500">
                                                    Loading users…
                                                </div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-slate-500">
                                                    No matches.
                                                </div>
                                            ) : (
                                                filteredUsers.map((u) => {
                                                    const active = String(u.id) === String(targetUserId);
                                                    return (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={async () => {
                                                                setUserMenuOpen(false);
                                                                setUserQuery("");
                                                                await applyTargetUser(u.id);
                                                            }}
                                                            className={[
                                                                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
                                                                active ? "bg-sky-600 text-white" : "text-slate-800 hover:bg-slate-50",
                                                            ].join(" ")}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate text-sm font-semibold">{u.displayName}</span>
                                                                    {active ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                                      <Check className="h-3 w-3" />
                                      Selected
                                    </span>
                                                                    ) : null}
                                                                </div>
                                                                {u.email ? (
                                                                    <p className={["mt-0.5 truncate text-xs", active ? "text-white/80" : "text-slate-500"].join(" ")}>
                                                                        {u.email}
                                                                    </p>
                                                                ) : null}
                                                            </div>

                                                            <span className={["ml-3 shrink-0 text-xs font-semibold", active ? "text-white/80" : "text-slate-400"].join(" ")}>
                                #{u.id}
                              </span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}

                {err ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {err}
                    </div>
                ) : null}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left */}
                <div className="col-span-12 space-y-6 xl:col-span-7">
                    <RobotDetailsCard status={status} loading={initialLoadingStatus} />

                    <RobotControlCard
                        status={status}
                        onCommandIssued={async () => {
                            await syncOnce({ initial: false });
                        }}
                    />

                    <RecentActivityCard robotId={robotId} activities={activities.slice(0, 10)} loading={initialLoadingActs} />
                </div>

                {/* Right */}
                <div className="col-span-12 space-y-6 xl:col-span-5">
                    <RobotLocationCard status={status} loading={initialLoadingStatus} />

                    {/* Keep upgraded Operational performance */}
                    <RobotEfficiencyCard activities={activities} loading={initialLoadingActs} />
                </div>
            </div>
        </div>
    );
}

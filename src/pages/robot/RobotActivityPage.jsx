import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../features/authStore.js";
import { getRobotActivities, getRobotStatusByUser } from "../../features/robotApi.js";
import { AlertTriangle, Filter, Info, ShieldAlert, ChevronDown, Search, Check } from "lucide-react";
import { api } from "../../utils/axios.js";

function labelizeEnum(v) {
    if (v == null) return "—";
    const s = String(v).trim();
    if (!s) return "—";
    return s
        .toLowerCase()
        .split("_")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
}

function fmtTime(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return String(iso);
    }
}

function severityMeta(sev) {
    const s = String(sev || "").toUpperCase();
    if (s === "WARN" || s === "WARNING")
        return { icon: AlertTriangle, pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
    if (s === "CRITICAL" || s === "ERROR")
        return { icon: ShieldAlert, pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
    return { icon: Info, pill: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
}

function isCaregiverOrAdmin(roles) {
    const set = new Set((roles || []).map((r) => String(r).toUpperCase()));
    return set.has("ADMIN") || set.has("CAREGIVER") || set.has("ROLE_ADMIN") || set.has("ROLE_CAREGIVER");
}

function initialsFromName(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? (parts[1]?.[0] || "") : "";
    return (a + b).toUpperCase();
}

function sameJSON(a, b) {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}

export default function RobotActivityPage() {
    const user = useAuthStore((s) => s.user);
    const userId = user?.id ?? user?.userId ?? null;
    const admin = isCaregiverOrAdmin(user?.roles);

    const [searchParams] = useSearchParams();
    const qpRobotId = searchParams.get("robotId") || "";
    const qpUserId = searchParams.get("userId") || "";

    // --- “Target user” selection (admin only)
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [targetUserId, setTargetUserId] = useState(qpUserId ? String(qpUserId) : "");
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

    // --- activity filters
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [severityFilter, setSeverityFilter] = useState("ALL");

    // --- resolved robot
    const [robotId, setRobotId] = useState(qpRobotId);

    // --- data
    const [raw, setRaw] = useState([]);
    const [loading, setLoading] = useState(true); // only used for initial / first load
    const [isUpdating, setIsUpdating] = useState(false); // subtle background refresh
    const [err, setErr] = useState("");

    // Option A: freeze paging when browsing older pages
    const [pendingRaw, setPendingRaw] = useState(null);
    const [newCount, setNewCount] = useState(0);

    const [page, setPage] = useState(1);
    const pageSize = 20;

    // refs so polling reads latest state without weird deps
    const pageRef = useRef(1);
    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    const rawRef = useRef([]);
    useEffect(() => {
        rawRef.current = raw;
    }, [raw]);

    // Load user list for admin/caregiver
    useEffect(() => {
        if (!admin) return;
        let cancelled = false;

        async function loadUsers() {
            try {
                setUsersLoading(true);
                const res = await api.get("/api/users/pick", { withCredentials: true });
                if (cancelled) return;

                const data = Array.isArray(res?.data) ? res.data : [];
                const mapped = data.map((u) => ({
                    id: u.id,
                    fullName: (u.fullname || "").trim(),
                    username: (u.username || "").trim(),
                    email: u.email || "",
                    displayName:
                        String(u.fullname || "").trim() ||
                        String(u.username || "").trim() ||
                        `User ${u.id}`,
                }));

                setUsers(mapped);

                if (!targetUserId && mapped.length > 0) {
                    setTargetUserId(String(mapped[0].id));
                }
            } catch (e) {
                console.error("[RobotActivityPage] Failed to load /api/users/pick", e);
            } finally {
                if (!cancelled) setUsersLoading(false);
            }
        }

        loadUsers();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admin]);

    // Dropdown close on outside click
    useEffect(() => {
        if (!admin) return;

        function onDocMouseDown(e) {
            if (!menuWrapRef.current) return;
            if (!menuWrapRef.current.contains(e.target)) setUserMenuOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [admin]);

    useEffect(() => {
        if (userMenuOpen) setTimeout(() => searchInputRef.current?.focus(), 0);
    }, [userMenuOpen]);

    useEffect(() => {
        function onKeyDown(e) {
            if (!userMenuOpen) return;
            if (e.key === "Escape") setUserMenuOpen(false);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [userMenuOpen]);

    async function resolveRobotIdForUser() {
        if (!userId) return "";
        const s = await getRobotStatusByUser(userId);
        return s?.id || "";
    }

    async function resolveRobotIdForAdmin() {
        if (robotId) return robotId;

        const tuid = String(targetUserId || "").trim();
        if (tuid) {
            const s = await getRobotStatusByUser(tuid);
            return s?.id || "";
        }

        return "";
    }

    // ---------- Option A loader ----------
    const load = useCallback(
        async ({ initial = false } = {}) => {
            try {
                if (initial) setLoading(true);
                else setIsUpdating(true);

                // IMPORTANT: don’t clear the UI on background refresh
                if (initial) setErr("");

                const rid = admin ? await resolveRobotIdForAdmin() : await resolveRobotIdForUser();
                if (!rid) {
                    if (initial) {
                        setRaw([]);
                        setErr(admin ? "Select a target user to resolve robot." : "Robot not resolved.");
                    }
                    return;
                }

                if (!robotId) setRobotId(rid);

                const limit = admin ? 500 : 50;
                const a = await getRobotActivities(rid, limit);
                const next = Array.isArray(a) ? a : [];

                const currentPage = pageRef.current;

                // If browsing older pages, freeze list and just accumulate pending
                if (currentPage > 1) {
                    const prev = rawRef.current || [];
                    const prevTopId = prev?.[0]?.id;
                    const nextTopId = next?.[0]?.id;

                    if (prevTopId && nextTopId && prevTopId !== nextTopId) {
                        const prevIds = new Set(prev.map((x) => x?.id));
                        const delta = next.filter((x) => x?.id != null && !prevIds.has(x.id)).length;

                        setPendingRaw(next);
                        setNewCount((c) => c + Math.max(0, delta || 0));
                        return; // do not apply
                    }

                    // If nothing changed at top, do nothing
                    return;
                }

                // Page 1 → apply immediately (no annoying reload: only update if changed)
                setRaw((prev) => (sameJSON(prev, next) ? prev : next));
                setPendingRaw(null);
                setNewCount(0);
            } catch (e) {
                if (initial) {
                    setErr(e?.message || "Failed to load activity");
                    setRaw([]);
                }
            } finally {
                if (initial) setLoading(false);
                setIsUpdating(false);
            }
        },
        [admin, robotId, targetUserId, userId]
    );

    // polling
    useEffect(() => {
        load({ initial: true });
        const t = setInterval(() => load({ initial: false }), 7000);
        return () => clearInterval(t);
    }, [load]);

    // When user picks a different target user → hard refresh once
    useEffect(() => {
        if (!admin) return;
        if (!targetUserId) return;

        // reset pending state
        setPendingRaw(null);
        setNewCount(0);

        // reset robotId so resolver uses selected user
        setRobotId("");
        setPage(1);

        load({ initial: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetUserId]);

    const filtered = useMemo(() => {
        let list = Array.isArray(raw) ? raw : [];
        if (typeFilter !== "ALL")
            list = list.filter((x) => String(x?.activityType || "").toUpperCase() === typeFilter);
        if (severityFilter !== "ALL")
            list = list.filter((x) => String(x?.severity || "").toUpperCase() === severityFilter);
        return list;
    }, [raw, typeFilter, severityFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage]);

    const types = useMemo(() => {
        const set = new Set(raw.map((x) => String(x?.activityType || "").toUpperCase()).filter(Boolean));
        return ["ALL", ...Array.from(set).sort()];
    }, [raw]);

    const severities = useMemo(() => {
        const set = new Set(raw.map((x) => String(x?.severity || "").toUpperCase()).filter(Boolean));
        return ["ALL", ...Array.from(set).sort()];
    }, [raw]);

    // Reset pagination when filters change (but NOT when new events arrive)
    useEffect(() => {
        setPage(1);
        pageRef.current = 1;
    }, [typeFilter, severityFilter, robotId, targetUserId]);

    const grouped = useMemo(() => {
        const map = new Map();
        for (const a of pageItems) {
            const d = a?.activityTime ? new Date(a.activityTime) : null;
            const key = d ? d.toLocaleDateString() : "Unknown date";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(a);
        }
        return Array.from(map.entries());
    }, [pageItems]);

    const applyPending = () => {
        if (!pendingRaw) return;
        setRaw(pendingRaw);
        setPendingRaw(null);
        setNewCount(0);
        setPage(1);
        pageRef.current = 1;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-slate-500">ROBOT</p>
                        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Activity Stream</h2>
                        <p className="mt-2 text-slate-600">
                            {admin
                                ? "Admin view — filter and browse activity history."
                                : "User view — last 50 activities."}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                            Robot: <span className="text-slate-700">{robotId || "—"}</span>
                            {isUpdating ? (
                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  Updating…
                </span>
                            ) : null}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/dashboard/robot"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Back to Robot
                        </Link>
                        <button
                            onClick={() => load({ initial: false })}
                            className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Admin: Selected user + Target user */}
                {admin ? (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Selected user */}
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-extrabold text-white">
                                {initialsFromName(selectedUser?.displayName)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Selected user</p>
                                <p className="truncate text-sm font-extrabold text-slate-900">
                                    {selectedUser?.displayName || (usersLoading ? "Loading…" : "—")}
                                </p>
                            </div>
                        </div>

                        {/* Target user dropdown */}
                        <div
                            ref={menuWrapRef}
                            className="relative w-full sm:w-[360px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                            <p className="text-[11px] font-bold tracking-widest text-slate-500">TARGET USER</p>

                            <button
                                type="button"
                                onClick={() => setUserMenuOpen((v) => !v)}
                                className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
                            >
                <span className="truncate">
                  {usersLoading ? "Loading…" : selectedUser?.displayName || "Select a user"}
                </span>
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                            </button>

                            {userMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
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

                                    <div className="max-h-72 overflow-auto p-1">
                                        {usersLoading ? (
                                            <div className="px-3 py-2 text-sm text-slate-500">Loading users…</div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-slate-500">No matches.</div>
                                        ) : (
                                            filteredUsers.map((u) => {
                                                const active = String(u.id) === String(targetUserId);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setUserMenuOpen(false);
                                                            setUserQuery("");
                                                            setTargetUserId(String(u.id));
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
                                                                <p
                                                                    className={[
                                                                        "mt-0.5 truncate text-xs",
                                                                        active ? "text-white/80" : "text-slate-500",
                                                                    ].join(" ")}
                                                                >
                                                                    {u.email}
                                                                </p>
                                                            ) : null}
                                                        </div>

                                                        <span
                                                            className={[
                                                                "ml-3 shrink-0 text-xs font-semibold",
                                                                active ? "text-white/80" : "text-slate-400",
                                                            ].join(" ")}
                                                        >
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
                ) : null}

                {/* Existing admin filters */}
                {admin ? (
                    <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <label className="text-[11px] font-extrabold tracking-widest text-slate-500">ACTIVITY TYPE</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                            >
                                {types.map((t) => (
                                    <option key={t} value={t}>
                                        {t === "ALL" ? "All" : labelizeEnum(t)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <label className="text-[11px] font-extrabold tracking-widest text-slate-500">SEVERITY</label>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                            >
                                {severities.map((s) => (
                                    <option key={s} value={s}>
                                        {s === "ALL" ? "All" : labelizeEnum(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : null}

                {err ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {err}
                    </div>
                ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
                {loading ? (
                    <div className="p-6">
                        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        {filtered.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">No activity.</div>
                        ) : (
                            <>
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <Filter className="h-4 w-4" />
                                        Showing <span className="font-extrabold text-slate-900">{filtered.length}</span> events
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Option A pill: show only when browsing older pages */}
                                        {page > 1 && newCount > 0 ? (
                                            <button
                                                onClick={applyPending}
                                                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800 shadow-sm hover:brightness-105"
                                            >
                                                +{newCount} new activities — Jump to latest
                                            </button>
                                        ) : null}

                                        <button
                                            disabled={safePage <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                                            Page <span className="font-extrabold text-slate-900">{safePage}</span> / {totalPages}
                                        </div>
                                        <button
                                            disabled={safePage >= totalPages}
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {grouped.map(([date, items]) => (
                                        <div key={date}>
                                            <p className="text-xs font-bold tracking-widest text-slate-500">{date}</p>
                                            <div className="mt-3 space-y-2">
                                                {items.map((a) => {
                                                    const meta = severityMeta(a?.severity);
                                                    const Icon = meta.icon;
                                                    return (
                                                        <div
                                                            key={a?.id}
                                                            className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${meta.pill}`}
                                  >
                                    <Icon className="h-4 w-4" />
                                      {labelizeEnum(a?.severity || "INFO")}
                                  </span>
                                                                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                    {labelizeEnum(a?.activityType || "—")}
                                  </span>
                                                                </div>

                                                                <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                                                                    {a?.activityDescription || "—"}
                                                                </p>
                                                            </div>

                                                            <div className="shrink-0 text-xs font-semibold text-slate-500">{fmtTime(a?.activityTime)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

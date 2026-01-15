import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, CalendarRange, Plus, ChevronDown, Search, Check } from "lucide-react";

import Alert from "../../components/general/Alert.jsx";
import { apiFetch, toLocalIso } from "../../features/apiFetch.js";
import { doseApi } from "../../features/doseApi.js";

import WindowBar from "../../components/dose-admin/WindowBar.jsx";
import StatTiles from "../../components/dose-admin/StatTiles.jsx";
import DosesTable from "../../components/dose-admin/DosesTable.jsx";
import OccurrencesTable from "../../components/dose-admin/OccurrencesTable.jsx";
import DoseBuilderModal from "../../components/dose-admin/DoseBuilderModal.jsx";

export default function DosesSchedulesAdminPage() {
    const [userId, setUserId] = useState("");
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Searchable dropdown state
    const [userQuery, setUserQuery] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuWrapRef = useRef(null);
    const searchInputRef = useRef(null);

    const [from, setFrom] = useState(() =>
        toLocalIso(new Date(new Date().setHours(0, 0, 0, 0)))
    );
    const [to, setTo] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(23, 59, 59, 0);
        return toLocalIso(d);
    });

    const [tab, setTab] = useState("DOSES"); // "DOSES" | "OCC"
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [notice, setNotice] = useState("");

    const [doses, setDoses] = useState([]);
    const [windowResp, setWindowResp] = useState(null);

    const [openBuilder, setOpenBuilder] = useState(false);
    const [editDose, setEditDose] = useState(null);

    // option to auto-generate occurrences window after creating a dose
    const [generateAfterCreate, setGenerateAfterCreate] = useState(true);

    const safeUserId = useMemo(() => {
        const n = Number(String(userId || "").trim());
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [userId]);

    const userReady = Boolean(safeUserId);

    const selectedUser = useMemo(() => {
        return users.find((u) => String(u.id) === String(userId)) || null;
    }, [users, userId]);

    // Load users (ONLY ROLE_USER backend endpoint: /api/users/pick)
    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                setUsersLoading(true);
                const data = await apiFetch("/api/users/pick");
                if (cancelled) return;

                // ✅ full name only (no @username)
                const mapped = (Array.isArray(data) ? data : []).map((u) => ({
                    id: u.id,
                    fullName: (u.fullname || "").trim(),
                    username: (u.username || "").trim(),
                    // displayName prefers fullname, falls back to username
                    displayName: ((u.fullname || "").trim() || (u.username || "").trim() || `User ${u.id}`),
                    email: u.email || "",
                }));

                setUsers(mapped);

                if (!userId && mapped.length > 0) {
                    setUserId(String(mapped[0].id));
                }
            } catch (e) {
                console.error("Failed to load users", e);
            } finally {
                if (!cancelled) setUsersLoading(false);
            }
        }

        loadUsers();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close menu on outside click
    useEffect(() => {
        function onDocMouseDown(e) {
            if (!menuWrapRef.current) return;
            if (!menuWrapRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    // Focus search when opening
    useEffect(() => {
        if (userMenuOpen) {
            // slight delay so the input exists
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
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

    async function refreshAll() {
        if (!safeUserId) {
            setErr("Pick a target user to load doses and occurrences.");
            return;
        }

        setLoading(true);
        setErr("");
        setNotice("");
        try {
            const [doseList, win] = await Promise.all([
                doseApi.listDoses({ userId: safeUserId }),
                doseApi.listWindow({ userId: safeUserId, from, to }),
            ]);

            setDoses(Array.isArray(doseList) ? doseList : []);
            setWindowResp(win || null);
        } catch (e) {
            setErr(e?.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    }

    async function refreshWindowOnly() {
        if (!safeUserId) return;
        const win = await doseApi.listWindow({ userId: safeUserId, from, to });
        setWindowResp(win || null);
    }

    async function generateWindow() {
        if (!safeUserId) {
            setErr("Pick a target user first.");
            return;
        }

        const prevCount = windowResp?.items?.length || 0;

        setLoading(true);
        setErr("");
        setNotice("");

        try {
            const win = await doseApi.generateWindow({ userId: safeUserId, from, to });
            setWindowResp(win || null);
            setTab("OCC");

            const nextCount = win?.items?.length || 0;
            const added = Math.max(0, nextCount - prevCount);

            if (added > 0) {
                setNotice(`Generated ${added} new occurrence(s) for the selected range.`);
            } else {
                setNotice("No new occurrences — schedule already exists for this range.");
            }
        } catch (e) {
            setErr(e?.message || "Failed to generate schedule.");
        } finally {
            setLoading(false);
        }
    }


    const occItems = useMemo(() => windowResp?.items || [], [windowResp]);

    const stats = useMemo(() => {
        const totalDoses = doses.length;

        const totalOcc = occItems.length;
        const taken = occItems.filter((x) => x.status === "TAKEN").length;
        const due = occItems.filter((x) => x.status === "DUE").length;
        const missed = occItems.filter((x) => x.status === "MISSED").length;
        const scheduled = occItems.filter((x) => x.status === "SCHEDULED").length;

        const rate = totalOcc ? Math.round((taken / totalOcc) * 100) : 0;

        return { totalDoses, totalOcc, taken, due, missed, scheduled, rate };
    }, [doses, occItems]);

    return (
        <div className="space-y-6">
            {/* Header / hero — EXACT layout requested */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-100 via-white to-emerald-50 p-6 shadow-sm">
                {/* Row 1: badges */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest text-emerald-700">
                        ADMIN / CAREGIVER
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-900 shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-emerald-700" />
                        Doses & Schedules
                    </span>
                </div>

                {/* Row 2: title */}
                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
                    Treatment control center
                </h2>

                {/* Row 3: description */}
                <p className="mt-2 max-w-2xl text-slate-600">
                    Create doses, generate schedule windows, and audit adherence — all in one place.
                </p>

                {/* Row 4: Selected user (left) + Target user + New Dose (right) */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Selected user */}
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">
                        {initialsFromName(selectedUser?.displayName)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                Selected user
                            </p>
                            <p className="truncate text-sm font-extrabold text-slate-900">
                                {selectedUser?.displayName || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Target user dropdown (searchable) */}
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

                            {/* ✅ Drop Down Menu */}
                            {userMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                    {/* search bar */}
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
                                                const active = String(u.id) === String(userId);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setUserId(String(u.id));
                                                            setUserMenuOpen(false);
                                                            setUserQuery("");
                                                        }}
                                                        className={[
                                                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
                                                            active
                                                                ? "bg-emerald-600 text-white"
                                                                : "text-slate-800 hover:bg-slate-50",
                                                        ].join(" ")}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="truncate text-sm font-semibold">
                                                                    {u.displayName}
                                                                </span>
                                                                {active ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                                                                        <Check className="h-3 w-3" />
                                                                        Selected
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {/* subtle secondary line (optional): email, not username in main label */}
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

                        {/* New Dose */}
                        <button
                            disabled={!userReady || loading}
                            onClick={() => {
                                if (!userReady) {
                                    setErr("Pick a target user before creating a dose.");
                                    return;
                                }
                                setEditDose(null);
                                setOpenBuilder(true);
                            }}
                            className={[
                                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
                                userReady && !loading
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                ,
                            ].join(" ")}
                        >
                            <Plus className="h-4 w-4" />
                            New Dose
                        </button>
                    </div>
                </div>

                {/* Optional automation toggle stays below header (kept from your previous design) */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-xs font-bold tracking-widest text-slate-500">AUTOMATION</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            Generate occurrences window after creating a dose
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Uses the current window ({from} → {to}).
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setGenerateAfterCreate((v) => !v)}
                        className={[
                            "rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition",
                            generateAfterCreate
                                ? "border-emerald-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
                                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        {generateAfterCreate ? "Enabled" : "Disabled"}
                    </button>
                </div>

                {err ? (
                    <div className="mt-4">
                        <Alert title="Action required" messages={[err]} />
                    </div>
                ) : null}

                {notice ? (
                    <div className="mt-4">
                        <Alert title="Update" messages={[notice]} />
                    </div>
                ) : null}

            </div>

            {/* Controls */}
            <WindowBar
                from={from}
                setFrom={setFrom}
                to={to}
                setTo={setTo}
                loading={loading}
                onGenerate={generateWindow}
                onRefresh={refreshAll}
            />


            {/* Stats */}
            <StatTiles stats={stats} />

            {/* Tabs + Content */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
                        <button
                            onClick={() => setTab("DOSES")}
                            className={[
                                "rounded-2xl px-4 py-2 text-sm font-semibold",
                                tab === "DOSES"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            Doses
                        </button>
                        <button
                            onClick={() => setTab("OCC")}
                            className={[
                                "rounded-2xl px-4 py-2 text-sm font-semibold",
                                tab === "OCC"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            Occurrences
                        </button>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        <CalendarRange className="h-4 w-4 text-slate-500" />
                        Window
                        <span className="text-slate-500">•</span>
                        <span className="font-extrabold">{occItems.length}</span>
                        items
                    </div>
                </div>

                <div className="mt-5">
                    {tab === "DOSES" ? (
                        <DosesTable
                            rows={doses}
                            onEdit={(d) => {
                                setEditDose(d);
                                setOpenBuilder(true);
                            }}
                            onDelete={async (id) => {
                                setLoading(true);
                                setErr("");
                                try {
                                    await doseApi.deleteDose(id);
                                    await refreshAll();
                                } catch (e) {
                                    setErr(e?.message || "Delete failed.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            onQuickRefresh={refreshAll}
                        />
                    ) : (
                        <OccurrencesTable
                            rows={occItems}
                            onSetStatus={async ({ id, status, note }) => {
                                setLoading(true);
                                setErr("");
                                try {
                                    await doseApi.setStatus({ id, status, note });
                                    await refreshWindowOnly();
                                } catch (e) {
                                    setErr(e?.message || "Update failed.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Builder modal */}
            <DoseBuilderModal
                open={openBuilder}
                onClose={() => { setOpenBuilder(false); setEditDose(null); }}
                userId={safeUserId}
                userFullName={selectedUser?.displayName}   // ✅ add this
                editDose={editDose}
                onCreated={async () => {
                    setOpenBuilder(false);
                    setEditDose(null);

                    await refreshAll();

                    if (generateAfterCreate) {
                        await generateWindow();
                    }
                }}
                onUpdated={async () => {
                    setOpenBuilder(false);
                    setEditDose(null);
                    await refreshAll();
                }}
            />
        </div>
    );
}

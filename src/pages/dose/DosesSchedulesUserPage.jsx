// src/pages/dashboard/DosesSchedulesUserPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bell,
    CalendarDays,
    CheckCircle2,
    Clock,
    Pill,
    Sparkles,
    Vault,
    AlertTriangle,
    X,
    Grid3X3,
    PackageOpen,
    CalendarRange,
    RefreshCcw,
    CircleDashed,
    Info,
    Lock,
} from "lucide-react";

import Alert from "../../components/general/Alert.jsx";
import { apiFetch, toLocalIso } from "../../features/apiFetch.js";
import { doseApi } from "../../features/doseApi.js";
import { notificationsApi } from "../../features/notificationsApi.js";
import { useAuthStore } from "../../features/authStore.js";

/* -------------------------------- helpers -------------------------------- */
function cx(...arr) {
    return arr.filter(Boolean).join(" ");
}
function pad2(n) {
    return String(n).padStart(2, "0");
}
function formatLocalDate(d) {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
function prettyDayLabel(yyyyMmDd) {
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    const today = formatLocalDate(new Date());
    const tomorrow = formatLocalDate(new Date(Date.now() + 86400000));
    if (yyyyMmDd === today) return "Today";
    if (yyyyMmDd === tomorrow) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function statusUpper(status) {
    return String(status || "").toUpperCase();
}
function isFinalizedOccurrence(o) {
    const s = statusUpper(o?.status);
    return s === "TAKEN" || s === "MISSED";
}
function statusMeta(status) {
    const s = statusUpper(status);
    if (s === "TAKEN")
        return { label: "Taken", chip: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 };
    if (s === "MISSED")
        return { label: "Missed", chip: "bg-rose-50 text-rose-800 border-rose-200", icon: AlertTriangle };
    if (s === "DUE")
        return { label: "Due", chip: "bg-amber-50 text-amber-900 border-amber-200", icon: Clock };
    return { label: "Scheduled", chip: "bg-slate-50 text-slate-700 border-slate-200", icon: CircleDashed };
}
function timeHM(localDateTimeStr) {
    if (!localDateTimeStr) return "—";
    const t = String(localDateTimeStr).split("T")[1] || "";
    return t ? t.slice(0, 5) : "—";
}
function dateOnly(localDateTimeStr) {
    if (!localDateTimeStr) return "";
    return String(localDateTimeStr).split("T")[0] || "";
}
function isTodayDate(yyyyMmDd) {
    return String(yyyyMmDd) === formatLocalDate(new Date());
}
function todayDayOfMonth() {
    return new Date().getDate();
}
function daysInMonth(year, monthIndex0) {
    return new Date(year, monthIndex0 + 1, 0).getDate();
}
function buildDateFromSelectedMonth(selectedDay, dayOfMonth) {
    const base = selectedDay ? new Date(`${selectedDay}T00:00:00`) : new Date();
    const y = base.getFullYear();
    const m0 = base.getMonth();
    const dim = daysInMonth(y, m0);
    const dd = Math.max(1, Math.min(dim, Number(dayOfMonth) || 1));
    return `${y}-${pad2(m0 + 1)}-${pad2(dd)}`;
}

/* ------------------------ Notification helpers (overview) ------------------------ */
function prettyEnum(v) {
    if (!v) return "";
    return String(v)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
function timeAgo(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
}
function overviewToneFromSeverity(sev) {
    // Keep your existing design: emerald for positive, sky for everything else.
    return sev === "SUCCESS" ? "emerald" : "sky";
}
function overviewTitle(n) {
    const r = n?.rule;
    switch (r) {
        case "DOSE_DUE":
            return "Medication due";
        case "DOSE_CONFIRM_REQUIRED":
            return "Confirmation needed";
        case "DOSE_MISSED":
            return "Medication missed";
        case "DOSE_TAKEN":
            return "Medication taken";
        case "DOSE_TAKEN_LATE":
            return "Taken late";
        case "DOSE_DUPLICATE_ATTEMPT":
            return "Duplicate attempt blocked";

        case "DISPENSER_EMPTY":
            return "Dispenser empty";
        case "DISPENSER_LOW":
            return "Dispenser running low";
        case "DISPENSE_FAILED":
            return "Dispense failed";
        case "DISPENSE_SUCCESS":
            return "Dispense successful";

        default:
            return n?.title || (r ? prettyEnum(r) : "Update");
    }
}
function overviewBody(n) {
    const r = n?.rule;
    switch (r) {
        case "DOSE_DUE":
            return "Your scheduled medication is due now.";
        case "DOSE_CONFIRM_REQUIRED":
            return "Please confirm whether you took your medication.";
        case "DOSE_MISSED":
            return "A scheduled medication dose was missed.";
        case "DOSE_TAKEN":
            return "Your medication was marked as taken.";
        case "DOSE_TAKEN_LATE":
            return "This medication was marked as taken after the scheduled time.";
        case "DOSE_DUPLICATE_ATTEMPT":
            return "A second “taken” attempt was blocked to prevent duplicates.";

        case "DISPENSER_EMPTY":
            return "No pills are available. Refill required.";
        case "DISPENSER_LOW":
            return "The dispenser is running low. Plan a refill soon.";
        case "DISPENSE_FAILED":
            return "The dispenser couldn’t dispense the medication. Please check it.";
        case "DISPENSE_SUCCESS":
            return "Medication was dispensed successfully.";

        default:
            return n?.message || "";
    }
}
function isDoseOrDispenserNotification(n) {
    const t = n?.type;
    return t === "MEDICATION" || t === "DISPENSER";
}
function isWorthShowingInOverview(n) {
    // keep overview focused on things that matter
    const r = n?.rule;
    // Hide noisy FYI if you want — tweak freely.
    if (r === "DOSE_TAKEN" || r === "DISPENSE_SUCCESS") return false;
    return true;
}

/* -------------------------------- Modal -------------------------------- */
function Modal({ open, title, children, onClose, widthClass = "max-w-4xl" }) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className={cx("relative w-[92vw]", widthClass)}>
                <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                    <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold tracking-widest text-emerald-700">SHOWCASE</p>
                            <h3 className="truncate text-lg font-extrabold text-slate-900">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"
                            aria-label="Close modal"
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-[78vh] overflow-y-auto overscroll-contain p-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function DosesSchedulesUserPage() {
    const user = useAuthStore((s) => s.user);
    const userId = user?.id || user?.userId || user?.profileId || null;

    /* ---------------- Robot ID resolution (fixes “No robot assigned”) ---------------- */
    const inlineRobotId =
        user?.robotId || user?.robot?.id || user?.robot?.robotId || user?.assignedRobotId || user?.robotAssignment?.robotId || null;

    const [resolvedRobotId, setResolvedRobotId] = useState(inlineRobotId);
    const effectiveRobotId = resolvedRobotId || inlineRobotId;
    const hasRobot = Boolean(effectiveRobotId);

    useEffect(() => {
        if (inlineRobotId) {
            setResolvedRobotId(inlineRobotId);
            return;
        }
        if (!userId) {
            setResolvedRobotId(null);
            return;
        }

        let mounted = true;
        (async () => {
            try {
                const status = await apiFetch(`/api/robot/by-user/${encodeURIComponent(String(userId))}/status`);
                if (!mounted) return;
                setResolvedRobotId(status?.id || null);
            } catch {
                if (!mounted) return;
                setResolvedRobotId(null);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [userId, inlineRobotId]);

    /* ---------------- Date window ---------------- */
    const [from] = useState(() => toLocalIso(startOfDay(new Date())));
    const [to] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return toLocalIso(endOfDay(d));
    });

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [notice, setNotice] = useState("");

    const [doses, setDoses] = useState([]);
    const [windowResp, setWindowResp] = useState(null);
    const occ = useMemo(() => windowResp?.items || [], [windowResp]);

    /* ---------------- Dispenser ---------------- */
    const [dispenser, setDispenser] = useState(null);
    const [dispenserLoading, setDispenserLoading] = useState(false);
    const [openVault, setOpenVault] = useState(false);

    /* ---------------- Notifications overview (backend) ---------------- */
    const [notif, setNotif] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);

    /* ---------------- Day selection ---------------- */
    const [selectedDay, setSelectedDay] = useState(() => formatLocalDate(new Date()));
    const viewingToday = isTodayDate(selectedDay);

    const doseById = useMemo(() => {
        const m = new Map();
        (Array.isArray(doses) ? doses : []).forEach((d) => m.set(d.id, d));
        return m;
    }, [doses]);

    const dayOcc = useMemo(() => {
        const day = String(selectedDay || "");
        return occ
            .filter((o) => dateOnly(o.scheduledAt) === day)
            .slice()
            .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
    }, [occ, selectedDay]);

    const upcoming = useMemo(() => {
        const nowIso = toLocalIso(new Date());
        return occ
            .filter((o) => String(o.scheduledAt) >= String(nowIso))
            .slice()
            .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)))
            .slice(0, 10);
    }, [occ]);

    const adherence = useMemo(() => {
        const total = occ.length || 0;
        const taken = occ.filter((x) => statusUpper(x.status) === "TAKEN").length;
        const missed = occ.filter((x) => statusUpper(x.status) === "MISSED").length;
        const due = occ.filter((x) => statusUpper(x.status) === "DUE").length;
        const scheduled = occ.filter((x) => statusUpper(x.status) === "SCHEDULED").length;
        const rate = total ? Math.round((taken / total) * 100) : 0;
        return { total, taken, missed, due, scheduled, rate };
    }, [occ]);

    const dispenserStats = useMemo(() => {
        const c = dispenser?.compartments || [];
        const totalPills = c.reduce((acc, x) => acc + (x?.pillsCount || 0), 0);
        const totalCap = c.reduce((acc, x) => acc + (x?.pillCapacity || 0), 0);
        const pct = totalCap ? Math.round((totalPills / totalCap) * 100) : 0;
        const low = c.filter((x) => (x?.pillCapacity || 0) > 0 && (x?.pillsCount || 0) <= Math.max(1, Math.floor((x.pillCapacity || 0) * 0.2))).length;
        return { totalPills, totalCap, pct, low, compartments: c.length };
    }, [dispenser]);

    const dayStrip = useMemo(() => {
        const base = startOfDay(new Date());
        const days = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date(base);
            d.setDate(d.getDate() + i);
            days.push(formatLocalDate(d));
        }
        return days;
    }, []);

    /* ---------------- Data loaders ---------------- */
    async function loadNotificationsOverview() {
        if (!userId) {
            setNotif([]);
            return;
        }

        setNotifLoading(true);
        try {
            // Backend supports one type per call — so fetch MEDICATION + DISPENSER then merge.
            const [med, disp] = await Promise.all([
                notificationsApi.list({ userId, type: "MEDICATION", unreadOnly: false, page: 0, size: 8 }),
                notificationsApi.list({ userId, type: "DISPENSER", unreadOnly: false, page: 0, size: 8 }),
            ]);

            const merged = [...(med?.content || []), ...(disp?.content || [])]
                .filter(isDoseOrDispenserNotification)
                .filter(isWorthShowingInOverview)
                .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
                .slice(0, 2)
                .map((n) => ({
                    id: n.id,
                    title: overviewTitle(n),
                    body: overviewBody(n),
                    time: timeAgo(n.createdAt),
                    tone: overviewToneFromSeverity(n.severity),
                }));

            setNotif(merged);
        } catch {
            // Don't break the whole page for overview widgets
            setNotif([]);
        } finally {
            setNotifLoading(false);
        }
    }

    async function loadAll() {
        setLoading(true);
        setErr("");
        setNotice("");

        try {
            const [doseList, win] = await Promise.all([
                userId ? doseApi.listDoses({ userId }) : apiFetch("/api/doses"),
                userId
                    ? doseApi.listWindow({ userId, from, to })
                    : apiFetch(`/api/dose-occurrences?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
            ]);

            setDoses(Array.isArray(doseList) ? doseList : []);
            setWindowResp(win || null);
        } catch (e) {
            setErr(e?.message || "Failed to load doses/schedule.");
        } finally {
            setLoading(false);
        }
    }

    async function loadDispenser() {
        if (!effectiveRobotId) return;

        setDispenserLoading(true);
        try {
            const d = await apiFetch(`/api/dispenser/${encodeURIComponent(String(effectiveRobotId))}`);
            setDispenser(d || null);
        } catch {
            setDispenser(null);
        } finally {
            setDispenserLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        loadNotificationsOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadDispenser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveRobotId]);

    useEffect(() => {
        loadNotificationsOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    /* ---------------- Actions (TAKEN / MISSED only) ---------------- */
    function canUpdateOccurrenceLocal(occurrence) {
        const occDay = dateOnly(occurrence?.scheduledAt);
        if (!isTodayDate(occDay)) return false;
        if (isFinalizedOccurrence(occurrence)) return false;
        return true;
    }

    async function markTaken(occurrence) {
        const occDay = dateOnly(occurrence?.scheduledAt);

        if (!isTodayDate(occDay)) {
            setErr("You can only update doses scheduled for today.");
            return;
        }

        const s = statusUpper(occurrence?.status);
        if (s === "TAKEN") {
            setErr("This dose is already marked as taken. It can’t be changed.");
            return;
        }
        if (s === "MISSED") {
            setErr("This dose is already marked as missed. It can’t be changed.");
            return;
        }

        if (!canUpdateOccurrenceLocal(occurrence)) {
            setErr("This dose is finalized and can’t be changed.");
            return;
        }

        setErr("");
        setNotice("");
        try {
            await doseApi.markTaken({ id: occurrence.id, takenAt: toLocalIso(new Date()), note: "" });
            setNotice("Marked as taken ✅");
            await loadAll();
            await loadNotificationsOverview();
        } catch (e) {
            setErr(e?.message || "Failed to mark taken.");
        }
    }

    async function setMissed(occurrence) {
        const occDay = dateOnly(occurrence?.scheduledAt);

        if (!isTodayDate(occDay)) {
            setErr("You can only update doses scheduled for today.");
            return;
        }

        const s = statusUpper(occurrence?.status);
        if (s === "MISSED") {
            setErr("This dose is already marked as missed. It can’t be changed.");
            return;
        }
        if (s === "TAKEN") {
            setErr("This dose is already marked as taken. It can’t be changed.");
            return;
        }

        if (!canUpdateOccurrenceLocal(occurrence)) {
            setErr("This dose is finalized and can’t be changed.");
            return;
        }

        setErr("");
        setNotice("");
        try {
            await doseApi.setStatus({ id: occurrence.id, status: "MISSED", note: "" });
            setNotice("Marked as missed.");
            await loadAll();
            await loadNotificationsOverview();
        } catch (e) {
            setErr(e?.message || "Failed to update status.");
        }
    }

    /* ---------------- WOW: connect vault day tiles to calendar ---------------- */
    function jumpToVaultDay(dayOfMonth) {
        const next = buildDateFromSelectedMonth(selectedDay, dayOfMonth);
        setSelectedDay(next);
    }

    return (
        <div className="space-y-6">
            {/* HERO */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-100 via-white to-sky-50 p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest text-emerald-700">USER VIEW</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                        <Sparkles className="h-4 w-4 text-emerald-700" />
                        Doses & Schedules
                    </span>

                    {!viewingToday ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                            <Lock className="h-4 w-4" />
                            Read-only (not today)
                        </span>
                    ) : null}
                </div>

                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Your treatment, beautifully organized</h2>
                <p className="mt-2 max-w-2xl text-slate-600">
                    See what’s coming, confirm what you’ve taken, and keep your schedule effortless.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-500 text-white shadow-sm">
                            <Pill className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold tracking-widest text-slate-500">ADHERENCE</p>
                            <p className="truncate text-sm font-extrabold text-slate-900">
                                {adherence.rate}% taken
                                <span className="text-slate-500 font-semibold"> • </span>
                                <span className="text-slate-700 font-semibold">
                                    {adherence.taken}/{adherence.total || 0}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <CalendarRange className="h-4 w-4 text-slate-500" />
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold tracking-widest text-slate-500">WINDOW</p>
                                <p className="text-sm font-extrabold text-slate-900 truncate">Next 7 days</p>
                                <p className="text-xs text-slate-500 truncate">
                                    {from} → {to}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                loadAll();
                                loadNotificationsOverview();
                                loadDispenser();
                            }}
                            disabled={loading}
                            className={cx(
                                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
                                loading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                            type="button"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {err ? (
                    <div className="mt-4">
                        <Alert title="Action required" messages={[err]} variant="error" />
                    </div>
                ) : null}

                {notice ? (
                    <div className="mt-4">
                        <Alert title="Update" messages={[notice]} variant="success" />
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-6">
                    <NotificationsOverview items={notif} loading={notifLoading} />
                    <DispenserShowcase
                        hasRobot={hasRobot}
                        robotId={effectiveRobotId}
                        dispenser={dispenser}
                        loading={dispenserLoading}
                        stats={dispenserStats}
                        selectedDay={selectedDay}
                        onJumpToVaultDay={jumpToVaultDay}
                        onOpenVault={() => setOpenVault(true)}
                        onRefresh={loadDispenser}
                    />
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <TreatmentDetails
                        doses={doses}
                        occForDay={dayOcc}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        dayStrip={dayStrip}
                        doseById={doseById}
                        onMarkTaken={markTaken}
                        onSetMissed={setMissed}
                    />
                    <ScheduleTimeline upcoming={upcoming} doseById={doseById} onMarkTaken={markTaken} onSetMissed={setMissed} />
                </div>
            </div>

            <Modal open={openVault} title="Dispenser compartments — Pill Vault" onClose={() => setOpenVault(false)} widthClass="max-w-5xl">
                <VaultGrid dispenser={dispenser} selectedDay={selectedDay} onSelectDay={jumpToVaultDay} />
            </Modal>
        </div>
    );
}

/* ------------------------------ sections ------------------------------ */
function NotificationsOverview({ items, loading }) {
    const list = (items || []).slice(0, 2);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold tracking-widest text-slate-500">NOTIFICATIONS</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">Recent updates</h3>
                    <p className="mt-1 text-sm text-slate-600">Dose/schedule + dispenser only.</p>
                </div>

                <Link
                    to="/dashboard/notifications"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <Bell className="h-4 w-4 text-violet-600" />
                    View all
                </Link>
            </div>

            <div className="mt-4 space-y-3">
                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white">
                                <CircleDashed className="h-5 w-5 text-slate-600 animate-spin" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">Loading updates…</p>
                                <p className="mt-1 text-sm text-slate-600">Pulling the latest medication + dispenser alerts.</p>
                            </div>
                        </div>
                    </div>
                ) : list.length ? (
                    list.map((n) => (
                        <div
                            key={n.id}
                            className={cx(
                                "rounded-2xl border p-4 transition",
                                n.tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" : "border-sky-200 bg-sky-50/60"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cx(
                                        "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border bg-white",
                                        n.tone === "emerald" ? "border-emerald-200" : "border-sky-200"
                                    )}
                                >
                                    {n.tone === "emerald" ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                        <Clock className="h-5 w-5 text-sky-600" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-extrabold text-slate-900">{n.title}</p>
                                        <span className="shrink-0 text-xs font-semibold text-slate-500">{n.time}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white">
                                <Info className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">No updates yet</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    When something is due/missed or the dispenser runs low, it’ll show here.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DispenserShowcase({ hasRobot, robotId, dispenser, loading, stats, selectedDay, onJumpToVaultDay, onOpenVault, onRefresh }) {
    const todayDM = todayDayOfMonth();

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold tracking-widest text-slate-500">DISPENSER</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">Pill Vault status</h3>
                    <p className="mt-1 text-sm text-slate-600">A quick visual health check of your compartments.</p>
                </div>

                <button
                    onClick={onRefresh}
                    disabled={!hasRobot || loading}
                    className={cx(
                        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition",
                        !hasRobot || loading
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    )}
                    type="button"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {!hasRobot ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-amber-200 bg-white">
                            <AlertTriangle className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-amber-900">No robot assigned</p>
                            <p className="mt-1 text-sm text-amber-800">
                                If you do have one, your auth payload likely doesn’t include robotId — this page resolves it from backend.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="mt-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 text-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold tracking-widest text-white/70">ROBOT ID</p>
                                <p className="mt-1 truncate text-sm font-extrabold">{robotId}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                                        {stats.compartments || 0} compartments
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                                        {stats.totalPills || 0} pills loaded
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                                        {stats.pct || 0}% filled
                                    </span>
                                    {stats.low ? (
                                        <span className="inline-flex items-center rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
                                            {stats.low} low
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                                            Stable
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid place-items-center rounded-3xl border border-white/15 bg-white/10 p-3">
                                <Vault className="h-7 w-7 text-emerald-200" />
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-center justify-between text-xs text-white/70">
                                <span>Fill level</span>
                                <span className="font-bold text-white/90">
                                    {stats.totalPills || 0} / {stats.totalCap || 0}
                                </span>
                            </div>
                            <div className="mt-2 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-300 to-indigo-300"
                                    style={{ width: `${Math.max(0, Math.min(100, stats.pct || 0))}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={onOpenVault}
                                disabled={!dispenser}
                                className={cx(
                                    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition",
                                    dispenser ? "bg-white text-slate-900 hover:bg-white/90" : "bg-white/10 text-white/40 cursor-not-allowed"
                                )}
                                type="button"
                            >
                                <Grid3X3 className="h-4 w-4" />
                                Open compartments
                            </button>

                            <div className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                                <p className="text-[11px] font-bold tracking-widest text-white/70">SYRUP HOLDER</p>
                                <p className="mt-1 text-sm font-extrabold text-white">{dispenser?.hasSyrupHolder ? "Enabled" : "Not installed"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-7 gap-2">
                        {(dispenser?.compartments || []).slice(0, 21).map((c) => {
                            const pct = c?.pillCapacity ? Math.round((c.pillsCount / c.pillCapacity) * 100) : 0;
                            const low = c?.pillCapacity ? c.pillsCount <= Math.max(1, Math.floor(c.pillCapacity * 0.2)) : false;
                            const isTodayTile = c?.dayOfMonth === todayDM;
                            const isSelectedTile = Number(selectedDay?.slice(8, 10)) === Number(c?.dayOfMonth);

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onJumpToVaultDay?.(c.dayOfMonth)}
                                    className={cx(
                                        "relative rounded-xl border p-2 text-center transition active:scale-[0.99]",
                                        low ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50",
                                        isSelectedTile ? "ring-2 ring-emerald-400" : "",
                                        isTodayTile ? "shadow-[0_0_0_1px_rgba(16,185,129,0.4),0_14px_40px_-22px_rgba(16,185,129,0.8)]" : ""
                                    )}
                                    title={`Day ${c.dayOfMonth}: ${c.pillsCount}/${c.pillCapacity} — jump calendar`}
                                    type="button"
                                >
                                    <p className="text-[10px] font-bold text-slate-500">D{c.dayOfMonth}</p>
                                    <p className={cx("mt-1 text-xs font-extrabold", low ? "text-amber-900" : "text-slate-900")}>{pct}%</p>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className={cx("h-full rounded-full", low ? "bg-amber-400" : "bg-emerald-500")}
                                            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                                        />
                                    </div>

                                    {isTodayTile ? (
                                        <span className="absolute -top-2 -right-2 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white shadow">
                                            TODAY
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    {loading ? <p className="mt-3 text-sm text-slate-500">Loading dispenser…</p> : null}
                    {!loading && !dispenser ? <p className="mt-3 text-sm text-slate-500">No dispenser data found yet (or endpoint unavailable).</p> : null}
                </>
            )}
        </div>
    );
}

function TreatmentDetails({ doses, occForDay, selectedDay, onSelectDay, dayStrip, doseById, onMarkTaken, onSetMissed }) {
    const doseCount = doses?.length || 0;
    const dueCount = occForDay.filter((x) => statusUpper(x.status) === "DUE").length;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold tracking-widest text-slate-500">TREATMENT</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">Your plan for {prettyDayLabel(selectedDay)}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        {doseCount} dose{doseCount === 1 ? "" : "s"} •{" "}
                        <span className={cx("font-extrabold", dueCount ? "text-amber-700" : "text-emerald-700")}>
                            {dueCount ? `${dueCount} due` : "all clear"}
                        </span>
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    Tap a day
                </div>
            </div>

            <div className="mt-4 overflow-x-auto">
                <div className="flex gap-2 min-w-max pb-1">
                    {dayStrip.map((d) => {
                        const active = d === selectedDay;
                        const isToday = isTodayDate(d);
                        return (
                            <button
                                key={d}
                                onClick={() => onSelectDay(d)}
                                className={cx(
                                    "rounded-2xl border px-4 py-3 text-left transition",
                                    active ? "border-emerald-200 bg-emerald-600 text-white shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
                                    isToday && !active ? "shadow-[0_14px_40px_-30px_rgba(16,185,129,0.9)]" : ""
                                )}
                                type="button"
                            >
                                <p className={cx("text-[11px] font-bold tracking-widest", active ? "text-white/80" : "text-slate-500")}>
                                    {prettyDayLabel(d).toUpperCase()}
                                </p>
                                <p className={cx("mt-1 text-sm font-extrabold", active ? "text-white" : "text-slate-900")}>{d.slice(8, 10)}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                {occForDay.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white">
                                <PackageOpen className="h-5 w-5 text-slate-700" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-slate-900">Nothing scheduled for this day</p>
                                <p className="mt-1 text-sm text-slate-600">Either you’re all clear, or the window doesn’t include this day.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {occForDay.map((o) => {
                            const d = doseById.get(o.doseId);
                            const meta = statusMeta(o.status);
                            const Icon = meta.icon;

                            const occDay = dateOnly(o.scheduledAt);
                            const allowedToday = isTodayDate(occDay);
                            const finalized = isFinalizedOccurrence(o);
                            const canAct = allowedToday && !finalized;

                            const s = statusUpper(o.status);

                            return (
                                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
                                                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                                                    {timeHM(o.scheduledAt)}
                                                </span>

                                                <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold", meta.chip)}>
                                                    <Icon className="h-4 w-4" />
                                                    {meta.label}
                                                </span>

                                                {!allowedToday ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                                                        <Lock className="h-4 w-4" />
                                                        Locked (not today)
                                                    </span>
                                                ) : finalized ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                                                        <Lock className="h-4 w-4" />
                                                        Finalized
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="mt-2 truncate text-sm font-extrabold text-slate-900">{d?.medicationName || `Dose #${o.doseId}`}</p>

                                            <p className="mt-1 text-sm text-slate-600">
                                                {d?.quantityAmount ? `${d.quantityAmount} ${d.quantityUnit}` : "—"}
                                                {d?.instructions ? <span className="text-slate-500"> • {d.instructions}</span> : null}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => onMarkTaken(o)}
                                                disabled={!canAct}
                                                className={cx(
                                                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition",
                                                    canAct
                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                                                        : s === "TAKEN"
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed"
                                                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                )}
                                                type="button"
                                                title={!allowedToday ? "Only today can be updated" : finalized ? "Finalized (cannot be changed)" : ""}
                                            >
                                                {canAct ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                Taken
                                            </button>

                                            <button
                                                onClick={() => onSetMissed(o)}
                                                disabled={!canAct}
                                                className={cx(
                                                    "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
                                                    canAct
                                                        ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 active:scale-[0.98]"
                                                        : s === "MISSED"
                                                            ? "border border-rose-200 bg-rose-50 text-rose-800 cursor-not-allowed opacity-90"
                                                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                )}
                                                type="button"
                                                title={!allowedToday ? "Only today can be updated" : finalized ? "Finalized (cannot be changed)" : ""}
                                            >
                                                Missed
                                            </button>
                                        </div>
                                    </div>

                                    {o.takenAt ? (
                                        <p className="mt-3 text-xs text-slate-500">
                                            Confirmed at <span className="font-bold text-slate-700">{o.takenAt}</span>
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScheduleTimeline({ upcoming, doseById, onMarkTaken, onSetMissed }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold tracking-widest text-slate-500">SCHEDULE</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">Upcoming doses</h3>
                    <p className="mt-1 text-sm text-slate-600">A clean timeline view so it feels clinic-grade.</p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    <Pill className="h-4 w-4 text-emerald-600" />
                    Timeline
                </div>
            </div>

            <div className="mt-5">
                {upcoming.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-extrabold text-slate-900">No upcoming items</p>
                        <p className="mt-1 text-sm text-slate-600">You’re all caught up — or the window needs more occurrences generated.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map((o) => {
                            const d = doseById.get(o.doseId);
                            const meta = statusMeta(o.status);
                            const Icon = meta.icon;

                            const occDay = dateOnly(o.scheduledAt);
                            const allowedToday = isTodayDate(occDay);
                            const finalized = isFinalizedOccurrence(o);
                            const canAct = allowedToday && !finalized;

                            const s = statusUpper(o.status);

                            return (
                                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
                                                    <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                                    {dateOnly(o.scheduledAt)}
                                                </span>

                                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
                                                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                                                    {timeHM(o.scheduledAt)}
                                                </span>

                                                <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold", meta.chip)}>
                                                    <Icon className="h-4 w-4" />
                                                    {meta.label}
                                                </span>

                                                {!allowedToday ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                                                        <Lock className="h-4 w-4" />
                                                        Locked
                                                    </span>
                                                ) : finalized ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                                                        <Lock className="h-4 w-4" />
                                                        Finalized
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="mt-2 truncate text-sm font-extrabold text-slate-900">{d?.medicationName || `Dose #${o.doseId}`}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => onMarkTaken(o)}
                                                disabled={!canAct}
                                                className={cx(
                                                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition",
                                                    canAct
                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                                                        : s === "TAKEN"
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed"
                                                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                )}
                                                type="button"
                                            >
                                                {canAct ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                Taken
                                            </button>

                                            <button
                                                onClick={() => onSetMissed(o)}
                                                disabled={!canAct}
                                                className={cx(
                                                    "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
                                                    canAct
                                                        ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 active:scale-[0.98]"
                                                        : s === "MISSED"
                                                            ? "border border-rose-200 bg-rose-50 text-rose-800 cursor-not-allowed opacity-90"
                                                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                )}
                                                type="button"
                                            >
                                                Missed
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function VaultGrid({ dispenser, selectedDay, onSelectDay }) {
    const compartments = dispenser?.compartments || [];
    const todayDM = todayDayOfMonth();

    const slots = useMemo(() => {
        const byDay = new Map();
        compartments.forEach((c) => byDay.set(c.dayOfMonth, c));
        const arr = [];
        for (let day = 1; day <= 31; day++) {
            arr.push(byDay.get(day) || { id: `missing-${day}`, dayOfMonth: day, pillsCount: 0, pillCapacity: 0, missing: true });
        }
        return arr;
    }, [compartments]);

    if (!dispenser) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-extrabold text-slate-900">No dispenser data</p>
                <p className="mt-1 text-sm text-slate-600">Assign a robot and open this again — it’ll render the full vault.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 text-white p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold tracking-widest text-white/70">DISPENSER</p>
                        <p className="mt-1 text-lg font-extrabold">Compartment map (31-day vault)</p>
                        <p className="mt-2 text-sm text-white/75">Tap a day tile to jump the calendar. Today auto-glows.</p>
                    </div>
                    <div className="grid place-items-center rounded-3xl border border-white/15 bg-white/10 p-3">
                        <Vault className="h-7 w-7 text-emerald-200" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {slots.map((c) => {
                    const cap = c?.pillCapacity || 0;
                    const val = c?.pillsCount || 0;
                    const pct = cap ? Math.round((val / cap) * 100) : 0;
                    const low = cap ? val <= Math.max(1, Math.floor(cap * 0.2)) : false;

                    const isTodayTile = c.dayOfMonth === todayDM;
                    const isSelectedTile = Number(selectedDay?.slice(8, 10)) === Number(c.dayOfMonth);

                    return (
                        <button
                            key={c.id}
                            onClick={() => onSelectDay?.(c.dayOfMonth)}
                            className={cx(
                                "rounded-2xl border p-4 transition text-left active:scale-[0.99]",
                                c.missing ? "border-slate-200 bg-slate-50 text-slate-500" : low ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50",
                                isSelectedTile ? "ring-2 ring-emerald-400" : "",
                                isTodayTile ? "shadow-[0_0_0_1px_rgba(16,185,129,0.45),0_18px_55px_-30px_rgba(16,185,129,0.9)]" : ""
                            )}
                            title={`Jump to day ${c.dayOfMonth}`}
                            type="button"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-[11px] font-bold tracking-widest text-slate-500">DAY</p>
                                    <p className={cx("mt-1 text-lg font-extrabold", low ? "text-amber-900" : "text-slate-900")}>{c.dayOfMonth}</p>
                                </div>
                                <div className={cx("rounded-2xl border p-2", low ? "border-amber-200 bg-white" : "border-slate-200 bg-white")}>
                                    <Pill className={cx("h-4 w-4", low ? "text-amber-700" : "text-emerald-700")} />
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Fill</span>
                                    <span className="font-bold text-slate-700">
                                        {val}/{cap || "—"}
                                    </span>
                                </div>
                                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className={cx("h-full rounded-full", low ? "bg-amber-400" : "bg-emerald-500")}
                                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                                    />
                                </div>
                                <p className={cx("mt-2 text-xs font-bold", low ? "text-amber-800" : "text-slate-600")}>{cap ? `${pct}%` : "Not configured"}</p>
                            </div>

                            {isTodayTile ? (
                                <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
                                    <Sparkles className="h-4 w-4" />
                                    Today highlighted
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-extrabold text-slate-900">That physical→digital moment</p>
                <p className="mt-1 text-sm text-slate-600">
                    Tap a compartment day → your calendar day jumps instantly. Today’s compartment is auto-highlighted.
                </p>
            </div>
        </div>
    );
}

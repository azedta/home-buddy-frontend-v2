// src/pages/notifications/NotificationsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    CheckCheck,
    Filter,
    Search,
    ShieldAlert,
    Siren,
    TriangleAlert,
    CircleCheck,
    Info,
} from "lucide-react";
import { notificationsApi } from "../../features/notificationsApi.js";
import { useAuthStore } from "../../features/authStore.js";

function cx(...arr) {
    return arr.filter(Boolean).join(" ");
}

function severityMeta(sev) {
    switch (sev) {
        case "CRITICAL":
            return {
                Icon: Siren,
                ring: "ring-red-200",
                bg: "bg-red-50",
                text: "text-red-700",
                dot: "bg-red-500",
            };
        case "WARN":
            return {
                Icon: TriangleAlert,
                ring: "ring-amber-200",
                bg: "bg-amber-50",
                text: "text-amber-700",
                dot: "bg-amber-500",
            };
        case "SUCCESS":
            return {
                Icon: CircleCheck,
                ring: "ring-emerald-200",
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                dot: "bg-emerald-500",
            };
        default:
            return {
                Icon: Info,
                ring: "ring-slate-200",
                bg: "bg-slate-50",
                text: "text-slate-700",
                dot: "bg-slate-400",
            };
    }
}

// Keep aligned with your backend NotificationType enum.
const TYPE_OPTIONS = [
    { value: "", label: "All types" },
    { value: "MEDICATION", label: "Medication" },
    { value: "DISPENSER", label: "Dispenser" },
    { value: "ROBOT", label: "Robot" },
    { value: "SECURITY", label: "Security" },
    { value: "SYSTEM", label: "System" },
];

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

function prettyEnum(v) {
    if (!v) return "";
    return String(v)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function prettySource(v) {
    if (!v) return "";
    // "NotificationEngine" -> "Notification Engine"
    return String(v).replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

function prettyEntity(type, id) {
    const t = prettyEnum(type);
    if (!t && !id) return "";
    if (!t) return String(id);
    if (!id) return t;
    return `${t} • #${id}`;
}

// Turns DOSE_TAKEN:occ=161:user=7 -> "Dose Taken • Occ 161 • User 7"
function prettyKey(key) {
    if (!key) return "";
    const raw = String(key).trim();
    const [head, ...rest] = raw.split(":");
    const title = prettyEnum(head);

    if (rest.length === 0) return title;

    const parts = rest
        .join(":")
        .split(":")
        .map((seg) => seg.trim())
        .filter(Boolean)
        .map((seg) => {
            const [k, v] = seg.split("=");
            if (!v) return prettyEnum(seg);
            return `${prettyEnum(k)} ${v}`;
        });

    return [title, ...parts].join(" • ");
}

function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
}

function friendlyRule(rule) {
    if (!rule) return "";
    return String(rule)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function userTitle(n) {
    const r = n?.rule;

    switch (r) {
        case "DOSE_DUE":
            return "Medication due";
        case "DOSE_CONFIRM_REQUIRED":
            return "Please confirm your medication";
        case "DOSE_MISSED":
            return "Medication missed";
        case "DOSE_TAKEN":
            return "Medication taken";
        case "DOSE_TAKEN_LATE":
            return "Medication taken late";
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

        case "ROBOT_DOWN":
            return "Robot offline";
        case "ROBOT_RECOVERED":
            return "Robot restored";
        case "ROBOT_BATTERY_LOW":
            return "Robot battery low";
        case "ROBOT_BATTERY_CRITICAL":
            return "Robot battery critical";
        case "ROBOT_STUCK":
            return "Robot may be stuck";
        case "ROBOT_SENSOR_DISABLED":
            return "Robot sensors disabled";

        case "LOGIN_NEW_DEVICE":
            return "New login detected";
        case "LOGIN_FAILED_ATTEMPTS":
            return "Failed login attempts";
        case "PERMISSION_DENIED":
            return "Permission denied";
        case "SYSTEM_INTEGRITY_WARNING":
            return "System warning";
        case "SYSTEM_INTEGRITY_CRITICAL":
            return "System critical alert";

        default:
            return n?.title || "Notification";
    }
}

function userMessage(n) {
    const r = n?.rule;

    switch (r) {
        case "DOSE_TAKEN":
            return "Your medication was successfully marked as taken.";
        case "DOSE_DUE":
            return "Your scheduled medication is due now.";
        case "DOSE_CONFIRM_REQUIRED":
            return "Your scheduled medication hasn’t been confirmed yet.";
        case "DOSE_MISSED":
            return "A scheduled medication dose was missed.";
        case "DOSE_TAKEN_LATE":
            return "This medication was marked as taken after the scheduled time.";
        case "DOSE_DUPLICATE_ATTEMPT":
            return "A second “taken” attempt was blocked to prevent duplicates.";

        case "DISPENSER_EMPTY":
            return "Your dispenser is empty and needs refilling.";
        case "DISPENSER_LOW":
            return "Your dispenser is running low. Plan a refill soon.";
        case "DISPENSE_FAILED":
            return "The dispenser couldn’t dispense the medication. Please check the dispenser.";
        case "DISPENSE_SUCCESS":
            return "Medication was dispensed successfully.";

        case "ROBOT_DOWN":
            return "Your home assistant is currently offline.";
        case "ROBOT_RECOVERED":
            return "Your home assistant is back online.";
        case "ROBOT_BATTERY_LOW":
            return "Battery is low. Consider charging soon.";
        case "ROBOT_BATTERY_CRITICAL":
            return "Battery is critically low. Charge immediately.";
        case "ROBOT_STUCK":
            return "The robot may be stuck. Please check its location.";
        case "ROBOT_SENSOR_DISABLED":
            return "Robot sensors are disabled. Some features may not work.";

        case "LOGIN_NEW_DEVICE":
            return "A login from a new device was detected.";
        case "LOGIN_FAILED_ATTEMPTS":
            return "Multiple failed login attempts were detected.";
        case "PERMISSION_DENIED":
            return "An action was blocked due to missing permissions.";
        case "SYSTEM_INTEGRITY_WARNING":
            return "A system integrity warning was detected.";
        case "SYSTEM_INTEGRITY_CRITICAL":
            return "A critical system integrity alert was detected.";

        default:
            return n?.message || "";
    }
}

function isAdminUser(u) {
    const role = u?.role || u?.userRole || null;
    const roles = u?.roles || u?.authorities || u?.grantedAuthorities || null;

    const norm = (x) => String(x || "").toUpperCase();

    if (role && norm(role).includes("ADMIN")) return true;

    if (Array.isArray(roles)) {
        return roles.some((r) => norm(r).includes("ADMIN"));
    }

    if (typeof roles === "string") {
        return norm(roles).includes("ADMIN");
    }

    return false;
}

export default function NotificationsPage({ selectedUserId }) {
    const authUser = useAuthStore((s) => s.user);

    const authUserId = useMemo(
        () => authUser?.id ?? authUser?.userId ?? null,
        [authUser]
    );

    const isAdmin = useMemo(() => isAdminUser(authUser), [authUser]);

    // For non-admin: resolve userId as before (selectedUserId OR auth user)
    const resolvedUserId = useMemo(
        () => (selectedUserId ?? authUserId) || null,
        [selectedUserId, authUserId]
    );

    // Admin behavior:
    // - If selectedUserId exists => act like viewing that user.
    // - If no selectedUserId => ALL USERS (no userId param).
    const adminAllMode = isAdmin && (selectedUserId == null);
    const effectiveUserId = adminAllMode ? null : resolvedUserId;

    const [tab, setTab] = useState("UNREAD"); // UNREAD | ALL
    const [type, setType] = useState("");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(0);
    const [size] = useState(20);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);

    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    const unreadOnly = tab === "UNREAD";

    // Can fetch:
    // - Admin all mode => yes
    // - Otherwise requires a userId
    const canFetch = adminAllMode ? true : !!effectiveUserId;

    // Can perform per-user actions (mark read / mark all):
    // - Only when a specific user context is active
    const canMutate = !!effectiveUserId;

    async function refreshCounts() {
        // In adminAllMode, backend must support unread-count without userId (global count)
        // If not supported yet, we fail gracefully and show 0.
        try {
            const res = await notificationsApi.unreadCount(
                effectiveUserId ? { userId: effectiveUserId } : {}
            );
            setUnreadCount(res?.unreadCount ?? 0);
        } catch {
            setUnreadCount(0);
        }
    }

    async function fetchList(overridePage = null) {
        const effectivePage = overridePage ?? page;

        setLoading(true);
        try {
            const res = await notificationsApi.list({
                // userId omitted in adminAllMode
                ...(effectiveUserId ? { userId: effectiveUserId } : {}),
                unreadOnly,
                type: type || undefined,
                q: q || undefined,
                page: effectivePage,
                size,
            });

            setItems(res?.content ?? []);
            setTotalPages(res?.totalPages ?? 0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setPage(0);
    }, [tab, type]);

    useEffect(() => {
        // Reset on scope changes
        setOpen(null);
        setShowDebug(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminAllMode, effectiveUserId]);

    useEffect(() => {
        if (!canFetch) {
            setLoading(false);
            setItems([]);
            setTotalPages(0);
            setUnreadCount(0);
            setOpen(null);
            setShowDebug(false);
            return;
        }

        fetchList();
        refreshCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminAllMode, effectiveUserId, tab, type, page, size]);

    const stats = useMemo(() => {
        const crit = items.filter((n) => n.severity === "CRITICAL" && !n.read).length;
        const warn = items.filter((n) => n.severity === "WARN" && !n.read).length;
        return { crit, warn };
    }, [items]);

    async function markRead(n) {
        // Only allowed in a specific user context
        if (!canMutate) return;
        if (!n || n.read) return;

        const updated = await notificationsApi.markRead({ id: n.id, userId: effectiveUserId });
        setItems((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
        setOpen((cur) => (cur?.id === n.id ? updated : cur));
        refreshCounts();
    }

    async function markAllRead() {
        if (!canMutate) return;

        await notificationsApi.markAllRead({ userId: effectiveUserId });
        setItems((prev) =>
            prev.map((x) => ({
                ...x,
                read: true,
                readAt: x.readAt ?? new Date().toISOString(),
            }))
        );
        refreshCounts();
    }

    const headerBadge = unreadCount > 99 ? "99+" : String(unreadCount);

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-slate-500">NOTIFICATIONS</p>
                        <div className="mt-2 flex items-center gap-3">
                            <h2 className="text-2xl font-extrabold text-slate-900">Inbox</h2>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                                <Bell className="h-4 w-4 text-slate-500" />
                                Unread{" "}
                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                                    {headerBadge}
                                </span>
                            </span>
                        </div>
                        <p className="mt-2 text-slate-600">
                            Alerts, reminders, and system updates — organized and easy to act on.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                <ShieldAlert className="h-4 w-4" /> Critical: {stats.crit}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                <TriangleAlert className="h-4 w-4" /> Warnings: {stats.warn}
                            </span>

                            {adminAllMode ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
                                    Admin view • All users
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTab("UNREAD")}
                                className={cx(
                                    "rounded-2xl px-4 py-2 text-sm font-bold",
                                    tab === "UNREAD"
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                Unread
                            </button>
                            <button
                                onClick={() => setTab("ALL")}
                                className={cx(
                                    "rounded-2xl px-4 py-2 text-sm font-bold",
                                    tab === "ALL"
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                All
                            </button>

                            <button
                                onClick={markAllRead}
                                className={cx(
                                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold",
                                    canMutate
                                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                )}
                                title={canMutate ? "Mark all as read" : "Select a user to mark as read"}
                                disabled={!canMutate}
                            >
                                <CheckCheck className="h-4 w-4" /> Mark all
                            </button>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-[420px]">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setPage(0);
                                                fetchList(0);
                                            }
                                        }}
                                        placeholder="Search…"
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-slate-100"
                                        disabled={!canFetch}
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        setPage(0);
                                        fetchList(0);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                                    disabled={!canFetch}
                                >
                                    <Filter className="h-4 w-4" /> Apply
                                </button>
                            </div>

                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-slate-100"
                                disabled={!canFetch}
                            >
                                {TYPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
                <div className="border-b border-slate-200 px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">
                        {loading ? "Loading…" : `${items.length} notification${items.length === 1 ? "" : "s"}`}
                    </p>
                </div>

                {!canFetch ? (
                    <div className="px-6 py-10 text-sm text-slate-600">Select a user to view notifications.</div>
                ) : items.length === 0 && !loading ? (
                    <div className="px-6 py-10 text-sm text-slate-600">
                        Nothing here. Your system is quiet — that’s a good sign.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {items.map((n) => {
                            const meta = severityMeta(n.severity);
                            const Icon = meta.Icon;

                            return (
                                <button
                                    key={n.id}
                                    onClick={() => {
                                        setOpen(n);
                                        setShowDebug(false);
                                        // Only auto-mark read when scoped to a specific user
                                        if (canMutate) markRead(n);
                                    }}
                                    className={cx(
                                        "w-full px-6 py-4 text-left transition hover:bg-white",
                                        !n.read ? "bg-slate-50/60" : ""
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cx(
                                                "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1",
                                                meta.bg,
                                                meta.ring
                                            )}
                                        >
                                            <Icon className={cx("h-5 w-5", meta.text)} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cx("h-2 w-2 rounded-full", meta.dot)} />
                                                <p
                                                    className={cx(
                                                        "truncate font-extrabold",
                                                        !n.read ? "text-slate-900" : "text-slate-700"
                                                    )}
                                                >
                                                    {userTitle(n)}
                                                </p>

                                                {!n.read ? (
                                                    <span className="ml-auto rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                                        NEW
                                                    </span>
                                                ) : (
                                                    <span className="ml-auto text-xs font-semibold text-slate-500">
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{userMessage(n)}</p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                                {/* Admin-all mode: show who it belongs to */}
                                                {adminAllMode ? (
                                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1">
                                                        User #{n.recipientUserId ?? "—"}
                                                    </span>
                                                ) : null}

                                                <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{n.type}</span>

                                                {n.rule ? (
                                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1">
                                                        {friendlyRule(n.rule)}
                                                    </span>
                                                ) : null}

                                                <span className="rounded-full border border-slate-200 bg-white px-2 py-1">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 ? (
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            disabled={page <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            className={cx(
                                "rounded-2xl px-4 py-2 text-sm font-bold",
                                page <= 0
                                    ? "border border-slate-200 bg-slate-100 text-slate-400"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            Previous
                        </button>
                        <p className="text-sm font-semibold text-slate-600">
                            Page <span className="font-extrabold text-slate-900">{page + 1}</span> / {totalPages}
                        </p>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            className={cx(
                                "rounded-2xl px-4 py-2 text-sm font-bold",
                                page >= totalPages - 1
                                    ? "border border-slate-200 bg-slate-100 text-slate-400"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            Next
                        </button>
                    </div>
                ) : null}
            </div>

            {/* DETAILS MODAL */}
            {open ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
                    <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                            <div className="min-w-0">
                                <p className="text-xs font-bold tracking-widest text-slate-500">DETAILS</p>
                                <p className="mt-2 truncate text-lg font-extrabold text-slate-900">{userTitle(open)}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-600">{formatTime(open.createdAt)}</p>

                                {adminAllMode ? (
                                    <p className="mt-1 text-sm font-semibold text-slate-600">
                                        Recipient: <span className="font-extrabold text-slate-900">User #{open.recipientUserId ?? "—"}</span>
                                    </p>
                                ) : null}
                            </div>

                            <button
                                onClick={() => {
                                    setOpen(null);
                                    setShowDebug(false);
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                                    {open.type}
                                </span>

                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                                    {open.severity}
                                </span>

                                {open.rule ? (
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                                        {friendlyRule(open.rule)}
                                    </span>
                                ) : null}
                            </div>

                            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{userMessage(open)}</p>

                            <button
                                onClick={() => setShowDebug((v) => !v)}
                                className="mt-6 text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >
                                {showDebug ? "Hide technical details" : "Show technical details"}
                            </button>

                            {showDebug ? (
                                <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                                    {open.rule ? (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-extrabold text-slate-700">Rule</span>
                                            <span className="text-right font-semibold text-slate-700">{prettyEnum(open.rule)}</span>
                                        </div>
                                    ) : null}

                                    {open.notificationKey ? (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-extrabold text-slate-700">Key</span>
                                            <span className="text-right font-semibold text-slate-700">{prettyKey(open.notificationKey)}</span>
                                        </div>
                                    ) : null}

                                    {open.sourceModule ? (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-extrabold text-slate-700">Source</span>
                                            <span className="text-right font-semibold text-slate-700">{prettySource(open.sourceModule)}</span>
                                        </div>
                                    ) : null}

                                    {open.relatedEntityType || open.relatedEntityId ? (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-extrabold text-slate-700">Entity</span>
                                            <span className="text-right font-semibold text-slate-700">
                                                {prettyEntity(open.relatedEntityType, open.relatedEntityId)}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setOpen(null);
                                        setShowDebug(false);
                                    }}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

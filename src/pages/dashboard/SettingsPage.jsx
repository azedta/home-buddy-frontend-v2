import { useEffect, useMemo, useState } from "react";
import { Settings2, ShieldCheck, UserCircle2, SlidersHorizontal } from "lucide-react";
import { settingsApi } from "../../features/settingsApi.js";
import { useAuthStore } from "../../features/authStore.js";

import ProfileSection from "../../components/settings/ProfileSection.jsx";
import PreferencesSection from "../../components/settings/PreferencesSection.jsx";
import SecuritySection from "../../components/settings/SecuritySection.jsx";

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const roles = user?.roles || [];

    const roleLabel = useMemo(() => {
        const up = roles.map((r) => String(r).toUpperCase());
        const isAdminLike = up.some((r) => r.includes("ADMIN") || r.includes("CAREGIVER"));
        if (isAdminLike) return "ADMIN / CAREGIVER";
        if (up.some((r) => r.includes("USER") || r.includes("ELDER") || r.includes("ELDERLY"))) return "USER";
        return "ACCOUNT";
    }, [roles]);

    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await settingsApi.getMe();
                if (!mounted) return;
                setSettings(data);
            } catch (e) {
                if (!mounted) return;
                setError(e?.message || "Failed to load settings");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    async function save(partial) {
        try {
            setSaving(true);
            setError(null);

            // optimistic merge
            const optimistic = { ...(settings || {}), ...partial };
            setSettings(optimistic);

            const updated = await settingsApi.updateMe(partial);
            setSettings(updated);

            setToast("Saved");
            window.setTimeout(() => setToast(null), 1500);
        } catch (e) {
            setError(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header / hero (INLINE - no separate file) */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-slate-50/30 p-8 shadow-sm">
                {/* soft background glow (STATIC) */}
                <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-slate-400/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-slate-300/10 blur-3xl" />

                {/* Row 1: badges */}
                <div className="relative z-10 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest text-slate-600">
                        {roleLabel}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur">
                        {/* ✅ must match Sidebar accent for Settings icon */}
                        <Settings2 className="h-4 w-4 text-slate-600" />
                        Settings Console
                    </span>

                    {toast ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
                            ✅ {toast}
                        </span>
                    ) : null}
                </div>

                {/* Title + description */}
                <div className="relative z-10 mt-6">
                    <h2 className="text-2xl font-extrabold text-slate-900">
                        Profile & preferences
                    </h2>

                    <p className="mt-3 max-w-2xl text-slate-600">
                        Control identity, experience settings, and basic security actions — consistent across your dashboard.
                    </p>
                </div>

                {/* Context strip */}
                <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
                    <span className="rounded-full bg-slate-100/70 px-3 py-1 backdrop-blur">
                        <UserCircle2 className="mr-2 inline h-4 w-4 align-[-2px] text-slate-600" />
                        Profile
                    </span>
                    <span className="rounded-full bg-slate-100/70 px-3 py-1 backdrop-blur">
                        <SlidersHorizontal className="mr-2 inline h-4 w-4 align-[-2px] text-slate-600" />
                        Preferences
                    </span>
                    <span className="rounded-full bg-slate-100/70 px-3 py-1 backdrop-blur">
                        <ShieldCheck className="mr-2 inline h-4 w-4 align-[-2px] text-slate-600" />
                        Security
                    </span>
                </div>
            </div>

            {/* Body */}
            {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <p className="text-sm font-semibold text-slate-700">Loading settings…</p>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                    <p className="text-sm font-extrabold text-red-800">Settings error</p>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <ProfileSection user={user} settings={settings} onSave={save} saving={saving} />
                    <PreferencesSection settings={settings} onSave={save} saving={saving} />
                    <SecuritySection settings={settings} onSave={save} saving={saving} />
                </div>
            )}
        </div>
    );
}

import { useMemo, useState } from "react";
import { User2, Save } from "lucide-react";
import SettingsCard from "./SettingsCard.jsx";

export default function ProfileSection({ user, settings, onSave, saving }) {
    const email = user?.email || user?.username || "—";

    const [displayName, setDisplayName] = useState(settings?.displayName ?? "");
    const [avatarColor, setAvatarColor] = useState(settings?.avatarColor ?? "slate");

    // keep in sync when settings load
    useMemo(() => {
        setDisplayName(settings?.displayName ?? "");
        setAvatarColor(settings?.avatarColor ?? "slate");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings?.displayName, settings?.avatarColor]);

    return (
        <SettingsCard
            title="Profile"
            subtitle="How your account appears inside HomeBuddy."
            icon={User2}
            iconClassName="text-slate-600"
            right={
                <button
                    onClick={() => onSave({ displayName, avatarColor })}
                    disabled={saving}
                    className={[
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold shadow-sm transition",
                        saving
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-slate-900 text-white hover:bg-slate-800",
                    ].join(" ")}
                >
                    <Save className="h-4 w-4" />
                    Save
                </button>
            }
        >
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-xs font-bold tracking-widest text-slate-500">
                        DISPLAY NAME
                    </label>
                    <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Aziz"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Used in the UI. Keep it short and clean.
                    </p>
                </div>

                <div>
                    <label className="text-xs font-bold tracking-widest text-slate-500">
                        EMAIL (READ-ONLY)
                    </label>
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        {email}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                        Email changes belong in your Auth module (later).
                    </p>
                </div>

                <div className="md:col-span-2">
                    <label className="text-xs font-bold tracking-widest text-slate-500">
                        AVATAR COLOR
                    </label>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {["slate", "blue", "emerald", "violet", "amber"].map((c) => (
                            <button
                                key={c}
                                onClick={() => setAvatarColor(c)}
                                className={[
                                    "rounded-full border px-3 py-1 text-xs font-bold transition",
                                    avatarColor === c
                                        ? "border-slate-400 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                ].join(" ")}
                            >
                                {c.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
                            <span className="text-sm font-extrabold text-slate-700">
                                {(displayName || "U").trim().slice(0, 1).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-slate-900">Preview</p>
                            <p className="text-xs text-slate-600">
                                Initial avatar is derived from display name.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
}

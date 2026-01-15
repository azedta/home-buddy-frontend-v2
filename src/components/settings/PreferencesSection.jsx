import { useMemo, useState } from "react";
import { SlidersHorizontal, Save } from "lucide-react";
import SettingsCard from "./SettingsCard.jsx";

const themeOptions = ["SYSTEM", "LIGHT", "DARK"];

export default function PreferencesSection({ settings, onSave, saving }) {
    const [timeZone, setTimeZone] = useState(settings?.timeZone ?? "America/Toronto");
    const [locale, setLocale] = useState(settings?.locale ?? "en-CA");
    const [themeMode, setThemeMode] = useState(settings?.themeMode ?? "SYSTEM");

    useMemo(() => {
        setTimeZone(settings?.timeZone ?? "America/Toronto");
        setLocale(settings?.locale ?? "en-CA");
        setThemeMode(settings?.themeMode ?? "SYSTEM");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings?.timeZone, settings?.locale, settings?.themeMode]);

    return (
        <SettingsCard
            title="Preferences"
            subtitle="Tune the experience — time zone, locale, and theme."
            icon={SlidersHorizontal}
            iconClassName="text-slate-600"
            right={
                <button
                    onClick={() => onSave({ timeZone, locale, themeMode })}
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
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <label className="text-xs font-bold tracking-widest text-slate-500">
                        TIME ZONE
                    </label>
                    <input
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="America/Toronto"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Used for schedules and “today” highlighting.
                    </p>
                </div>

                <div>
                    <label className="text-xs font-bold tracking-widest text-slate-500">
                        LOCALE
                    </label>
                    <input
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="en-CA"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Formatting for dates & labels (later).
                    </p>
                </div>

                <div>
                    <label className="text-xs font-bold tracking-widest text-slate-500">
                        THEME
                    </label>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {themeOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setThemeMode(opt)}
                                className={[
                                    "rounded-2xl border px-3 py-3 text-xs font-extrabold transition",
                                    themeMode === opt
                                        ? "border-slate-400 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                ].join(" ")}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                        “System” follows OS preference.
                    </p>
                </div>
            </div>
        </SettingsCard>
    );
}

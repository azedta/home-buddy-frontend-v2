import { ShieldCheck, RotateCcw } from "lucide-react";
import SettingsCard from "./SettingsCard.jsx";

export default function SecuritySection({ settings, onSave, saving }) {
    const updatedAt = settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : "—";

    return (
        <SettingsCard
            title="Security & Integrity"
            subtitle="Basic account safety actions (more coming later)."
            icon={ShieldCheck}
            iconClassName="text-slate-600"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold tracking-widest text-slate-500">
                        LAST SETTINGS UPDATE
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-slate-900">{updatedAt}</p>
                    <p className="mt-1 text-xs text-slate-600">
                        Helpful for auditing changes in admin/caregiver environments.
                    </p>
                </div>

                <button
                    onClick={() =>
                        onSave({
                            themeMode: "SYSTEM",
                            notifyEmail: true,
                            notifyPush: true,
                            doseReminders: true,
                            timeZone: "America/Toronto",
                            locale: "en-CA",
                        })
                    }
                    disabled={saving}
                    className={[
                        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
                        saving
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                >
                    <RotateCcw className="h-4 w-4 text-slate-600" />
                    Reset to defaults
                </button>
            </div>
        </SettingsCard>
    );
}

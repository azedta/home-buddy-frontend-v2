import { useMemo, useState } from "react";
import { Pill, Sparkles, Shield, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../../features/authStore.js";
import ElderlyMedicationView from "../medication/ElderlyMedicationView.jsx";
import AdminMedicationView from "../medication/AdminMedicationView.jsx";

function hasAnyRole(roles = [], needles = []) {
    const rr = (roles || []).map((r) => String(r).toUpperCase());
    return needles.some((n) => rr.includes(String(n).toUpperCase()));
}

export default function MedicationPage() {
    const user = useAuthStore((s) => s.user);
    const roles = user?.roles || [];

    const isAdminLike = useMemo(() => {
        return hasAnyRole(roles, ["ADMIN", "ROLE_ADMIN", "CAREGIVER", "ROLE_CAREGIVER"]);
    }, [roles]);

    const isElderly = useMemo(() => {
        // if you store ROLE_USER for elderly
        return hasAnyRole(roles, ["USER", "ROLE_USER"]) && !isAdminLike;
    }, [roles, isAdminLike]);

    const mode = isAdminLike ? "admin" : "user";

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-3 py-2 text-xs font-bold tracking-widest text-slate-700">
                            <Sparkles className="h-4 w-4" />
                            MEDICATION CONSOLE
                        </div>

                        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                            Schedules, dispensing, adherence
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">
                            A realistic “clinic-grade” dashboard: track what’s scheduled, what was taken, and what needs attention —
                            with a dispenser model that actually feels like a product demo.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[11px] font-bold tracking-widest text-slate-500">MODE</p>
                            <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                                {mode === "admin" ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                                {mode === "admin" ? "Caregiver / Admin" : "User"}
                            </div>
                        </div>

                        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
                            <Pill className="h-5 w-5 text-amber-700" />
                        </div>
                    </div>
                </div>
            </div>

            {mode === "admin" ? (
                <AdminMedicationView />
            ) : (
                <ElderlyMedicationView forceUserMode={isElderly || !isAdminLike} />
            )}
        </div>
    );
}

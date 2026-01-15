import { useMemo } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { useAuthStore } from "../../features/authStore.js";

import AdminMedicationView from "../medication/AdminMedicationView.jsx";

function toRoleSet(user) {
    const r = user?.roles || [];
    const roles = Array.isArray(r) ? r.map(String) : [];
    return new Set(roles.map((x) => String(x).toUpperCase()));
}

export default function MedicationPage() {
    const user = useAuthStore((s) => s.user);

    const roleSet = useMemo(() => toRoleSet(user), [user]);

    const isAdminLike = useMemo(() => {
        return (
            roleSet.has("ADMIN") ||
            roleSet.has("CAREGIVER") ||
            roleSet.has("ROLE_ADMIN") ||
            roleSet.has("ROLE_CAREGIVER")
        );
    }, [roleSet]);

    return (
        <div className="space-y-6">
            {/* Header / hero (STATIC) */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-8 shadow-sm">
                {/* soft background glow (STATIC) */}
                <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-amber-200/12 blur-3xl" />

                {/* Row 1: badges */}
                <div className="relative z-10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-widest text-amber-700">
            ADMIN / CAREGIVER
          </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 backdrop-blur px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Medication Console
          </span>
                </div>

                {/* Title + description */}
                <div className="relative z-10 mt-6">
                    <h2 className="text-2xl font-extrabold text-slate-900">
                        Medication Management
                    </h2>

                    <p className="mt-3 max-w-2xl text-slate-600">
                        Search medications from the built-in database and your custom list,
                        then save what you find to your local medication list and manage it anytime.
                    </p>
                </div>

                {/* Context strip */}
                <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-amber-800">
          <span className="rounded-full bg-amber-100/60 px-3 py-1 backdrop-blur">
            💊 Local medications
          </span>
                    <span className="rounded-full bg-amber-100/60 px-3 py-1 backdrop-blur">
            🔍 RxNorm search
          </span>
                    <span className="rounded-full bg-amber-100/60 px-3 py-1 backdrop-blur">
            🛡 Admin managed
          </span>
                </div>
            </div>

            {/* Guard: admin-only */}
            {!isAdminLike ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-rose-200 bg-white p-3">
                            <Lock className="h-5 w-5 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-extrabold text-rose-800">
                                Access denied
                            </p>
                            <p className="mt-1 text-sm text-rose-700/90">
                                This page is available only to Admins and Caregivers.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <AdminMedicationView />
            )}
        </div>
    );
}

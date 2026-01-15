import { useState } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { medicationApi } from "../../../features/medicationApi.js";

export default function LocalMedicationCreateCard() {
    const [name, setName] = useState("Vitamin D");
    const [medicationForm, setMedicationForm] = useState("TABLET");
    const [medicationStrength, setMedicationStrength] = useState("1000 IU");
    const [description, setDescription] = useState("Take with breakfast.");

    const [busy, setBusy] = useState(false);

    // message state (styled)
    const [toast, setToast] = useState(null); // { type: "success"|"error", text: string }

    const MEDICATION_FORMS = [
        "TABLET",
        "CAPSULE",
        "SYRUP",
        "SUSPENSION",
        "SOLUTION",
        "INJECTION",
        "INHALER",
        "PATCH",
        "CREAM",
        "OINTMENT",
        "DROPS",
        "SPRAY",
        "OTHER",
    ];


    function showSuccess(text) {
        setToast({ type: "success", text });
    }
    function showError(text) {
        setToast({ type: "error", text });
    }

    async function create() {
        setToast(null);
        setBusy(true);
        try {
            // matches MedicationDtos.CreateRequest fields you use server-side
            const payload = {
                name,
                medicationForm,
                medicationStrength,
                medicationDescription : description,
            };
            const saved = await medicationApi.createLocal(payload);
            showSuccess(`Created successfully • ${saved?.key || `LOCAL:${saved?.localId ?? ""}`}`);
        } catch (e) {
            showError(e?.message || "Create failed. Check backend validation fields match.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-bold tracking-widest text-slate-500">LOCAL MEDICATION</p>
            <h3 className="mt-2 text-lg font-extrabold text-slate-900">Create manual meds</h3>
            <p className="mt-1 text-sm text-slate-600">Create a custom medication when it’s not already available.</p>

            {/* colored confirmation */}
            {toast ? (
                <div
                    className={[
                        "mt-4 rounded-2xl border p-4 text-sm font-semibold",
                        toast.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-rose-200 bg-rose-50 text-rose-800",
                    ].join(" ")}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            {toast.type === "success" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                            ) : (
                                <XCircle className="h-5 w-5 text-rose-700" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate">{toast.text}</p>
                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                className="mt-2 text-xs font-bold underline underline-offset-2 opacity-80 hover:opacity-100"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="mt-4 space-y-3">
                <Field label="Name" value={name} onChange={setName} />
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold tracking-widest text-slate-500">
                        FORM
                    </p>

                    <select
                        value={medicationForm}
                        onChange={(e) => setMedicationForm(e.target.value)}
                        className="
      mt-2 w-full rounded-2xl border border-slate-200
      bg-white px-3 py-2 text-sm text-slate-900
      outline-none focus:ring-2 focus:ring-slate-200
    "
                    >
                        {MEDICATION_FORMS.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </div>
                <Field label="Strength" value={medicationStrength} onChange={setMedicationStrength} />
                <Field label="Description" value={description} onChange={setDescription} />
            </div>

            <button
                onClick={create}
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
                {busy ? "Creating..." : "Create local medication"}
            </button>
        </div>
    );
}

function Field({ label, value, onChange }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
        </div>
    );
}

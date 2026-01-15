import { useMemo, useState } from "react";
import { Check, Plus, Sparkles } from "lucide-react";
import { medicationApi } from "../../features/medicationApi.js";

export default function AssignDoseCard({ userId, selectedMedication }) {
    const [timeFrequency, setTimeFrequency] = useState("DAILY");
    const [daysOfWeek, setDaysOfWeek] = useState(["MONDAY", "WEDNESDAY", "FRIDAY"]);
    const [times, setTimes] = useState(["08:00", "20:00"]);
    const [quantityAmount, setQuantityAmount] = useState(1);
    const [quantityUnit, setQuantityUnit] = useState("PILL");
    const [instructions, setInstructions] = useState("Take after food.");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState("");

    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const medicationId = selectedMedication?.localId || null;

    const canAssign = Boolean(userId) && (selectedMedication?.localId || selectedMedication?.externalId);

    async function createDose() {
        setMsg("");
        setBusy(true);
        try {
            // IMPORTANT:
            // Your backend DoseService.create() expects medicationId as a DB FK.
            // If RxNorm items are selected (no localId), you’ll later implement "materialize from catalog" -> local medication.
            if (!medicationId) {
                setMsg("Pick a LOCAL medication (with localId) for now. RxNorm materialization will be added next.");
                setBusy(false);
                return;
            }

            const payload = {
                userId,
                medicationId,
                timeFrequency,
                daysOfWeek,
                times,
                quantityAmount,
                quantityUnit,
                startDate,
                endDate: endDate || null,
                instructions,
            };

            const saved = await medicationApi.createDose(payload);
            setMsg(`Dose created: #${saved?.id}`);
        } catch (e) {
            setMsg("Create dose failed — check payload fields/enums match your backend DTO.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500">ASSIGN DOSE</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">Create a schedule for the patient</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Select medication → fill schedule → create.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    <Sparkles className="h-4 w-4" />
                    Dose builder
                </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[11px] font-bold tracking-widest text-slate-500">SELECTED MED</p>
                <p className="mt-2 text-sm font-extrabold text-slate-900">
                    {selectedMedication?.name || "None selected"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                    {selectedMedication?.key || "Pick from catalog search above."}
                </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="TimeFrequency (enum)" value={timeFrequency} onChange={setTimeFrequency} />
                <Field
                    label="Times (comma)"
                    value={times.join(", ")}
                    onChange={(v) => setTimes(v.split(",").map((x) => x.trim()).filter(Boolean))}
                />
                <Field
                    label="DaysOfWeek (comma enums)"
                    value={daysOfWeek.join(", ")}
                    onChange={(v) => setDaysOfWeek(v.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean))}
                />
                <Field
                    label="Quantity"
                    value={String(quantityAmount)}
                    onChange={(v) => setQuantityAmount(Number(v || 0))}
                    type="number"
                />
                <Field label="Unit (enum)" value={quantityUnit} onChange={setQuantityUnit} />
                <Field label="Instructions" value={instructions} onChange={setInstructions} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField label="Start date" value={startDate} onChange={setStartDate} />
                <DateField label="End date (optional)" value={endDate} onChange={setEndDate} />
            </div>

            <button
                onClick={createDose}
                disabled={busy || !canAssign}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-cyan-50 to-blue-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
                Create dose for user #{userId}
            </button>

            {!!msg && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {msg}
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = "text" }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
        </div>
    );
}

function DateField({ label, value, onChange }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold tracking-widest text-slate-500">{label}</p>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
        </div>
    );
}

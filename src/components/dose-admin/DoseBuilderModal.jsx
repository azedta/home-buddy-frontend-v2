// src/components/dose-admin/DoseBuilderModal.jsx
import { useEffect, useMemo, useState } from "react";
import Modal from "../general/Modal.jsx";
import Alert from "../general/Alert.jsx";
import Button from "../general/Button.jsx";
import Input from "../general/Input.jsx";

import MedicationPicker from "./MedicationPicker.jsx";
import DaysOfWeekChips from "./DaysOfWeekChips.jsx";
import TimesEditor from "./TimesEditor.jsx";
import DosePreviewCard from "./DosePreviewCard.jsx";
import SchedulePreview from "./SchedulePreview.jsx";

import { doseApi } from "../../features/doseApi.js";

function isLocal(med) {
    const key = String(med?.key || "");
    return key.startsWith("LOCAL:") || med?.localId != null;
}

function clampFreq(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(24, Math.floor(n)));
}

function toBigDecimalString(v) {
    const s = String(v ?? "").trim();
    if (!s) return "";
    return s;
}

function normalizeTimeForDto(s) {
    // UI will hold HH:mm (from time input)
    const t = String(s || "").trim();
    if (!t) return "";
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    return t;
}

function setFromArray(arr) {
    return arr?.length ? Array.from(new Set(arr)) : null;
}

function emptyToNull(s) {
    const x = String(s ?? "").trim();
    return x ? x : null;
}

const DOSE_UNITS = ["PILL", "CAPSULE", "TABLESPOON", "TEASPOON", "ML", "DROPS", "PUFF"];

const ALL_DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

const UNIT_LABEL = {
    PILL: "Pill",
    CAPSULE: "Capsule",
    TABLESPOON: "Tablespoon",
    TEASPOON: "Teaspoon",
    ML: "mL",
    DROPS: "Drops",
    PUFF: "Puff",
};

function isAllDaysSelected(daysArr) {
    const arr = Array.isArray(daysArr) ? daysArr : [];
    if (arr.length !== ALL_DAYS.length) return false;
    const set = new Set(arr);
    return ALL_DAYS.every((d) => set.has(d));
}

export default function DoseBuilderModal({
                                             open,
                                             onClose,
                                             userId, // number or string
                                             userFullName, // pass from admin page
                                             onCreated,
                                             editDose,
                                             onUpdated,
                                         }) {
    const isEdit = Boolean(editDose?.id);

    const [step, setStep] = useState(1);
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);

    // Medication selection (create only)
    const [med, setMed] = useState(null);

    // Form fields
    const [timeFrequency, setTimeFrequency] = useState(2);
    const [daysOfWeek, setDaysOfWeek] = useState([]); // UI days (can be empty = every day)
    const [times, setTimes] = useState([]); // UI times (HH:mm)

    const [quantityAmount, setQuantityAmount] = useState("1");
    const [quantityUnit, setQuantityUnit] = useState("PILL");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [instructions, setInstructions] = useState("");

    useEffect(() => {
        if (!open) return;

        setErr("");
        setStep(1);

        if (isEdit) {
            setTimeFrequency(editDose.timeFrequency ?? 1);

            // ✅ if backend stored all 7 days, show it as empty in UI = "Every day"
            const serverDays = editDose.daysOfWeek ? Array.from(editDose.daysOfWeek) : [];
            setDaysOfWeek(isAllDaysSelected(serverDays) ? [] : serverDays);

            setTimes(
                editDose.times
                    ? Array.from(editDose.times).map((t) => String(t || "").slice(0, 5)) // HH:mm:ss -> HH:mm
                    : []
            );
            setQuantityAmount(editDose.quantityAmount != null ? String(editDose.quantityAmount) : "");
            setQuantityUnit(editDose.quantityUnit || "PILL");
            setStartDate(editDose.startDate || "");
            setEndDate(editDose.endDate || "");
            setInstructions(editDose.instructions || "");
            setMed(null);
        } else {
            setMed(null);
            setTimeFrequency(2);
            setDaysOfWeek([]);
            setTimes([]);
            setQuantityAmount("1");
            setQuantityUnit("PILL");
            setStartDate("");
            setEndDate("");
            setInstructions("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isEdit, editDose?.id]);

    // ✅ Frontend-only rule:
    // UI empty days = every day. DTO gets explicit days (ALL_DAYS).
    const payload = useMemo(() => {
        const f = clampFreq(timeFrequency);

        const timesNorm = (times || []).map(normalizeTimeForDto).filter(Boolean);

        const dtoDays = (daysOfWeek?.length ? daysOfWeek : ALL_DAYS);

        return {
            userId: userId ? Number(userId) : null,
            localMedicationId: med?.localId ?? null,
            timeFrequency: f,
            daysOfWeek: setFromArray(dtoDays),
            times: setFromArray(timesNorm),
            quantityAmount: emptyToNull(toBigDecimalString(quantityAmount)),
            quantityUnit: emptyToNull(quantityUnit),
            startDate: emptyToNull(startDate),
            endDate: emptyToNull(endDate),
            instructions: emptyToNull(instructions),
        };
    }, [userId, med, timeFrequency, daysOfWeek, times, quantityAmount, quantityUnit, startDate, endDate, instructions]);

    function validateStep() {
        setErr("");

        if (!userId) return "Target user is required.";

        if (!isEdit && step >= 1) {
            if (!med) return "Pick a LOCAL medication first.";
            if (!isLocal(med)) return "Only LOCAL medications can be selected here.";
        }

        if (step >= 2) {
            const f = clampFreq(timeFrequency);
            if (!f || f < 1 || f > 24) return "Frequency must be between 1 and 24.";
        }

        if (step >= 3) {
            const f = clampFreq(timeFrequency);
            const ts = (times || []).map((t) => String(t || "").trim()).filter(Boolean);
            if (ts.length !== f) return `Times must contain exactly ${f} time(s).`;
        }

        if (step >= 4) {
            const q = Number(quantityAmount);
            if (!quantityAmount) return "Quantity amount is required.";
            if (!Number.isFinite(q)) return "Quantity amount must be a number.";
            if (q < 0.001) return "Quantity amount must be at least 0.001.";
            if (!quantityUnit) return "Quantity unit is required.";
            if (!DOSE_UNITS.includes(String(quantityUnit))) return "Invalid quantity unit.";
            if (instructions && instructions.length > 500) return "Instructions must be 500 characters or less.";
        }

        return null;
    }

    function validateAll() {
        const f = clampFreq(timeFrequency);
        const ts = (times || []).map((t) => String(t || "").trim()).filter(Boolean);

        if (!userId) return "Target user is required.";
        if (!isEdit && !med?.localId) return "Missing localMedicationId.";
        if (!f || f < 1 || f > 24) return "Frequency must be between 1 and 24.";
        if (ts.length !== f) return `Times must contain exactly ${f} time(s).`;

        const q = Number(quantityAmount);
        if (!quantityAmount) return "Quantity amount is required.";
        if (!Number.isFinite(q)) return "Quantity amount must be a number.";
        if (q < 0.001) return "Quantity amount must be at least 0.001.";
        if (!quantityUnit) return "Quantity unit is required.";
        if (!DOSE_UNITS.includes(String(quantityUnit))) return "Invalid quantity unit.";
        if (instructions && instructions.length > 500) return "Instructions must be 500 characters or less.";

        return null;
    }

    function next() {
        const msg = validateStep();
        if (msg) return setErr(msg);
        setStep((s) => Math.min(4, s + 1));
    }

    function back() {
        setErr("");
        setStep((s) => Math.max(1, s - 1));
    }

    async function submit() {
        const msg = validateAll();
        if (msg) return setErr(msg);

        setSaving(true);
        setErr("");

        try {
            if (isEdit) {
                await doseApi.updateDose(editDose.id, {
                    timeFrequency: payload.timeFrequency,
                    daysOfWeek: payload.daysOfWeek,
                    times: payload.times,
                    quantityAmount: payload.quantityAmount,
                    quantityUnit: payload.quantityUnit,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    instructions: payload.instructions,
                });
                onUpdated?.();
            } else {
                await doseApi.createDose({
                    userId: payload.userId,
                    localMedicationId: payload.localMedicationId,
                    timeFrequency: payload.timeFrequency,
                    daysOfWeek: payload.daysOfWeek,
                    times: payload.times,
                    quantityAmount: payload.quantityAmount,
                    quantityUnit: payload.quantityUnit,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    instructions: payload.instructions,
                });
                onCreated?.();
            }
        } catch (e) {
            setErr(e?.message || (isEdit ? "Update dose failed." : "Create dose failed."));
        } finally {
            setSaving(false);
        }
    }

    const title = isEdit ? `Edit Dose #${editDose.id}` : "Create Dose";

    return (
        <Modal
            open={open}
            onClose={() => {
                setErr("");
                setStep(1);
                onClose?.();
            }}
            title={title}
            widthClass="max-w-6xl"
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left */}
                <div className="lg:col-span-7 space-y-5">
                    {err ? <Alert title="Fix this first" messages={[err]} /> : null}

                    <Stepper step={step} setStep={setStep} isEdit={isEdit} />

                    {step === 1 ? (
                        isEdit ? (
                            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                                <p className="text-xs font-bold tracking-widest text-slate-500">MEDICATION</p>
                                <p className="mt-2 text-lg font-extrabold text-slate-900">{editDose.medicationName}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Medication is locked for updates (dose is tied to the existing medication).
                                </p>
                            </div>
                        ) : (
                            <MedicationPicker
                                value={med}
                                onChange={(m) => {
                                    setErr("");
                                    setMed(m);
                                }}
                                localOnly={true}
                                showCreateInline={false}
                            />
                        )
                    ) : null}

                    {step === 2 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur space-y-5">
                            <p className="text-xs font-bold tracking-widest text-slate-500">SCHEDULE</p>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="Frequency (1–24 / day)"
                                    name="freq"
                                    type="number"
                                    value={timeFrequency}
                                    onChange={(e) => {
                                        setErr("");
                                        setTimeFrequency(e.target.value);
                                    }}
                                    placeholder="e.g. 2"
                                />

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-800">Quick presets</label>
                                    <div className="flex flex-wrap gap-2">
                                        <PresetBtn label="Once" tone="sky" onClick={() => setTimeFrequency(1)} />
                                        <PresetBtn label="2x/day" tone="emerald" onClick={() => setTimeFrequency(2)} />
                                        <PresetBtn label="3x/day" tone="violet" onClick={() => setTimeFrequency(3)} />
                                        <PresetBtn label="4x/day" tone="amber" onClick={() => setTimeFrequency(4)} />
                                    </div>
                                </div>
                            </div>

                            <DaysOfWeekChips value={daysOfWeek} onChange={setDaysOfWeek} />
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                            <p className="text-xs font-bold tracking-widest text-slate-500 mb-4">TIMES</p>
                            <TimesEditor
                                frequency={timeFrequency}
                                times={times}
                                onChange={(t) => {
                                    setErr("");
                                    setTimes(t);
                                }}
                            />
                        </div>
                    ) : null}

                    {step === 4 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur space-y-5">
                            <p className="text-xs font-bold tracking-widest text-slate-500">DETAILS</p>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="Quantity Amount"
                                    name="qtyAmount"
                                    value={quantityAmount}
                                    onChange={(e) => setQuantityAmount(toBigDecimalString(e.target.value))}
                                    placeholder="e.g. 1"
                                />

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-800">Quantity Unit</label>
                                    <select
                                        value={quantityUnit}
                                        onChange={(e) => setQuantityUnit(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-sky-100"
                                    >
                                        {DOSE_UNITS.map((u) => (
                                            <option key={u} value={u}>
                                                {UNIT_LABEL[u] || u}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Start Date (optional)"
                                    name="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />

                                <Input
                                    label="End Date (optional)"
                                    name="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-800">Instructions (optional)</label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-sky-100"
                                        placeholder="e.g. take with food"
                                    />
                                    <p className="text-xs text-slate-500">Max 500 characters • {instructions.length}/500</p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Footer */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={back}
                            disabled={step === 1}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                            Back
                        </button>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={next}
                                    className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-sky-700"
                                >
                                    Next
                                </button>
                            ) : (
                                <Button loading={saving} onClick={submit} className="sm:w-auto">
                                    {isEdit ? "Save changes" : "Create Dose"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-5 space-y-4">
                    <DosePreviewCard
                        userFullName={userFullName}
                        medicationName={isEdit ? editDose.medicationName : med?.name}
                        payload={payload}
                    />

                    <SchedulePreview
                        medicationName={isEdit ? editDose.medicationName : med?.name}
                        daysOfWeek={daysOfWeek} // UI days (empty shows as every day)
                        times={(times || []).map(normalizeTimeForDto)}
                        startDate={startDate}
                        endDate={endDate}
                        quantityAmount={quantityAmount}
                        quantityUnit={quantityUnit}
                    />
                </div>
            </div>
        </Modal>
    );
}

/* ---------------- Stepper ---------------- */

function Stepper({ step, setStep, isEdit }) {
    const steps = [
        { n: 1, label: isEdit ? "Medication (locked)" : "Medication" },
        { n: 2, label: "Schedule" },
        { n: 3, label: "Times" },
        { n: 4, label: "Details" },
    ];

    const pct = ((step - 1) / (steps.length - 1)) * 100;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {steps.map((s) => {
                    const active = s.n === step;
                    const done = s.n < step;

                    return (
                        <button
                            key={s.n}
                            type="button"
                            onClick={() => setStep(s.n)}
                            className={[
                                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                                active
                                    ? "bg-sky-600 text-white shadow-sm"
                                    : done
                                        ? "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                            ].join(" ")}
                        >
              <span
                  className={[
                      "h-6 w-6 rounded-full text-xs grid place-items-center font-extrabold",
                      active
                          ? "bg-white text-sky-700"
                          : done
                              ? "bg-sky-600 text-white"
                              : "bg-slate-100 text-slate-700",
                  ].join(" ")}
              >
                {s.n}
              </span>
                            {s.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------------- Preset Buttons ---------------- */

function PresetBtn({ label, onClick, tone = "sky" }) {
    const toneMap = {
        sky: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
        violet: "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100",
        amber: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "rounded-2xl border px-3 py-2 text-xs font-extrabold shadow-sm transition",
                toneMap[tone] || toneMap.sky,
            ].join(" ")}
        >
            {label}
        </button>
    );
}

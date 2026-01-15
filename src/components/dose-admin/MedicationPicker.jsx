import { useEffect, useMemo, useState } from "react";
import { Search, Lock, Pill } from "lucide-react";
import Input from "../general/Input.jsx";
import Alert from "../general/Alert.jsx";
import { medicationApi } from "../../features/medicationApi.js";

function isLocalItem(x) {
    const key = String(x?.key || "");
    return key.startsWith("LOCAL:") || x?.localId != null;
}

export default function MedicationPicker({
                                             value, // selected CatalogItem or null
                                             onChange, // (CatalogItem|null) => void
                                             showCreateInline = true,
                                             onCreateLocal, // optional hook after local creation
                                         }) {
    const [q, setQ] = useState("");
    const [limit] = useState(15);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [items, setItems] = useState([]);
    const [convertSeed, setConvertSeed] = useState(null); // CatalogItem to convert

    // ✅ One place to “select” AND clear the search UI
    function selectAndClear(itemOrNull) {
        onChange?.(itemOrNull);

        // Clear search UX (your requirement)
        setQ("");
        setItems([]);
        setErr("");
        setLoading(false);
        setConvertSeed(null);
    }

    useEffect(() => {
        let alive = true;

        async function run() {
            setErr("");
            const term = q.trim();
            if (term.length < 2) {
                setItems([]);
                return;
            }

            setLoading(true);
            try {
                // ✅ support either method name (your codebase has both in places)
                const fn =
                    medicationApi.searchCatalog ||
                    medicationApi.catalog ||
                    medicationApi.search ||
                    null;

                if (!fn) throw new Error("medicationApi.searchCatalog (or .catalog) is not implemented.");

                const res = await fn(term, limit);
                if (!alive) return;
                setItems(Array.isArray(res) ? res : []);
            } catch (e) {
                if (!alive) return;
                setErr(e?.message || "Failed to search medications.");
            } finally {
                if (alive) setLoading(false);
            }
        }

        const t = setTimeout(run, 250);
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [q, limit]);

    const sorted = useMemo(() => {
        const arr = [...items];
        arr.sort((a, b) => Number(isLocalItem(b)) - Number(isLocalItem(a))); // LOCAL first
        return arr;
    }, [items]);

    return (
        <div className="space-y-4">
            <Input
                label="Medication"
                name="medSearch"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Search (e.g. "amox", "tylenol")'
                right={
                    <div className="flex items-center gap-2">
                        {loading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                        ) : (
                            <Search className="h-4 w-4 text-slate-400" />
                        )}
                    </div>
                }
            />

            {err ? <Alert title="Medication search failed" messages={[err]} /> : null}

            {/* Selected */}
            {value ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-bold tracking-widest text-slate-500">SELECTED</p>
                            <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{value.name}</p>

                            <p className="mt-1 text-xs text-slate-500">
                                {isLocalItem(value) ? (
                                    <>
                                        <span className="font-semibold text-emerald-700">LOCAL</span> • localId:{" "}
                                        <span className="font-semibold">{value.localId}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-semibold text-slate-700">RXNORM</span> • RxCUI:{" "}
                                        <span className="font-semibold">{value.externalId}</span>
                                    </>
                                )}
                            </p>
                        </div>

                        <button
                            onClick={() => onChange?.(null)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            type="button"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Results */}
            {sorted.length ? (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-bold tracking-widest text-slate-500">RESULTS</p>
                        <p className="text-xs text-slate-500">{sorted.length} items</p>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {sorted.map((m) => {
                            const local = isLocalItem(m);

                            return (
                                <div
                                    key={m.key}
                                    className={[
                                        "w-full px-4 py-3 text-left transition",
                                        local ? "cursor-pointer hover:bg-slate-50" : "bg-white",
                                    ].join(" ")}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        if (!local) return; // RxNorm is not selectable here (convert instead)
                                        selectAndClear(m); // ✅ clears search when selected
                                    }}
                                    onKeyDown={(e) => {
                                        if (!local) return;
                                        if (e.key === "Enter" || e.key === " ") selectAndClear(m);
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 rounded-2xl border border-slate-200 bg-white p-2 text-slate-700">
                                            {local ? <Pill className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-extrabold text-slate-900">{m.name}</p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {local ? (
                                                    <>
                                                        <span className="font-semibold text-emerald-700">LOCAL</span> • localId{" "}
                                                        <span className="font-semibold">{m.localId}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-semibold text-slate-700">RXNORM</span> • RxCUI{" "}
                                                        <span className="font-semibold">{m.externalId}</span>
                                                    </>
                                                )}
                                            </p>

                                            {m.description ? (
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{m.description}</p>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center">
                                            {local ? (
                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                          Select
                        </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setConvertSeed(m);
                                                    }}
                                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                                                >
                                                    Convert to Local
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Type at least <span className="font-semibold">2 characters</span> to search.
                </div>
            )}

            {/* Inline create/convert */}
            {showCreateInline ? (
                <CreateLocalMedicationInline
                    query={q}
                    seed={convertSeed}
                    onCloseSeed={() => setConvertSeed(null)}
                    onCreated={(created) => {
                        // ✅ treat conversion as “select”, so search clears automatically
                        selectAndClear(created);
                        onCreateLocal?.(created);
                    }}
                />
            ) : null}
        </div>
    );
}

/* ---------------- Inline Create Local ---------------- */

function CreateLocalMedicationInline({ query, seed, onCloseSeed, onCreated }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (seed) setOpen(true);
    }, [seed]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-widest text-slate-500">LOCAL MED</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                        {seed ? "Convert RxNorm → Local" : "Create manual medication"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        {seed
                            ? "We’ll pre-fill fields from the RxNorm item, then create a local manual medication."
                            : "Needed for dose creation (RxNorm items are locked)."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {seed ? (
                        <button
                            onClick={() => {
                                onCloseSeed?.();
                                setOpen(false);
                            }}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                            type="button"
                        >
                            Cancel convert
                        </button>
                    ) : null}

                    <button
                        onClick={() => setOpen((s) => !s)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                        type="button"
                    >
                        {open ? "Hide" : "Create"}
                    </button>
                </div>
            </div>

            {open ? (
                <div className="mt-4">
                    <CreateLocalMedicationInlineForm
                        seedName={seed?.name || query?.trim() || ""}
                        seedExternalId={seed?.externalId || null}
                        onCreated={onCreated}
                    />
                </div>
            ) : null}
        </div>
    );
}

function CreateLocalMedicationInlineForm({ seedName, seedExternalId, onCreated }) {
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const guessedStrength = guessStrength(seedName);

    const [form, setForm] = useState({
        name: seedName || "",
        medicationForm: "TABLET",
        medicationStrength: guessedStrength,
        medicationDescription: seedExternalId ? `Converted from RxNorm (RxCUI: ${seedExternalId}).` : "",
    });

    async function submit() {
        setErr("");
        if (!form.name.trim()) {
            setErr("Name is required.");
            return;
        }

        setSaving(true);
        try {
            const created = await medicationApi.createLocal({
                name: form.name.trim(),
                medicationForm: form.medicationForm,
                medicationStrength: form.medicationStrength || null,
                medicationDescription: form.medicationDescription || null,
            });

            onCreated?.(created);
        } catch (e) {
            setErr(e?.message || "Failed to create local medication.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            {err ? <Alert title="Could not create medication" messages={[err]} /> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Amoxicillin 500mg"
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800">Form</label>
                    <select
                        value={form.medicationForm}
                        onChange={(e) => setForm((p) => ({ ...p, medicationForm: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
                    >
                        <option value="TABLET">TABLET</option>
                        <option value="CAPSULE">CAPSULE</option>
                        <option value="LIQUID">LIQUID</option>
                        <option value="INJECTION">INJECTION</option>
                        <option value="OTHER">OTHER</option>
                    </select>
                </div>

                <Input
                    label="Strength (optional)"
                    name="strength"
                    value={form.medicationStrength}
                    onChange={(e) => setForm((p) => ({ ...p, medicationStrength: e.target.value }))}
                    placeholder="e.g. 500 mg"
                />

                <Input
                    label="Medication Description (optional)"
                    name="medicationDescription"
                    value={form.medicationDescription}
                    onChange={(e) => setForm((p) => ({ ...p, medicationDescription: e.target.value }))}
                    placeholder="Any helpful note"
                />
            </div>

            <button
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                type="button"
            >
                {saving ? "Creating..." : "Create Local Medication"}
            </button>
        </div>
    );
}

function guessStrength(name) {
    const s = String(name || "");
    const m = s.match(/(\d+(\.\d+)?)\s*(MG|G|MCG|ML|IU)\b/i);
    if (!m) return "";
    return `${m[1]} ${m[3].toUpperCase()}`;
}

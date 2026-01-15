// src/pages/medication/views/AdminMedicationView.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, Trash2, Pencil } from "lucide-react";

import { medicationApi } from "../../features/medicationApi.js";

import Button from "../../components/general/Button.jsx";
import Input from "../../components/general/Input.jsx";
import Modal from "../../components/general/Modal.jsx";

// ✅ use picker (it includes Convert→Local)
import MedicationPicker from "../../components/dose-admin/MedicationPicker.jsx";
import LocalMedicationCreateCard from "../../components/medication/admin/LocalMedicationCreateCard.jsx";

function isLocalItem(item) {
    return item && item.localId != null;
}

export default function AdminMedicationView() {
    const [query, setQuery] = useState("");
    const [limit, setLimit] = useState(20);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]); // catalog merge (rx + local)
    const [error, setError] = useState("");

    const localItems = useMemo(() => items.filter(isLocalItem), [items]);

    // ✅ picker “selection”
    const [picked, setPicked] = useState(null);

    // Edit modal state
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [saving, setSaving] = useState(false);

    const [selected, setSelected] = useState(null); // CatalogItem (local)
    const [edit, setEdit] = useState({
        id: null,
        name: "",
        medicationForm: "",
        medicationStrength: "",
        medicationDescription: "",
    });

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

    // debounced search (for the “Local meds manager” list below)
    const debounceRef = useRef(null);
    const latestQueryRef = useRef("");

    useEffect(() => {
        latestQueryRef.current = query.trim();

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            runSearch(latestQueryRef.current);
        }, 300);

        return () => debounceRef.current && clearTimeout(debounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, limit]);

    async function runSearch(q) {
        const trimmed = (q || "").trim();
        setError("");

        if (trimmed.length < 2) {
            setItems([]);
            return;
        }

        setLoading(true);
        try {
            // your api exposes `catalog` (and we keep compatibility if you later add searchCatalog)
            const fn = medicationApi.searchCatalog || medicationApi.catalog;
            if (!fn) throw new Error("medicationApi.catalog is not implemented.");

            const res = await fn(trimmed, limit);

            if (latestQueryRef.current !== trimmed) return;
            setItems(Array.isArray(res) ? res : []);
        } catch (e) {
            setItems([]);
            setError(e?.message || "Catalog search failed.");
        } finally {
            setLoading(false);
        }
    }

    function openEditFor(item) {
        setError("");
        setSelected(item);
        setEdit({
            id: item.localId,
            name: item.name || "",
            medicationForm: item.medicationForm || "",
            medicationStrength: item.medicationStrength || "",
            medicationDescription: item.description || "",
        });
        setOpenEdit(true);
    }

    async function handleUpdate() {
        if (!edit.id) {
            setError("No local medication selected (missing id).");
            return;
        }

        const payload = {
            name: String(edit.name || "").trim(),
            medicationForm: String(edit.medicationForm || "").trim(), // dropdown enum
            medicationStrength: String(edit.medicationStrength || "").trim(),
            medicationDescription: String(edit.medicationDescription || "").trim(),
        };

        if (payload.name.length < 2) {
            setError("Medication name must be at least 2 characters.");
            return;
        }
        if (!payload.medicationForm) {
            setError("Medication form is required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            // ✅ correct method name from medicationApi.js
            await medicationApi.updateLocal(edit.id, payload); // :contentReference[oaicite:1]{index=1}

            setOpenEdit(false);

            if (latestQueryRef.current.length >= 2) {
                await runSearch(latestQueryRef.current);
            }
        } catch (e) {
            setError(e?.message || "Update failed.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!edit.id) return;

        setSaving(true);
        setError("");
        try {
            await medicationApi.deleteLocal(edit.id); // :contentReference[oaicite:2]{index=2}
            setOpenDelete(false);
            setOpenEdit(false);
            setSelected(null);

            if (latestQueryRef.current.length >= 2) {
                await runSearch(latestQueryRef.current);
            }
        } catch (e) {
            setError(e?.message || "Delete failed.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Error block (so nothing fails silently) */}
            {error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                    {error}
                </div>
            ) : null}

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Catalog search + Convert→Local */}
                    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold tracking-widest text-slate-700">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    CATALOG SEARCH
                                </div>
                                <h4 className="mt-3 text-base font-extrabold text-slate-900">
                                    Search & convert RxNorm → Local
                                </h4>
                                <p className="mt-1 text-sm text-slate-600">
                                    Pick local meds directly, or convert RxNorm results into local meds.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <MedicationPicker
                                value={picked}
                                onChange={(item) => {
                                    setPicked(item);
                                    if (item?.localId != null) openEditFor(item);
                                }}
                                showCreateInline={true}
                                onCreateLocal={(created) => {
                                    if (created?.localId != null) openEditFor(created);
                                }}
                            />
                        </div>
                    </div>

                    {/* Local meds manager */}
                    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold tracking-widest text-slate-700">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    LOCAL MEDS MANAGER
                                </div>
                                <h4 className="mt-3 text-base font-extrabold text-slate-900">
                                    Update / Delete local medications
                                </h4>
                                <p className="mt-1 text-sm text-slate-600">
                                    Search the catalog, then manage only{" "}
                                    <span className="font-semibold">LOCAL</span> entries.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[11px] font-bold tracking-widest text-slate-500">
                                        LOCAL IN RESULTS
                                    </p>
                                    <p className="mt-1 text-sm font-extrabold text-slate-900">{localItems.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <Input
                                    label="Search Local Medications"
                                    name="query"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Try: advi, amox, tylenol..."
                                    right={
                                        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                      <Search className="h-4 w-4" />
                                            {loading ? "Searching..." : "Search"}
                    </span>
                                    }
                                />
                            </div>

                            <div>
                                <Input
                                    label="Limit"
                                    type="number"
                                    name="limit"
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value || 20))}
                                    placeholder="20"
                                />
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-bold tracking-widest text-slate-500">LOCAL RESULTS</p>
                                <p className="text-xs text-slate-500">
                                    {query.trim().length < 2
                                        ? "Type 2+ chars"
                                        : loading
                                            ? "Loading..."
                                            : `${localItems.length} found`}
                                </p>
                            </div>

                            <div className="max-h-[420px] overflow-y-auto p-3">
                                {query.trim().length < 2 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                        Start typing to fetch results (min 2 characters).
                                    </div>
                                ) : loading ? (
                                    <div className="space-y-2">
                                        {[...Array(6)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-14 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                                            />
                                        ))}
                                    </div>
                                ) : localItems.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                        No local medications in these results.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {localItems.map((m) => (
                                            <button
                                                key={m.key}
                                                onClick={() => openEditFor(m)}
                                                className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
                                                type="button"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-extrabold text-slate-900">{m.name}</p>
                                                        <p className="mt-1 text-xs text-slate-600">
                                                            Local ID: <span className="font-semibold">{m.localId}</span>
                                                            {" • "}
                                                            Form: <span className="font-semibold">{m.medicationForm || "—"}</span>
                                                            {" • "}
                                                            Strength: <span className="font-semibold">{m.medicationStrength || "—"}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition group-hover:bg-slate-50">
                              <Pencil className="h-4 w-4" />
                              Manage
                            </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="space-y-6">
                    <LocalMedicationCreateCard />
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                open={openEdit}
                onClose={() => {
                    if (!saving) setOpenEdit(false);
                }}
                title={`Manage Local Medication${edit.id ? ` • ID ${edit.id}` : ""}`}
                widthClass="max-w-4xl"
            >
                <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold tracking-widest text-slate-500">SELECTED</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">{selected?.name || "—"}</p>
                        <p className="mt-1 text-xs text-slate-600">
                            Key: <span className="font-semibold">{selected?.key}</span>
                        </p>
                    </div>

                    {/* show error inside modal too */}
                    {error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                            {error}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Medication Name"
                            name="name"
                            value={edit.name}
                            onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g., Ibuprofen 200mg Tablet"
                        />

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-800">Medication Form</label>

                            <select
                                name="medicationForm"
                                value={edit.medicationForm}
                                onChange={(e) => setEdit((p) => ({ ...p, medicationForm: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-slate-200"
                            >
                                <option value="" disabled>
                                    Select form…
                                </option>
                                {MEDICATION_FORMS.map((form) => (
                                    <option key={form} value={form}>
                                        {form}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Strength"
                            name="medicationStrength"
                            value={edit.medicationStrength}
                            onChange={(e) => setEdit((p) => ({ ...p, medicationStrength: e.target.value }))}
                            placeholder="e.g., 200 MG"
                        />
                        <Input
                            label="Description"
                            name="medicationDescription"
                            value={edit.medicationDescription}
                            onChange={(e) => setEdit((p) => ({ ...p, medicationDescription: e.target.value }))}
                            placeholder="Optional notes"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={() => setOpenDelete(true)}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setOpenEdit(false)}
                                disabled={saving}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <Button loading={saving} disabled={saving} onClick={handleUpdate} className="!w-auto px-6" type="button">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete confirm Modal */}
            <Modal
                open={openDelete}
                onClose={() => {
                    if (!saving) setOpenDelete(false);
                }}
                title="Confirm delete"
                widthClass="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <p className="text-sm font-extrabold text-rose-700">This action cannot be undone.</p>
                        <p className="mt-1 text-sm text-rose-700/90">
                            You’re deleting: <span className="font-extrabold">{edit.name || "—"}</span>
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setOpenDelete(false)}
                            disabled={saving}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" />
                            {saving ? "Deleting..." : "Yes, delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Pill, Search, Sparkles, Database, ShieldCheck, Info } from "lucide-react";
import { medicationApi } from "../../../features/medicationApi.js";

function isLocal(m) {
    return m?.localId != null || String(m?.key || "").startsWith("LOCAL:");
}

function chip(kind = "neutral") {
    const base =
        "inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1 text-[11px] font-bold tracking-wide";
    if (kind === "rx") return `${base} border-indigo-200 bg-indigo-50 text-indigo-700`;
    if (kind === "local") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    if (kind === "muted") return `${base} border-slate-200 bg-white text-slate-600`;
    return `${base} border-slate-200 bg-slate-50 text-slate-700`;
}

function buildChips(m) {
    const chips = [];

    if (isLocal(m)) {
        chips.push({ kind: "local", label: "LOCAL" });
        if (m?.localId != null) chips.push({ kind: "muted", label: `ID ${m.localId}` });
    } else {
        chips.push({ kind: "rx", label: "RXNORM" });
        if (m?.externalId) chips.push({ kind: "muted", label: `RxCUI ${m.externalId}` });
    }

    if (m?.medicationForm) chips.push({ kind: "muted", label: m.medicationForm });
    if (m?.medicationStrength) chips.push({ kind: "muted", label: m.medicationStrength });

    return chips;
}

export default function CatalogSearchCard() {
    const [q, setQ] = useState("");
    const [limit, setLimit] = useState(20);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    // debounce so typing feels premium
    const debRef = useRef(null);
    const latestRef = useRef("");

    const stats = useMemo(() => {
        const local = items.filter(isLocal).length;
        const rx = items.length - local;
        return { total: items.length, local, rx };
    }, [items]);

    async function runSearch(query, lim = limit) {
        const s = (query || "").trim();
        setError("");

        if (s.length < 2) {
            setItems([]);
            return;
        }

        setLoading(true);
        try {
            const res = await medicationApi.searchCatalog(s, lim);
            if (latestRef.current !== s) return; // ignore stale responses
            setItems(Array.isArray(res) ? res : []);
        } catch (e) {
            setError(e?.message || "Search failed.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        latestRef.current = q.trim();
        if (debRef.current) clearTimeout(debRef.current);

        debRef.current = setTimeout(() => {
            runSearch(latestRef.current);
        }, 250);

        return () => debRef.current && clearTimeout(debRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, limit]);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-widest text-slate-500">CATALOG SEARCH</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">RxNorm + Local medication</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Helpful reference information for caregivers and admins, displayed only when needed.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={chip("rx")}>RXNORM</span>
                        <span className={chip("local")}>LOCAL</span>
                        <span className={chip("muted")}>
              <Database className="h-3.5 w-3.5" />
                            {stats.total} results
            </span>
                        <span className={chip("muted")}>Rx: {stats.rx}</span>
                        <span className={chip("muted")}>Local: {stats.local}</span>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    <Sparkles className="h-4 w-4" />
                    Live
                </div>
            </div>

            {/* Controls */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-6">
                <div className="relative sm:col-span-4">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search: tylenol, amox, advi, ibup…"
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div className="sm:col-span-1">
                    <input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value || 20))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="20"
                        min={5}
                        max={50}
                    />
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">Limit</p>
                </div>

                <button
                    onClick={() => runSearch(q, limit)}
                    className="sm:col-span-1 h-[48px] rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-5 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
                >
                    Search
                </button>
            </div>

            {/* Results */}
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                        {error}
                    </div>
                ) : items.length ? (
                    <div className="space-y-2">
                        {items.slice(0, 10).map((m) => {
                            const local = isLocal(m);
                            const chipsList = buildChips(m);

                            return (
                                <div
                                    key={m.key}
                                    className={[
                                        "group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition",
                                        "hover:bg-slate-50 hover:shadow-md",
                                    ].join(" ")}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-extrabold text-slate-900 capitalize">{m.name}</p>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {chipsList.map((c, idx) => (
                                                    <span key={`${m.key}-${idx}`} className={chip(c.kind || "muted")}>
                            {c.label}
                          </span>
                                                ))}
                                            </div>

                                            {!!m.description ? (
                                                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{m.description}</p>
                                            ) : null}
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                      <span className={local ? chip("local") : chip("rx")}>
                        {local ? <ShieldCheck className="h-3.5 w-3.5" /> : <Pill className="h-3.5 w-3.5" />}
                          {local ? "Local" : "Reference"}
                      </span>

                                            <div
                                                className="h-10 w-10 rounded-2xl border border-slate-200 bg-white grid place-items-center"
                                                title="Reference entry"
                                            >
                                                <Info className="h-5 w-5 text-slate-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        {q.trim().length < 2 ? "Type at least 3 characters to search." : "No results found."}
                    </div>
                )}
            </div>
        </div>
    );
}

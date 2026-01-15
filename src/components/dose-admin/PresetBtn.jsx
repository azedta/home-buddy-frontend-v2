export default function PresetBtn({ label, onClick, variant = "slate" }) {
    const variants = {
        slate:
            "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100",
        emerald:
            "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
        indigo:
            "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
        amber:
            "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
        violet:
            "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
       inline-flex items-center rounded-2xl border px-4 py-2 shadow-sm
        text-xs font-extrabold transition
        ${variants[variant] ?? variants.slate}
      `}
        >
            {label}
        </button>
    );
}
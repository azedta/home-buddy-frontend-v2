export default function Button({ children, disabled, loading, className = "", ...props }) {
    return (
        <button
            disabled={disabled || loading}
            className={[
                "w-full rounded-xl px-4 py-3 font-semibold text-white",
                "shadow-lg shadow-blue-200/60 transition",
                "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400",
                "hover:brightness-105 active:brightness-95",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                className,
            ].join(" ")}
            {...props}
        >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : null}
          {children}
      </span>
        </button>
    );
}

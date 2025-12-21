export default function Divider({ label = "or" }) {
    return (
        <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-white/60">{label}</span>
            <div className="h-px flex-1 bg-white/10" />
        </div>
    );
}

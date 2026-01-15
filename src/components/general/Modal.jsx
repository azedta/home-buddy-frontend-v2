import { X } from "lucide-react";

export default function Modal({
                                  open,
                                  onClose,
                                  title,
                                  children,
                                  widthClass = "max-w-4xl",
                                  backdropClass = "bg-slate-900/40 backdrop-blur-sm",
                                  rootClass = "fixed inset-0 z-[80]", // ✅ NEW (defaults to current behavior)
                              }) {
    if (!open) return null;

    return (
        <div className={rootClass}>
            <div
                className={`absolute inset-0 ${backdropClass}`}
                onClick={onClose}
            />
            <div className="absolute inset-0 overflow-y-auto">
                <div className="mx-auto flex min-h-full items-center justify-center px-4 py-10">
                    <div className={`w-full ${widthClass} rounded-3xl border border-slate-200 bg-white shadow-2xl`}>
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
                            <div className="min-w-0">
                                <p className="text-xs font-bold tracking-widest text-slate-500">DETAILS</p>
                                <h3 className="mt-1 text-lg font-extrabold text-slate-900">{title}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

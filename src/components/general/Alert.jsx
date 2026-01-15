// src/components/general/Alert.jsx
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export default function Alert({ title, messages = [], variant = "info" }) {
    if (!title && (!messages || messages.length === 0)) return null;

    const v = String(variant || "info").toLowerCase();

    const meta =
        v === "error"
            ? {
                wrap: "border-rose-200 bg-rose-50",
                title: "text-rose-900",
                text: "text-rose-800",
                icon: AlertTriangle,
                iconWrap: "border-rose-200 bg-white",
                iconColor: "text-rose-700",
            }
            : v === "success"
                ? {
                    wrap: "border-emerald-200 bg-emerald-50",
                    title: "text-emerald-900",
                    text: "text-emerald-800",
                    icon: CheckCircle2,
                    iconWrap: "border-emerald-200 bg-white",
                    iconColor: "text-emerald-700",
                }
                : {
                    // info (default)
                    wrap: "border-sky-200 bg-sky-50",
                    title: "text-sky-900",
                    text: "text-sky-800",
                    icon: Info,
                    iconWrap: "border-sky-200 bg-white",
                    iconColor: "text-sky-700",
                };

    const Icon = meta.icon;

    return (
        <div className={`rounded-2xl border p-4 ${meta.wrap}`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border ${meta.iconWrap}`}>
                    <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                </div>

                <div className="min-w-0 flex-1">
                    {title ? <p className={`font-extrabold ${meta.title}`}>{title}</p> : null}

                    {messages?.length ? (
                        <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${meta.text}`}>
                            {messages.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

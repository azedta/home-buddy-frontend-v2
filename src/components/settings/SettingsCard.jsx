export default function SettingsCard({ title, subtitle, icon: Icon, iconClassName = "text-slate-600", children, right }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                    {Icon ? (
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <Icon className={["h-5 w-5", iconClassName].join(" ")} />
                        </div>
                    ) : null}

                    <div>
                        <p className="text-sm font-extrabold text-slate-900">{title}</p>
                        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
                    </div>
                </div>

                {right ? <div className="shrink-0">{right}</div> : null}
            </div>

            <div className="mt-5">{children}</div>
        </section>
    );
}

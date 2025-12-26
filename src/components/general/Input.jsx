import FieldError from "./FieldError.jsx";

export default function Input({
                                  label,
                                  type = "text",
                                  name,
                                  value,
                                  onChange,
                                  onBlur,
                                  placeholder,
                                  error,
                                  right,
                                  autoComplete,
                              }) {
    const hasError = Boolean(error);

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">
                {label}
            </label>

            <div
                className={[
                    "relative rounded-xl border bg-white shadow-sm transition",
                    "focus-within:ring-4",
                    hasError
                        ? "border-rose-300 ring-rose-100"
                        : "border-slate-200 ring-blue-100",
                ].join(" ")}
            >
                <input
                    className={[
                        "w-full rounded-xl bg-transparent px-4 py-3 text-slate-900 outline-none",
                        "placeholder:text-slate-400",
                    ].join(" ")}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                />

                {right ? (
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        {right}
                    </div>
                ) : null}
            </div>

            <FieldError>{error}</FieldError>
        </div>
    );
}

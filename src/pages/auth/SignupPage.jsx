import { useMemo, useState } from "react";
import Input from "../../components/general/Input.jsx";
import Button from "../../components/general/Button.jsx";
import Alert from "../../components/general/Alert.jsx";
import { validateSignup } from "../../features/authValidation.js";
import { signup } from "../../features/authApi.js";
import { normalizeAuthError } from "../../features/authErrors.js";
import { useNavigate, Link } from "react-router-dom";

/* ---------- UI bits ---------- */

function scorePassword(pw) {
    const s = pw || "";
    let score = 0;
    if (s.length >= 6) score += 20;
    if (s.length >= 10) score += 20;
    if (/[a-z]/.test(s)) score += 15;
    if (/[A-Z]/.test(s)) score += 15;
    if (/[0-9]/.test(s)) score += 15;
    if (/[^a-zA-Z0-9]/.test(s)) score += 15;
    if (s.length > 0 && s.length < 6) score = Math.min(score, 25);
    return Math.min(100, score);
}

function strengthLabel(score) {
    if (score === 0) return { text: "—", hint: "Enter a password", tone: "slate" };
    if (score < 40) return { text: "Weak", hint: "Add length + numbers", tone: "rose" };
    if (score < 70) return { text: "Good", hint: "Add uppercase/symbols", tone: "amber" };
    return { text: "Strong", hint: "Nice. This is solid.", tone: "emerald" };
}

function StrengthBar({ password }) {
    const score = scorePassword(password);
    const meta = strengthLabel(score);

    const toneMap = {
        slate: "bg-slate-300",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        emerald: "bg-emerald-500",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                    Password strength: <span className="font-extrabold">{meta.text}</span>
                </p>
                <p className="text-xs text-slate-600">{meta.hint}</p>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full ${toneMap[meta.tone]} transition-all duration-300`} style={{ width: `${score}%` }} />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-600">
                <span className={password.length >= 6 ? "text-slate-900 font-semibold" : ""}>6+ chars</span>
                <span className={/[0-9]/.test(password) ? "text-slate-900 font-semibold" : ""}>number</span>
                <span className={/[A-Z]/.test(password) ? "text-slate-900 font-semibold" : ""}>uppercase</span>
                <span className={/[^a-zA-Z0-9]/.test(password) ? "text-slate-900 font-semibold" : ""}>symbol</span>
            </div>
        </div>
    );
}

function IllustrationPanel() {
    return (
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18)_0%,transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.16)_0%,transparent_45%),radial-gradient(circle_at_60%_85%,rgba(99,102,241,0.10)_0%,transparent_45%)]" />
            <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:72px_72px]" />

            {/* Orbit rings */}
            <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/60" />
            <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/70" />
            <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/60" />

            {/* Floating cards */}
            <div className="absolute left-10 top-14 animate-float-1">
                <div className="group w-64 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur transition duration-200 hover:shadow-xl hover:-translate-y-0.5">
                    <p className="text-xs font-bold tracking-widest text-slate-500">LIVE</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Robot status</p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
            <span className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Battery</span>
              <span className="mt-0.5 text-sm font-bold text-emerald-800">92%</span>
            </span>

                        <span className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-blue-50 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">Dock</span>
              <span className="mt-0.5 text-sm font-bold text-blue-800">Docked</span>
            </span>

                        <span className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Tray</span>
              <span className="mt-0.5 text-sm font-bold text-slate-800">OK</span>
            </span>
                    </div>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>
            </div>

            <div className="absolute right-12 top-32 animate-float-xy">
                <div className="group w-56 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur transition duration-200 hover:shadow-xl hover:-translate-y-0.5">
                    <p className="text-xs font-bold tracking-widest text-slate-500">REMINDER</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Water time</p>
                    <p className="mt-2 text-xs text-slate-600">Gentle notifications with clear actions.</p>
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>
            </div>

            {/* Center robot */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="relative inline-block">
                    <div className="absolute inset-0 -z-10 rounded-full bg-blue-300/30 blur-2xl" />
                    <img
                        src="/robot.png"
                        alt="HomeBuddy robot"
                        className="h-36 w-36 drop-shadow-[0_25px_40px_rgba(59,130,246,0.25)] animate-float-5"
                    />
                </div>

                <div className="mt-4 flex flex-col items-center">
                    <p className="text-[22px] font-extrabold tracking-tight text-slate-900 leading-none">
                        Home
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Buddy</span>
                    </p>

                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-700 backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        HOME ASSISTANT ROBOT
                    </div>
                </div>
            </div>

            {/* Bottom cards */}
            <div className="absolute right-10 bottom-10 animate-float-3">
                <div className="group w-64 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur transition duration-200 hover:shadow-xl hover:-translate-y-0.5">
                    <p className="text-xs font-bold tracking-widest text-slate-500">MEDICATION</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Schedule & dispensing</p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
            <span className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-orange-50 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-600">Morning</span>
              <span className="mt-0.5 text-sm font-bold text-orange-800">Pills</span>
            </span>

                        <span className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-yellow-50 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-600">Daily</span>
              <span className="mt-0.5 text-sm font-bold text-yellow-800">Capsules</span>
            </span>

                        <span className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-violet-50 px-4 py-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">Night</span>
              <span className="mt-0.5 text-sm font-bold text-violet-800">Tablets</span>
            </span>
                    </div>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>
            </div>

            {/* ✅ bottom-24 instead of bottom-22 */}
            <div className="absolute left-12 bottom-24 animate-float-xy-soft">
                <div className="group w-56 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur transition duration-200 hover:shadow-xl hover:-translate-y-0.5">
                    <p className="text-xs font-bold tracking-widest text-slate-500">COMPANION</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Gentle check-ins</p>
                    <p className="mt-2 text-xs text-slate-600">Friendly prompts and calm daily wellness reminders.</p>
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-20" />
            <div className="absolute bottom-5 left-8 text-xs text-slate-500">
                © {new Date().getFullYear()} HomeBuddy — Capstone v2
            </div>
        </div>
    );
}

/* ---------- Page ---------- */

export default function SignupPage() {
    const [values, setValues] = useState({
        fullname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    const errors = useMemo(() => validateSignup(values), [values]);
    const canSubmit = Object.keys(errors).length === 0 && !loading;

    function onChange(e) {
        setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
        setServerError(null);
        setSuccessMsg("");
    }

    function onBlur(e) {
        setTouched((t) => ({ ...t, [e.target.name]: true }));
    }

    async function onSubmit(e) {
        e.preventDefault();

        setTouched({
            fullname: true,
            username: true,
            email: true,
            password: true,
            confirmPassword: true,
        });

        const currentErrors = validateSignup(values);
        if (Object.keys(currentErrors).length) return;

        setLoading(true);
        setServerError(null);
        setSuccessMsg("");

        try {
            const payload = {
                fullname: values.fullname.trim(),
                username: values.username.trim(),
                email: values.email.trim(),
                password: values.password,
                role: ["user"],
            };

            await signup(payload);

            // Optional: show brief success feedback
            setSuccessMsg("Account created successfully. Redirecting to login...");

            // Small delay feels intentional (matches your Login UX)
            setTimeout(() => {
                navigate("/login");
            }, 700);

        } catch (err) {
            setServerError(normalizeAuthError(err));
        } finally {
            setLoading(false);
        }
    }

    const show = (name) => (touched[name] ? errors[name] : "");

    return (
        <div className="min-h-screen w-full overflow-auto md:h-screen md:overflow-hidden bg-slate-50">
            {/* background */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(59,130,246,0.18)_0%,transparent_42%),radial-gradient(circle_at_80%_25%,rgba(34,211,238,0.14)_0%,transparent_45%)]" />

            <div className="relative grid min-h-screen md:h-screen grid-cols-1 md:grid-cols-2">
                {/* Left panel (desktop only) */}
                <section className="hidden md:block p-8">
                    <div className="flex h-full flex-col gap-6">
                        <div className="min-h-0 flex-1">
                            <IllustrationPanel />
                        </div>
                    </div>
                </section>

                {/* Right panel */}
                <section className="flex items-center justify-center px-6 py-10 md:px-10 md:py-0">
                    <div className="w-full max-w-md md:h-[calc(100vh-64px)] md:flex md:flex-col md:justify-center">
                        {/* ✅ make card relative so scroll hint anchors correctly */}
                        <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 md:max-h-[calc(100vh-80px)] md:overflow-hidden">
                            {/* ✅ scroll container */}
                            <div className="relative p-6 md:p-8 md:max-h-[calc(100vh-80px)] md:overflow-auto scrollbar-hidden">
                                <p className="text-xs font-bold tracking-widest text-slate-500">CREATE ACCOUNT</p>
                                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Join HomeBuddy</h2>
                                <p className="mt-2 text-slate-600">Beautifully simple. Built for comfort.</p>

                                <div className="mt-6">
                                    {serverError ? (
                                        <div className="mb-4">
                                            <Alert title={serverError.title} messages={serverError.messages} />
                                        </div>
                                    ) : null}

                                    {successMsg ? (
                                        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                                            <p className="font-semibold">Success</p>
                                            <p className="mt-1 text-sm">{successMsg}</p>
                                        </div>
                                    ) : null}

                                    <form onSubmit={onSubmit} className="space-y-4 pb-5 md:pb-14">
                                    <Input
                                            label="Full name"
                                            name="fullname"
                                            value={values.fullname}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            placeholder="e.g., Aziz Tazrout"
                                            autoComplete="name"
                                            error={show("fullname")}
                                        />

                                        <Input
                                            label="Username"
                                            name="username"
                                            value={values.username}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            placeholder="Choose a username"
                                            autoComplete="username"
                                            error={show("username")}
                                        />

                                        <Input
                                            label="Email"
                                            name="email"
                                            value={values.email}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            error={show("email")}
                                        />

                                        <Input
                                            label="Password"
                                            name="password"
                                            type="password"
                                            value={values.password}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            placeholder="At least 6 characters"
                                            autoComplete="new-password"
                                            error={show("password")}
                                        />

                                        <StrengthBar password={values.password} />

                                        <Input
                                            label="Confirm password"
                                            name="confirmPassword"
                                            type="password"
                                            value={values.confirmPassword}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            placeholder="Re-enter password"
                                            autoComplete="new-password"
                                            error={show("confirmPassword")}
                                        />

                                        <div className="pt-2">
                                            <div className="relative">
                                                <div className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600/25 via-cyan-400/25 to-indigo-400/20 blur-lg" />
                                                <Button type="submit" loading={loading} disabled={!canSubmit}>
                                                    Create account
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                            <p className="font-semibold text-slate-900">Why we ask full name</p>
                                            <p className="mt-1">It will appear on your dashboard for a warmer, more human experience.</p>
                                        </div>

                                        <p className="pt-2 text-center text-sm text-slate-600">
                                            Already have an account?{" "}
                                            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                                                Log in
                                            </Link>
                                        </p>
                                    </form>
                                </div>
                            </div>

                            {/* Scroll hint (desktop only) */}
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 hidden md:flex items-end justify-center">
                                <div className="h-14 w-full bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center">
                                    <span className="mb-2 text-slate-400 animate-scrollHint">↓</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-xs text-slate-500 hidden md:block">
                            Built for clarity and comfort. High-contrast UI, large inputs, simple flow.
                        </p>
                    </div>
                </section>

            </div>

        </div>
    );
}

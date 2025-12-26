import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/authStore.js";
import { signout } from "../../features/authApi";


function getGreetingLine() {
    const h = new Date().getHours();
    if (h < 12) return { greet: "Good morning", sub: "Let’s keep things smooth and on-track." };
    if (h < 18) return { greet: "Good afternoon", sub: "Ready for a clean, productive session?" };
    return { greet: "Good evening", sub: "Let’s wrap up strong — small wins count." };
}

export default function Topbar({ onOpenSidebar }) {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const name = user?.fullname || user?.username || "there";
    const initial = (name?.trim()?.charAt(0) || "U").toUpperCase();

    const { greet, sub } = useMemo(getGreetingLine, []);

    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        function onDocClick(e) {
            if (!open) return;
            const t = e.target;
            if (btnRef.current?.contains(t)) return;
            if (menuRef.current?.contains(t)) return;
            setOpen(false);
        }
        function onEsc(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    const logout = useAuthStore((s) => s.logout);

    async function handleSignOut() {
        try {
            await signout(); // clears HttpOnly cookie via backend
        } catch {
            // If backend is unreachable, still log out locally to avoid stuck UI
        } finally {
            logout();         // clears homebuddy_auth + user state
            navigate("/login");
        }
    }

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/75 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenSidebar}
                        className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 active:scale-[0.98] transition"
                        aria-label="Open sidebar"
                        type="button"
                    >
                        ☰
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-600">
                            {greet},{" "}
                            <span className="font-semibold text-slate-900">{name}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p>
                    </div>

                    {/* Avatar dropdown */}
                    <div className="relative">
                        <button
                            ref={btnRef}
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            onMouseEnter={() => setOpen(true)}
                            className="group h-10 w-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 grid place-items-center font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 active:scale-[0.98] transition"
                            aria-haspopup="menu"
                            aria-expanded={open}
                            aria-label="Open user menu"
                            title={name}
                        >
                            <span className="drop-shadow-sm">{initial}</span>
                        </button>

                        {/* Menu */}
                        <div
                            ref={menuRef}
                            onMouseLeave={() => setOpen(false)}
                            className={[
                                "absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
                                "origin-top-right transition",
                                open ? "scale-100 opacity-100" : "pointer-events-none scale-[0.98] opacity-0",
                            ].join(" ")}
                            role="menu"
                        >
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-xs text-slate-500">Signed in as</p>
                                <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                            </div>

                            <div className="p-2">
                                <Link
                                    to="/notifications"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                                    role="menuitem"
                                >
                  <span className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 grid place-items-center">
                    🔔
                  </span>
                                    <div className="min-w-0">
                                        <p className="font-medium">Notifications</p>
                                        <p className="text-xs text-slate-500 truncate">Recent alerts & updates</p>
                                    </div>
                                </Link>

                                <Link
                                    to="/settings"
                                    onClick={() => setOpen(false)}
                                    className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                                    role="menuitem"
                                >
                  <span className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 grid place-items-center">
                    ⚙️
                  </span>
                                    <div className="min-w-0">
                                        <p className="font-medium">Settings</p>
                                        <p className="text-xs text-slate-500 truncate">Profile & preferences</p>
                                    </div>
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 transition"
                                    role="menuitem"
                                >
                  <span className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-100 grid place-items-center">
                    ⎋
                  </span>
                                    <div className="min-w-0 text-left">
                                        <p className="font-semibold">Sign out</p>
                                        <p className="text-xs text-rose-600 truncate">End this session safely</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* /Avatar dropdown */}
                </div>
            </div>
        </header>
    );
}

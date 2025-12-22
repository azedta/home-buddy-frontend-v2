import { useAuthStore } from "../features/authStore.js";


// function getGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return "Good morning";
//     if (h < 18) return "Good afternoon";
//     return "Good evening";
// }

export default function Topbar({ pageMeta, onOpenSidebar }) {
    const user = useAuthStore((s) => s.user);

    const name = user?.fullname || user?.username || "there";
    const initial = name.charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/75 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenSidebar}
                        className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                    >
                        ☰
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-600">
                            Good day, <span className="font-semibold text-slate-800">{name}</span>
                        </p>

                        <h1 className="text-[20px] font-semibold tracking-tight text-slate-800">
                            {pageMeta.title}
                        </h1>
                    </div>

                    <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 grid place-items-center font-semibold text-slate-700">
                        {initial}
                    </div>
                </div>
            </div>
        </header>
    );
}

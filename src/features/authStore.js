import { create } from "zustand";

function readStoredAuth() {
    try {
        const local = localStorage.getItem("homebuddy_auth");
        const session = sessionStorage.getItem("homebuddy_auth");
        const raw = local || session;
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearStoredAuth() {
    localStorage.removeItem("homebuddy_auth");
    sessionStorage.removeItem("homebuddy_auth");
}

export const useAuthStore = create((set) => ({
    user: readStoredAuth(),

    // if you want: pass { rememberMe: true/false }
    setUser: (user, opts = { rememberMe: true }) => {
        try {
            clearStoredAuth();
            const rememberMe = opts?.rememberMe !== false;
            if (rememberMe) localStorage.setItem("homebuddy_auth", JSON.stringify(user));
            else sessionStorage.setItem("homebuddy_auth", JSON.stringify(user));
        } catch {
            // ignore storage errors
        }
        set({ user });
    },

    logout: () => {
        clearStoredAuth();
        set({ user: null });
    },
}));

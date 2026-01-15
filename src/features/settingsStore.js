import { create } from "zustand";
import { settingsApi } from "./settingsApi.js";

export const useSettingsStore = create((set, get) => ({
    settings: null,
    loading: false,
    error: null,

    // fetch once (unless forced)
    load: async (force = false) => {
        const { settings, loading } = get();
        if (!force && (settings || loading)) return;

        try {
            set({ loading: true, error: null });
            const data = await settingsApi.getMe();
            set({ settings: data, loading: false });
        } catch (e) {
            set({
                loading: false,
                error: e?.message || "Failed to load settings",
            });
        }
    },

    // optional: allow optimistic local update after saving
    setSettings: (next) => set({ settings: next }),
}));

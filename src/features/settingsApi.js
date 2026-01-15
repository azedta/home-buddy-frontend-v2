import { apiFetch } from "./apiFetch.js";

export const settingsApi = {
    getMe: () => apiFetch(`/api/settings/me`),
    updateMe: (payload) =>
        apiFetch(`/api/settings/me`, { method: "PUT", body: payload }),
};

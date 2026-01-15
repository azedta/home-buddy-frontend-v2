import { apiFetch } from "./apiFetch.js";

export const medicationApi = {
    catalog: (q, limit = 20) =>
        apiFetch(`/api/medications/catalog?q=${encodeURIComponent(q)}&limit=${limit}`),

    createLocal: (payload) =>
        apiFetch(`/api/medications`, { method: "POST", body: payload }),

    updateLocal: (id, payload) =>
        apiFetch(`/api/medications/${id}`, { method: "PUT", body: payload }),

    deleteLocal: (id) =>
        apiFetch(`/api/medications/${id}`, { method: "DELETE" }),
};

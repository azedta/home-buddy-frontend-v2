import { apiFetch } from "./apiFetch.js";

export const doseApi = {
    /* ------------------------------
       DOSES
    ------------------------------ */
    createDose: (payload) =>
        apiFetch(`/api/doses`, { method: "POST", body: payload }),

    listDoses: ({ userId }) =>
        apiFetch(`/api/doses?userId=${encodeURIComponent(String(userId))}`),

    getDoseById: (id) =>
        apiFetch(`/api/doses/${encodeURIComponent(String(id))}`),

    updateDose: (id, payload) =>
        apiFetch(`/api/doses/${encodeURIComponent(String(id))}`, { method: "PUT", body: payload }),

    deleteDose: (id) =>
        apiFetch(`/api/doses/${encodeURIComponent(String(id))}`, { method: "DELETE" }),

    /* ------------------------------
       OCCURRENCES
    ------------------------------ */
    listWindow: ({ userId, from, to }) =>
        apiFetch(
            `/api/dose-occurrences?userId=${encodeURIComponent(String(userId))}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        ),

    generateWindow: ({ userId, from, to }) =>
        apiFetch(`/api/dose-occurrences/generate?userId=${encodeURIComponent(String(userId))}`, {
            method: "POST",
            body: { from, to },
        }),

    // convenience (optional)
    generateAndListWindow: async ({ userId, from, to }) => {
        await doseApi.generateWindow({ userId, from, to });
        return doseApi.listWindow({ userId, from, to });
    },

    markTaken: ({ id, takenAt, note }) =>
        apiFetch(`/api/dose-occurrences/${encodeURIComponent(String(id))}/taken`, {
            method: "POST",
            body: { takenAt, note: note || "" },
        }),

    setStatus: ({ id, status, note }) =>
        apiFetch(`/api/dose-occurrences/${encodeURIComponent(String(id))}/status`, {
            method: "POST",
            body: { status, note: note || "" },
        }),
};

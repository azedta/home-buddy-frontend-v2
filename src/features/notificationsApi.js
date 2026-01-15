// src/features/notificationsApi.js
import { apiFetch } from "./apiFetch.js";

function appendIf(params, key, value) {
    if (value === undefined || value === null) return;
    const s = String(value).trim();
    if (!s || s === "undefined" || s === "null") return;
    params.set(key, s);
}

export const notificationsApi = {
    list: ({ userId, unreadOnly, type, from, to, q, page = 0, size = 20 } = {}) => {
        const params = new URLSearchParams();

        // IMPORTANT: only include userId when it’s valid
        appendIf(params, "userId", userId);

        if (unreadOnly !== undefined && unreadOnly !== null) {
            params.set("unreadOnly", String(unreadOnly));
        }

        appendIf(params, "type", type);
        appendIf(params, "from", from);
        appendIf(params, "to", to);
        appendIf(params, "q", q);

        params.set("page", String(page));
        params.set("size", String(size));

        const qs = params.toString();
        return apiFetch(`/api/notifications${qs ? `?${qs}` : ""}`);
    },

    unreadCount: ({ userId } = {}) => {
        // If userId is missing, hit endpoint without userId param (only works if backend supports global count)
        if (userId === undefined || userId === null || String(userId).trim() === "" || String(userId) === "undefined") {
            return apiFetch(`/api/notifications/unread-count`);
        }
        return apiFetch(`/api/notifications/unread-count?userId=${encodeURIComponent(userId)}`);
    },

    create: (payload) => apiFetch(`/api/notifications`, { method: "POST", body: payload }),

    markRead: ({ id, userId }) =>
        apiFetch(`/api/notifications/${id}/read?userId=${encodeURIComponent(userId)}`, { method: "POST" }),

    markAllRead: ({ userId }) =>
        apiFetch(`/api/notifications/read-all?userId=${encodeURIComponent(userId)}`, { method: "POST" }),

    delete: ({ id }) => apiFetch(`/api/notifications/${id}`, { method: "DELETE" }),
};

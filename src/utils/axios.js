import axios from "axios";
import { useAuthStore } from "../features/authStore.js";

function extractJwt(raw) {
    if (!raw) return null;
    const s = String(raw).trim();

    if (s.split(".").length === 3) return s;

    const m1 = s.match(/Bearer\s+(.+)/i);
    if (m1?.[1]) return m1[1].trim();

    const m2 = s.match(/(?:^|;\s*)jwtToken=([^;]+)/i);
    if (m2?.[1]) return m2[1].trim();

    return null;
}

function getToken() {
    const state = useAuthStore.getState();
    return (
        extractJwt(state?.user?.token) ||
        extractJwt(state?.user?.rawJwtToken) ||
        null
    );
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            console.error("[api] 401 Unauthorized", error?.config?.url);
        }
        return Promise.reject(error);
    }
);
// src/utils/apiFetch.js
import { useAuthStore } from "./authStore.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
    const s = useAuthStore.getState();
    return extractJwt(s?.user?.token) || extractJwt(s?.user?.rawJwtToken) || null;
}

export async function apiFetch(path, { method = "GET", body, headers } = {}) {
    const token = getToken();

    const finalHeaders = {
        ...(headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body != null ? { "Content-Type": "application/json" } : {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: "include",
        headers: finalHeaders,
        ...(body != null ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        let msg = "";

        try {
            if (ct.includes("application/json")) {
                const data = await res.json();
                msg = data?.message || data?.error || data?.details || JSON.stringify(data);
            } else {
                msg = await res.text();
            }
        } catch {
            msg = "";
        }

        if (res.status === 401) {
            throw new Error("401 Unauthorized — missing/invalid JWT.");
        }

        throw new Error(msg || `Request failed: ${res.status}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return null;
}

// Local ISO (no Z) for Spring LocalDateTime params
export function toLocalIso(d) {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

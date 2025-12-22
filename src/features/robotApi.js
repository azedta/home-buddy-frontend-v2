function getAuthToken() {
    try {
        const fromLocal = localStorage.getItem("homebuddy_auth");
        const fromSession = sessionStorage.getItem("homebuddy_auth");
        const raw = fromLocal || fromSession;
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token || null;
    } catch {
        return null;
    }
}

async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const data = await res.json();
            msg = data?.message || data?.error || msg;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

const BASE = "/api/v2/robot";

export function getRobotStatus() {
    return fetchWithAuth(`${BASE}/status`);
}

export function getRobotActivities(limit = 50) {
    return fetchWithAuth(`${BASE}/activities?limit=${encodeURIComponent(limit)}`);
}

export function getRobotCommands(limit = 15) {
    return fetchWithAuth(`${BASE}/commands?limit=${encodeURIComponent(limit)}`);
}

export function issueRobotCommand({ commandType, targetLocation, description }) {
    return fetchWithAuth(`${BASE}/commands`, {
        method: "POST",
        body: JSON.stringify({ commandType, targetLocation, description }),
    });
}
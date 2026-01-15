import { api } from "../utils/axios";

/* ---------------------------------------------
   ROBOT LOOKUP
--------------------------------------------- */

// Admin / Caregiver → list all robots
export async function getRobots() {
    const res = await api.get("/api/robot", { withCredentials: true });
    return res.data;
}

// Elderly user → backend resolves robot by userId
export async function getRobotStatusByUser(userId) {
    const res = await api.get(`/api/robot/by-user/${userId}/status`, {
        withCredentials: true,
    });
    return res.data;
}

// Admin / Caregiver → explicit robotId
export async function getRobotStatus(robotId) {
    const res = await api.get(`/api/robot/${robotId}/status`, {
        withCredentials: true,
    });
    return res.data;
}

// Admin / Caregiver → resolve robot by assisted user's username
export async function getRobotStatusByUsername(userName) {
    const u = encodeURIComponent(String(userName || "").trim());
    const res = await api.get(`/api/robot/by-username/${u}/status`, {
        withCredentials: true,
    });
    return res.data;
}


/* ---------------------------------------------
   ACTIVITIES & COMMANDS
--------------------------------------------- */

export async function getRobotActivities(robotId, limit = 50) {
    const res = await api.get(`/api/robot/${robotId}/activities`, {
        params: { limit },
        withCredentials: true,
    });
    return res.data;
}

export async function getRobotCommands(robotId, limit = 15) {
    const res = await api.get(`/api/robot/${robotId}/commands`, {
        params: { limit },
        withCredentials: true,
    });
    return res.data;
}

/* ---------------------------------------------
   COMMAND ISSUING
--------------------------------------------- */

export async function issueRobotCommand(robotId, payload) {
    const rid = encodeURIComponent(robotId);
    const res = await api.post(
        `/api/robot/${rid}/commands`,
        {
            commandType: payload.commandType,
            targetLocation: payload.targetLocation ?? null,
            description: payload.description ?? null,
        },
        { withCredentials: true }
    );
    return res.data;
}


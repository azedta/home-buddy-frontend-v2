import { api } from "../utils/axios.js";

export async function signup(payload) {
    const res = await api.post("/api/auth/signup", payload);
    return res.data;
}

export async function signin(payload) {
    const res = await api.post("/api/auth/signin", payload);
    return res.data;
}

import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    withCredentials: true, // needed if you use cookies for JWT
    headers: {
        "Content-Type": "application/json",
    },
});

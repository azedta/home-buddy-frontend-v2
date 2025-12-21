export function normalizeAuthError(err) {
    // Axios errors
    const status = err?.response?.status;
    const data = err?.response?.data;

    // Typical Spring validation errors can vary depending on how you built it
    // We'll support: { message }, string, { errors: [] }, etc.
    if (!status) {
        return {
            title: "Network error",
            messages: ["Could not reach the server. Check backend is running and CORS."],
        };
    }

    // If backend returns MessageResponse {message: "..."}
    if (data?.message && typeof data.message === "string") {
        return { title: "Authentication failed", messages: [data.message] };
    }

    // If backend returns a plain string
    if (typeof data === "string") {
        return { title: "Authentication failed", messages: [data] };
    }

    // Bean validation errors sometimes come like { errors: ["..."] }
    if (Array.isArray(data?.errors)) {
        return { title: "Please fix the highlighted fields", messages: data.errors };
    }

    // Fallback
    return {
        title: `Request failed (${status})`,
        messages: ["Something went wrong. Please try again."],
    };
}

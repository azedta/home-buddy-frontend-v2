export function validateSignup(values) {
    const errors = {};

    const full = values.fullname?.trim() || "";
    const user = values.username?.trim() || "";
    const email = values.email?.trim() || "";
    const pass = values.password || "";
    const confirm = values.confirmPassword || "";

    if (!full) errors.fullname = "Full name is required.";
    else if (full.length < 3) errors.fullname = "Full name must be at least 3 characters.";

    if (!user) errors.username = "Username is required.";
    else if (user.length < 3) errors.username = "Username must be at least 3 characters.";
    else if (!/^[a-zA-Z0-9._-]+$/.test(user)) errors.username = "Only letters, numbers, dot, underscore, dash.";

    if (!email) errors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";

    if (!pass) errors.password = "Password is required.";
    else if (pass.length < 6) errors.password = "Password must be at least 6 characters.";

    if (!confirm) errors.confirmPassword = "Please confirm your password.";
    else if (confirm !== pass) errors.confirmPassword = "Passwords do not match.";

    return errors;
}

export function validateLogin(values) {
    const errors = {};

    const user = values.username?.trim() || "";
    const pass = values.password || "";

    if (!user) errors.username = "Username is required.";
    else if (user.length < 3) errors.username = "Username must be at least 3 characters.";

    if (!pass) errors.password = "Password is required.";
    else if (pass.length < 6) errors.password = "Password must be at least 6 characters.";

    return errors;
}

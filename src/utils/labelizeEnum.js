// src/utils/labelizeEnum.js

/**
 * Converts enum-like strings to a clean label.
 * Examples:
 *  - "MOVING_TO_LOCATION" -> "Moving To Location"
 *  - "DINING_ROOM"        -> "Dining Room"
 *  - "RETURN_TO_DOCK"     -> "Return To Dock"
 */
export function labelizeEnum(value) {
    if (value == null) return "—";

    const raw = String(value).trim();
    if (!raw) return "—";

    // Normalize separators to spaces
    const normalized = raw
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Title case each word
    return normalized
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default labelizeEnum;

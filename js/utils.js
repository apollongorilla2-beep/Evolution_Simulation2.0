/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

/**
 * Normalizes an angle to be between 0 and 2*PI.
 * @param {number} angle - The angle to normalize.
 * @returns {number} The normalized angle.
 */
export const normalizeAngle = (angle) => {
    let normalized = angle % (2 * Math.PI);
    if (normalized < 0) {
        normalized += (2 * Math.PI);
    }
    return normalized;
};

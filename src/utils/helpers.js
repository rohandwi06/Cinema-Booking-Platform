// src/utils/helpers.js

/**
 * Formats a date string to YYYY-MM-DD.
 * @param {Date} date - Date object.
 * @returns {string} Formatted date string.
 */
exports.formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

/**
 * Formats time string to HH:MM (24-hour format).
 * @param {Date} date - Date object.
 * @returns {string} Formatted time string.
 */
exports.formatTime = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
};

/**
 * Combines date and time strings into a Date object.
 * @param {string} dateStr - YYYY-MM-DD date string.
 * @param {string} timeStr - HH:MM time string.
 * @returns {Date} Combined Date object.
 */
exports.combineDateTime = (dateStr, timeStr) => {
    // Assuming dateStr is 'YYYY-MM-DD' and timeStr is 'HH:MM' (24-hour)
    // Create a UTC date to avoid timezone issues when comparing
    return new Date(`${dateStr}T${timeStr}:00.000Z`);
};

/**
 * Calculates the current UTC timestamp in ISO format.
 * @returns {string} Current UTC timestamp.
 */
exports.getCurrentUtcTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Calculates a future UTC timestamp based on minutes from now.
 * @param {number} minutes - Number of minutes from now.
 * @returns {string} Future UTC timestamp.
 */
exports.getFutureUtcTimestamp = (minutes) => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + minutes);
    return futureDate.toISOString();
};

/**
 * Checks if a given string is a valid JSON.
 * @param {string} str - The string to check.
 * @returns {boolean} True if valid JSON, false otherwise.
 */
exports.isValidJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};

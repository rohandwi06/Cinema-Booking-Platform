// src/utils/bookingReference.js

/**
 * Generates a unique booking reference number.
 * Format: PVR + 6 random digits.
 * @returns {string} Unique booking reference.
 */
exports.generateBookingReference = () => {
    const prefix = 'PVR';
    const digits = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    return `${prefix}${digits}`;
};

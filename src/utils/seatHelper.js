// src/utils/seatHelper.js

/**
 * Parses a seat layout string (e.g., "A5") into its row and number components.
 * Assumes format like "A1", "B10", "AA100".
 * @param {string} seatIdentifier - The seat string (e.g., "A5").
 * @returns {{row: string, number: number}} Object with row and seat number.
 */
exports.parseSeatIdentifier = (seatIdentifier) => {
    const match = seatIdentifier.match(/^([A-Z]{1,2})(\d{1,3})$/);
    if (!match) {
        throw new Error(`Invalid seat identifier format: ${seatIdentifier}`);
    }
    return {
        row: match[1],
        number: parseInt(match[2], 10)
    };
};

/**
 * Validates if a list of requested seats are valid according to the screen's layout.
 * Returns an object with seat categories and their counts, or throws an error.
 * @param {Array<string>} requestedSeats - Array of seat identifiers (e.g., ["A1", "B2"]).
 * @param {Object} seatLayout - Parsed JSON seat layout object from seat_layouts.layout_data.
 * @returns {Object} An object mapping seat category to an array of seats, e.g., { regular: ["A1"], premium: ["B2"] }.
 * @throws {Error} If any seat is invalid or out of bounds.
 */
exports.validateSeatsWithLayout = (requestedSeats, seatLayout) => {
    const validatedSeats = {};

    for (const seatCategory in seatLayout) {
        validatedSeats[seatCategory] = [];
    }

    for (const seatId of requestedSeats) {
        const { row, number } = exports.parseSeatIdentifier(seatId);
        let found = false;

        for (const categoryName in seatLayout) {
            const category = seatLayout[categoryName];
            if (category.rows.includes(row)) {
                if (number >= 1 && number <= category.seatsPerRow) {
                    validatedSeats[categoryName].push(seatId);
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            throw new Error(`Invalid seat ${seatId} for this screen layout.`);
        }
    }

    return validatedSeats;
};

/**
 * Calculates the total number of seats in a given seat layout.
 * @param {Object} seatLayout - Parsed JSON seat layout object.
 * @returns {number} Total capacity.
 */
exports.calculateTotalCapacity = (seatLayout) => {
    let total = 0;
    for (const categoryName in seatLayout) {
        const category = seatLayout[categoryName];
        total += category.rows.length * category.seatsPerRow;
    }
    return total;
};

/**
 * Calculates the total price for a list of seats based on show base price and seat layout.
 * @param {Object} validatedSeats - Object of validated seats categorized by seat type.
 * @param {Object} seatLayout - Parsed JSON seat layout object.
 * @param {number} showBasePrice - The base price for the show.
 * @returns {number} Total price for the seats.
 */
exports.calculateSeatsTotalPrice = (validatedSeats, seatLayout, showBasePrice) => {
    let totalPrice = 0;
    for (const categoryName in validatedSeats) {
        const seatsInCurrentCategory = validatedSeats[categoryName];
        const priceMultiplier = seatLayout[categoryName]?.price_multiplier || 1.0;
        totalPrice += seatsInCurrentCategory.length * (showBasePrice * priceMultiplier);
    }
    return totalPrice;
};

// src/controllers/seatController.js

const { getDatabase } = require('../config/database');
const { isValidJson } = require('../utils/helpers');

/**
 * Get seat layout and availability for a specific show.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getSeatLayout = async (req, res, next) => {
    const { showId } = req.params;
    const db = getDatabase();

    try {
        // Get show details and seat layout
        const showDetails = await db.get(`
            SELECT
                sh.id AS showId,
                sc.name AS screenName,
                sc.id AS screenId,
                sl.layout_data AS seatLayoutData
            FROM
                shows sh
            JOIN screens sc ON sh.screen_id = sc.id
            LEFT JOIN seat_layouts sl ON sc.id = sl.screen_id
            WHERE sh.id = ?;
        `, [showId]);

        if (!showDetails) {
            return res.status(404).json({
                success: false,
                message: 'Show not found.'
            });
        }

        if (!showDetails.seatLayoutData) {
            console.error('[getSeatLayout ERROR] seatLayoutData is null for showId:', showId, 'screenId:', showDetails.screenId);
            return res.status(404).json({
                success: false,
                message: 'Seat layout not configured for this screen (no seatLayoutData).'
            });
        }

        let seatLayout = {};
        try {
            seatLayout = isValidJson(showDetails.seatLayoutData) ? JSON.parse(showDetails.seatLayoutData) : {};
        } catch (e) {
            console.error('[getSeatLayout ERROR] seatLayoutData is not valid JSON for showId:', showId, 'screenId:', showDetails.screenId, 'data:', showDetails.seatLayoutData);
            return res.status(500).json({
                success: false,
                message: 'Seat layout data is corrupted or not valid JSON.'
            });
        }
        console.log('[DEBUG] seatLayout:', seatLayout);
        if (!seatLayout || Object.keys(seatLayout).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Seat layout not configured for this screen.'
            });
        }

        // Get seat pricing for this show
        const seatPricing = await db.all(`SELECT category, price FROM seat_pricing WHERE show_id = ?;`, [showId]);
        const pricingMap = new Map(seatPricing.map(p => [p.category, p.price]));

        // Get booked seats for this show
        const bookedSeats = await db.all(`
            SELECT seat_label FROM booked_seats
            WHERE show_id = ? AND status = 'confirmed';
        `, [showId]);
        console.log('[DEBUG] bookedSeats:', bookedSeats);

        // Get blocked seats from static seat_layout table
        const blockedSeats = await db.all(`
            SELECT sl.row || sl.seat_number AS seat_label FROM seat_layout sl
            JOIN screens scr ON sl.screen_id = scr.id
            JOIN shows sh ON scr.id = sh.screen_id
            WHERE sh.id = ? AND sl.is_blocked = 1;
        `, [showId]);
        console.log('[DEBUG] blockedSeats:', blockedSeats);

        // Format the response
        const formattedLayout = {};
        for (const categoryName in seatLayout) {
            const category = seatLayout[categoryName];
            formattedLayout[categoryName] = {
                rows: category.rows,
                seatsPerRow: category.seatsPerRow,
                price: pricingMap.has(categoryName) ? pricingMap.get(categoryName) : null
            };
        }

        const bookedSeatLabels = bookedSeats.map(bs => bs.seat_label);
        const blockedSeatLabels = blockedSeats.map(bs => bs.seat_label);

        res.status(200).json({
            success: true,
            screen: showDetails.screenName,
            seatLayout: formattedLayout,
            bookedSeats: bookedSeatLabels,
            blockedSeats: blockedSeatLabels
        });

    } catch (error) {
        console.error('[getSeatLayout ERROR]', error); // Log to console
        if (typeof logger !== 'undefined') {
            logger.error({ message: '[getSeatLayout ERROR]', error });
        }
        next(error);
    }
};

/**
 * Hold seats temporarily (placeholder for future implementation).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.holdSeats = async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'Seat holding functionality not yet implemented.'
    });
};

/**
 * Book seats (placeholder for future implementation).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.bookSeats = async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'Direct seat booking functionality not yet implemented. Use booking API instead.'
    });
};

/**
 * Release seats (placeholder for future implementation).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.releaseSeats = async (req, res, next) => {
    res.status(501).json({
        success: false,
        message: 'Seat release functionality not yet implemented.'
    });
};
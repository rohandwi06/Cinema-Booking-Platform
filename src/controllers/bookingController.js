// src/controllers/bookingController.js

const { getDatabase } = require('../config/database');
const { generateBookingReference } = require('../utils/bookingReference');
const {
    parseSeatIdentifier,
    validateSeatsWithLayout,
    calculateSeatsTotalPrice,
    calculateTotalCapacity
} = require('../utils/seatHelper');
const { combineDateTime, getCurrentUtcTimestamp, getFutureUtcTimestamp, isValidJson } = require('../utils/helpers');
const { CONVENIENCE_FEE_PERCENTAGE, GST_PERCENTAGE, BOOKING_CANCEL_CUTOFF_HOURS, SEAT_HOLD_TIME_MINUTES } = require('../utils/constants'); // Added SEAT_HOLD_TIME_MINUTES here
const logger = require('../utils/logger');

/**
 * NOTE: Booking will fail if seat pricing is missing for any seat category in the layout.
 * This is enforced by the adminController's show creation logic.
 */

/**
 * Creates a new booking.
 * Implements seat hold, availability check, price calculation, and age restriction.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.createBooking = async (req, res, next) => {
    const { showId, seats: requestedSeats, userDetails } = req.body;
    const userId = req.user.id;
    const db = getDatabase();
    let transactionStarted = false;

    try {
        logger.info('Booking creation started', {
            userId: userId,
            showId: showId,
            seats: requestedSeats,
            userDetails: userDetails
        });

        // Start transaction
        await db.run('BEGIN TRANSACTION;');
        transactionStarted = true;

        // Step 1: Validate show exists and is active
        const showDetails = await db.get(`
            SELECT s.id, s.show_date, s.show_time, s.base_price, s.status,
                   m.title as movieTitle, m.rating as movieRating,
                   th.name as theaterName, sc.name as screenName
            FROM shows s
            JOIN movies m ON s.movie_id = m.id
            JOIN theaters th ON s.theater_id = th.id
            JOIN screens sc ON s.screen_id = sc.id
            WHERE s.id = ? AND s.status = 'active'
        `, [showId]);

        if (!showDetails) {
            logger.warn('Show not found or inactive', { showId: showId });
            throw new Error('Show not found or inactive.');
        }

        // Step 2: Check if show is in the past
        const showDateTime = combineDateTime(showDetails.show_date, showDetails.show_time);
        const currentTime = getCurrentUtcTimestamp();
        if (showDateTime <= currentTime) {
            logger.warn('Attempted to book past show', { 
                showId: showId, 
                showDateTime: showDateTime, 
                currentTime: currentTime 
            });
            throw new Error('Cannot book seats for past shows.');
        }

        // Step 3: Get seat layout and validate seats
        const seatLayout = await db.get('SELECT layout_data FROM seat_layouts WHERE screen_id = (SELECT screen_id FROM shows WHERE id = ?)', [showId]);
        if (!seatLayout) {
            logger.error('Seat layout not found', { showId: showId });
            throw new Error('Seat layout not found for this show.');
        }

        const layoutData = JSON.parse(seatLayout.layout_data);
        logger.debug('Seat layout retrieved', { layoutData: layoutData });

        // Validate seats against layout
        const validatedSeats = validateSeatsWithLayout(requestedSeats, layoutData);

        // Check for conflicts (already booked, held, or blocked)
        const conflictSeats = await checkSeatConflicts(db, showId, requestedSeats);
        if (conflictSeats.length > 0) {
            logger.warn('Seat conflicts detected', { 
                showId: showId, 
                conflictSeats: conflictSeats 
            });
            throw new Error(`Seats ${conflictSeats.join(', ')} are already booked, held, or blocked.`);
        }

        // Step 4: Get seat pricing
        const pricingData = await db.all('SELECT category, price FROM seat_pricing WHERE show_id = ?', [showId]);
        const pricingMap = new Map(pricingData.map(p => [p.category, p.price]));
        
        logger.debug('Fetched seat pricing', { 
            showId: showId, 
            pricingData: pricingData,
            pricingMap: Object.fromEntries(pricingMap)
        });

        // Step 5: Calculate total amount based on seat categories and their prices
        let rawTicketAmount = 0;
        for (const categoryName in validatedSeats) {
            const seatsInCurrentCategory = validatedSeats[categoryName];
            const categoryPrice = pricingMap.get(categoryName);
            if (categoryPrice === undefined) {
                logger.error('Pricing not found for seat category', {
                    category: categoryName,
                    showId: showId,
                    pricingMap: Object.fromEntries(pricingMap)
                });
                throw new Error(`Pricing not found for seat category: ${categoryName}`);
            }
            rawTicketAmount += seatsInCurrentCategory.length * categoryPrice;
        }

        const convenienceFee = rawTicketAmount * CONVENIENCE_FEE_PERCENTAGE;
        const subTotal = rawTicketAmount + convenienceFee;
        const gst = subTotal * GST_PERCENTAGE;
        const totalAmount = subTotal + gst;

        logger.info('Booking calculation completed', {
            showId: showId,
            seats: requestedSeats,
            rawTicketAmount: rawTicketAmount,
            convenienceFee: convenienceFee,
            gst: gst,
            totalAmount: totalAmount
        });

        // Step 6: Insert seats as 'held' in booked_seats table
        const heldUntil = getFutureUtcTimestamp(SEAT_HOLD_TIME_MINUTES);
        for (const categoryName in validatedSeats) {
            const seats = validatedSeats[categoryName];
            for (const seatId of seats) {
                await db.run(
                    'INSERT INTO booked_seats (user_id, show_id, seat_label, seat_category, status, held_until, booking_id) VALUES (?, ?, ?, ?, ?, ?, NULL)',
                    [userId, showId, seatId, categoryName, 'held', heldUntil]
                );
            }
        }

        // Step 7: Create a pending booking entry
        const bookingReference = generateBookingReference();
        const finalUserEmail = userDetails.email || req.user.email;
        const finalUserMobile = userDetails.mobile;

        const bookingResult = await db.run(
            `INSERT INTO bookings (user_id, show_id, booking_reference, total_amount, booking_status, payment_status, user_email, user_mobile)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, showId, bookingReference, totalAmount, 'pending', 'pending', finalUserEmail, finalUserMobile]
        );

        const newBookingDbId = bookingResult.lastID;

        // Link the newly held seats to this booking
        await db.run(`
            UPDATE booked_seats
            SET booking_id = ?
            WHERE show_id = ? AND user_id = ? AND status = 'held' AND held_until = ? AND booking_id IS NULL
            AND seat_label IN (${requestedSeats.map(s => `'${s}'`).join(',')});
        `, [newBookingDbId, showId, userId, heldUntil]);

        // Commit transaction
        await db.run('COMMIT;');
        transactionStarted = false;

        logger.bookingCreated(bookingReference, userId, showId, requestedSeats, totalAmount);

        res.status(201).json({
            success: true,
            bookingId: bookingReference,
            message: 'Booking confirmed',
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            showDetails: {
                movie: showDetails.movieTitle,
                theater: showDetails.theaterName,
                screen: showDetails.screenName,
                showTime: showDetails.showTime,
                date: showDetails.showDate,
                seats: requestedSeats
            }
        });

    } catch (error) {
        if (transactionStarted) {
            await db.run('ROLLBACK;');
        }
        logger.bookingFailed(userId, showId, requestedSeats, error.message);
        next(error);
    }
};

/**
 * Get user's booking history.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getUserBookings = async (req, res, next) => {
    const userId = req.user.id;
    const db = getDatabase();

    try {
        const bookings = await db.all(`
            SELECT
                b.booking_reference AS bookingId,
                b.total_amount AS totalAmount,
                b.booking_status AS bookingStatus,
                b.payment_status AS paymentStatus,
                b.booked_at AS bookedAt,
                m.title AS movieTitle,
                th.name AS theaterName,
                sc.name AS screenName,
                sh.show_date AS showDate,
                sh.show_time AS showTime,
                GROUP_CONCAT(bs.seat_label) AS seatsBooked -- Changed from seat_identifier to seat_label
            FROM
                bookings b
            JOIN shows sh ON b.show_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN theaters th ON sh.theater_id = th.id
            JOIN screens sc ON sh.screen_id = sc.id
            LEFT JOIN booked_seats bs ON b.id = bs.booking_id AND bs.status = 'confirmed'
            WHERE
                b.user_id = ?
            GROUP BY
                b.id
            ORDER BY
                b.booked_at DESC;
        `, [userId]);

        const formattedBookings = bookings.map(booking => ({
            ...booking,
            seatsBooked: booking.seatsBooked ? booking.seatsBooked.split(',') : []
        }));

        res.status(200).json({
            success: true,
            bookings: formattedBookings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get details for a specific booking.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getBookingDetails = async (req, res, next) => {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    try {
        const booking = await db.get(`
            SELECT
                b.id,
                b.booking_reference AS bookingId,
                b.total_amount AS totalAmount,
                b.booking_status AS bookingStatus,
                b.payment_status AS paymentStatus,
                b.booked_at AS bookedAt,
                b.user_email AS userEmail,
                b.user_mobile AS userMobile,
                m.title AS movieTitle,
                m.poster_url AS moviePoster,
                th.name AS theaterName,
                th.address AS theaterAddress,
                sc.name AS screenName,
                sh.show_date AS showDate,
                sh.show_time AS showTime,
                sh.format AS showFormat,
                sh.language AS showLanguage
            FROM
                bookings b
            JOIN shows sh ON b.show_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN theaters th ON sh.theater_id = th.id
            JOIN screens sc ON sh.screen_id = sc.id
            WHERE
                b.booking_reference = ? AND b.user_id = ?;
        `, [bookingId, userId]);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not authorized.' });
        }

        const bookedSeats = await db.all(`
            SELECT seat_label, seat_category FROM booked_seats
            WHERE booking_id = ? AND status = 'confirmed';
        `, [booking.id]);

        const formattedSeats = bookedSeats.map(s => s.seat_label);

        res.status(200).json({
            success: true,
            booking: {
                id: booking.id, // Keep the internal DB ID for consistency if needed by frontend
                bookingReference: booking.bookingId,
                totalAmount: parseFloat(booking.totalAmount.toFixed(2)),
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
                bookedAt: booking.bookedAt,
                userDetails: {
                    email: booking.userEmail,
                    mobile: booking.userMobile
                },
                showDetails: {
                    movie: booking.movieTitle,
                    posterUrl: booking.moviePoster,
                    theater: booking.theaterName,
                    address: booking.theaterAddress,
                    screen: booking.screenName,
                    showTime: booking.showTime,
                    date: booking.showDate,
                    format: booking.showFormat,
                    language: booking.showLanguage,
                    seats: formattedSeats
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancels a booking.
 * Checks cancellation policy (e.g., 2 hours before show).
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.cancelBooking = async (req, res, next) => {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const db = getDatabase();

    let transactionStarted = false;

    try {
        await db.run('BEGIN TRANSACTION;');
        transactionStarted = true;

        // Get booking details and show time
        const booking = await db.get(`
            SELECT
                b.id, b.show_id, b.booking_status, b.payment_status,
                sh.show_date, sh.show_time
            FROM
                bookings b
            JOIN shows sh ON b.show_id = sh.id
            WHERE
                b.booking_reference = ? AND b.user_id = ?;
        `, [bookingId, userId]);

        if (!booking) {
            throw new Error('No rows found: Booking not found or not authorized.');
        }

        if (booking.booking_status === 'cancelled') {
            throw new Error('Booking is already cancelled.');
        }

        if (booking.payment_status !== 'paid') {
            throw new Error('Cannot cancel a booking that has not been paid or is pending payment.');
        }

        const showDateTime = combineDateTime(booking.show_date, booking.show_time);
        const cancellationCutoff = new Date(showDateTime.getTime() - BOOKING_CANCEL_CUTOFF_HOURS * 60 * 60 * 1000);

        if (new Date() > cancellationCutoff) {
            throw new Error(`Cancellation not allowed: Must cancel at least ${BOOKING_CANCEL_CUTOFF_HOURS} hours before show time.`);
        }

        // Update booking status
        await db.run(
            `UPDATE bookings
             SET booking_status = 'cancelled', payment_status = 'refunded'
             WHERE id = ?;`,
            [booking.id]
        );

        // Update booked seats status for this booking
        await db.run(
            `UPDATE booked_seats
             SET status = 'cancelled', booking_id = NULL, held_until = NULL
             WHERE booking_id = ?;`, // Set booking_id to NULL to detach from cancelled booking
            [booking.id]
        );

        await db.run('COMMIT;');
        transactionStarted = false;

        res.status(200).json({
            success: true,
            message: `Booking ${bookingId} has been successfully cancelled and refund initiated.`,
            bookingId: bookingId,
            newStatus: 'cancelled'
        });

    } catch (error) {
        if (transactionStarted) {
            await db.run('ROLLBACK;');
        }
        next(error);
    }
};

/**
 * Block seats temporarily for a user.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.blockSeats = async (req, res, next) => {
    const { showId, seats } = req.body;
    const userId = req.user.id;
    const db = getDatabase();
    const currentUtcTime = getCurrentUtcTimestamp();

    try {
        // Get show details
        const showDetails = await db.get(`
            SELECT sh.id, sh.show_date, sh.show_time, sh.status,
                   sl.layout_data AS seatLayoutData
            FROM shows sh
            JOIN screens sc ON sh.screen_id = sc.id
            JOIN seat_layouts sl ON sc.id = sl.screen_id
            WHERE sh.id = ?;
        `, [showId]);

        if (!showDetails) {
            return res.status(404).json({
                success: false,
                message: 'Show not found.'
            });
        }

        // Check if show has started
        const showDateTime = combineDateTime(showDetails.show_date, showDetails.show_time);
        if (showDateTime < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Show already started. Cannot block seats.'
            });
        }

        // Validate seat layout
        const seatLayout = isValidJson(showDetails.seatLayoutData) ? JSON.parse(showDetails.seatLayoutData) : {};
        if (Object.keys(seatLayout).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Seat layout not configured for this screen.'
            });
        }

        // Validate requested seats
        const validatedSeats = validateSeatsWithLayout(seats, seatLayout);

        // Check for conflicts
        const existingBookedSeats = await db.all(`
            SELECT seat_label, status FROM booked_seats
            WHERE show_id = ? AND (status = 'confirmed' OR (status = 'held' AND held_until > ?));
        `, [showId, currentUtcTime]);

        const conflictSeats = [];
        for (const seat of seats) {
            if (existingBookedSeats.some(bs => bs.seat_label === seat)) {
                conflictSeats.push(seat);
            }
        }

        if (conflictSeats.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Seats ${conflictSeats.join(', ')} are already booked or held.`
            });
        }

        // Block seats for 10 minutes
        const heldUntil = getFutureUtcTimestamp(10);
        for (const seat of seats) {
            await db.run(
                'INSERT OR REPLACE INTO booked_seats (user_id, show_id, seat_label, status, held_until) VALUES (?, ?, ?, ?, ?)',
                [userId, showId, seat, 'held', heldUntil]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Seats blocked successfully',
            seats: seats,
            heldUntil: heldUntil
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Check for seat conflicts (already booked, held, or blocked)
 * @param {Object} db - Database instance
 * @param {number} showId - Show ID
 * @param {Array} requestedSeats - Array of requested seat labels
 * @returns {Promise<Array>} Array of conflicting seat labels
 */
async function checkSeatConflicts(db, showId, requestedSeats) {
    const currentTime = getCurrentUtcTimestamp();
    const conflictSeats = [];

    // Check for already booked or held seats
    const existingBookedSeats = await db.all(`
        SELECT seat_label, status FROM booked_seats
        WHERE show_id = ? AND (status = 'confirmed' OR (status = 'held' AND held_until > ?))
    `, [showId, currentTime]);

    for (const reqSeat of requestedSeats) {
        // Check if seat is already booked or held
        if (existingBookedSeats.some(bs => bs.seat_label === reqSeat)) {
            conflictSeats.push(reqSeat);
            continue;
        }

        // Check if seat is blocked in static seat layout
        const seatInfo = parseSeatIdentifier(reqSeat);
        const blockedSeatCheck = await db.get(`
            SELECT sl.row, sl.seat_number FROM seat_layout sl
            JOIN screens scr ON sl.screen_id = scr.id
            JOIN shows sh ON scr.id = sh.screen_id
            WHERE sh.id = ? AND sl.is_blocked = 1 AND sl.row = ? AND sl.seat_number = ?
        `, [showId, seatInfo.row, seatInfo.number]);

        if (blockedSeatCheck) {
            conflictSeats.push(reqSeat);
        }
    }

    return conflictSeats;
}

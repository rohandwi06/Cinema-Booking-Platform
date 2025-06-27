// src/controllers/paymentController.js

const { getDatabase } = require('../config/database');
const { generateBookingReference } = require('../utils/bookingReference'); // Re-using for transaction ID
const { CONVENIENCE_FEE_PERCENTAGE, GST_PERCENTAGE, SEAT_HOLD_TIME_MINUTES } = require('../utils/constants');
const { combineDateTime, isValidJson, getCurrentUtcTimestamp } = require('../utils/helpers');
const { calculateSeatsTotalPrice, validateSeatsWithLayout } = require('../utils/seatHelper');

/**
 * Initiates payment for a booking.
 * Calculates final amount including F&B (if any), fees, and taxes.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.initiatePayment = async (req, res, next) => {
    const { bookingId, paymentMethod, includesFnb } = req.body;
    const userId = req.user.id;
    const db = getDatabase();
    const currentUtcTime = getCurrentUtcTimestamp();

    let transactionStarted = false;

    try {
        await db.run('BEGIN TRANSACTION;');
        transactionStarted = true;

        // Step 1: Fetch booking details
        const booking = await db.get(`
            SELECT
                b.id, b.user_id, b.show_id, b.total_amount, b.booking_status, b.payment_status,
                sh.base_price AS showBasePrice, sh.show_date, sh.show_time,
                sc.id AS screenId, -- Added screenId to fetch seat_layout from the correct screen
                sl.layout_data AS seatLayoutData
            FROM
                bookings b
            JOIN shows sh ON b.show_id = sh.id
            JOIN screens sc ON sh.screen_id = sc.id
            LEFT JOIN seat_layouts sl ON sc.id = sl.screen_id -- Changed to LEFT JOIN for robustness
            WHERE
                b.booking_reference = ? AND b.user_id = ?;
        `, [bookingId, userId]);

        if (!booking) {
            throw new Error('No rows found: Booking not found or not authorized.');
        }

        if (booking.booking_status !== 'pending' || booking.payment_status !== 'pending') {
            throw new Error('Payment can only be initiated for pending bookings.');
        }

        // Clean up expired held seats related to this booking before proceeding
        await db.run(`
            UPDATE booked_seats
            SET status = 'expired'
            WHERE booking_id = ? AND show_id = ? AND status = 'held' AND held_until < ?;
        `, [booking.id, booking.show_id, currentUtcTime]);

        // Get currently held seats for this booking
        const heldSeats = await db.all(`
            SELECT seat_label, seat_category FROM booked_seats
            WHERE booking_id = ? AND show_id = ? AND status = 'held' AND held_until > ?;
        `, [booking.id, booking.show_id, currentUtcTime]);

        if (heldSeats.length === 0) {
            // This means the seats were held, but expired, or something went wrong.
            // Mark booking as cancelled or failed
            await db.run(`UPDATE bookings SET booking_status = 'failed', payment_status = 'failed' WHERE id = ?`, [booking.id]);
            throw new Error('Selected seats are no longer held or available. Please re-initiate booking.');
        }

        const seatLayout = booking.seatLayoutData ? JSON.parse(booking.seatLayoutData) : {};
        if (Object.keys(seatLayout).length === 0) {
             throw new Error('Seat layout not configured for this screen.');
        }

        // Recalculate ticket amount based on currently held seats and seat_pricing
        const seatPricing = await db.all(
            `SELECT category, price FROM seat_pricing WHERE show_id = ?;`,
            [booking.show_id]
        );
        const pricingMap = new Map(seatPricing.map(p => [p.category, p.price]));

        let ticketsAmount = 0;
        for (const seat of heldSeats) {
            const categoryPrice = pricingMap.get(seat.seat_category);
            if (categoryPrice === undefined) {
                throw new Error(`Pricing not found for seat category: ${seat.seat_category}`);
            }
            ticketsAmount += categoryPrice;
        }


        let fnbAmount = 0;
        if (includesFnb) {
            // Calculate F&B amount for this booking if any food orders exist
            const fnbOrders = await db.get(`
                SELECT SUM(quantity * price_at_order) AS totalFnb
                FROM food_orders WHERE booking_id = ?;
            `, [booking.id]);
            fnbAmount = fnbOrders.totalFnb || 0; // Access as .totalFnb
        }

        // Calculate final total including fees and GST
        const totalBeforeFees = ticketsAmount + fnbAmount;
        const convenienceFee = totalBeforeFees * CONVENIENCE_FEE_PERCENTAGE;
        const subTotal = totalBeforeFees + convenienceFee;
        const gst = subTotal * GST_PERCENTAGE;
        const finalTotalAmount = subTotal + gst;

        // Update booking's total_amount with the newly calculated value (if different, e.g. due to F&B)
        await db.run(
            `UPDATE bookings SET total_amount = ? WHERE id = ?`,
            [finalTotalAmount, booking.id]
        );

        // Simulate transaction ID
        const transactionId = `TXN${generateBookingReference().substring(3)}`; // Use booking reference logic to generate TXN ID

        // Simulate payment record (status pending initially)
        await db.run(
            `INSERT INTO payments (booking_id, transaction_id, amount, method, status, breakdown)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [booking.id, transactionId, parseFloat(finalTotalAmount.toFixed(2)), paymentMethod, 'pending',
                JSON.stringify({
                    tickets: parseFloat(ticketsAmount.toFixed(2)),
                    fnb: parseFloat(fnbAmount.toFixed(2)),
                    convenienceFee: parseFloat(convenienceFee.toFixed(2)),
                    gst: parseFloat(gst.toFixed(2)),
                    total: parseFloat(finalTotalAmount.toFixed(2))
                })
            ]
        );

        await db.run('COMMIT;');
        transactionStarted = false;

        res.status(200).json({
            success: true,
            transactionId: transactionId,
            amount: parseFloat(finalTotalAmount.toFixed(2)),
            breakdown: {
                tickets: parseFloat(ticketsAmount.toFixed(2)),
                fnb: parseFloat(fnbAmount.toFixed(2)),
                convenienceFee: parseFloat(convenienceFee.toFixed(2)),
                gst: parseFloat(gst.toFixed(2)),
                total: parseFloat(finalTotalAmount.toFixed(2))
            },
            message: 'Payment initiation successful. Awaiting confirmation.'
        });

    } catch (error) {
        if (transactionStarted) {
            await db.run('ROLLBACK;');
        }
        console.error('[PaymentController ERROR] Error initiating payment:', error);
        next(error);
    }
};

/**
 * Confirms payment for a booking.
 * Updates booking and payment status.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.confirmPayment = async (req, res, next) => {
    const { bookingId, transactionId, status } = req.body; // status: 'success' or 'failed'
    const userId = req.user.id;
    const db = getDatabase();

    let transactionStarted = false;

    try {
        await db.run('BEGIN TRANSACTION;');
        transactionStarted = true;

        // Verify payment record and booking
        const payment = await db.get(`
            SELECT p.id, p.booking_id, p.status AS payment_status, b.user_id, b.show_id, b.booking_status -- Added show_id
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.transaction_id = ? AND b.booking_reference = ? AND b.user_id = ?;
        `, [transactionId, bookingId, userId]);

        if (!payment) {
            throw new Error('No rows found: Payment or booking not found or not authorized.');
        }

        if (payment.payment_status !== 'pending') {
            throw new Error(`Payment is already ${payment.payment_status}. Cannot re-confirm.`);
        }

        let newPaymentStatus, newBookingStatus;
        if (status === 'success') {
            newPaymentStatus = 'paid';
            newBookingStatus = 'confirmed';
        } else {
            newPaymentStatus = 'failed';
            newBookingStatus = 'failed';
        }

        // Update payment status
        await db.run(
            `UPDATE payments SET status = ? WHERE id = ?`,
            [newPaymentStatus, payment.id]
        );

        // Update booking status
        await db.run(
            `UPDATE bookings SET booking_status = ?, payment_status = ? WHERE id = ?`,
            [newBookingStatus, newPaymentStatus, payment.booking_id]
        );

        // If payment failed, release held seats
        if (status === 'failed') {
            await db.run(`
                UPDATE booked_seats
                SET status = 'cancelled', booking_id = NULL, held_until = NULL
                WHERE booking_id = ? AND show_id = ? AND status = 'held';
            `, [payment.booking_id, payment.show_id]);
        } else {
            // If payment succeeded, set held seats to confirmed
            await db.run(`
                UPDATE booked_seats
                SET status = 'confirmed'
                WHERE booking_id = ? AND status = 'held';
            `, [payment.booking_id]);
        }

        await db.run('COMMIT;');
        transactionStarted = false;

        res.status(200).json({
            success: true,
            message: `Payment ${status}. Booking ${newBookingStatus}.`,
            bookingId: bookingId,
            transactionId: transactionId,
            paymentStatus: newPaymentStatus,
            bookingStatus: newBookingStatus
        });

    } catch (error) {
        if (transactionStarted) {
            await db.run('ROLLBACK;');
        }
        console.error('[PaymentController ERROR] Error confirming payment:', error);
        next(error);
    }
};

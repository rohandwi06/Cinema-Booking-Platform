const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');
const { createBooking, getBookingDetails } = require('../middleware/validation');

// Apply authentication middleware to all booking routes
router.use(authenticateToken);

// Booking routes with validation
router.post('/create', createBooking, bookingController.createBooking);
router.get('/', bookingController.getUserBookings);
router.get('/:bookingId', getBookingDetails, bookingController.getBookingDetails);

module.exports = router;

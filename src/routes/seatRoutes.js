// src/routes/seatRoutes.js
const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');

// Route to get seat layout for a specific show
router.get('/:showId/seats', seatController.getSeatLayout);

// Additional seat management routes (for future use)
router.post('/:showId/hold', seatController.holdSeats);
router.post('/:showId/book', seatController.bookSeats);
router.post('/:showId/release', seatController.releaseSeats);

module.exports = router;

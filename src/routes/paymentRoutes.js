// src/routes/paymentRoutes.js

const express = require('express');
const router = express.Router(); // Ensure this is initialized
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { validate, paymentSchemas } = require('../middleware/validation');

// Routes for payment processing (requires authentication)
router.post('/initiate', verifyToken, validate(paymentSchemas.initiatePayment, 'body'), paymentController.initiatePayment);
router.post('/confirm', verifyToken, validate(paymentSchemas.confirmPayment, 'body'), paymentController.confirmPayment);

module.exports = router; // <-- CRITICAL LINE
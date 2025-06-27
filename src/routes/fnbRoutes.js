// src/routes/fnbRoutes.js

const express = require('express');
const router = express.Router(); // Ensure this is initialized
const fnbController = require('../controllers/fnbController');
const { verifyToken } = require('../middleware/auth');
const { validate, fnbSchemas } = require('../middleware/validation');

// Public route for F&B menu
router.get('/menu', fnbController.getFnbMenu);

// Route for ordering F&B (requires authentication and a confirmed booking)
router.post('/order', verifyToken, validate(fnbSchemas.orderFnb, 'body'), fnbController.orderFnb);

module.exports = router; // <-- CRITICAL LINE
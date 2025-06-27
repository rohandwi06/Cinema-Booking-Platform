// src/routes/authRoutes.js

const express = require('express');
const router = express.Router(); // Ensure this is initialized
const authController = require('../controllers/authController');
const { register, login } = require('../middleware/validation');

// Public routes for authentication
router.post('/register', register, authController.register);
router.post('/login', login, authController.login);

module.exports = router; // <-- CRITICAL LINE


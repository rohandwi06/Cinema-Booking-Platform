// src/routes/theaterRoutes.js

const express = require('express');
const router = express.Router(); // Ensure this is initialized
const theaterController = require('../controllers/theaterController');
const { validate, theaterSchemas } = require('../middleware/validation');

// Public route to get theaters by city
router.get('/', validate(theaterSchemas.getTheaters, 'query'), theaterController.getTheaters);

module.exports = router; // <-- CRITICAL LINE
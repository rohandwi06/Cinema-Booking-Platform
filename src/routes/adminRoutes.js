// src/routes/adminRoutes.js
// src/routes/adminRoutes.js

const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { addMovie, createShow, updateShow } = require('../middleware/validation');

const router = express.Router();

// Apply authentication and admin middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin routes with validation
router.post('/movies', addMovie, adminController.addMovie);
router.post('/shows', createShow, adminController.createShow);
router.put('/shows/:showId', updateShow, adminController.updateShow);
router.get('/reports/occupancy', adminController.getOccupancyReports);

module.exports = router; // <-- CRITICAL LINE

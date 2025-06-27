const express = require('express');
const router = express.Router();
const Joi = require('joi'); // ✅ Fix: Import Joi
const showController = require('../controllers/showController');
const { validate, showSchemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

console.log('[ShowRoutes Debug] showController after require:', showController);

// Get all shows (query-based filtering) - This should be the main route for getting shows
router.get('/', validate(showSchemas.getShows, 'query'), showController.getShows);

// Get a specific show by ID
router.get('/:showId', validate(showSchemas.showIdParam, 'params'), showController.getShowById);

// Get all shows for a movie
router.get('/movie/:movieId', validate(Joi.object({ movieId: Joi.number().integer().min(1).required() }), 'params'), showController.getShowsByMovie);

// Create a show (admin only)
router.post('/', authenticateToken, requireAdmin, validate(showSchemas.createShow, 'body'), showController.createShow);

// Update a show (admin only)
router.put('/:showId', authenticateToken, requireAdmin, validate(showSchemas.updateShow, 'body'), showController.updateShow);

// Delete a show (admin only)
router.delete('/:showId', authenticateToken, requireAdmin, validate(showSchemas.showIdParam, 'params'), showController.deleteShow);

module.exports = router;

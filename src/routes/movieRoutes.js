// src/routes/movieRoutes.js

const express = require('express');
const router = express.Router(); // Ensure this is initialized
const { validate, movieSchemas } = require('../middleware/validation');
const movieController = require('../controllers/movieController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes for movies
router.get('/', validate(movieSchemas.getMovies, 'query'), movieController.getMovies);
router.get('/upcoming', movieController.getUpcomingMovies);
router.get('/:id', validate(movieSchemas.movieIdParam, 'params'), movieController.getMovieById);

// Admin routes for movie management
router.post('/', authenticateToken, requireAdmin, validate(movieSchemas.createMovie, 'body'), movieController.createMovie);
router.put('/:id', authenticateToken, requireAdmin, validate(movieSchemas.updateMovie, 'body'), movieController.updateMovie);
router.delete('/:id', authenticateToken, requireAdmin, validate(movieSchemas.movieIdParam, 'params'), movieController.deleteMovie);

module.exports = router; // <-- CRITICAL LINE

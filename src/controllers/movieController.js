// src/controllers/movieController.js

const { getDatabase } = require('../config/database');

// Define the SQL query for getMovieById as a constant
// Using '?' as a placeholder for the ID parameter
const GET_MOVIE_BY_ID_SQL = `
    SELECT id, title, description, duration_mins, genre, language, format,
           release_date, rating, "cast", director, producer, poster_url,
           trailer_url, imdb_rating, is_upcoming
    FROM movies
    WHERE id = ?
`;
/**
 * Helper function to safely parse JSON strings from the database.
 * Returns an array or null if parsing fails.
 * @param {string|null} jsonString
 * @returns {Array|null}
 */
const parseJsonArray = (jsonString) => {
    if (!jsonString) return null;
    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.error('JSON parse error:', jsonString, error);
        return null;
    }
};

/**
 * Get currently running or upcoming movies based on query parameters.
 * Allows filtering by city, language, genre, and format.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getMovies = async (req, res, next) => {
    const { city, language, genre, format } = req.query;
    const db = getDatabase();
    const params = [];
    const conditions = ['m.is_upcoming = 0'];

    let query = `
        SELECT m.id, m.title, m.description, m.duration_mins AS duration,
               m.genre, m.language, m.format, m.release_date AS releaseDate,
               m.rating, m.cast, m.director, m.producer, m.poster_url AS posterUrl,
               m.trailer_url AS trailerUrl, m.imdb_rating AS imdbRating,
               m.is_upcoming AS isUpcoming
        FROM movies m
    `;

    if (city || format) {
        query += `
            JOIN shows s ON m.id = s.movie_id
            JOIN screens scr ON s.screen_id = scr.id
            JOIN theaters t ON scr.theater_id = t.id
        `;
        conditions.push(`s.show_date >= STRFTIME('%Y-%m-%d', 'now', 'localtime')`, `s.status = 'active'`);
    }

    if (city) {
        conditions.push('t.city_id = ?');
        params.push(city);
    }
    if (genre) {
        conditions.push('m.genre LIKE ?');
        params.push(`%${genre}%`);
    }

    if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY m.id ORDER BY m.release_date DESC;';

    try {
        const movies = await db.all(query, params);
        const processed = movies.filter(m => {
            const langArr = parseJsonArray(m.language);
            const formatArr = parseJsonArray(m.format);
            let langOk = true, formatOk = true;
            if (language) langOk = Array.isArray(langArr) && langArr.includes(language);
            if (format) formatOk = Array.isArray(formatArr) && formatArr.includes(format);
            return langOk && formatOk;
        }).map(m => ({
            id: m.id,
            title: m.title,
            duration: `${m.duration} mins`,
            rating: m.rating,
            genre: parseJsonArray(m.genre),
            language: parseJsonArray(m.language),
            formats: parseJsonArray(m.format),
            posterUrl: m.posterUrl,
            releaseDate: m.releaseDate,
            imdbRating: m.imdbRating
        }));
        res.status(200).json({ success: true, movies: processed });
    } catch (err) {
        console.error('[getMovies] Error:', err);
        next(err);
    }
};

/**
 * Get details for a specific movie by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getMovieById = async (req, res, next) => {
    const { id } = req.params;
    const db = getDatabase();
    try {
        const movie = await db.get(GET_MOVIE_BY_ID_SQL.trim(), [id]);
        if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

        const processed = {
            id: movie.id,
            title: movie.title,
            synopsis: movie.description,
            duration: `${movie.duration_mins} mins`,
            genre: parseJsonArray(movie.genre),
            language: parseJsonArray(movie.language),
            formats: parseJsonArray(movie.format),
            releaseDate: movie.release_date,
            rating: movie.rating,
            cast: parseJsonArray(movie.cast),
            crew: {
                director: movie.director,
                producer: movie.producer
            },
            posterUrl: movie.poster_url,
            trailerUrl: movie.trailer_url,
            imdbRating: movie.imdb_rating,
            isUpcoming: movie.is_upcoming === 1
        };
        res.status(200).json({ success: true, movie: processed });
    } catch (err) {
        console.error('[getMovieById] Error:', err);
        next(err);
    }
};


/**
 * Get upcoming movies.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getUpcomingMovies = async (req, res, next) => {
    const db = getDatabase();
    try {
        const movies = await db.all(`
            SELECT id, title, description, duration_mins, genre, language,
                   format, release_date, rating, "cast", director, producer,
                   poster_url, trailer_url, imdb_rating, is_upcoming
            FROM movies
            WHERE is_upcoming = 1
            ORDER BY release_date ASC
        `);

        const processed = movies.map(m => ({
            id: m.id,
            title: m.title,
            synposis: m.description,
            duration: `${m.duration_mins} mins`,
            genre: parseJsonArray(m.genre),
            language: parseJsonArray(m.language),
            formats: parseJsonArray(m.format),
            releaseDate: m.release_date,
            rating: m.rating,
            cast: parseJsonArray(m.cast),
            crew: {
                director: m.director,
                producer: m.producer
            },
            posterUrl: m.poster_url,
            trailerUrl: m.trailer_url,
            imdbRating: m.imdb_rating,
            isUpcoming: m.is_upcoming === 1
        }));

        res.status(200).json({ success: true, movies: processed });
    } catch (err) {
        console.error('[getUpcomingMovies] Error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
        next(err);
    }
};

/**
 * Create a new movie (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.createMovie = async (req, res, next) => {
    const {
        title,
        description,
        duration_mins,
        genre,
        language,
        format,
        release_date,
        rating,
        cast,
        director,
        producer,
        poster_url,
        trailer_url,
        imdb_rating,
        is_upcoming
    } = req.body;

    const db = getDatabase();

    try {
        // Validate required fields
        if (!title || !description || !duration_mins || !genre || !language || !format) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, duration_mins, genre, language, format'
            });
        }

        // Check if movie with same title already exists
        const existingMovie = await db.get('SELECT id FROM movies WHERE title = ?', [title]);
        if (existingMovie) {
            return res.status(409).json({
                success: false,
                message: 'Movie with this title already exists'
            });
        }

        // Insert new movie
        const result = await db.run(`
            INSERT INTO movies (
                title, description, duration_mins, genre, language, format,
                release_date, rating, cast, director, producer, poster_url,
                trailer_url, imdb_rating, is_upcoming
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            description,
            duration_mins,
            JSON.stringify(genre),
            JSON.stringify(language),
            JSON.stringify(format),
            release_date || null,
            rating || null,
            JSON.stringify(cast || []),
            director || null,
            producer || null,
            poster_url || null,
            trailer_url || null,
            imdb_rating || null,
            is_upcoming ? 1 : 0
        ]);

        res.status(201).json({
            success: true,
            message: 'Movie created successfully',
            movieId: result.lastID
        });

    } catch (error) {
        console.error('[createMovie] Error:', error);
        next(error);
    }
};

/**
 * Update an existing movie (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.updateMovie = async (req, res, next) => {
    const { id } = req.params;
    const updateFields = req.body;

    const db = getDatabase();

    try {
        // Check if movie exists
        const existingMovie = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
        if (!existingMovie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Build dynamic update query
        const allowedFields = [
            'title', 'description', 'duration_mins', 'genre', 'language', 'format',
            'release_date', 'rating', 'cast', 'director', 'producer', 'poster_url',
            'trailer_url', 'imdb_rating', 'is_upcoming'
        ];

        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateFields)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                // Handle JSON fields
                if (['genre', 'language', 'format', 'cast'].includes(key)) {
                    values.push(JSON.stringify(value));
                } else if (key === 'is_upcoming') {
                    values.push(value ? 1 : 0);
                } else {
                    values.push(value);
                }
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        values.push(id);

        const query = `UPDATE movies SET ${updates.join(', ')} WHERE id = ?`;
        await db.run(query, values);

        res.status(200).json({
            success: true,
            message: 'Movie updated successfully'
        });

    } catch (error) {
        console.error('[updateMovie] Error:', error);
        next(error);
    }
};

/**
 * Delete a movie (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.deleteMovie = async (req, res, next) => {
    const { id } = req.params;
    const db = getDatabase();

    try {
        // Check if movie exists
        const existingMovie = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
        if (!existingMovie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Check if movie has associated shows
        const associatedShows = await db.get('SELECT COUNT(*) as count FROM shows WHERE movie_id = ?', [id]);
        if (associatedShows.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete movie with associated shows'
            });
        }

        // Delete the movie
        await db.run('DELETE FROM movies WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Movie deleted successfully'
        });

    } catch (error) {
        console.error('[deleteMovie] Error:', error);
        next(error);
    }
};


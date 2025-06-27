// src/controllers/adminController.js

const { getDatabase } = require('../config/database');
const { combineDateTime, isValidJson } = require('../utils/helpers');

/**
 * Admin: Add a new movie.
 * @param {Object} req - Express request object (requires admin authentication).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.addMovie = async (req, res, next) => {
    const {
        title, description, duration_mins, durationMins, genre, language, format,
        release_date, releaseDate, rating, cast, director, producer,
        poster_url, posterUrl, trailer_url, trailerUrl, imdb_rating, imdbRating, is_upcoming, isUpcoming
    } = req.body;
    const db = getDatabase();

    try {
        // Map fields to handle both camelCase and snake_case
        const finalDurationMins = durationMins || duration_mins;
        const finalReleaseDate = releaseDate || release_date;
        const finalPosterUrl = posterUrl || poster_url;
        const finalTrailerUrl = trailerUrl || trailer_url;
        const finalImdbRating = imdbRating || imdb_rating;
        const finalIsUpcoming = isUpcoming !== undefined ? isUpcoming : (is_upcoming !== undefined ? is_upcoming : false);

        const result = await db.run(
            `INSERT INTO movies (
                title, description, duration_mins, genre, language, format,
                release_date, rating, cast, director, producer,
                poster_url, trailer_url, imdb_rating, is_upcoming
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, description, finalDurationMins, JSON.stringify(genre), JSON.stringify(language), JSON.stringify(format),
                finalReleaseDate, rating, JSON.stringify(cast), director, producer,
                finalPosterUrl, finalTrailerUrl, finalImdbRating, finalIsUpcoming ? 1 : 0
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Movie added successfully',
            movieId: result.lastID
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Create a new show schedule.
 * Validates movie, screen, and theater existence.
 * @param {Object} req - Express request object (requires admin authentication).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.createShow = async (req, res, next) => {
    const { movieId, screenId, theaterId, showDate, showTime, basePrice, format, language } = req.body;
    const db = getDatabase();
    try {
        await db.run('BEGIN TRANSACTION;');
        // Validate movie existence and format/language compatibility
        const movie = await db.get('SELECT id, title, format, language FROM movies WHERE id = ?', [movieId]);
        if (!movie) throw new Error('Movie not found.');
        const movieFormats = Array.isArray(movie.format) ? movie.format : (isValidJson(movie.format) ? JSON.parse(movie.format) : []);
        const movieLanguages = Array.isArray(movie.language) ? movie.language : (isValidJson(movie.language) ? JSON.parse(movie.language) : []);
        if (!movieFormats.includes(format)) throw new Error(`Invalid format '${format}' for movie '${movie.title}'. Available: ${movieFormats.join(', ')}`);
        if (!movieLanguages.includes(language)) throw new Error(`Invalid language '${language}' for movie '${movie.title}'. Available: ${movieLanguages.join(', ')}`);
        // Check for existing show at same time
        const existingShow = await db.get('SELECT id FROM shows WHERE screen_id = ? AND show_date = ? AND show_time = ?', [screenId, showDate, showTime]);
        if (existingShow) throw new Error(`A show already exists on screen ${screenId} at ${showDate} ${showTime}.`);
        // Insert show
        const showResult = await db.run('INSERT INTO shows (movie_id, screen_id, theater_id, show_date, show_time, base_price, format, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [movieId, screenId, theaterId, showDate, showTime, basePrice, format, language]);
        const showId = showResult.lastID;
        // Fetch seat layout from seat_layouts table
        const seatLayoutRow = await db.get('SELECT layout_data FROM seat_layouts WHERE screen_id = ?', [screenId]);
        if (!seatLayoutRow || !seatLayoutRow.layout_data || !isValidJson(seatLayoutRow.layout_data)) {
            throw new Error(`Seat layout not found or invalid for screen ${screenId}. Cannot create show without valid seat layout.`);
        }
        const layout = JSON.parse(seatLayoutRow.layout_data);
        const categories = Object.keys(layout);
        if (categories.length === 0) {
            throw new Error(`Seat layout for screen ${screenId} has no categories. Cannot create show.`);
        }
        // Insert seat pricing for each category
        const multipliers = { regular: 1, premium: 1.2, recliner: 1.5 };
        for (const category of categories) {
            const price = Math.round(basePrice * (multipliers[category] || 1));
            await db.run('INSERT INTO seat_pricing (show_id, category, price) VALUES (?, ?, ?)', [showId, category, price]);
        }
        // Post-insert: verify all categories have pricing
        const pricingRows = await db.all('SELECT category FROM seat_pricing WHERE show_id = ?', [showId]);
        const pricingCategories = pricingRows.map(r => r.category);
        const missing = categories.filter(cat => !pricingCategories.includes(cat));
        if (missing.length > 0) {
            throw new Error(`Failed to insert pricing for categories: ${missing.join(', ')}`);
        }
        await db.run('COMMIT;');
        res.status(201).json({ success: true, showId });
    } catch (err) {
        await db.run('ROLLBACK;');
        next(err);
    }
};

/**
 * Admin: Update show details.
 * @param {Object} req - Express request object (requires admin authentication).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.updateShow = async (req, res, next) => {
    const { showId } = req.params;
    const { movieId, screenId, showDate, showTime, basePrice, format, language, status } = req.body;
    const db = getDatabase();
    const updates = [];
    const params = [];
    if (movieId !== undefined) { updates.push('movie_id = ?'); params.push(movieId); }
    if (screenId !== undefined) { updates.push('screen_id = ?'); params.push(screenId); }
    if (showDate !== undefined) { updates.push('show_date = ?'); params.push(showDate); }
    if (showTime !== undefined) { updates.push('show_time = ?'); params.push(showTime); }
    if (basePrice !== undefined) { updates.push('base_price = ?'); params.push(basePrice); }
    if (format !== undefined) { updates.push('format = ?'); params.push(format); }
    if (language !== undefined) { updates.push('language = ?'); params.push(language); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }
    params.push(showId);
    try {
        const result = await db.run(`UPDATE shows SET ${updates.join(', ')} WHERE id = ?`, params);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Show not found or no changes made.' });
        }
        // If basePrice is updated, update seat_pricing for all categories
        if (basePrice !== undefined) {
            const show = await db.get('SELECT screen_id FROM shows WHERE id = ?', [showId]);
            const seatLayoutRow = await db.get('SELECT layout_data FROM seat_layouts WHERE screen_id = ?', [show.screen_id]);
            if (seatLayoutRow && seatLayoutRow.layout_data && isValidJson(seatLayoutRow.layout_data)) {
                const layout = JSON.parse(seatLayoutRow.layout_data);
                const categories = Object.keys(layout);
                const multipliers = { regular: 1, premium: 1.2, recliner: 1.5 };
                for (const category of categories) {
                    const price = Math.round(basePrice * (multipliers[category] || 1));
                    await db.run('UPDATE seat_pricing SET price = ? WHERE show_id = ? AND category = ?', [price, showId, category]);
                }
            }
        }
        res.status(200).json({ success: true, message: 'Show updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get theater occupancy reports.
 * @param {Object} req - Express request object (requires admin authentication).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getOccupancyReports = async (req, res, next) => {
    const db = getDatabase();

    try {
        const reports = await db.all(`
            SELECT 
                t.name AS theaterName,
                sc.name AS screenName,
                COUNT(bs.id) AS bookedSeats,
                sc.capacity AS totalSeats,
                ROUND((COUNT(bs.id) * 100.0 / sc.capacity), 2) AS occupancyPercentage
            FROM theaters t
            JOIN screens sc ON t.id = sc.theater_id
            LEFT JOIN shows sh ON sc.id = sh.screen_id
            LEFT JOIN booked_seats bs ON sh.id = bs.show_id AND bs.status = 'confirmed'
            GROUP BY t.id, sc.id
            ORDER BY t.name, sc.name
        `);

        res.status(200).json({
            success: true,
            reports: reports
        });
    } catch (error) {
        next(error);
    }
};

/**
 * NOTE: Seat pricing is always inserted/updated for ALL categories in the seat layout.
 * Show creation will fail if seat layout is missing or invalid for the screen.
 */

// src/controllers/theaterController.js

const { getDatabase } = require('../config/database');
const { isValidJson } = require('../utils/helpers');

/**
 * Get theaters by city, optionally filtered by movie.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getTheaters = async (req, res, next) => {
    const { cityId, movieId } = req.query;
    const db = getDatabase();

    let query = `
        SELECT
            t.id,
            t.name,
            t.address,
            t.facilities,
            COUNT(DISTINCT s.id) AS screens,
            t.latitude,
            t.longitude
        FROM
            theaters t
        JOIN
            screens sc ON t.id = sc.theater_id
        LEFT JOIN
            shows s ON sc.id = s.screen_id
        WHERE
            t.city_id = ?
    `;
    const params = [cityId];

    if (movieId) {
        // Ensure that the theater has shows for the specific movie today or in the future
        const today = new Date().toISOString().split('T')[0];
        query += ` AND s.movie_id = ? AND s.show_date >= ?`;
        params.push(movieId, today);
    }

    query += `
        GROUP BY
            t.id, t.name, t.address, t.facilities, t.latitude, t.longitude
        ORDER BY
            t.name;
    `;

    try {
        const theaters = await db.all(query, params);

        const formattedTheaters = theaters.map(theater => ({
            ...theater,
            facilities: isValidJson(theater.facilities) ? JSON.parse(theater.facilities) : []
        }));

        res.status(200).json({
            success: true,
            theaters: formattedTheaters
        });
    } catch (error) {
        next(error);
    }
};

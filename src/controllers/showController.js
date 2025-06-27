const { getDatabase } = require('../config/database');
const { calculateTotalCapacity } = require('../utils/seatHelper');
const { isValidJson } = require('../utils/helpers');

/**
 * Get shows for a movie in a specific city and date.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getShows = async (req, res, next) => {
    const { movieId, cityId, date } = req.query;
    const db = getDatabase();

    try {
        // Validate required parameters
        if (!movieId || !cityId || !date) {
            return res.status(400).json({
                success: false,
                message: 'movieId, cityId, and date are required parameters.'
            });
        }

        // Get shows for the movie in the specified city and date
        const shows = await db.all(`
            SELECT
                sh.id AS showId,
                sh.show_time AS showTime,
                sh.format,
                sh.language,
                sh.base_price AS basePrice,
                sh.status AS showStatus,
                sc.name AS screenName,
                sc.sound_system AS soundSystem,
                sc.capacity AS totalSeats,
                th.id AS theaterId,
                th.name AS theaterName,
                th.address AS theaterAddress,
                sl.layout_data AS seatLayoutData
            FROM
                shows sh
            JOIN screens sc ON sh.screen_id = sc.id
            JOIN theaters th ON sh.theater_id = th.id
            LEFT JOIN seat_layouts sl ON sc.id = sl.screen_id
            WHERE
                sh.movie_id = ? AND th.city_id = ? AND sh.show_date = ? AND sh.status = 'active'
            ORDER BY
                th.name, sh.show_time;
        `, [movieId, cityId, date]);

        if (shows.length === 0) {
            return res.status(200).json({
                success: true,
                date: date,
                shows: []
            });
        }

        // Group shows by theater
        const theatersMap = {};
        for (const show of shows) {
            const theaterId = show.theaterId;
            
            if (!theatersMap[theaterId]) {
                theatersMap[theaterId] = {
                    theaterId: theaterId,
                    theaterName: show.theaterName,
                    shows: []
                };
            }

            // Calculate available seats
            let availableSeats = show.totalSeats;
            if (show.seatLayoutData) {
                const seatLayout = isValidJson(show.seatLayoutData) ? JSON.parse(show.seatLayoutData) : {};
                availableSeats = calculateTotalCapacity(seatLayout);
            }

            // Get booked seats count
            const bookedSeatsResult = await db.get(`
                SELECT COUNT(*) as bookedCount FROM booked_seats
                WHERE show_id = ? AND status = 'confirmed';
            `, [show.showId]);
            
            const bookedSeats = bookedSeatsResult ? bookedSeatsResult.bookedCount : 0;
            availableSeats -= bookedSeats;

            // Get seat pricing for this show
            const seatPricing = await db.all(`
                SELECT category, price FROM seat_pricing WHERE show_id = ?;
            `, [show.showId]);

            const prices = {};
            seatPricing.forEach(sp => {
                prices[sp.category] = sp.price;
            });

            theatersMap[theaterId].shows.push({
                showId: show.showId,
                showTime: show.showTime,
                format: show.format,
                language: show.language,
                screenName: show.screenName,
                soundSystem: show.soundSystem,
                availableSeats: Math.max(0, availableSeats),
                totalSeats: show.totalSeats,
                prices: prices
            });
        }

        res.status(200).json({
            success: true,
            date: date,
            shows: Object.values(theatersMap)
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get a specific show by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getShowById = async (req, res, next) => {
    const { showId } = req.params;
    const db = getDatabase();

    try {
        const show = await db.get(`
            SELECT
                sh.id AS showId,
                sh.show_date AS showDate,
                sh.show_time AS showTime,
                sh.format,
                sh.language,
                sh.base_price AS basePrice,
                sh.status AS showStatus,
                m.title AS movieTitle,
                sc.name AS screenName,
                th.name AS theaterName
            FROM
                shows sh
            JOIN movies m ON sh.movie_id = m.id
            JOIN screens sc ON sh.screen_id = sc.id
            JOIN theaters th ON sh.theater_id = th.id
            WHERE sh.id = ?;
        `, [showId]);

        if (!show) {
            return res.status(404).json({
                success: false,
                message: 'Show not found.'
            });
        }

        res.status(200).json({
            success: true,
            show: show
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Create a new show (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.createShow = async (req, res, next) => {
    const {
        movieId,
        screenId,
        theaterId,
        showDate,
        showTime,
        basePrice,
        format,
        language
    } = req.body;

    const db = getDatabase();

    try {
        // Validate required fields
        if (!movieId || !screenId || !theaterId || !showDate || !showTime || !basePrice || !format || !language) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: movieId, screenId, theaterId, showDate, showTime, basePrice, format, language'
            });
        }

        // Check if movie exists
        const movie = await db.get('SELECT id FROM movies WHERE id = ?', [movieId]);
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Check if screen exists and belongs to the theater
        const screen = await db.get('SELECT id FROM screens WHERE id = ? AND theater_id = ?', [screenId, theaterId]);
        if (!screen) {
            return res.status(404).json({
                success: false,
                message: 'Screen not found or does not belong to the specified theater'
            });
        }

        // Check if theater exists
        const theater = await db.get('SELECT id FROM theaters WHERE id = ?', [theaterId]);
        if (!theater) {
            return res.status(404).json({
                success: false,
                message: 'Theater not found'
            });
        }

        // Check for conflicting shows (same screen, date, and time)
        const conflictingShow = await db.get(`
            SELECT id FROM shows 
            WHERE screen_id = ? AND show_date = ? AND show_time = ? AND status = 'active'
        `, [screenId, showDate, showTime]);

        if (conflictingShow) {
            return res.status(409).json({
        success: false,
                message: 'A show already exists for this screen, date, and time'
            });
        }

        // Insert new show
        const result = await db.run(`
            INSERT INTO shows (
                movie_id, screen_id, theater_id, show_date, show_time,
                base_price, format, language, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [movieId, screenId, theaterId, showDate, showTime, basePrice, format, language]);

        // Fetch seat layout for the screen
        const seatLayoutRow = await db.get('SELECT layout_data FROM seat_layouts WHERE screen_id = ?', [screenId]);
        let seatLayout = {};
        if (seatLayoutRow && seatLayoutRow.layout_data) {
            try {
                seatLayout = JSON.parse(seatLayoutRow.layout_data);
                console.log('[DEBUG] Parsed seat layout:', seatLayout);
            } catch (e) {
                console.log('[DEBUG] Error parsing seat layout:', e);
                seatLayout = {};
            }
        } else {
            console.log('[DEBUG] No seat layout found for screen:', screenId);
        }

        // Insert seat pricing for all categories in the seat layout
        let pricingInserts = [];
        let multipliers = [1, 1.2, 1.5];
        let i = 0;
        
        console.log('[DEBUG] Seat layout keys:', Object.keys(seatLayout));
        
        if (seatLayout && typeof seatLayout === 'object' && Object.keys(seatLayout).length > 0) {
            for (const categoryName of Object.keys(seatLayout)) {
                let price = Math.round(basePrice * (multipliers[i] || 1));
                pricingInserts.push({ show_id: result.lastID, category: categoryName, price });
                console.log('[DEBUG] Adding pricing for category:', categoryName, 'price:', price);
                i++;
            }
        } else {
            // Fallback: insert at least 'regular' with base price
            pricingInserts.push({ show_id: result.lastID, category: 'regular', price: basePrice });
            console.log('[DEBUG] Using fallback pricing for regular category');
        }
        
        console.log('[DEBUG] Final pricing inserts:', pricingInserts);
        
        for (const p of pricingInserts) {
            try {
                await db.run('INSERT INTO seat_pricing (show_id, category, price) VALUES (?, ?, ?)', [p.show_id, p.category, p.price]);
                console.log('[DEBUG] Inserted pricing for show', p.show_id, 'category', p.category, 'price', p.price);
            } catch (error) {
                console.error('[DEBUG] Error inserting pricing for show', p.show_id, 'category', p.category, 'error:', error);
                throw error;
            }
        }

        res.status(201).json({
            success: true,
            message: 'Show created successfully',
            showId: result.lastID
        });

    } catch (error) {
        console.error('[createShow] Error:', error);
        next(error);
    }
};

/**
 * Update a show (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.updateShow = async (req, res, next) => {
    const { showId } = req.params;
    const updateFields = req.body;

    const db = getDatabase();

    try {
        // Check if show exists
        const existingShow = await db.get('SELECT id FROM shows WHERE id = ?', [showId]);
        if (!existingShow) {
            return res.status(404).json({
                success: false,
                message: 'Show not found'
            });
        }

        // Map camelCase to snake_case for database fields
        const fieldMapping = {
            movieId: 'movie_id',
            screenId: 'screen_id',
            theaterId: 'theater_id',
            showDate: 'show_date',
            showTime: 'show_time',
            basePrice: 'base_price',
            format: 'format',
            language: 'language',
            status: 'status'
        };

        // Build dynamic update query
        const allowedFields = [
            'movie_id', 'screen_id', 'theater_id', 'show_date', 'show_time',
            'base_price', 'format', 'language', 'status'
        ];

        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateFields)) {
            const dbField = fieldMapping[key];
            if (dbField && allowedFields.includes(dbField)) {
                updates.push(`${dbField} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Check for conflicts if updating date/time/screen
        if (updateFields.showDate || updateFields.showTime || updateFields.screenId) {
            const currentShow = await db.get('SELECT screen_id, show_date, show_time FROM shows WHERE id = ?', [showId]);
            const checkScreenId = updateFields.screenId || currentShow.screen_id;
            const checkDate = updateFields.showDate || currentShow.show_date;
            const checkTime = updateFields.showTime || currentShow.show_time;

            const conflictingShow = await db.get(`
                SELECT id FROM shows 
                WHERE screen_id = ? AND show_date = ? AND show_time = ? AND status = 'active' AND id != ?
            `, [checkScreenId, checkDate, checkTime, showId]);

            if (conflictingShow) {
                return res.status(409).json({
        success: false,
                    message: 'A show already exists for this screen, date, and time'
                });
            }
        }

        values.push(showId);

        const query = `UPDATE shows SET ${updates.join(', ')} WHERE id = ?`;
        await db.run(query, values);

        // Update seat pricing if base price changed
        if (updateFields.basePrice) {
            // Get all categories for this show
            const categories = await db.all('SELECT category FROM seat_pricing WHERE show_id = ?', [showId]);
            const multipliers = [1, 1.2, 1.5];
            let i = 0;
            for (const cat of categories) {
                let price = Math.round(updateFields.basePrice * (multipliers[i] || 1));
                await db.run('UPDATE seat_pricing SET price = ? WHERE show_id = ? AND category = ?', [price, showId, cat.category]);
                i++;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Show updated successfully'
    });

    } catch (error) {
        console.error('[updateShow] Error:', error);
        next(error);
    }
};

/**
 * Delete a show (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.deleteShow = async (req, res, next) => {
    const { showId } = req.params;
    const db = getDatabase();

    try {
        // Check if show exists
        const existingShow = await db.get('SELECT id FROM shows WHERE id = ?', [showId]);
        if (!existingShow) {
            return res.status(404).json({
                success: false,
                message: 'Show not found'
            });
        }

        // Check if show has bookings
        const bookings = await db.get('SELECT COUNT(*) as count FROM booked_seats WHERE show_id = ?', [showId]);
        if (bookings.count > 0) {
            return res.status(400).json({
        success: false,
                message: 'Cannot delete show with existing bookings'
            });
        }

        // Delete seat pricing first
        await db.run('DELETE FROM seat_pricing WHERE show_id = ?', [showId]);

        // Delete the show
        await db.run('DELETE FROM shows WHERE id = ?', [showId]);

        res.status(200).json({
            success: true,
            message: 'Show deleted successfully'
    });

    } catch (error) {
        console.error('[deleteShow] Error:', error);
        next(error);
    }
};

/**
 * Get shows by movie ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getShowsByMovie = async (req, res, next) => {
  const { movieId } = req.params;
  const db = getDatabase();

    try {
        const shows = await db.all(`
            SELECT
                sh.id AS showId,
                sh.show_date AS showDate,
                sh.show_time AS showTime,
                sh.format,
                sh.language,
                sh.base_price AS basePrice,
                th.name AS theaterName,
                sc.name AS screenName
            FROM shows sh
            JOIN theaters th ON sh.theater_id = th.id
            JOIN screens sc ON sh.screen_id = sc.id
            WHERE sh.movie_id = ? AND sh.status = 'active'
            ORDER BY sh.show_date, sh.show_time;
        `, [movieId]);

        res.status(200).json({
            success: true,
            shows: shows
        });

    } catch (error) {
        next(error);
    }
};

console.log('[ShowController Debug] Module exports:', Object.keys(module.exports));

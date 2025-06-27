// src/controllers/cityController.js

const { getDatabase } = require('../config/database');

/**
 * Get all cities with theater counts.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getCitiesWithTheaters = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cities = await db.all(`
      SELECT c.id, c.name, c.state, COUNT(t.id) AS theaterCount
      FROM cities c
      LEFT JOIN theaters t ON t.city_id = c.id
      GROUP BY c.id;
    `);
    res.status(200).json({ success: true, cities });
  } catch (err) {
    next(err);
  }
};
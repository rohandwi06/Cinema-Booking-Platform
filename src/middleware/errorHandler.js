// src/middleware/errorHandler.js

/**
 * Centralized error handling middleware.
 * Catches errors from routes and sends appropriate JSON responses.
 * @param {Error} err - The error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error encountered:', err.message);
    console.error(err.stack); // Log the stack trace for debugging

    // Handle specific error types or custom errors
    if (err.name === 'UnauthorizedError') { // Example for JWT errors if using express-jwt
        return res.status(401).json({ success: false, message: 'Unauthorized: ' + err.message });
    }
    if (err.message.includes('No rows found')) {
        return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes('already exists') || err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ success: false, message: 'Conflict: ' + err.message });
    }
    if (err.message.includes('Invalid input')) {
        return res.status(400).json({ success: false, message: 'Bad Request: ' + err.message });
    }
    if (err.message.includes('Show already started')) {
        return res.status(410).json({ success: false, message: err.message });
    }
    if (err.message.includes('Forbidden')) {
        return res.status(403).json({ success: false, message: err.message });
    }


    // Default to 500 Internal Server Error
    res.status(500).json({
        success: false,
        message: 'An unexpected internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined // Only expose error message in dev
    });
};

module.exports = errorHandler;

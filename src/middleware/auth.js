// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token attempt', {
                token: token.substring(0, 10) + '...',
                error: err.message
            });
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }

        req.user = user;
        next();
    });
};

/**
 * Middleware to require admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        logger.warn('Unauthorized admin access attempt', {
            userId: req.user?.id,
            email: req.user?.email
        });
        return res.status(403).json({ 
            success: false, 
            message: 'Admin access required' 
        });
    }
    next();
};

/**
 * Verify token and check if user is admin (legacy function for backward compatibility)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = (req, res, next) => {
    return authenticateToken(req, res, next);
};

/**
 * Check if user is admin (legacy function for backward compatibility)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAdmin = (req, res, next) => {
    return requireAdmin(req, res, next);
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, email, and isAdmin
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            isAdmin: user.is_admin === 1 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = {
    authenticateToken,
    requireAdmin,
    verifyToken, // Legacy
    isAdmin, // Legacy
    generateToken,
    hashPassword,
    comparePassword
};

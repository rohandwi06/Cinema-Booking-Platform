// src/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Register a new user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.register = async (req, res, next) => {
    const { name, email, password, mobile, dateOfBirth } = req.body;
    const db = getDatabase();

    try {
        logger.info('User registration attempt', { email, mobile });

        // Check if user already exists
        const existingUser = await db.get(
            'SELECT id FROM users WHERE email = ? OR mobile = ?',
            [email, mobile]
        );

        if (existingUser) {
            logger.warn('Registration failed - user already exists', { email, mobile });
            return res.status(409).json({
                success: false,
                message: 'Email or mobile already registered.'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Insert new user
        const result = await db.run(
            'INSERT INTO users (name, email, password, mobile, date_of_birth) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, mobile, dateOfBirth]
        );

        const userId = result.lastID;

        logger.authSuccess(userId, email, { event: 'registration' });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: userId
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message, email });
        next(error);
    }
};

/**
 * Login user and return JWT token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const db = getDatabase();

    try {
        logger.info('Login attempt', { email });

        // Get user by email
        const user = await db.get(
            'SELECT id, email, password, name, is_admin FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            logger.authFailure(email, 'User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            logger.authFailure(email, 'Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        logger.authSuccess(user.id, email, { event: 'login' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.is_admin === 1
            }
        });
    } catch (error) {
        logger.error('Login error', { error: error.message, email });
        next(error);
    }
};


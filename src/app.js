require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler'); // Correctly import the error handler
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { sanitizeInput, preventSqlInjection } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const cityRoutes = require('./routes/cityRoutes');
const theaterRoutes = require('./routes/theaterRoutes');
const showRoutes = require('./routes/showRoutes');
const seatRoutes = require('./routes/seatRoutes'); // ✅ Ensure this exports a Router, not an object
const bookingRoutes = require('./routes/bookingRoutes');
const fnbRoutes = require('./routes/fnbRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(preventSqlInjection);
app.use(sanitizeInput);

// Enhanced request logging middleware
app.use(logger.requestLogger);

// Global rate limiter (e.g., 100 requests per 15 minutes per IP)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { 
        success: false, 
        message: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    // Custom key generator for better rate limiting
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    // Skip rate limiting for certain paths
    skip: (req) => {
        // Skip rate limiting for health check and static assets
        return req.path === '/' || req.path.startsWith('/health');
    }
}));

// Specific rate limiters for sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // TEMP: allow 1000 login attempts per 15 minutes for testing
    message: { 
        success: false, 
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    }
});

const bookingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 booking requests per 5 minutes
    message: { 
        success: false, 
        message: 'Too many booking attempts, please try again later.',
        retryAfter: '5 minutes'
    }
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/shows', seatRoutes); // Mount seat routes under shows path FIRST
app.use('/api/shows', showRoutes); // Mount show routes AFTER seat routes
app.use('/api/bookings', bookingLimiter, bookingRoutes);
app.use('/api/fnb', fnbRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Cinema Booking API is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test route
app.get('/', (req, res) => {
    res.send('Welcome to the Cinema Booking API!');
});

// Enhanced error logging middleware
app.use(logger.errorLogger);

// Centralized error handling
app.use(errorHandler);

// Start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server started successfully`, {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        });
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    logger.error('Failed to initialize database or start server', {
        error: err.message,
        stack: err.stack
    });
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
});

module.exports = app;

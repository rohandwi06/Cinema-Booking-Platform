// src/middleware/validation.js

const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const { isValidJson } = require('../utils/helpers');

/**
 * Middleware factory for validating request data.
 * @param {Joi.ObjectSchema} schema - Joi schema to validate against.
 * @param {'body' | 'query' | 'params'} property - Source of the request data.
 * @returns {Function} Express middleware function.
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        if (!schema || typeof schema.validate !== 'function') {
            console.error(`[Validation Error] Invalid Joi schema for request.${property}`);
            return res.status(500).json({
                success: false,
                message: `Internal validation configuration error for '${property}'`,
            });
        }

        const { error } = schema.validate(req[property], { abortEarly: false });

        if (error) {
            const errors = error.details.map(d => d.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
        }

        next();
    };
};

// ------------------ Joi Schemas ------------------ //

const authSchemas = {
    register: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        mobile: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
        dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
};

const movieSchemas = {
    getMovies: Joi.object({
        city: Joi.string().required(),
        language: Joi.string().optional(),
        genre: Joi.string().optional(),
        format: Joi.string().valid('2D', '3D', 'IMAX').optional()
    }),
    movieIdParam: Joi.object({
        id: Joi.number().integer().min(1).required()
    }),
    createMovie: Joi.object({
        title: Joi.string().min(1).max(255).required(),
        description: Joi.string().min(10).required(),
        duration_mins: Joi.number().integer().min(1).max(300).required(),
        genre: Joi.array().items(Joi.string()).min(1).required(),
        language: Joi.array().items(Joi.string()).min(1).required(),
        format: Joi.array().items(Joi.string().valid('2D', '3D', 'IMAX')).min(1).required(),
        release_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        rating: Joi.string().max(10).optional(),
        cast: Joi.array().items(Joi.string()).optional(),
        director: Joi.string().optional(),
        producer: Joi.string().optional(),
        poster_url: Joi.string().uri().optional(),
        trailer_url: Joi.string().uri().optional(),
        imdb_rating: Joi.number().min(0).max(10).optional(),
        is_upcoming: Joi.boolean().optional().default(false)
    }),
    updateMovie: Joi.object({
        title: Joi.string().min(1).max(255).optional(),
        description: Joi.string().min(10).optional(),
        duration_mins: Joi.number().integer().min(1).max(300).optional(),
        genre: Joi.array().items(Joi.string()).min(1).optional(),
        language: Joi.array().items(Joi.string()).min(1).optional(),
        format: Joi.array().items(Joi.string().valid('2D', '3D', 'IMAX')).min(1).optional(),
        release_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        rating: Joi.string().max(10).optional(),
        cast: Joi.array().items(Joi.string()).optional(),
        director: Joi.string().optional(),
        producer: Joi.string().optional(),
        poster_url: Joi.string().uri().optional(),
        trailer_url: Joi.string().uri().optional(),
        imdb_rating: Joi.number().min(0).max(10).optional(),
        is_upcoming: Joi.boolean().optional()
    }).min(1)
};

const theaterSchemas = {
    getTheaters: Joi.object({
        cityId: Joi.number().integer().min(1).required(),
        movieId: Joi.number().integer().min(1).optional()
    })
};

const showSchemas = {
    getShows: Joi.object({
        movieId: Joi.number().integer().required(),
        cityId: Joi.number().integer().required(),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
    }),
    showIdParam: Joi.object({
        showId: Joi.number().integer().required()
    }),
    createShow: Joi.object({
        movieId: Joi.number().integer().required(),
        screenId: Joi.number().integer().required(),
        theaterId: Joi.number().integer().required(),
        showDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        showTime: Joi.string().pattern(/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/).required(),
        basePrice: Joi.number().min(0).required(),
        format: Joi.string().required(),
        language: Joi.string().required()
    }),
    updateShow: Joi.object({
        movieId: Joi.number().integer().optional(),
        screenId: Joi.number().integer().optional(),
        theaterId: Joi.number().integer().optional(),
        showDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        showTime: Joi.string().pattern(/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/).optional(),
        basePrice: Joi.number().min(0).optional(),
        format: Joi.string().optional(),
        language: Joi.string().optional(),
        status: Joi.string().valid('active', 'cancelled', 'housefull').optional()
    }).min(1)
};

const bookingSchemas = {
    createBooking: Joi.object({
        showId: Joi.number().integer().min(1).required(),
        seats: Joi.array().items(
            Joi.string().pattern(/^[A-Z]{1,2}\d{1,3}$/)
        ).min(1).required(),
        userDetails: Joi.object({
            email: Joi.string().email().required(),
            mobile: Joi.string().pattern(/^\+?\d{10,15}$/).required()
        }).required()
    }),
    bookingIdParam: Joi.object({
        bookingId: Joi.string().pattern(/^PVR\d{6}$/).required()
    })
};

const fnbSchemas = {
    orderFnb: Joi.object({
        bookingId: Joi.string().pattern(/^PVR\d{6}$/).required(),
        items: Joi.array().items(Joi.object({
            itemId: Joi.number().integer().min(1).required(),
            quantity: Joi.number().integer().min(1).required()
        })).min(1).required()
    })
};

const paymentSchemas = {
    initiatePayment: Joi.object({
        bookingId: Joi.string().pattern(/^PVR\d{6}$/).required(),
        paymentMethod: Joi.string().valid('card', 'upi', 'netbanking').required(),
        includesFnb: Joi.boolean().optional().default(false)
    }),
    confirmPayment: Joi.object({
        bookingId: Joi.string().pattern(/^PVR\d{6}$/).required(),
        transactionId: Joi.string().required(),
        status: Joi.string().valid('success', 'failed').required()
    })
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Common validation rules
const commonValidations = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    password: body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    mobile: body('mobile')
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid mobile number in international format (e.g., +919876543210)'),
    
    name: body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must be 2-50 characters long and contain only letters and spaces'),
    
    dateOfBirth: body('dateOfBirth')
        .isISO8601()
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13 || age > 120) {
                throw new Error('Age must be between 13 and 120 years');
            }
            return true;
        })
        .withMessage('Please provide a valid date of birth'),
    
    movieId: body('movieId')
        .isInt({ min: 1 })
        .withMessage('Movie ID must be a positive integer'),
    
    screenId: body('screenId')
        .isInt({ min: 1 })
        .withMessage('Screen ID must be a positive integer'),
    
    theaterId: body('theaterId')
        .isInt({ min: 1 })
        .withMessage('Theater ID must be a positive integer'),
    
    basePrice: body('basePrice')
        .isFloat({ min: 50, max: 2000 })
        .withMessage('Base price must be between 50 and 2000'),
    
    showDate: body('showDate')
        .isISO8601()
        .custom((value) => {
            const showDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (showDate < today) {
                throw new Error('Show date cannot be in the past');
            }
            return true;
        })
        .withMessage('Please provide a valid future show date'),
    
    showTime: body('showTime')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid show time in HH:MM format'),
    
    format: body('format')
        .isIn(['2D', '3D', 'IMAX', '4DX'])
        .withMessage('Format must be one of: 2D, 3D, IMAX, 4DX'),
    
    language: body('language')
        .isLength({ min: 1, max: 50 })
        .withMessage('Language must be 1-50 characters long'),
    
    seats: body('seats')
        .isArray({ min: 1, max: 10 })
        .withMessage('Seats must be an array with 1-10 seats')
        .custom((seats) => {
            const seatPattern = /^[A-Z][1-9][0-9]*$/;
            for (const seat of seats) {
                if (!seatPattern.test(seat)) {
                    throw new Error(`Invalid seat format: ${seat}. Expected format: A1, B2, etc.`);
                }
            }
            return true;
        }),
    
    userDetails: body('userDetails')
        .isObject()
        .withMessage('User details must be an object')
        .custom((userDetails) => {
            if (!userDetails.email && !userDetails.mobile) {
                throw new Error('User details must include either email or mobile');
            }
            if (userDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) {
                throw new Error('User details email must be a valid email address');
            }
            if (userDetails.mobile && !/^\+?\d{10,15}$/.test(userDetails.mobile)) {
                throw new Error('User details mobile must be a valid phone number');
            }
            return true;
        }),
    
    bookingId: param('bookingId')
        .matches(/^[A-Z]{3}\d{6}$/)
        .withMessage('Booking ID must be in format: XXX123456'),
    
    showId: param('showId')
        .isInt({ min: 1 })
        .withMessage('Show ID must be a positive integer'),
    
    movieIdParam: param('movieId')
        .isInt({ min: 1 })
        .withMessage('Movie ID must be a positive integer'),
    
    theaterIdParam: param('theaterId')
        .isInt({ min: 1 })
        .withMessage('Theater ID must be a positive integer'),
    
    cityId: query('cityId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('City ID must be a positive integer'),
    
    date: query('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be in ISO format'),
    
    genre: query('genre')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Genre must be 1-50 characters long'),
    
    language: query('language')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Language must be 1-50 characters long'),
    
    format: query('format')
        .optional()
        .isIn(['2D', '3D', 'IMAX', '4DX'])
        .withMessage('Format must be one of: 2D, 3D, IMAX, 4DX'),
    
    page: query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    limit: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    // Movie-specific validations
    title: body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be 1-200 characters long'),
    
    description: body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    
    durationMins: body('duration_mins')
        .isInt({ min: 1, max: 300 })
        .withMessage('Duration must be between 1 and 300 minutes'),
    
    genre: body('genre')
        .isArray({ min: 1 })
        .withMessage('Genre must be a non-empty array'),
    
    language: body('language')
        .isArray({ min: 1 })
        .withMessage('Language must be a non-empty array'),
    
    format: body('format')
        .isArray({ min: 1 })
        .withMessage('Format must be a non-empty array'),
    
    releaseDate: body('release_date')
        .isISO8601()
        .withMessage('Release date must be in ISO format'),
    
    rating: body('rating')
        .isIn(['G', 'PG', 'PG-13', 'R', 'NC-17', 'U', 'UA', 'A'])
        .withMessage('Rating must be one of: G, PG, PG-13, R, NC-17, U, UA, A'),
    
    cast: body('cast')
        .isArray({ min: 1 })
        .withMessage('Cast must be a non-empty array'),
    
    director: body('director')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Director must be 1-100 characters long'),
    
    producer: body('producer')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Producer must be 1-100 characters long'),
    
    posterUrl: body('poster_url')
        .optional()
        .isURL()
        .withMessage('Poster URL must be a valid URL'),
    
    trailerUrl: body('trailer_url')
        .optional()
        .isURL()
        .withMessage('Trailer URL must be a valid URL'),
    
    imdbRating: body('imdb_rating')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('IMDB rating must be between 0 and 10'),
    
    // Payment validations
    paymentMethod: body('paymentMethod')
        .isIn(['card', 'upi', 'netbanking', 'wallet'])
        .withMessage('Payment method must be one of: card, upi, netbanking, wallet'),
    
    transactionId: body('transactionId')
        .matches(/^TXN\d{9}$/)
        .withMessage('Transaction ID must be in format: TXN123456789'),
    
    // FnB validations
    items: body('items')
        .isArray({ min: 1 })
        .withMessage('Items must be a non-empty array')
        .custom((items) => {
            for (const item of items) {
                if (!item.itemId || !item.quantity) {
                    throw new Error('Each item must have itemId and quantity');
                }
                if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
                    throw new Error('Quantity must be an integer between 1 and 10');
                }
            }
            return true;
        }),
    
    itemId: body('itemId')
        .isInt({ min: 1 })
        .withMessage('Item ID must be a positive integer'),
    
    quantity: body('quantity')
        .isInt({ min: 1, max: 10 })
        .withMessage('Quantity must be between 1 and 10')
};

// Validation chains for specific endpoints
const validationChains = {
    // Auth validations
    register: [
        commonValidations.name,
        commonValidations.email,
        commonValidations.password,
        commonValidations.mobile,
        commonValidations.dateOfBirth,
        handleValidationErrors
    ],
    
    login: [
        commonValidations.email,
        body('password').notEmpty().withMessage('Password is required'),
        handleValidationErrors
    ],
    
    // Movie validations
    addMovie: [
        commonValidations.title,
        commonValidations.description,
        commonValidations.durationMins,
        commonValidations.genre,
        commonValidations.language,
        commonValidations.format,
        commonValidations.releaseDate,
        commonValidations.rating,
        commonValidations.cast,
        commonValidations.director,
        commonValidations.producer,
        commonValidations.posterUrl,
        commonValidations.trailerUrl,
        commonValidations.imdbRating,
        handleValidationErrors
    ],
    
    // Show validations
    createShow: [
        commonValidations.movieId,
        commonValidations.screenId,
        commonValidations.theaterId,
        commonValidations.basePrice,
        commonValidations.showDate,
        commonValidations.showTime,
        commonValidations.format,
        commonValidations.language,
        handleValidationErrors
    ],
    
    updateShow: [
        commonValidations.showId,
        body('movieId').optional().isInt({ min: 1 }),
        body('screenId').optional().isInt({ min: 1 }),
        body('basePrice').optional().isFloat({ min: 50, max: 2000 }),
        body('showDate').optional().isISO8601(),
        body('showTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        body('format').optional().isIn(['2D', '3D', 'IMAX', '4DX']),
        body('language').optional().isLength({ min: 1, max: 50 }),
        body('status').optional().isIn(['active', 'cancelled', 'completed']),
        handleValidationErrors
    ],
    
    // Booking validations
    createBooking: [
        body('showId').isInt({ min: 1 }).withMessage('Show ID must be a positive integer'),
        commonValidations.seats,
        commonValidations.userDetails,
        handleValidationErrors
    ],
    
    // Payment validations
    initiatePayment: [
        commonValidations.bookingId,
        commonValidations.paymentMethod,
        body('includesFnb').optional().isBoolean(),
        handleValidationErrors
    ],
    
    confirmPayment: [
        commonValidations.bookingId,
        commonValidations.transactionId,
        body('status').isIn(['success', 'failed', 'pending']),
        handleValidationErrors
    ],
    
    // FnB validations
    orderFnb: [
        commonValidations.bookingId,
        commonValidations.items,
        handleValidationErrors
    ],
    
    // Query validations
    getMovies: [
        commonValidations.cityId,
        commonValidations.genre,
        commonValidations.language,
        commonValidations.format,
        commonValidations.page,
        commonValidations.limit,
        handleValidationErrors
    ],
    
    getShows: [
        commonValidations.movieIdParam,
        commonValidations.cityId,
        commonValidations.date,
        handleValidationErrors
    ],
    
    // Parameter validations
    getMovieById: [
        commonValidations.movieIdParam,
        handleValidationErrors
    ],
    
    getShowById: [
        commonValidations.showId,
        handleValidationErrors
    ],
    
    getBookingDetails: [
        commonValidations.bookingId,
        handleValidationErrors
    ],
    
    getTheaterById: [
        commonValidations.theaterIdParam,
        handleValidationErrors
    ]
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize string inputs
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].trim();
            }
        });
    }
    
    next();
};

// SQL injection prevention middleware
const preventSqlInjection = (req, res, next) => {
    const sqlKeywords = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
        'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'EVAL', 'EXPRESSION'
    ];
    
    const checkValue = (value) => {
        if (typeof value === 'string') {
            const upperValue = value.toUpperCase();
            for (const keyword of sqlKeywords) {
                if (upperValue.includes(keyword)) {
                    return false;
                }
            }
        }
        return true;
    };
    
    const checkObject = (obj) => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (!checkObject(obj[key])) {
                        return false;
                    }
                } else if (!checkValue(obj[key])) {
                    return false;
                }
            }
        }
        return true;
    };
    
    if (!checkObject(req.body) || !checkObject(req.query) || !checkObject(req.params)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
        });
    }
    
    next();
};

module.exports = {
    validate,
    authSchemas,
    movieSchemas,
    theaterSchemas,
    showSchemas,
    bookingSchemas,
    fnbSchemas,
    paymentSchemas,
    ...validationChains,
    sanitizeInput,
    preventSqlInjection,
    handleValidationErrors
};

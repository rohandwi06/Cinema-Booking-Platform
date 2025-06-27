const winston = require('winston');
const path = require('path');

// Custom format for structured logging
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: `;
        
        if (typeof message === 'object') {
            log += JSON.stringify(message, null, 2);
        } else {
            log += message;
        }
        
        if (stack) {
            log += `\nStack: ${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
            log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { 
        service: 'cinema-booking-api',
        version: '1.0.0'
    },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        
        // File transport for errors
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: customFormat
        }),
        
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: customFormat
        }),
        
        // File transport for API requests
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/api.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: customFormat
        })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log'),
            format: customFormat
        })
    ],
    
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rejections.log'),
            format: customFormat
        })
    ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Enhanced logging methods
const enhancedLogger = {
    // Standard logging methods
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },
    
    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },
    
    info: (message, meta = {}) => {
        logger.info(message, meta);
    },
    
    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },
    
    // API-specific logging methods
    apiRequest: (req, meta = {}) => {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            body: req.method !== 'GET' ? req.body : undefined,
            query: req.query,
            params: req.params,
            ...meta
        };
        
        logger.info('API Request', logData);
    },
    
    apiResponse: (req, res, responseTime, meta = {}) => {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userId: req.user?.id,
            ...meta
        };
        
        if (res.statusCode >= 400) {
            logger.warn('API Response', logData);
        } else {
            logger.info('API Response', logData);
        }
    },
    
    // Database logging methods
    dbQuery: (query, params, executionTime, meta = {}) => {
        const logData = {
            query: query,
            params: params,
            executionTime: `${executionTime}ms`,
            ...meta
        };
        
        logger.debug('Database Query', logData);
    },
    
    dbError: (error, query, params, meta = {}) => {
        const logData = {
            error: error.message,
            stack: error.stack,
            query: query,
            params: params,
            ...meta
        };
        
        logger.error('Database Error', logData);
    },
    
    // Authentication logging methods
    authSuccess: (userId, email, meta = {}) => {
        const logData = {
            userId: userId,
            email: email,
            event: 'login_success',
            ...meta
        };
        
        logger.info('Authentication Success', logData);
    },
    
    authFailure: (email, reason, meta = {}) => {
        const logData = {
            email: email,
            reason: reason,
            event: 'login_failure',
            ...meta
        };
        
        logger.warn('Authentication Failure', logData);
    },
    
    // Booking logging methods
    bookingCreated: (bookingId, userId, showId, seats, amount, meta = {}) => {
        const logData = {
            bookingId: bookingId,
            userId: userId,
            showId: showId,
            seats: seats,
            amount: amount,
            event: 'booking_created',
            ...meta
        };
        
        logger.info('Booking Created', logData);
    },
    
    bookingFailed: (userId, showId, seats, reason, meta = {}) => {
        const logData = {
            userId: userId,
            showId: showId,
            seats: seats,
            reason: reason,
            event: 'booking_failed',
            ...meta
        };
        
        logger.error('Booking Failed', logData);
    },
    
    // Payment logging methods
    paymentInitiated: (bookingId, amount, method, meta = {}) => {
        const logData = {
            bookingId: bookingId,
            amount: amount,
            method: method,
            event: 'payment_initiated',
            ...meta
        };
        
        logger.info('Payment Initiated', logData);
    },
    
    paymentCompleted: (bookingId, transactionId, amount, meta = {}) => {
        const logData = {
            bookingId: bookingId,
            transactionId: transactionId,
            amount: amount,
            event: 'payment_completed',
            ...meta
        };
        
        logger.info('Payment Completed', logData);
    },
    
    paymentFailed: (bookingId, reason, meta = {}) => {
        const logData = {
            bookingId: bookingId,
            reason: reason,
            event: 'payment_failed',
            ...meta
        };
        
        logger.error('Payment Failed', logData);
    },
    
    // Performance logging methods
    performance: (operation, duration, meta = {}) => {
        const logData = {
            operation: operation,
            duration: `${duration}ms`,
            ...meta
        };
        
        if (duration > 1000) {
            logger.warn('Performance Warning', logData);
        } else {
            logger.debug('Performance', logData);
        }
    },
    
    // Security logging methods
    securityEvent: (event, details, meta = {}) => {
        const logData = {
            event: event,
            details: details,
            ...meta
        };
        
        logger.warn('Security Event', logData);
    },
    
    // Error logging with context
    errorWithContext: (error, context, meta = {}) => {
        const logData = {
            error: error.message,
            stack: error.stack,
            context: context,
            ...meta
        };
        
        logger.error('Error with Context', logData);
    }
};

// Middleware for request logging
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    enhancedLogger.apiRequest(req);
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - start;
        enhancedLogger.apiResponse(req, res, responseTime);
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

// Middleware for error logging
const errorLogger = (error, req, res, next) => {
    enhancedLogger.errorWithContext(error, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id
    });
    next(error);
};

module.exports = {
    ...enhancedLogger,
    requestLogger,
    errorLogger,
    // Export the base logger for backward compatibility
    logger
};
/**
 * Logger Utility
 * Centralized logging configuration for the application
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'fixwell-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs to console in development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            silent: process.env.NODE_ENV === 'production'
        })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'exceptions.log') 
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'rejections.log') 
        })
    ]
});

// Create specialized loggers for different components
const createComponentLogger = (component) => {
    return logger.child({ component });
};

// Export the logger and utility functions
export {
    logger,
    createComponentLogger
};

// Convenience methods
export const info = (message, meta = {}) => logger.info(message, meta);
export const warn = (message, meta = {}) => logger.warn(message, meta);
export const error = (message, meta = {}) => logger.error(message, meta);
export const debug = (message, meta = {}) => logger.debug(message, meta);

// Performance logging
export const logPerformance = (operation, duration, meta = {}) => {
    logger.info(`Performance: ${operation}`, {
        ...meta,
        duration: `${duration}ms`,
        type: 'performance'
    });
};

// Security logging
export const logSecurity = (event, meta = {}) => {
    logger.warn(`Security: ${event}`, {
        ...meta,
        type: 'security'
    });
};

// Audit logging
export const logAudit = (action, user, meta = {}) => {
    logger.info(`Audit: ${action}`, {
        ...meta,
        userId: user?.id,
        userEmail: user?.email,
        type: 'audit'
    });
};
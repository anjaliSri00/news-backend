/**
 * Winston logger for the entire application.
 *
 * Dev:  colourised, human-readable console output
 * Prod: JSON to console + rotating files
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('Server started');
 *   logger.error('DB failed', { error: err.message, userId: 'abc' });
 *   logger.warn('Cache miss', { key: 'events:list' });
 *   logger.debug('Query took 45ms');
 *
 * Morgan stream (HTTP access logs):
 *   app.use(morgan('combined', { stream: logger.stream }));
 */

const path = require('path');
const fs = require('fs');
const winston = require('winston');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_PROD = process.env.NODE_ENV === 'production';

/* ──────────────────────────────────────────────────────
 * Ensure log directory exists
 * ────────────────────────────────────────────────────── */
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/* ──────────────────────────────────────────────────────
 * Custom format: adds timestamp, handles Error objects,
 * avoids printing secrets if someone accidentally passes them
 * ────────────────────────────────────────────────────── */
const redactSensitive = winston.format((info) => {
  const SENSITIVE_KEYS = [
    'password',
    'password_hash',
    'token',
    'accessToken',
    'refreshToken',
    'access-token',
    'refresh-token',
    'secret',
    'authorization',
    'cookie',
  ];

  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        obj[key] = scrub(obj[key]);
      }
    }
    return obj;
  };

  // Only scrub metadata (info objects that came from logger.error(msg, meta))
  if (typeof info === 'object') scrub(info);
  return info;
});

/* ──────────────────────────────────────────────────────
 * Formatters
 * ────────────────────────────────────────────────────── */
const devFormat = winston.format.combine(
  redactSensitive(),
  winston.format.colorize({ all: false }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}${stackStr}`;
  })
);

const prodFormat = winston.format.combine(
  redactSensitive(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/* ──────────────────────────────────────────────────────
 * Transports
 * ────────────────────────────────────────────────────── */
const transports = [
  // Console — always on
  new winston.transports.Console({
    format: IS_PROD ? prodFormat : devFormat,
    handleExceptions: true,
  }),
];

// File transports only in production
if (IS_PROD) {
  transports.push(
    // All logs
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 14, // keep 14 days
      tailable: true,
      format: prodFormat,
    }),
    // Errors only
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
      tailable: true,
      format: prodFormat,
    })
  );
}

/* ──────────────────────────────────────────────────────
 * Logger instance
 * ────────────────────────────────────────────────────── */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'form-and-field-api' },
  transports,
  // Don't crash the process on uncaught errors — just log them
  exitOnError: false,
});

/* ──────────────────────────────────────────────────────
 * Morgan stream adapter (for HTTP access logs)
 * ────────────────────────────────────────────────────── */
logger.stream = {
  write: (message) => {
    // Morgan adds a trailing newline — trim it
    logger.info(message.trim());
  },
};

module.exports = logger;
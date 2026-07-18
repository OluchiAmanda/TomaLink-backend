const rateLimit = require('express-rate-limit');

/**
 * Tighter limit than the global limiter in app.js — applied only to
 * register/login/forgot-password to slow down brute-force and credential
 * stuffing attempts. Login attempt *locking* per-account is handled
 * separately in auth.service.js; this limits by IP.
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

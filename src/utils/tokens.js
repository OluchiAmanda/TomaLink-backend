const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// --- JWT access & refresh tokens ---

exports.signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

exports.signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

exports.verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);

exports.verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// --- One-time random tokens (email verification, password reset) ---
// The raw token is emailed to the user; only its SHA-256 hash is stored in the
// DB, so a leaked database dump alone can't be used to verify/reset accounts.

exports.generateRandomToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

exports.hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

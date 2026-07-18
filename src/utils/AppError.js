/**
 * Custom error class for operational/expected errors (bad input, not found,
 * unauthorized, etc.) — as opposed to unexpected bugs. Thrown from services
 * and controllers, caught by the centralized error handler in app.js.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

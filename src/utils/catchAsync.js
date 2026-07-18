/**
 * Wraps an async route handler so any rejected promise is passed to
 * Express's error handler via next(), instead of needing try/catch
 * in every controller function.
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

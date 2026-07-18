/**
 * Returns an Express middleware that validates req.body against the given
 * Joi schema. Unknown fields are stripped, all errors are collected (not just
 * the first), and the sanitized value replaces req.body on success.
 *
 * Usage: router.post('/register', validate(registerSchema), controller.register)
 */
module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.body = value;
  next();
};

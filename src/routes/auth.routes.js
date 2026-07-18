const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.get('/verify-email/:token', authController.verifyEmail);

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);
router.patch(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

// --- Google OAuth ---
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  authController.googleCallback
);

module.exports = router;

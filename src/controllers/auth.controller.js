const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

exports.register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user },
  });
});

exports.verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

exports.login = catchAsync(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: { user, accessToken },
  });
});

exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken, refreshToken } = await authService.refresh(token);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    data: { accessToken },
  });
});

exports.logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  await authService.logout(token);
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If that email is registered, a password reset link has been sent.',
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please log in again.',
  });
});

exports.changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
  });
});

// Called after passport's Google strategy has already attached req.user
exports.googleCallback = catchAsync(async (req, res) => {
  const { accessToken, refreshToken } = await authService.issueTokens(req.user);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  // Frontend picks the access token up from the redirect URL and stores it.
  res.redirect(`${process.env.FRONTEND_URL}/oauth-success?accessToken=${accessToken}`);
});

const User = require('../entities/User');
const RefreshToken = require('../entities/RefreshToken');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/sendEmail');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} = require('../utils/tokens');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days


const issueTokens = async (user, meta = {}) => {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  return { accessToken, refreshToken };
};
exports.issueTokens = issueTokens;

// --- Register ---
exports.register = async ({ name, email, phone, password, role }) => {
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    throw new AppError('A user with this email or phone already exists.', 409);
  }

  const { rawToken, hashedToken } = generateRandomToken();

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: password, // hashed automatically by the User model's pre-save hook
    role: role || 'farmer',
    emailVerificationToken: hashedToken,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  const verifyUrl = `${process.env.APP_URL}/api/v1/auth/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your TomaLink account',
    html: `<p>Hi ${user.name},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email address. This link expires in 24 hours.</p>`,
  });

  return user;
};

// --- Verify email ---
exports.verifyEmail = async (rawToken) => {
  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new AppError('Invalid or expired verification link.', 400);
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

// --- Login ---
exports.login = async ({ email, password }, meta = {}) => {
  const user = await User.findOne({ email }).select(
    '+passwordHash +failedLoginAttempts +lockUntil'
  );

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.isLocked) {
    throw new AppError(
      'Account temporarily locked due to too many failed login attempts. Please try again later.',
      423
    );
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      user.failedLoginAttempts = 0;
    }

    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been suspended. Contact support.', 403);
  }

  // Successful login — reset attempt counter
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  const tokens = await issueTokens(user, meta);
  return { user, ...tokens };
};

// --- Refresh access token (with rotation) ---
exports.refresh = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new AppError('No refresh token provided.', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, user: decoded.id });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError('Refresh token is no longer valid. Please log in again.', 401);
  }

  // Rotation: revoke the used token so it can never be replayed, then issue a new pair.
  stored.revoked = true;
  await stored.save();

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError('User no longer exists or is inactive.', 401);
  }

  return issueTokens(user);
};

// --- Logout ---
exports.logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
};

// --- Forgot password ---
exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Deliberately don't throw if no user is found — revealing whether an
  // email is registered is itself a minor information leak.
  if (!user) return;

  const { rawToken, hashedToken } = generateRandomToken();
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your TomaLink password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  });
};

// --- Reset password (via emailed token) ---
exports.resetPassword = async (rawToken, newPassword) => {
  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Invalid or expired reset link.', 400);
  }

  user.passwordHash = newPassword; // re-hashed by the pre-save hook
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Invalidate every existing session — a password reset should log out
  // any device that might have been compromised.
  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true });

  return user;
};

// --- Change password (while logged in) ---
exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.passwordHash = newPassword;
  await user.save();

  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true });

  return user;
};

const { verifyAccessToken } = require('../utils/tokens');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../entities/User');

/**
 * Verifies the JWT access token on the Authorization header and attaches
 * the corresponding user document to req.user. Use on any protected route.
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }
  if (!currentUser.isActive) {
    return next(new AppError('Your account has been suspended.', 403));
  }

  req.user = currentUser;
  next();
});

/**
 * Restricts a route to specific roles. Must be used after `protect`.
 * Usage: router.get('/admin/stuff', protect, restrictTo('admin'), controller)
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };

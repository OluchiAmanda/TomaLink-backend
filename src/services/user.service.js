const User = require('../entities/User');
const OwnerProfile = require('../entities/OwnerProfile');
const AppError = require('../utils/AppError');
const uploadBufferToCloudinary = require('../utils/uploadToCloudinary');

exports.getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

exports.updateMe = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

exports.uploadAvatar = async (userId, file) => {
  if (!file) throw new AppError('No image file provided.', 400);

  const result = await uploadBufferToCloudinary(file.buffer, 'tomalink/avatars');

  const user = await User.findByIdAndUpdate(userId, { avatarUrl: result.secure_url }, { new: true });
  return user;
};

exports.createOwnerProfile = async (userId, { businessName, serviceType }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  if (user.role !== 'owner') {
    throw new AppError(
      'Only accounts with the owner role can create an owner profile.',
      403
    );
  }

  const existing = await OwnerProfile.findOne({ user: userId });
  if (existing) throw new AppError('An owner profile already exists for this account.', 409);

  return OwnerProfile.create({ user: userId, businessName, serviceType });
};

exports.getMyOwnerProfile = async (userId) => {
  const ownerProfile = await OwnerProfile.findOne({ user: userId });
  if (!ownerProfile) {
    throw new AppError('No owner profile found for this account. Create one first.', 404);
  }
  return ownerProfile;
};

const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');

exports.getMe = catchAsync(async (req, res) => {
  const user = await userService.getMe(req.user._id);
  res.status(200).json({ success: true, data: { user } });
});

exports.updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateMe(req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Profile updated.', data: { user } });
});

exports.uploadAvatar = catchAsync(async (req, res) => {
  const user = await userService.uploadAvatar(req.user._id, req.file);
  res.status(200).json({ success: true, message: 'Avatar updated.', data: { user } });
});

exports.createfarmerProfile = catchAsync(async (req, res) => {
  const farmerProfile = await userService.createfarmerProfile(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: 'Farmer profile created. An admin must verify it before your listings can go live.',
    data: { farmerProfile },
  });
});

exports.getMyfarmerProfile = catchAsync(async (req, res) => {
  const farmerProfile = await userService.getMyfarmerProfile(req.user._id);
  res.status(200).json({ success: true, data: { farmerProfile } });
});

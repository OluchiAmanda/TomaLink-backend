const catchAsync = require('../utils/catchAsync');
const listingService = require('../services/listing.service');

exports.createListing = catchAsync(async (req, res) => {
  const listing = await listingService.createListing(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Listing created.', data: { listing } });
});

exports.updateListing = catchAsync(async (req, res) => {
  const listing = await listingService.updateListing(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Listing updated.', data: { listing } });
});

exports.deleteListing = catchAsync(async (req, res) => {
  await listingService.deleteListing(req.user._id, req.params.id);
  res.status(200).json({ success: true, message: 'Listing deleted.' });
});

exports.pauseListing = catchAsync(async (req, res) => {
  const listing = await listingService.setPauseState(req.user._id, req.params.id, true);
  res.status(200).json({ success: true, message: 'Listing paused.', data: { listing } });
});

exports.resumeListing = catchAsync(async (req, res) => {
  const listing = await listingService.setPauseState(req.user._id, req.params.id, false);
  res.status(200).json({ success: true, message: 'Listing resumed.', data: { listing } });
});

exports.addImages = catchAsync(async (req, res) => {
  const images = await listingService.addImages(req.user._id, req.params.id, req.files);
  res.status(201).json({ success: true, message: 'Images uploaded.', data: { images } });
});

exports.getMyListings = catchAsync(async (req, res) => {
  const { listings, pagination } = await listingService.getMyListings(req.user._id, req.query);
  res.status(200).json({ success: true, pagination, data: { listings } });
});

exports.getPublicListings = catchAsync(async (req, res) => {
  const { listings, pagination } = await listingService.getPublicListings(req.query);
  res.status(200).json({ success: true, pagination, data: { listings } });
});

exports.getListingById = catchAsync(async (req, res) => {
  const { listing, images } = await listingService.getListingById(req.params.id);
  res.status(200).json({ success: true, data: { listing, images } });
});

exports.getNearbyListings = catchAsync(async (req, res) => {
  const { lat, lng, maxDistanceKm } = req.query;
  const listings = await listingService.getNearbyListings({ lat, lng, maxDistanceKm });
  res.status(200).json({ success: true, data: { listings } });
});

exports.toggleFavorite = catchAsync(async (req, res) => {
  const result = await listingService.toggleFavorite(req.user._id, req.params.id);
  res.status(200).json({ success: true, data: result });
});

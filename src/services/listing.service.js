const Listing = require('../entities/Listing');
const ListingImage = require('../entities/ListingImage');
const OwnerProfile = require('../entities/OwnerProfile');
const Favorite = require('../entities/Favorite');
const AppError = require('../utils/AppError');
const ApiFeatures = require('../utils/apiFeatures');
const uploadBufferToCloudinary = require('../utils/uploadToCloudinary');

const OWNER_POPULATE = { path: 'owner', select: 'businessName serviceType isVerifiedOwner' };

const getOwnerProfileOrThrow = async (userId) => {
  const ownerProfile = await OwnerProfile.findOne({ user: userId });
  if (!ownerProfile) {
    throw new AppError(
      'You need an owner profile before you can manage listings. Create one first.',
      403
    );
  }
  return ownerProfile;
};

// --- Owner management ---

exports.createListing = async (userId, data) => {
  const ownerProfile = await getOwnerProfileOrThrow(userId);

  const listing = await Listing.create({
    owner: ownerProfile._id,
    type: data.type,
    brandName: data.brandName,
    description: data.description,
    address: data.address,
    location:
      data.lat != null && data.lng != null
        ? { type: 'Point', coordinates: [data.lng, data.lat] }
        : undefined,
    dailyPrice: data.dailyPrice,
    capacity: data.capacity,
    vehicleType: data.vehicleType,
    avgSpeedKmph: data.avgSpeedKmph,
    // Business rule: a listing can't go live until its owner is admin-verified,
    // regardless of what the owner requests here.
    isAvailable: ownerProfile.isVerifiedOwner,
  });

  return listing;
};

exports.updateListing = async (userId, listingId, updates) => {
  const ownerProfile = await getOwnerProfileOrThrow(userId);

  const listing = await Listing.findOne({
    _id: listingId,
    owner: ownerProfile._id,
    isDeleted: false,
  });
  if (!listing) throw new AppError('Listing not found.', 404);

  if (updates.lat != null && updates.lng != null) {
    listing.location = { type: 'Point', coordinates: [updates.lng, updates.lat] };
  }
  delete updates.lat;
  delete updates.lng;

  Object.assign(listing, updates);
  await listing.save();

  return listing;
};

exports.deleteListing = async (userId, listingId) => {
  const ownerProfile = await getOwnerProfileOrThrow(userId);

  const listing = await Listing.findOneAndUpdate(
    { _id: listingId, owner: ownerProfile._id, isDeleted: false },
    { isDeleted: true, isAvailable: false },
    { new: true }
  );
  if (!listing) throw new AppError('Listing not found.', 404);

  return listing;
};

exports.setPauseState = async (userId, listingId, isPaused) => {
  const ownerProfile = await getOwnerProfileOrThrow(userId);

  const listing = await Listing.findOneAndUpdate(
    { _id: listingId, owner: ownerProfile._id, isDeleted: false },
    { isPaused },
    { new: true }
  );
  if (!listing) throw new AppError('Listing not found.', 404);

  return listing;
};

exports.addImages = async (userId, listingId, files) => {
  const ownerProfile = await getOwnerProfileOrThrow(userId);

  const listing = await Listing.findOne({
    _id: listingId,
    owner: ownerProfile._id,
    isDeleted: false,
  });
  if (!listing) throw new AppError('Listing not found.', 404);

  if (!files || files.length === 0) throw new AppError('No image files provided.', 400);

  const existingCount = await ListingImage.countDocuments({ listing: listingId });

  const uploads = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, `tomalink/listings/${listingId}`))
  );

  return ListingImage.insertMany(
    uploads.map((result, index) => ({
      listing: listingId,
      url: result.secure_url,
      publicId: result.public_id,
      sortOrder: existingCount + index,
    }))
  );
};

exports.getMyListings = async (userId, queryString) => {
  const ownerProfile = await getOwnerProfileOrThrow(userId);

  const features = new ApiFeatures(
    Listing.find({ owner: ownerProfile._id, isDeleted: false }),
    queryString
  )
    .filter()
    .sort()
    .paginate();

  const listings = await features.query;
  return { listings, pagination: features.pagination };
};

// --- Public / customer-facing ---

exports.getPublicListings = async (queryString) => {
  const baseQuery = Listing.find({ isDeleted: false, isAvailable: true, isPaused: false });

  const features = new ApiFeatures(baseQuery, queryString)
    .search(['brandName', 'description', 'address'])
    .filter()
    .sort()
    .paginate();

  const listings = await features.query.populate(OWNER_POPULATE);
  return { listings, pagination: features.pagination };
};

exports.getListingById = async (listingId) => {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false }).populate(
    OWNER_POPULATE
  );
  if (!listing) throw new AppError('Listing not found.', 404);

  const images = await ListingImage.find({ listing: listingId }).sort('sortOrder');

  return { listing, images };
};

exports.getNearbyListings = async ({ lat, lng, maxDistanceKm = 20 }) => {
  if (lat == null || lng == null) {
    throw new AppError('lat and lng query parameters are required.', 400);
  }

  return Listing.find({
    isDeleted: false,
    isAvailable: true,
    isPaused: false,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(maxDistanceKm) * 1000,
      },
    },
  }).populate(OWNER_POPULATE);
};

// --- Favorites ---

exports.toggleFavorite = async (userId, listingId) => {
  const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
  if (!listing) throw new AppError('Listing not found.', 404);

  const existing = await Favorite.findOne({ user: userId, listing: listingId });

  if (existing) {
    await existing.deleteOne();
    return { favorited: false };
  }

  await Favorite.create({ user: userId, listing: listingId });
  return { favorited: true };
};

const mongoose = require('mongoose');

const listingImageSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String, // Cloudinary public_id — needed to delete the asset later
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

listingImageSchema.index({ listing: 1 });

module.exports = mongoose.model('ListingImage', listingImageSchema);

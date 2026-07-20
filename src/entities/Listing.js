const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'farmerProfile',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    // GeoJSON Point — enables $near queries for "nearby" search.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
    },
    dailyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      min: 0,
    },
    vehicleType: {
      type: String,
      trim: true,
    },
    // Only meaningful for type: logistics/transport — used to estimate
    // delivery time in the recommendation engine (distance / avgSpeedKmph).
    // Falls back to a platform default if the owner hasn't set one.
    avgSpeedKmph: {
      type: Number,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: false, // stays false until the owner is admin-verified
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false, // soft delete
    },
  },
  { timestamps: true }
);

listingSchema.index({ type: 1, isAvailable: 1, isPaused: 1, isDeleted: 1 });
listingSchema.index({ location: '2dsphere' });
listingSchema.index({ brandName: 'text', description: 'text', address: 'text' });

module.exports = mongoose.model('Listing', listingSchema);

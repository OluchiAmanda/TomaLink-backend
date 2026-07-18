const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OwnerProfile',
      required: true,
    },
    type: {
      type: String,
      enum: ['warehouse', 'cold_storage', 'logistics', 'transport'],
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

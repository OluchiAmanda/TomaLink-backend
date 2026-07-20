const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    isVerifiedOwner: {
      type: Boolean,
      default: false, // an admin must verify before listings can go live
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('farmerProfile', farmerProfileSchema);

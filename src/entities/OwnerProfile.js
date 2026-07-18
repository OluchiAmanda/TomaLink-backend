const mongoose = require('mongoose');

const ownerProfileSchema = new mongoose.Schema(
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
      enum: ['warehouse', 'cold_storage', 'logistics', 'transport'],
      required: true,
    },
    isVerifiedOwner: {
      type: Boolean,
      default: false, // an admin must verify before listings can go live
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OwnerProfile', ownerProfileSchema);

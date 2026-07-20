const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      // Not required — a user who signs up via Google OAuth has no password
      select: false, // never returned in queries unless explicitly requested
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many documents with no googleId, only one per value when set
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['farmer', 'buyer'],
      default: 'farmer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // --- Email verification ---
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // --- Password reset ---
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // --- Login attempt limiting ---
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

// Index for role-based queries (e.g. admin listing all owners)
userSchema.index({ role: 1 });

/**
 * Hash the password before saving, only if it was modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

/**
 * Compare a plaintext password against the stored hash.
 * Usage: const isMatch = await user.comparePassword(candidatePassword);
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false; // Google-only account, no password set
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Virtual: is the account currently locked due to failed login attempts?
 */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Ensure passwordHash and internal tokens never leak into API responses,
// even on documents fetched without .select('-passwordHash') explicitly.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please add a valid phone number']
  },
  avatar: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    zipCode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  addresses: [{
    label: {
      type: String,
      required: true,
      enum: ['home', 'work', 'other']
    },
    line1: {
      type: String,
      required: true
    },
    line2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [lng, lat]
    }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  socialLogin: {
    google: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create 2dsphere index for geo queries
UserSchema.index({ 'addresses.geo': '2dsphere' });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for default address
UserSchema.virtual('defaultAddress').get(function() {
  // Check if addresses exists and is an array before trying to use find
  if (!this.addresses || !Array.isArray(this.addresses) || this.addresses.length === 0) {
    return null;
  }
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Ensure only one active admin exists in the system
UserSchema.pre('save', async function(next) {
  // Only check when creating a new admin or updating role to admin
  if (this.isNew && this.role === 'admin' || this.isModified('role') && this.role === 'admin') {
    const existingAdmin = await this.constructor.findOne({ role: 'admin', isActive: true });
    if (existingAdmin && existingAdmin._id.toString() !== this._id.toString()) {
      return next(new Error('Only one active admin is allowed in the system. Admin already exists.'));
    }
  }
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Static method to check if admin exists
UserSchema.statics.adminExists = async function() {
  const admin = await this.findOne({ role: 'admin', isActive: true });
  return !!admin;
};

// Static method to get current admin
UserSchema.statics.getAdmin = async function() {
  return await this.findOne({ role: 'admin' });
};

// Cascade delete related data when user is deleted
UserSchema.pre('remove', async function(next) {
  // This will be implemented when other models are created
  // await this.model('Vendor').deleteMany({ ownerUserId: this._id });
  // await this.model('Order').deleteMany({ userId: this._id });
  // await this.model('Review').deleteMany({ userId: this._id });
  next();
});

module.exports = mongoose.model('User', UserSchema);

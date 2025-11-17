const mongoose = require('mongoose');

/**
 * Vendor Schema - Simplified version without geo-location
 * This schema defines the structure for vendor profiles in the ExpressKart application
 */
const VendorSchema = new mongoose.Schema({
  // Link to user account that owns this vendor profile
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Basic vendor information
  businessName: {
    type: String,
    required: [true, 'Please add a business name'],
    trim: true,
    maxlength: [100, 'Business name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Please add a business type'],
    enum: [
      'grocery', 'bakery', 'dairy', 'meat', 'fish', 'produce',
      'beverages', 'snacks', 'household', 'personal-care', 'pharmacy',
      'electronics', 'clothing', 'footwear', 'jewelry', 'home-decor',
      'books', 'sports', 'automotive', 'pet-supplies', 'baby-products',
      'garden', 'hardware', 'textiles', 'art-crafts', 'music',
      'gifts', 'organic', 'frozen-foods', 'imported-goods', 'other'
    ]
  },
  
  // Physical address (no geo-coordinates)
  businessAddress: {
    street: {
      type: String,
      required: [true, 'Please add street address']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    zipCode: {
      type: String,
      required: [true, 'Please add zip code']
    },
    country: {
      type: String,
      required: [true, 'Please add country'],
      default: 'India'
    }
  },
  
  // Removed standalone deliveryRadiusKm as it's now part of deliverySettings
  
  // Contact information
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Please add phone number']
    },
    email: {
      type: String,
      required: [true, 'Please add email']
    },
    website: String
  },
  
  // Business hours
  businessHours: [{
    day: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please add valid time format (HH:MM)']
    },
    close: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please add valid time format (HH:MM)']
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  }],
  
  // Images for the vendor profile
  images: {
    logo: String,
    banner: String,
    gallery: [String]
  },
  
  // Rating information
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Vendor status (for admin approval workflow)
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked', 'suspended'],
    default: 'pending'
  },
  
  // Verification status (for admin approval workflow)
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String
  },
  
  // Store features
  features: {
    hasDelivery: {
      type: Boolean,
      default: true
    },
    hasPickup: {
      type: Boolean,
      default: true
    },
    acceptsCash: {
      type: Boolean,
      default: true
    },
    acceptsCard: {
      type: Boolean,
      default: false
    },
    acceptsUPI: {
      type: Boolean,
      default: true
    },
    acceptsWallet: {
      type: Boolean,
      default: false
    }
  },
  
  // Delivery settings
  deliverySettings: {
    radius: {
      type: Number,
      default: 10,
      min: [1, 'Delivery radius must be at least 1km'],
      max: [50, 'Delivery radius cannot exceed 50km']
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    estimatedDeliveryTime: {
      type: Number,
      default: 30, // minutes
      min: [15, 'Estimated delivery time must be at least 15 minutes']
    }
  },
  
  // Social media links
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  
  // Additional metadata
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  commissionRate: {
    type: Number,
    default: 5, // percentage
    min: [0, 'Commission rate cannot be negative'],
    max: [20, 'Commission rate cannot exceed 20%']
  },
  // Products associated with this vendor
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient queries
VendorSchema.index({ businessType: 1, status: 1 });
VendorSchema.index({ rating: -1 });
VendorSchema.index({ isFeatured: 1 });
VendorSchema.index({ 'businessAddress.city': 1, 'businessAddress.state': 1 });

// Ensure we're only indexing ownerUserId with a unique constraint
// The unique constraint ensures one vendor per user, but sparse:true allows documents without ownerUserId
// We'll create this index programmatically to ensure it's done correctly

// Add index for products to efficiently retrieve vendor products
VendorSchema.index({ products: 1 });

// Explicitly define the schema without a user field to prevent MongoDB from creating an index on it
VendorSchema.set('strict', true); // This ensures fields not in the schema won't be saved

// Virtual for full address
VendorSchema.virtual('fullAddress').get(function() {
  try {
    if (!this.businessAddress) {
      return '';
    }
    const addr = this.businessAddress;
    return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}, ${addr.country || ''}`;
  } catch (error) {
    console.error('Error in fullAddress virtual:', error);
    return '';
  }
});

// Virtual for isOpen now
VendorSchema.virtual('isOpenNow').get(function() {
  try {
    // Check if businessHours exists and is an array
    if (!this.businessHours || !Array.isArray(this.businessHours)) {
      return false;
    }
    
    const now = new Date();
    // Fix: 'lowercase' is not a valid option for weekday, using 'long' and converting to lowercase
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const todayHours = this.businessHours.find(h => h.day === day);
    if (!todayHours || !todayHours.isOpen) return false;
    
    return time >= todayHours.open && time <= todayHours.close;
  } catch (error) {
    console.error('Error in isOpenNow virtual:', error);
    return false;
  }
});

// Virtual for delivery fee calculation
VendorSchema.virtual('calculatedDeliveryFee').get(function() {
  try {
    if (!this.deliverySettings) {
      return 0;
    }
    return this.deliverySettings.deliveryFee || 0;
  } catch (error) {
    console.error('Error in calculatedDeliveryFee virtual:', error);
    return 0;
  }
});

// Method to check if vendor can deliver to a location
// Simplified to always return true since we're not using geo-location
VendorSchema.methods.canDeliverTo = function() {
  return true;
};

// Method to update vendor rating
VendorSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Pre-save hook to ensure vendor document is properly initialized
VendorSchema.pre('save', function(next) {
  // Ensure we have a products array
  if (!this.products) {
    this.products = [];
    console.log('Initialized empty products array for vendor');
  }
  
  next();
});

// No static methods needed

module.exports = mongoose.model('Vendor', VendorSchema);

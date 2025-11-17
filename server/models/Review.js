const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please add a review comment'],
    trim: true,
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  images: [{
    url: String,
    caption: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reported: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reasons: [String]
  },
  moderation: {
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationReason: String,
    moderationNotes: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one review per user per product
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Index for efficient querying
ReviewSchema.index({ productId: 1, status: 1, rating: 1 });
ReviewSchema.index({ vendorId: 1, status: 1, rating: 1 });
ReviewSchema.index({ userId: 1, status: 1 });

// Virtual for rating stars
ReviewSchema.virtual('ratingStars').get(function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Virtual for status color
ReviewSchema.virtual('statusColor').get(function() {
  const statusColors = {
    pending: 'text-yellow-600',
    approved: 'text-green-600',
    rejected: 'text-red-600'
  };
  return statusColors[this.status] || 'text-gray-600';
});

// Virtual for helpful text
ReviewSchema.virtual('helpfulText').get(function() {
  if (this.helpful.count === 0) return 'Helpful?';
  if (this.helpful.count === 1) return '1 person found this helpful';
  return `${this.helpful.count} people found this helpful`;
});

// Static method to get average rating for a product
ReviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    {
      $match: {
        productId: mongoose.Types.ObjectId(productId),
        status: 'approved',
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const ratingDistribution = result[0].ratingDistribution.reduce((acc, rating) => {
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    ratingDistribution
  };
};

// Static method to get average rating for a vendor
ReviewSchema.statics.getVendorAverageRating = async function(vendorId) {
  const result = await this.aggregate([
    {
      $match: {
        vendorId: mongoose.Types.ObjectId(vendorId),
        status: 'approved',
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0
    };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews
  };
};

// Static method to get review statistics
ReviewSchema.statics.getReviewStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

// Method to mark review as helpful
ReviewSchema.methods.markHelpful = async function(userId) {
  if (this.helpful.users.includes(userId)) {
    // Remove from helpful
    this.helpful.users = this.helpful.users.filter(id => id.toString() !== userId.toString());
    this.helpful.count = Math.max(0, this.helpful.count - 1);
  } else {
    // Add to helpful
    this.helpful.users.push(userId);
    this.helpful.count += 1;
  }
  
  await this.save();
  return this.helpful.count;
};

// Method to report review
ReviewSchema.methods.reportReview = async function(userId, reason) {
  if (!this.reported.users.includes(userId)) {
    this.reported.users.push(userId);
    this.reported.count += 1;
    if (reason) {
      this.reported.reasons.push(reason);
    }
    await this.save();
  }
  
  return this.reported.count;
};

// Pre-save middleware to update product and vendor ratings
ReviewSchema.post('save', async function() {
  if (this.status === 'approved' && this.isActive) {
    // Update product average rating
    const Product = mongoose.model('Product');
    const productRating = await this.constructor.getAverageRating(this.productId);
    
    await Product.findByIdAndUpdate(this.productId, {
      'rating.average': productRating.averageRating,
      'rating.count': productRating.totalReviews,
      'rating.distribution': productRating.ratingDistribution
    });

    // Update vendor average rating
    const Vendor = mongoose.model('Vendor');
    const vendorRating = await this.constructor.getVendorAverageRating(this.vendorId);
    
    await Vendor.findByIdAndUpdate(this.vendorId, {
      'rating.average': vendorRating.averageRating,
      'rating.count': vendorRating.totalReviews
    });
  }
});

// Pre-remove middleware to update product and vendor ratings
ReviewSchema.pre('remove', async function() {
  if (this.status === 'approved' && this.isActive) {
    // Update product average rating
    const Product = mongoose.model('Product');
    const productRating = await this.constructor.getAverageRating(this.productId);
    
    await Product.findByIdAndUpdate(this.productId, {
      'rating.average': productRating.averageRating,
      'rating.count': productRating.totalReviews,
      'rating.distribution': productRating.ratingDistribution
    });

    // Update vendor average rating
    const Vendor = mongoose.model('Vendor');
    const vendorRating = await this.constructor.getVendorAverageRating(this.vendorId);
    
    await Vendor.findByIdAndUpdate(this.vendorId, {
      'rating.average': vendorRating.averageRating,
      'rating.count': vendorRating.totalReviews
    });
  }
});

module.exports = mongoose.model('Review', ReviewSchema);

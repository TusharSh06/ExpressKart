const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a product title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Please add a vendor']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
    'grocery',
    'bakery',
    'dairy',
    'meat',
    'fish',
    'produce',
    'beverages',
    'snacks',
    'household',
    'personal-care',
    'pharmacy',
    'electronics',
    'clothing',
    'footwear',
    'jewelry',
    'home-decor',
    'books',
    'sports',
    'automotive',
    'pet-supplies',
    'baby-products',
    'garden',
    'hardware',
    'textiles',
    'art-crafts',
    'music',
    'gifts',
    'organic',
    'frozen-foods',
    'imported-goods',
    'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  price: {
    mrp: {
      type: Number,
      required: [true, 'Please add MRP'],
      min: [0, 'MRP cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add selling price'],
      min: [0, 'Selling price cannot be negative']
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  },
  inventory: {
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    minStock: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock cannot be negative']
    },
    maxStock: {
      type: Number,
      min: [0, 'Maximum stock cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Please add unit'],
      enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'dozen', 'pack', 'bundle', 'meter', 'yard']
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'ml', 'l']
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch', 'mm']
      }
    }
  },
  variants: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      min: 0
    },
    stock: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  attributes: [{
    name: String,
    value: String
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
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
  sales: {
    totalSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    isFreeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    }
  },
  warranty: {
    hasWarranty: {
      type: Boolean,
      default: false
    },
    duration: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    },
    description: String
  },
  returnPolicy: {
    isReturnable: {
      type: Boolean,
      default: true
    },
    returnWindow: {
      type: Number,
      default: 7
    },
    returnWindowUnit: {
      type: String,
      enum: ['days', 'weeks'],
      default: 'days'
    },
    conditions: [String]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  // Nutritional Information (Optional)
  nutrition: {
    flavour: String,
    sugarProfile: String,
    proteinPer100g: {
      value: Number,
      unit: { type: String, default: 'g' }
    },
    energyPer100g: {
      value: Number,
      unit: { type: String, default: 'kcal' }
    },
    fatPer100g: {
      value: Number,
      unit: { type: String, default: 'g' }
    },
    sodiumPer100g: {
      value: Number,
      unit: { type: String, default: 'mg' }
    },
    carbohydratesPer100g: {
      value: Number,
      unit: { type: String, default: 'g' }
    },
    addedSugarsPer100g: {
      value: Number,
      unit: { type: String, default: 'g' }
    },
    totalSugarPer100g: {
      value: Number,
      unit: { type: String, default: 'g' }
    }
  },
  // Key Features (Optional)
  keyFeatures: [String],
  // Ingredients (Optional)
  ingredients: String,
  // Unit/Size (Optional)
  unitSize: String,
  // Product Images (Cloudinary)
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
ProductSchema.index({ vendorId: 1, isActive: 1 });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ 'price.sellingPrice': 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ 'sales.totalSold': -1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ isNewArrival: 1 });
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for discount amount
ProductSchema.virtual('discountAmount').get(function() {
  return this.price.mrp - this.price.sellingPrice;
});

// Virtual for is in stock
ProductSchema.virtual('isInStock').get(function() {
  return this.inventory.stock > 0;
});

// Virtual for is low stock
ProductSchema.virtual('isLowStock').get(function() {
  return this.inventory.stock <= this.inventory.minStock && this.inventory.stock > 0;
});

// Virtual for is out of stock
ProductSchema.virtual('isOutOfStock').get(function() {
  return this.inventory.stock === 0;
});

// Virtual for formatted price
ProductSchema.virtual('formattedPrice').get(function() {
  return {
    mrp: `₹${this.price.mrp.toFixed(2)}`,
    sellingPrice: `₹${this.price.sellingPrice.toFixed(2)}`,
    discountPercentage: `${this.price.discountPercentage}%`,
    discountAmount: `₹${this.discountAmount.toFixed(2)}`
  };
});

// Method to update stock
ProductSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    if (this.inventory.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.inventory.stock -= quantity;
  } else if (operation === 'increase') {
    this.inventory.stock += quantity;
  }
  
  return this.save();
};

// Method to update rating
ProductSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to update sales
ProductSchema.methods.updateSales = function(quantity, price) {
  this.sales.totalSold += quantity;
  this.sales.revenue += quantity * price;
  return this.save();
};

// Pre-save middleware to calculate discount percentage
ProductSchema.pre('save', function(next) {
  if (this.price.mrp && this.price.sellingPrice) {
    this.price.discountPercentage = Math.round(
      ((this.price.mrp - this.price.sellingPrice) / this.price.mrp) * 100
    );
  }
  next();
});

// Pre-save middleware to generate slug
ProductSchema.pre('save', function(next) {
  if (this.title && !this.seo.slug) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);

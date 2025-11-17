const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize, isAdmin, isVendor, isOwnerOrAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const Vendor = require('../models/Vendor');

// Import vendor controller
const {
  getVendors,
  getVendor,
  createVendorProfile,
  getVendorProfile,
  updateVendorProfile,
  deleteVendorProfile,
  getVendorsInRadius,
  vendorPhotoUpload
} = require('../controllers/vendorController');

const router = express.Router();

/**
 * Helper function to normalize vendor data from request body
 * @param {Object} body - Request body
 * @param {Object} user - Authenticated user object
 * @returns {Object} - Normalized vendor data
 */
const normalizeVendorData = (body, user) => {
  // With aligned field names between frontend and backend,
  // we can just pass through the data with minimal processing
  const data = { ...body };
  
  // Ensure businessType is valid
  data.businessType = normalizeBusinessType(data.businessType || 'other');
  
  // Ensure businessAddress has all required fields
  if (!data.businessAddress) {
    data.businessAddress = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    };
  }
  
  // Ensure contactInfo has all required fields
  if (!data.contactInfo) {
    data.contactInfo = {
      phone: '',
      email: user?.email || '',
      website: ''
    };
  } else if (!data.contactInfo.email) {
    data.contactInfo.email = user?.email || '';
  }
  
  // Ensure deliverySettings has all required fields
  if (!data.deliverySettings) {
    data.deliverySettings = {
      radius: 10,
      minOrderAmount: 0,
      deliveryFee: 0,
      estimatedDeliveryTime: 30
    };
  }
  
  return data;
};

/**
 * Helper function to get default business hours
 * @returns {Array} - Default business hours
 */
const getDefaultBusinessHours = () => [
  { day: 'monday', open: '09:00', close: '21:00', isOpen: true },
  { day: 'tuesday', open: '09:00', close: '21:00', isOpen: true },
  { day: 'wednesday', open: '09:00', close: '21:00', isOpen: true },
  { day: 'thursday', open: '09:00', close: '21:00', isOpen: true },
  { day: 'friday', open: '09:00', close: '21:00', isOpen: true },
  { day: 'saturday', open: '10:00', close: '20:00', isOpen: true },
  { day: 'sunday', open: '10:00', close: '18:00', isOpen: true }
];

/**
 * Helper function to get default features
 * @returns {Object} - Default features
 */
const getDefaultFeatures = () => ({
  hasDelivery: true,
  hasPickup: true,
  acceptsCash: true,
  acceptsCard: false,
  acceptsUPI: true,
  acceptsWallet: false
});

/**
 * Helper function to get default delivery settings
 * @returns {Object} - Default delivery settings
 */
const getDefaultDeliverySettings = () => ({
  minOrderAmount: 0,
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  estimatedDeliveryTime: 30
});


// Vendor profile routes
router.route('/profile')
  .post(protect, createVendorProfile)  // Create vendor profile
  .get(protect, getVendorProfile)      // Get vendor's own profile
  .put(protect, updateVendorProfile)   // Update vendor profile
  .delete(protect, deleteVendorProfile); // Delete vendor profile

// @desc    Get vendor dashboard data
// @route   GET /api/vendors/dashboard
// @access  Private (vendor only)
router.get('/dashboard', protect, authorize('vendor'), asyncHandler(async (req, res, next) => {
  try {
    // Find the vendor profile for the current user
    const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Get vendor's products
    console.log('Looking for products with vendorId:', vendor._id);
    const Product = require('../models/Product'); // Import directly to avoid issues
    
    // Use the products array from the vendor document if it exists
    let productIds = [];
    if (vendor.products && vendor.products.length > 0) {
      productIds = vendor.products;
      console.log(`Using ${productIds.length} product IDs from vendor.products array`);
    }
    
    // Find all products for this vendor
    const products = await Product.find({ vendorId: vendor._id });
    console.log('Found products by vendorId:', products.length);
    
    // If vendor.products doesn't match the actual products, update it
    if (products.length !== productIds.length) {
      console.log('Updating vendor.products array to match actual products');
      vendor.products = products.map(p => p._id);
      await vendor.save();
      console.log('Updated vendor.products array with', vendor.products.length, 'product IDs');
    }
    
    console.log('Product IDs:', products.map(p => p._id));
    console.log('First product details:', products.length > 0 ? JSON.stringify(products[0], null, 2) : 'No products');

    // Get vendor's orders (if you have an Order model)
    // const orders = await require('mongoose').model('Order').find({ vendorId: vendor._id });
    const orders = []; // Placeholder if Order model doesn't exist yet

    // Calculate analytics
    const analytics = {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageRating: vendor.rating?.average || 0,
      pendingOrders: orders.filter(order => order.status === 'pending').length || 0
    };

    // Structure the response in multiple formats for different frontend expectations
    const response = {
      success: true,
      // Format 1: Nested under data
      data: {
        vendor,
        analytics,
        recentProducts: products.slice(0, 5),
        recentOrders: orders.slice(0, 5)
      },
      // Format 2: Direct properties for easier access
      vendor,
      products: products.slice(0, 5),
      orders: orders.slice(0, 5),
      analytics,
      // Format 3: Include counts
      count: products.length,
      totalProducts: products.length,
      totalOrders: orders.length
    };
    
    console.log('Sending dashboard response with products:', products.length);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
}));

// @desc    Get all vendors (public)
// @route   GET /api/vendors
// @access  Public
router.get('/', getVendors);

// Normalizes payload coming from various frontend forms to match Vendor model
const normalizeBusinessType = (input) => {
  if (!input) return 'other';
  const slug = String(input).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const allowed = new Set([
    'grocery', 'bakery', 'dairy', 'meat', 'fish', 'produce',
    'beverages', 'snacks', 'household', 'personal-care', 'pharmacy',
    'electronics', 'clothing', 'footwear', 'jewelry', 'home-decor',
    'books', 'sports', 'automotive', 'pet-supplies', 'baby-products',
    'garden', 'hardware', 'textiles', 'art-crafts', 'music',
    'gifts', 'organic', 'frozen-foods', 'imported-goods', 'other'
  ]);
  if (allowed.has(slug)) return slug;
  // common aliases
  const alias = {
    'dairy-milk-products': 'dairy',
    'dairy-products': 'dairy',
    'milk-products': 'dairy',
    'fruits-veg': 'produce',
    'fruits-vegetables': 'produce',
    'fruits-and-vegetables': 'produce'
  };
  return alias[slug] || 'other';
};

const toVendorPayload = (raw, user) => {
  // Just return the raw payload as-is since we've aligned the field names
  // between frontend and backend
  return raw;
};

// @desc    Get vendors nearby (public)
// @route   GET /api/vendors/nearby
// @access  Public
router.get('/nearby', asyncHandler(async (req, res, next) => {
  try {
    // Extract query parameters with defaults
    const lat = parseFloat(req.query.lat) || 0;
    const lng = parseFloat(req.query.lng) || 0;
    const radiusKm = parseFloat(req.query.radiusKm) || 5;
    
    // Validate parameters
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      console.log('Invalid or missing coordinates:', { lat, lng });
      // Return empty results instead of error for better UX
      return res.status(200).json({
        success: true,
        message: 'No location provided or invalid coordinates',
        count: 0,
        data: []
      });
    }
    
    // Find vendors within radius
    const vendors = await Vendor.find({
      status: 'active',
      // In a real app, you would use geospatial queries here
    }).limit(10);
    
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error('Error finding nearby vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding nearby vendors'
    });
  }
}));

// @desc    Get vendor by ID (public)
// @route   GET /api/vendors/:id
// @access  Public
router.get('/:id', getVendor);

// @desc    Create vendor (admin route - DISABLED to avoid conflict with /profile)
// @route   POST /api/vendors
// @access  Private (vendor role)
/* DISABLED - Using /profile route instead
router.post('/', [
  protect,
  authorize('vendor'),
  body('shopName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn([
      'grocery', 'fruits-vegetables', 'dairy-bakery', 'meat-fish',
      'electronics', 'clothing', 'home-kitchen', 'beauty-personal-care',
      'pharmacy', 'books-stationery', 'sports-outdoors', 'automotive',
      'jewelry-accessories', 'handmade-crafts', 'other'
    ])
    .withMessage('Invalid category'),
  body('address.line1')
    .notEmpty()
    .withMessage('Address line 1 is required'),
  body('address.city')
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .notEmpty()
    .withMessage('State is required'),
  body('address.pincode')
    .notEmpty()
    .withMessage('Pincode is required'),
  body('contactInfo.phone')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('deliveryRadiusKm')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Delivery radius must be between 1 and 50 km')
], asyncHandler(async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid vendor id' });
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if vendor profile already exists
    const existingVendor = await Vendor.findOne({ ownerUserId: req.user._id });
    if (existingVendor) {
      return res.status(400).json({
        status: 'error',
        message: 'Vendor profile already exists for this user'
      });
    }

    const {
      shopName,
      description,
      category,
      address,
      deliveryRadiusKm = 5,
      contactInfo,
      businessHours,
      features,
      deliverySettings
    } = req.body;

    // Removed geocoding code

    // Create vendor
    const vendor = await Vendor.create({
      ownerUserId: req.user._id,
      shopName,
      description,
      category,
      address,
      // Removed geo field
      deliveryRadiusKm,
      contactInfo: {
        ...contactInfo,
        email: contactInfo.email || req.user.email
      },
      businessHours: businessHours || getDefaultBusinessHours(),
      features: features || getDefaultFeatures(),
      deliverySettings: deliverySettings || getDefaultDeliverySettings()
    });

    // Populate owner details
    await vendor.populate('ownerUserId', 'name email phone');

    res.status(201).json({
      status: 'success',
      message: 'Vendor profile created successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating vendor profile'
    });
  }
})); */


// Removed duplicate GET /profile route

// @desc    Update current vendor profile for logged-in vendor
// @route   PUT /api/vendors/profile
// @access  Private (vendor)
router.put('/profile', protect, authorize('vendor'), asyncHandler(async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const normalized = toVendorPayload(req.body, req.user);
    const updateData = { ...normalized };

    // Removed geocoding code

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendor._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('ownerUserId', 'name email phone');

    res.json({ status: 'success', message: 'Vendor profile updated successfully', data: { vendor: updatedVendor } });
  } catch (error) {
    console.error('Update self vendor profile error:', error);
    res.status(500).json({ status: 'error', message: 'Server error while updating vendor profile' });
  }
}));

// @desc    Update vendor profile
// @route   PUT /api/vendors/:id
// @access  Private (owner or admin)
router.put('/:id', [
  protect,
  body('shopName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn([
      'grocery', 'fruits-vegetables', 'dairy-bakery', 'meat-fish',
      'electronics', 'clothing', 'home-kitchen', 'beauty-personal-care',
      'pharmacy', 'books-stationery', 'sports-outdoors', 'automotive',
      'jewelry-accessories', 'handmade-crafts', 'other'
    ])
    .withMessage('Invalid category'),
  body('deliveryRadiusKm')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Delivery radius must be between 1 and 50 km')
], asyncHandler(async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor not found'
      });
    }

    // Check ownership or admin access
    if (req.user.role !== 'admin' && vendor.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this vendor profile'
      });
    }

    const updateData = { ...req.body };

    // Removed geocoding code

    // Update vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('ownerUserId', 'name email phone');

    res.json({
      status: 'success',
      message: 'Vendor profile updated successfully',
      data: { vendor: updatedVendor }
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating vendor profile'
    });
  }
}));

// @desc    Delete vendor profile
// @route   DELETE /api/vendors/:id
// @access  Private (owner or admin)
router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid vendor id' });
    }
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor not found'
      });
    }

    // Check ownership or admin access
    if (req.user.role !== 'admin' && vendor.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this vendor profile'
      });
    }

    await Vendor.findByIdAndDelete(id);

    res.json({
      status: 'success',
      message: 'Vendor profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting vendor profile'
    });
  }
}));

// @desc    Verify vendor (admin only)
// @route   PATCH /api/vendors/:id/verify
// @access  Private (admin only)
router.patch('/:id/verify', protect, isAdmin, [
  body('verificationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Verification notes cannot exceed 500 characters')
], asyncHandler(async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor not found'
      });
    }

    const { verificationNotes } = req.body;

    // Update verification status
    vendor.verificationStatus.isVerified = true;
    vendor.verificationStatus.verifiedBy = req.user._id;
    vendor.verificationStatus.verifiedAt = new Date();
    vendor.verificationStatus.verificationNotes = verificationNotes;
    vendor.status = 'active';

    await vendor.save();

    // Populate owner details
    await vendor.populate('ownerUserId', 'name email phone');

    res.json({
      status: 'success',
      message: 'Vendor verified successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('Verify vendor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying vendor'
    });
  }
}));

// @desc    Update vendor status (admin only)
// @route   PATCH /api/vendors/:id/status
// @access  Private (admin only)
router.patch('/:id/status', protect, isAdmin, [
  body('status')
    .isIn(['pending', 'active', 'blocked', 'suspended'])
    .withMessage('Invalid status'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], asyncHandler(async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor not found'
      });
    }

    const { status, reason } = req.body;

    // Update status
    vendor.status = status;
    if (reason) {
      vendor.verificationStatus.verificationNotes = reason;
    }

    await vendor.save();

    // Populate owner details
    await vendor.populate('ownerUserId', 'name email phone');

    res.json({
      status: 'success',
      message: 'Vendor status updated successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating vendor status'
    });
  }
}));

// @desc    Get vendor's products
// @route   GET /api/vendors/:id/products
// @access  Public
router.get('/:id/products', asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Check if vendor exists
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        status: 'error',
        message: 'Vendor not found'
      });
    }

    // Build filter object
    const filter = { vendorId: req.params.id, isActive: true };
    if (category) filter.category = category;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products (we'll implement this when Product model is created)
    // const products = await Product.find(filter)
    //   .sort(sort)
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // For now, return empty array
    const products = [];

    res.json({
      status: 'success',
      data: {
        vendor: {
          id: vendor._id,
          shopName: vendor.shopName,
          category: vendor.category,
          rating: vendor.rating
        },
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(0 / parseInt(limit)),
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching vendor products'
    });
  }
}));

/**
 * @desc    Get recommended vendors (replacing nearby vendors concept)
 * @route   GET /api/vendors/recommended
 * @access  Public
 */
router.get('/recommended', asyncHandler(async (req, res, next) => {
  try {
    const { category, minRating = 0, limit = 20, city, state } = req.query;

    // Build query for recommended vendors
    const query = {
      status: 'active',
      'rating.average': { $gte: parseFloat(minRating) || 0 }
    };
    
    // Add filters if provided
    if (category) query.category = category;
    if (city) query['address.city'] = new RegExp(city, 'i'); // Case-insensitive city match
    if (state) query['address.state'] = new RegExp(state, 'i'); // Case-insensitive state match

    // Find vendors matching criteria
    const vendors = await Vendor.find(query)
      .limit(parseInt(limit) || 20)
      .select('shopName category rating deliveryRadiusKm address contactInfo images')
      .sort({ isFeatured: -1, 'rating.average': -1, createdAt: -1 }); // Featured first, then highest rated, then newest

    // Return response
    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Recommended vendors retrieved successfully',
      data: {
        vendors,
        searchParams: {
          category,
          city,
          state,
          minRating: parseFloat(minRating) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving recommended vendors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching vendors'
    });
  }
}));

/**
 * @desc    Admin approve/reject vendor profile
 * @route   PATCH /api/vendors/:id/approve
 * @access  Private (admin only)
 */
router.patch('/:id/approve', protect, isAdmin, asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Invalid vendor id',
        error: 'INVALID_ID'
      });
    }
    
    // Find the vendor profile
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        status: 'error',
        message: 'Vendor profile not found',
        error: 'NOT_FOUND'
      });
    }
    
    // Update verification status
    vendor.verificationStatus.isVerified = approved === true;
    vendor.verificationStatus.verifiedBy = req.user._id;
    vendor.verificationStatus.verifiedAt = new Date();
    vendor.verificationStatus.verificationNotes = notes || '';
    
    // Update vendor status based on approval
    if (approved === true) {
      vendor.status = 'active';
    } else if (approved === false) {
      vendor.status = 'suspended';
    }
    
    // Save the updated vendor profile
    await vendor.save();
    
    // Return success response
    return res.status(200).json({
      success: true,
      status: 'success',
      message: approved ? 'Vendor profile approved successfully' : 'Vendor profile rejected',
      data: { vendor }
    });
    
  } catch (error) {
    console.error('Error approving/rejecting vendor profile:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Server error while approving/rejecting vendor profile',
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
}));

module.exports = router;

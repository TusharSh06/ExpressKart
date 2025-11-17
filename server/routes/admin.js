const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { protect, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (admin only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts for dashboard stats
    const [totalUsers, totalVendors, totalProducts, totalOrders, totalReviews] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments()
    ]);

    // Get recent data for dashboard
    const [recentUsers, recentVendors, recentProducts, recentOrders] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Vendor.find().sort({ createdAt: -1 }).limit(5).select('shopName category status createdAt'),
      Product.find().sort({ createdAt: -1 }).limit(5).select('title category price status createdAt'),
      Order.find().sort({ createdAt: -1 }).limit(5).select('orderNumber total status createdAt')
    ]);

    // Calculate revenue
    const revenueData = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'completed'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get role distribution
    const userRoleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get vendor status distribution
    const vendorStatusStats = await Vendor.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get product category distribution
    const productCategoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        stats: {
          totalUsers,
          totalVendors,
          totalProducts,
          totalOrders,
          totalReviews,
          totalRevenue
        },
        recent: {
          users: recentUsers,
          vendors: recentVendors,
          products: recentProducts,
          orders: recentOrders
        },
        distributions: {
          userRoles: userRoleStats,
          vendorStatuses: vendorStatusStats,
          productCategories: productCategoryStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (admin only)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('role').optional().isIn(['user', 'vendor', 'admin']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, role, isActive, search } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNextPage: skip + users.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// @desc    Get all vendors (admin only)
// @route   GET /api/admin/vendors
// @access  Private (admin only)
router.get('/vendors', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['pending', 'active', 'blocked', 'suspended']).withMessage('Invalid status'),
  query('category').optional().trim(),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, status, category, search } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vendors, total] = await Promise.all([
      Vendor.find(filter)
        .populate('ownerUserId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: vendors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalVendors: total,
        hasNextPage: skip + vendors.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message
    });
  }
});

// @desc    Get all products (admin only)
// @route   GET /api/admin/products
// @access  Private (admin only)
router.get('/products', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('category').optional().trim(),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('search').optional().trim(),
  query('vendorId').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, category, status, search, vendorId } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.isActive = status === 'active';
    if (vendorId) filter.vendorId = vendorId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Admin products filter:', filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total, vendors] = await Promise.all([
      Product.find(filter)
        .populate('vendorId', 'shopName businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
      Vendor.find({ status: 'active' })
        .select('_id shopName businessName')
        .sort({ createdAt: -1 })
        .limit(100)
    ]);

    console.log(`Found ${products.length} products out of ${total} total`);
    console.log(`Found ${vendors.length} active vendors`);

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      vendors: vendors, // Include vendors for filtering
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNextPage: skip + products.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// @desc    Get all orders (admin only)
// @route   GET /api/admin/orders
// @access  Private (admin only)
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, status, search } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .populate('vendorId', 'shopName businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNextPage: skip + orders.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// @desc    Get all reviews (admin only)
// @route   GET /api/admin/reviews
// @access  Private (admin only)
router.get('/reviews', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, rating, status, search } = req.query;

    // Build filter
    const filter = {};
    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name email')
        .populate('productId', 'title')
        .populate('vendorId', 'shopName businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total,
        hasNextPage: skip + reviews.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
});

// @desc    Update user status (admin only)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (admin only)
router.patch('/users/:id/status', [
  param('id').isMongoId().withMessage('Valid user ID is required'),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user.role === 'admin' && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate admin user'
      });
    }

    user.isActive = isActive;
    if (reason) user.deactivationReason = reason;
    
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// @desc    Update vendor verification status (admin only)
// @route   PATCH /api/admin/vendors/:id/verify
// @access  Private (admin only)
router.patch('/vendors/:id/verify', [
  param('id').isMongoId().withMessage('Valid vendor ID is required'),
  body('isVerified').isBoolean().withMessage('isVerified must be boolean'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { isVerified, notes } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.verificationStatus.isVerified = isVerified;
    vendor.verificationStatus.verifiedBy = req.user._id;
    vendor.verificationStatus.verifiedAt = new Date();
    if (notes) vendor.verificationStatus.verificationNotes = notes;

    // If verified, activate the vendor
    if (isVerified) {
      vendor.status = 'active';
    }

    await vendor.save();

    res.json({
      success: true,
      message: `Vendor ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        vendor: {
          id: vendor._id,
          shopName: vendor.shopName,
          status: vendor.status,
          verificationStatus: vendor.verificationStatus
        }
      }
    });
  } catch (error) {
    console.error('Error updating vendor verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor verification',
      error: error.message
    });
  }
});

// @desc    Update vendor status (admin only)
// @route   PATCH /api/admin/vendors/:id/status
// @access  Private (admin only)
router.patch('/vendors/:id/status', [
  param('id').isMongoId().withMessage('Valid vendor ID is required'),
  body('status').isIn(['active', 'blocked', 'suspended']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = status;
    if (reason) vendor.statusChangeReason = reason;
    
    await vendor.save();

    res.json({
      success: true,
      message: `Vendor status updated to ${status} successfully`,
      data: {
        vendor: {
          id: vendor._id,
          shopName: vendor.shopName,
          status: vendor.status
        }
      }
    });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor status',
      error: error.message
    });
  }
});

// @desc    Delete vendor (admin only)
// @route   DELETE /api/admin/vendors/:id
// @access  Private (admin only)
router.delete('/vendors/:id', [
  param('id').isMongoId().withMessage('Valid vendor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    // Find vendor
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Delete vendor's products first
    await Product.deleteMany({ vendorId: id });
    console.log(`Deleted all products for vendor ${id}`);

    // Delete vendor's orders
    await Order.deleteMany({ vendorId: id });
    console.log(`Deleted all orders for vendor ${id}`);

    // Delete vendor
    await Vendor.findByIdAndDelete(id);
    console.log(`Deleted vendor ${id}`);

    // Delete vendor's user account if needed (optional)
    // You can uncomment this if you want to delete the associated user account
    // await User.findByIdAndDelete(vendor.ownerUserId);

    res.json({
      success: true,
      message: 'Vendor deleted successfully',
      data: {
        deletedVendor: {
          id: vendor._id,
          businessName: vendor.businessName
        }
      }
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor',
      error: error.message
    });
  }
});

// @desc    Update product status (admin only)
// @route   PATCH /api/admin/products/:id/status
// @access  Private (admin only)
router.patch('/products/:id/status', [
  param('id').isMongoId().withMessage('Valid product ID is required'),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { isActive, reason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = isActive;
    if (reason) product.statusChangeReason = reason;
    
    await product.save();

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        product: {
          id: product._id,
          title: product.title,
          isActive: product.isActive
        }
      }
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status',
      error: error.message
    });
  }
});

// @desc    Update order status (admin only)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private (admin only)
router.patch('/orders/:id/status', [
  param('id').isMongoId().withMessage('Valid order ID is required'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (notes) order.adminNotes = notes;
    
    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status
        }
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// @desc    Moderate review (admin only)
// @route   PATCH /api/admin/reviews/:id/moderate
// @access  Private (admin only)
router.patch('/reviews/:id/moderate', [
  param('id').isMongoId().withMessage('Valid review ID is required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    if (reason) review.moderationReason = reason;
    
    await review.save();

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: {
        review: {
          id: review._id,
          status: review.status,
          moderatedBy: review.moderatedBy,
          moderatedAt: review.moderatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error.message
    });
  }
});

module.exports = router;

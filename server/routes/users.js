const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (admin only)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNextPage: skip + users.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching users'
    });
  }
});

// @desc    Get user by ID (admin or self)
// @route   GET /api/users/:id
// @access  Private (admin or self)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this user profile'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (admin or self)
router.put('/:id', [
  protect,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
], async (req, res) => {
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this user profile'
      });
    }

    const { name, phone, addresses, preferences } = req.body;

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;
    if (preferences) user.preferences = preferences;

    await user.save();

    // Remove sensitive fields from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.emailVerificationExpire;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpire;

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating user profile'
    });
  }
});

// @desc    Update user role (admin only, but prevents admin role changes)
// @route   PATCH /api/users/:id/role
// @access  Private (admin only)
router.patch('/:id/role', [
  protect,
  isAdmin,
  body('role')
    .isIn(['user', 'vendor'])
    .withMessage('Role must be either user or vendor. Admin role changes are not allowed.')
], async (req, res) => {
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

    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent changing admin role
    if (user.role === 'admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot change admin role. Admin role is permanent.'
      });
    }

    // Prevent setting role to admin
    if (role === 'admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot set role to admin. Only one admin is allowed in the system.'
      });
    }

    // Update role
    user.role = role;
    await user.save();

    res.json({
      status: 'success',
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating user role'
    });
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user.role === 'admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete admin user'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting user'
    });
  }
});

// @desc    Update user status (admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (admin only)
router.patch('/:id/status', [
  protect,
  isAdmin,
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const { isActive, reason } = req.body;

    // Prevent admin from deactivating themselves
    if (user.role === 'admin' && !isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot deactivate admin user'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: { id: user._id, isActive: user.isActive } }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating user status'
    });
  }
});

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats/overview
// @access  Private (admin only)
router.get('/stats/overview', protect, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const stats = {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers,
      inactive: totalUsers - activeUsers,
      unverified: totalUsers - verifiedUsers,
      byRole: roleStats.reduce((acc, role) => {
        acc[role._id] = role.count;
        return acc;
      }, {}),
      recent: recentUsers
    };

    res.json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user statistics'
    });
  }
});

// @desc    Search users (admin only)
// @route   GET /api/users/search
// @access  Private (admin only)
router.get('/search', protect, isAdmin, async (req, res) => {
  try {
    const { q, role, isActive, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Build search filter
    const filter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    };

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        users,
        query: q,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNextPage: skip + users.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while searching users'
    });
  }
});

module.exports = router;

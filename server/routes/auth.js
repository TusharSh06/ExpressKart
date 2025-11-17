const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

const router = express.Router();

// @desc    Create first admin (only when no admin exists)
// @route   POST /api/auth/create-admin
// @access  Public (but restricted to first admin creation)
router.post('/create-admin', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
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

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Check if admin already exists
    const adminExists = await User.adminExists();
    if (adminExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Active admin already exists. Only one active admin is allowed in the system.'
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      phone,
      isEmailVerified: true // Auto-verify admin email
    });

    // Generate JWT token
    const token = admin.getSignedJwtToken();

    res.status(201).json({
      status: 'success',
      message: 'First admin created successfully',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          phone: admin.phone,
          isEmailVerified: admin.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during admin creation'
    });
  }
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'vendor'])
    .withMessage('Role must be either user or vendor. Admin creation is not allowed through regular registration.'),
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

    const { name, email, password, role = 'user', phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Check if admin already exists (only one active admin allowed)
    if (role === 'admin') {
      const adminExists = await User.adminExists();
      if (adminExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Active admin already exists. Only one active admin is allowed in the system.'
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - ExpressKart',
        message: `Please click on the following link to verify your email: ${verificationUrl}`
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with user creation even if email fails
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    // Check if user exists and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
});

// @desc    Check if admin exists
// @route   GET /api/auth/admin-exists
// @access  Public
router.get('/admin-exists', async (req, res) => {
  try {
    const adminExists = await User.adminExists();
    res.json({
      status: 'success',
      data: {
        adminExists,
        message: adminExists ? 'Admin already exists' : 'No admin found'
      }
    });
  } catch (error) {
    console.error('Check admin exists error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while checking admin status'
    });
  }
});

// @desc    Get admin information (if exists)
// @route   GET /api/auth/admin-info
// @access  Public
router.get('/admin-info', async (req, res) => {
  try {
    const admin = await User.getAdmin();
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'No admin found in the system'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching admin information'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          addresses: user.addresses,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user data'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
router.put('/me', protect, [
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

    const { name, phone, address, addresses, preferences } = req.body;

    // Find user and update
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('=== UPDATE PROFILE ===')
    console.log('Updating user:', req.user._id)
    console.log('Name:', name)
    console.log('Phone:', phone)
    console.log('Address:', address)
    console.log('Addresses:', addresses)
    console.log('Preferences:', preferences)

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (addresses) user.addresses = addresses;
    if (preferences) user.preferences = preferences;

    await user.save();

    console.log('User updated successfully')
    console.log('Updated user address:', user.address)
    console.log('=== END UPDATE PROFILE ===')

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          addresses: user.addresses,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating profile'
    });
  }
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while changing password'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
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

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Send reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - ExpressKart',
        message: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}`
      });

      res.json({
        status: 'success',
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Reset the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500).json({
        status: 'error',
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while processing forgot password'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
router.post('/reset-password/:resetToken', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
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

    const { password } = req.body;
    const { resetToken } = req.params;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while resetting password'
    });
  }
});

// @desc    Verify email
// @route   POST /api/auth/verify-email/:token
// @access  Public
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying email'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  // In JWT-based auth, logout is handled client-side by removing the token
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// @desc    Check if admin exists
// @route   GET /api/auth/check-admin
// @access  Public
router.get('/check-admin', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    res.json({
      status: 'success',
      data: {
        adminExists: !!adminExists
      }
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while checking admin status'
    });
  }
});

module.exports = router;

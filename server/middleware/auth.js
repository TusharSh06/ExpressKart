const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;
  
  console.log('Auth middleware called for path:', req.originalUrl);
  console.log('Auth headers:', req.headers.authorization);

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      if (!token) {
        console.error('No token provided');
        return res.status(401).json({
          success: false,
          message: 'No authentication token, authorization denied',
          error: 'No token provided'
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError.message);
        return res.status(401).json({
          success: false,
          message: 'Session expired or invalid token',
          error: 'Token verification failed',
          details: jwtError.message
        });
      }

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      console.log('User loaded from token:', {
        id: req.user ? req.user._id : 'NOT FOUND',
        name: req.user ? req.user.name : 'NOT FOUND',
        email: req.user ? req.user.email : 'NOT FOUND'
      });

      if (!req.user) {
        console.error('User not found for token');
        return res.status(401).json({
          success: false,
          status: 'error',
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, please login'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is vendor
const isVendor = (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    return res.status(403).json({
      status: 'error',
      message: 'Vendor access required'
    });
  }
  next();
};

// Check if user is regular user
const isUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      status: 'error',
      message: 'User access required'
    });
  }
  next();
};

// Check if user is vendor or admin
const isVendorOrAdmin = (req, res, next) => {
  if (!req.user || !['vendor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Vendor or admin access required'
    });
  }
  next();
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, please login'
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  isVendor,
  isUser,
  isVendorOrAdmin,
  isOwnerOrAdmin
};

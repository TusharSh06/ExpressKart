const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');

// All wishlist routes require authentication
router.use(protect);

// Get user's wishlist
router.get('/', async (req, res) => {
  try {
    console.log('=== GET WISHLIST START ===');
    console.log('User ID:', req.user._id);
    
    const user = await User.findById(req.user._id).populate('wishlist');
    console.log('User found:', user ? user.name : 'NOT FOUND');
    console.log('Wishlist array:', user ? user.wishlist : 'NO USER');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out any wishlist items that might have been deleted
    const validWishlistItems = user.wishlist.filter(item => item && item.isActive !== false);
    console.log('Valid wishlist items count:', validWishlistItems.length);
    console.log('=== GET WISHLIST END ===');

    res.json({
      success: true,
      data: validWishlistItems
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message
    });
  }
});

// Add product to wishlist
router.post('/', [
  body('productId').isMongoId().withMessage('Valid product ID is required')
], async (req, res) => {
  try {
    console.log('=== ADD TO WISHLIST START ===');
    console.log('User ID:', req.user._id);
    console.log('Product ID:', req.body.productId);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { productId } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    console.log('Product found:', product ? product.title : 'NOT FOUND');
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    // Check if product is already in wishlist
    const user = await User.findById(req.user._id);
    console.log('User found:', user ? user.name : 'NOT FOUND');
    console.log('Current wishlist:', user.wishlist);
    
    if (user.wishlist.includes(productId)) {
      console.log('Product already in wishlist');
      return res.status(400).json({
        success: false,
        message: 'Product is already in wishlist'
      });
    }

    // Add to wishlist using findByIdAndUpdate for reliability
    console.log('Adding product to wishlist using findByIdAndUpdate');
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { wishlist: productId } },
      { new: true }
    );
    
    console.log('User updated:', {
      id: updatedUser._id,
      name: updatedUser.name,
      wishlistLength: updatedUser.wishlist.length,
      wishlistArray: updatedUser.wishlist
    });

    // Populate the added product
    const populatedUser = await User.findById(req.user._id).populate('wishlist');
    console.log('Populated wishlist count:', populatedUser.wishlist.length);
    console.log('Populated wishlist items:', populatedUser.wishlist.map(item => ({
      id: item._id,
      title: item.title
    })));
    
    const addedItem = populatedUser.wishlist.find(item => item._id.toString() === productId);
    console.log('Added item:', addedItem ? addedItem.title : 'NOT FOUND');
    console.log('=== ADD TO WISHLIST END ===');

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: addedItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message
    });
  }
});

// Remove product from wishlist
router.delete('/:productId', [
  param('productId').isMongoId().withMessage('Valid product ID is required')
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

    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is in wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product is not in wishlist'
      });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({
      success: true,
      message: 'Product removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message
    });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', [
  param('productId').isMongoId().withMessage('Valid product ID is required')
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

    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isInWishlist = user.wishlist.includes(productId);

    res.json({
      success: true,
      message: 'Wishlist status checked successfully',
      data: {
        productId,
        isInWishlist
      }
    });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      error: error.message
    });
  }
});

// Clear entire wishlist
router.delete('/clear', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.wishlist = [];
    await user.save();

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// IMPORTANT: Specific routes MUST come before generic :id routes
// Otherwise /user/me gets matched as an ID

// @desc    Get current user's reviews
// @route   GET /api/reviews/user/me
// @access  Private
router.get('/user/me', protect, asyncHandler(async (req, res, next) => {
  console.log('=== GET /reviews/user/me ===');
  console.log('User ID:', req.user.id);
  
  const reviews = await Review.find({ userId: req.user.id })
    .populate('productId', 'title')
    .sort({ createdAt: -1 });

  console.log('Found', reviews.length, 'reviews for user');
  
  res.status(200).json({
    success: true,
    data: reviews
  });
}));

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', asyncHandler(async (req, res, next) => {
  console.log('=== GET /reviews/product/:productId ===');
  console.log('Product ID:', req.params.productId);
  
  const reviews = await Review.find({ productId: req.params.productId, status: 'approved', isActive: true })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  console.log('Found', reviews.length, 'reviews for product');
  
  res.status(200).json({
    success: true,
    data: reviews
  });
}));

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  console.log('=== CREATE REVIEW START ===');
  console.log('User ID:', req.user.id);
  console.log('Product ID:', productId);
  console.log('Rating:', rating);
  console.log('Comment:', comment);
  console.log('Request body:', req.body);

  // Validate required fields
  if (!productId || !rating) {
    console.error('Missing productId or rating');
    return next(new ErrorResponse('Please provide productId and rating', 400));
  }

  if (!comment || comment.trim() === '') {
    console.error('Missing or empty comment');
    return next(new ErrorResponse('Please provide a comment', 400));
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  console.log('Product found:', product._id, 'Vendor:', product.vendorId);

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    productId,
    userId: req.user.id
  });

  if (existingReview) {
    return next(new ErrorResponse('You have already reviewed this product', 400));
  }

  // Create review
  const review = await Review.create({
    productId,
    vendorId: product.vendorId,
    userId: req.user.id,
    rating: parseInt(rating),
    comment: comment.trim(),
    status: 'approved', // Auto-approve for now
    isActive: true
  });

  console.log('Review created:', review._id);

  // Update product rating - get all approved reviews
  const allReviews = await Review.find({ 
    productId,
    status: 'approved',
    isActive: true
  });
  
  const avgRating = allReviews.length > 0 
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
    : 0;
  
  console.log('Average rating:', avgRating, 'Total reviews:', allReviews.length);
  
  await Product.findByIdAndUpdate(productId, {
    'rating.average': avgRating,
    'rating.count': allReviews.length
  });

  console.log('=== CREATE REVIEW END ===');

  res.status(201).json({
    success: true,
    data: review
  });
}));

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // Make sure user is review owner or admin
  if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this review', 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Update product rating
  const productId = review.productId;
  const allReviews = await Review.find({ productId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  
  await Product.findByIdAndUpdate(productId, {
    'rating.average': avgRating,
    'rating.count': allReviews.length
  });

  res.status(200).json({
    success: true,
    data: review
  });
}));

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // Make sure user is review owner or admin
  if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this review', 401));
  }

  const productId = review.productId;
  await Review.findByIdAndDelete(req.params.id);

  // Update product rating
  const allReviews = await Review.find({ productId });
  if (allReviews.length > 0) {
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      'rating.average': avgRating,
      'rating.count': allReviews.length
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0,
      'rating.count': 0
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

module.exports = router;

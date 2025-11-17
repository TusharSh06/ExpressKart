const Review = require('../models/Review');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get reviews by product ID
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${productId}`, 404));
  }
  
  // Get reviews
  const reviews = await Review.find({ product: productId, isApproved: true })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get reviews by vendor ID
// @route   GET /api/reviews/vendor/:vendorId
// @access  Public
exports.getVendorReviews = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.params;
  
  // Check if vendor exists
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return next(new ErrorResponse(`Vendor not found with id of ${vendorId}`, 404));
  }
  
  // Get reviews
  const reviews = await Review.find({ vendor: vendorId, isApproved: true })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res, next) => {
  const { product, vendor, rating, comment } = req.body;
  
  // Check if user has already reviewed this product/vendor
  let existingReview;
  
  if (product) {
    existingReview = await Review.findOne({
      user: req.user._id,
      product: product
    });
    
    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return next(new ErrorResponse(`Product not found with id of ${product}`, 404));
    }
  } else if (vendor) {
    existingReview = await Review.findOne({
      user: req.user._id,
      vendor: vendor
    });
    
    // Check if vendor exists
    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) {
      return next(new ErrorResponse(`Vendor not found with id of ${vendor}`, 404));
    }
  } else {
    return next(new ErrorResponse('Please provide either product or vendor ID', 400));
  }
  
  // Check if user has already reviewed
  if (existingReview) {
    return next(new ErrorResponse('You have already reviewed this item', 400));
  }
  
  // Create review
  const review = await Review.create({
    user: req.user._id,
    product,
    vendor,
    rating,
    comment,
    isApproved: req.user.role === 'admin' // Auto-approve for admins
  });
  
  // Update product/vendor rating
  await updateRating(product, vendor);
  
  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is review owner or admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this review`, 401)
    );
  }
  
  // Update review
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // Update product/vendor rating
  await updateRating(review.product, review.vendor);
  
  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is review owner or admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this review`, 401)
    );
  }
  
  const productId = review.product;
  const vendorId = review.vendor;
  
  await review.deleteOne();
  
  // Update product/vendor rating
  await updateRating(productId, vendorId);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Private/Admin
exports.getReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find()
    .populate('user', 'name email')
    .populate('product', 'name')
    .populate('vendor', 'shopName')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Approve/Reject review (admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = asyncHandler(async (req, res, next) => {
  const { isApproved } = req.body;
  
  if (typeof isApproved === 'undefined') {
    return next(new ErrorResponse('Please provide approval status', 400));
  }
  
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved },
    { new: true, runValidators: true }
  );
  
  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }
  
  // Update product/vendor rating if approved
  if (isApproved) {
    await updateRating(review.product, review.vendor);
  }
  
  res.status(200).json({
    success: true,
    data: review
  });
});

// Helper function to update product or vendor rating
const updateRating = async (productId, vendorId) => {
  if (productId) {
    // Update product rating
    const productAggregate = await Review.aggregate([
      {
        $match: { 
          product: productId,
          isApproved: true 
        }
      },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          numOfReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (productAggregate.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: {
          average: productAggregate[0].averageRating,
          count: productAggregate[0].numOfReviews
        }
      });
    }
  } else if (vendorId) {
    // Update vendor rating
    const vendorAggregate = await Review.aggregate([
      {
        $match: { 
          vendor: vendorId,
          isApproved: true 
        }
      },
      {
        $group: {
          _id: '$vendor',
          averageRating: { $avg: '$rating' },
          numOfReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (vendorAggregate.length > 0) {
      await Vendor.findByIdAndUpdate(vendorId, {
        'rating.average': vendorAggregate[0].averageRating,
        'rating.count': vendorAggregate[0].numOfReviews
      });
    }
  }
};

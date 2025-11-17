const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { geocodeAddress, geocodeByPostal } = require('../services/geo.service');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
exports.getVendors = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    status = 'active',
    minRating,
    isFeatured,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = { status };
  if (category) filter.category = category;
  if (minRating) filter['rating.average'] = { $gte: parseFloat(minRating) };
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const vendors = await Vendor.find(filter)
    .populate('ownerUserId', 'name email phone')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-verificationStatus');

  // Get total count
  const total = await Vendor.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: vendors.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: vendors
  });
});

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Public
exports.getVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id)
    .populate('ownerUserId', 'name email phone')
    .populate('products', 'title price images');

  if (!vendor) {
    return next(
      new ErrorResponse(`Vendor not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: vendor
  });
});

// @desc    Create vendor profile
// @route   POST /api/vendors/profile
// @access  Private
exports.createVendorProfile = async (req, res, next) => {
  console.log('\n🟢 [createVendorProfile] API hit');
  console.log('Headers:', req.headers.authorization ? 'Authorization present' : 'No authorization');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    if (!req.user || !req.user.id) {
      console.log('🔴 No authenticated user found');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'AUTH_REQUIRED'
      });
    }

    console.log('🟢 Authenticated user ID:', req.user.id);

    // Check if vendor already exists for this user using Mongoose
    const existingVendor = await Vendor.findOne({ ownerUserId: req.user.id });
    if (existingVendor) {
      console.log('🟡 Vendor already exists for this user');
      return res.status(200).json({
        success: true,
        message: 'Vendor profile already exists',
        data: { vendor: existingVendor }
      });
    }

    // Prepare vendor data - simple and clean approach
    const vendorData = {
      ...req.body,
      ownerUserId: req.user.id,
      products: [] // Initialize empty products array
    };

    console.log('🟢 Vendor data being saved:', JSON.stringify(vendorData, null, 2));

    // Create the vendor using Mongoose
    let vendor;
    try {
      // Create the vendor
      vendor = await Vendor.create(vendorData);
      console.log('✅ Vendor saved successfully:', vendor._id);
      
      // Update user role to vendor
      await User.findByIdAndUpdate(req.user.id, { role: 'vendor' });
      console.log('✅ User role updated to vendor');
    } catch (error) {
      console.error('❌ Error creating vendor profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while creating vendor profile',
        error: error.message
      });
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Vendor profile created successfully',
      data: vendor // Return vendor directly, not wrapped in an object
    });

    console.log('🟢 Response sent successfully');
  } catch (err) {
    console.error('❌ [createVendorProfile] Error details:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating vendor profile',
      error: err.message,
      stack: err.stack
    });
  }
};

// @desc    Get vendor's own profile
// @route   GET /api/vendors/profile
// @access  Private
exports.getVendorProfile = asyncHandler(async (req, res, next) => {
  try {
    console.log('GET /vendors/profile - User:', req.user?._id);
    
    if (!req.user || !req.user.id) {
      console.error('GET /vendors/profile - No authenticated user found');
      return next(new ErrorResponse('Authentication required', 401));
    }
    
    // Find the vendor profile for the authenticated user
    console.log('Looking for vendor with ownerUserId:', req.user._id);
    const vendor = await Vendor.findOne({ ownerUserId: req.user.id })
      .populate('ownerUserId', 'name email phone');
    
    console.log('Vendor profile found:', vendor ? 'Yes' : 'No');
    
    // Check if vendor profile exists
    if (!vendor) {
      return next(new ErrorResponse('Vendor profile not found', 404));
    }
    
    // Return the vendor profile
    return res.status(200).json({
      success: true,
      message: 'Vendor profile retrieved successfully',
      data: vendor // Return vendor directly, not wrapped in an object
    });
    
  } catch (error) {
    console.error('Error retrieving vendor profile:', error);
    return next(new ErrorResponse('Server error while retrieving vendor profile', 500));
  }
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private
exports.updateVendorProfile = asyncHandler(async (req, res, next) => {
  let vendor = await Vendor.findOne({ ownerUserId: req.user.id });

  if (!vendor) {
    return next(
      new ErrorResponse('Vendor profile not found', 404)
    );
  }

  // Make sure user is vendor owner or admin
  if (vendor.ownerUserId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this vendor profile', 401)
    );
  }

  // Update vendor
  vendor = await Vendor.findOneAndUpdate(
    { ownerUserId: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: vendor
  });
});

// @desc    Delete vendor profile
// @route   DELETE /api/vendors/profile
// @access  Private
exports.deleteVendorProfile = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user.id });

  if (!vendor) {
    return next(
      new ErrorResponse('Vendor profile not found', 404)
    );
  }

  // Make sure user is vendor owner or admin
  if (vendor.ownerUserId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to delete this vendor profile', 401)
    );
  }

  await vendor.deleteOne();

  // Optionally, update user role if needed
  // await User.findByIdAndUpdate(req.user.id, { role: 'user' });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get vendors within a radius
// @route   GET /api/vendors/radius/:zipcode/:distance
// @access  Public
exports.getVendorsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocodeByPostal(zipcode);
  const lat = loc.lat;
  const lng = loc.lng;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const vendors = await Vendor.find({
    'location.coordinates': {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    },
    status: 'active'
  });

  res.status(200).json({
    success: true,
    count: vendors.length,
    data: vendors
  });
});

// @desc    Upload photo for vendor
// @route   PUT /api/vendors/photo
// @access  Private
exports.vendorPhotoUpload = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ ownerUserId: req.user.id });

  if (!vendor) {
    return next(
      new ErrorResponse('Vendor not found', 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${vendor._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    await Vendor.findByIdAndUpdate(vendor._id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

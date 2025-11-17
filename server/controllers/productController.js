const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  try {
    console.log('GET /products - Query params:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { category, minPrice, maxPrice, minRating, sortBy = 'newest', search, vendor } = req.query;
    console.log('Parsed params:', { page, limit, category, minPrice, maxPrice, minRating, sortBy, search, vendor });

    // Build filter object - don't filter by isActive to show all products
    const filter = {};
    
    // Only add filters if they have valid values
    if (category && category.trim() !== '') {
      filter.category = category.trim();
    }
    
    console.log('Using empty filter to show ALL products regardless of status');
    
    // Handle nested price structure
    if ((minPrice && minPrice.trim() !== '') || (maxPrice && maxPrice.trim() !== '')) {
      filter['price.sellingPrice'] = {};
      
      if (minPrice && minPrice.trim() !== '') {
        filter['price.sellingPrice'].$gte = parseFloat(minPrice);
      }
      
      if (maxPrice && maxPrice.trim() !== '') {
        filter['price.sellingPrice'].$lte = parseFloat(maxPrice);
      }
    }
    
    if (minRating && minRating.trim() !== '') {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }
    
    if (vendor && vendor.trim() !== '') {
      filter.vendorId = vendor.trim();
    }
    
    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
    }

  // Build sort object
  let sort = {};
  switch (sortBy) {
    case 'price_asc':
      sort = { 'price.sellingPrice': 1 };
      break;
    case 'price_desc':
      sort = { 'price.sellingPrice': -1 };
      break;
    case 'rating':
      sort = { 'rating.average': -1 };
      break;
    case 'popularity':
      sort = { 'sales.totalSold': -1 };
      break;
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    default: // newest
      sort = { createdAt: -1 };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  console.log('Product filter:', JSON.stringify(filter));
  console.log('Product sort:', JSON.stringify(sort));
  
  // Execute query with proper error handling
  try {
    console.log('Executing product query with filter:', JSON.stringify(filter));
    console.log('Sort:', JSON.stringify(sort));
    console.log('Pagination:', { skip, limit });
    
    // First check if there are any products at all
    const totalInDb = await Product.countDocuments({});
    console.log(`Total products in database (no filter): ${totalInDb}`);
    
    if (totalInDb === 0) {
      console.log('WARNING: No products found in database at all!');
    }
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendorId', 'shopName category rating')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean(),
      Product.countDocuments(filter)
    ]);
    
    console.log(`Query returned ${products.length} products out of ${total} matching the filter`);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    console.log(`Found ${products.length} products out of ${total} total`);
    if (products.length > 0) {
      console.log('First product ID:', products[0]._id);
      console.log('First product details:', JSON.stringify(products[0], null, 2));
    } else {
      console.log('No products found with filter:', JSON.stringify(filter, null, 2));
      
      // Let's check if there are any products in the database at all
      const allProducts = await Product.countDocuments({});
      console.log(`Total products in database (no filter): ${allProducts}`);
      
      if (allProducts > 0) {
        // Get a sample product to see its structure
        const sampleProduct = await Product.findOne({}).lean();
        console.log('Sample product structure:', JSON.stringify(sampleProduct, null, 2));
      }
    }

    // Return response with multiple data formats for compatibility
    // Make sure we're returning data in ALL possible formats that the frontend might expect
    const response = {
      success: true,
      count: products.length,
      data: products,
      products: products, // Alternative format
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit
      }
    };
    
    console.log('Sending response with formats:', Object.keys(response));
    console.log(`Response contains ${response.data.length} products`);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
} catch (error) {
  console.error('Error in getProducts:', error);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: error.message
  });
}
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('vendor', 'shopName logo rating')
    .populate('reviews.user', 'name avatar');

  if (!product || !product.isActive) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Increment view count
  product.stats.views += 1;
  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// No longer using file cleanup utility since we're not uploading files

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Vendor
exports.createProduct = asyncHandler(async (req, res, next) => {
  try {
    // Extract data from request body
    const {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      brand,
      price, // This could be flat or nested
      stock, // This could be flat stock quantity
      unit, // This could be flat unit
      tags,
      isActive,
      isFeatured
    } = req.body;
    
    // Find the vendor
    const vendor = await Vendor.findById(req.user.vendor);
    
    if (!vendor) {
      return next(
        new ErrorResponse(`No vendor found with id ${req.user.vendor}`, 404)
      );
    }
    
    
    // Transform flat data into nested structure
    const productData = {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      brand,
      vendorId: req.user.vendor,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      
      // Handle price - could be flat or nested
      price: {
        mrp: typeof price === 'object' ? price.mrp : Number(price),
        sellingPrice: typeof price === 'object' ? price.sellingPrice : Number(price),
        discountPercentage: typeof price === 'object' ? (price.discountPercentage || 0) : 0
      },
      
      // Handle inventory - could be flat or nested
      inventory: {
        stock: typeof stock === 'object' ? stock.quantity : Number(stock || 0),
        unit: typeof unit === 'object' ? unit.type : (unit || 'piece')
      },
      
    };
    
    console.log('Creating product with data:', JSON.stringify(productData, null, 2));
    
    // Create the product
    const product = await Product.create(productData);
    
    // Add product to vendor's products array
    if (!vendor.products) vendor.products = [];
    vendor.products.push(product._id);
    await vendor.save();
    
    console.log(`Product ${product._id} added to vendor ${vendor._id}'s products array`);
    console.log(`Vendor now has ${vendor.products.length} products`);
    
    // No need to clean up files since we're not using Cloudinary
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // No need to clean up files since we're not using Cloudinary
    
    return next(new ErrorResponse(error.message, 500));
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Vendor
exports.updateProduct = asyncHandler(async (req, res, next) => {
  console.log('=== UPDATE PRODUCT START ===');
  console.log('Product ID:', req.params.id);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.vendor.toString() !== req.user.vendor && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, 401)
    );
  }

  // Prevent changing vendor
  if (req.body.vendor && req.body.vendor !== product.vendor.toString()) {
    return next(
      new ErrorResponse('Cannot change product vendor', 400)
    );
  }

  // Process the request body to handle nested fields
  const updateData = { ...req.body };
  console.log('Initial updateData keys:', Object.keys(updateData));

  // Handle nested price fields
  if (req.body['price[mrp]'] || req.body['price[sellingPrice]']) {
    updateData.price = {
      mrp: req.body['price[mrp]'] ? parseFloat(req.body['price[mrp]']) : product.price?.mrp,
      sellingPrice: req.body['price[sellingPrice]'] ? parseFloat(req.body['price[sellingPrice]']) : product.price?.sellingPrice,
      discountPercentage: req.body['price[discountPercentage]'] ? parseFloat(req.body['price[discountPercentage]']) : product.price?.discountPercentage || 0
    };
    delete updateData['price[mrp]'];
    delete updateData['price[sellingPrice]'];
    delete updateData['price[discountPercentage]'];
  }

  // Handle nested inventory fields
  if (req.body['inventory[stock]'] || req.body['inventory[unit]']) {
    updateData.inventory = {
      stock: req.body['inventory[stock]'] ? parseInt(req.body['inventory[stock]']) : product.inventory?.stock,
      unit: req.body['inventory[unit]'] || product.inventory?.unit || 'piece'
    };
    delete updateData['inventory[stock]'];
    delete updateData['inventory[unit]'];
  }

  // Handle nutrition fields
  if (Object.keys(req.body).some(key => key.startsWith('nutrition['))) {
    const nutrition = product.nutrition || {};
    
    if (req.body['nutrition[flavour]']) nutrition.flavour = req.body['nutrition[flavour]'];
    if (req.body['nutrition[sugarProfile]']) nutrition.sugarProfile = req.body['nutrition[sugarProfile]'];
    
    // Handle nested nutrition values
    if (req.body['nutrition[proteinPer100g][value]']) {
      nutrition.proteinPer100g = {
        value: parseFloat(req.body['nutrition[proteinPer100g][value]']),
        unit: 'g'
      };
    }
    if (req.body['nutrition[energyPer100g][value]']) {
      nutrition.energyPer100g = {
        value: parseFloat(req.body['nutrition[energyPer100g][value]']),
        unit: 'kcal'
      };
    }
    if (req.body['nutrition[fatPer100g][value]']) {
      nutrition.fatPer100g = {
        value: parseFloat(req.body['nutrition[fatPer100g][value]']),
        unit: 'g'
      };
    }
    if (req.body['nutrition[sodiumPer100g][value]']) {
      nutrition.sodiumPer100g = {
        value: parseFloat(req.body['nutrition[sodiumPer100g][value]']),
        unit: 'mg'
      };
    }
    if (req.body['nutrition[carbohydratesPer100g][value]']) {
      nutrition.carbohydratesPer100g = {
        value: parseFloat(req.body['nutrition[carbohydratesPer100g][value]']),
        unit: 'g'
      };
    }
    if (req.body['nutrition[addedSugarsPer100g][value]']) {
      nutrition.addedSugarsPer100g = {
        value: parseFloat(req.body['nutrition[addedSugarsPer100g][value]']),
        unit: 'g'
      };
    }
    if (req.body['nutrition[totalSugarPer100g][value]']) {
      nutrition.totalSugarPer100g = {
        value: parseFloat(req.body['nutrition[totalSugarPer100g][value]']),
        unit: 'g'
      };
    }
    
    updateData.nutrition = nutrition;
    
    // Remove all nutrition[...] keys
    Object.keys(updateData).forEach(key => {
      if (key.startsWith('nutrition[')) {
        delete updateData[key];
      }
    });
  }

  // Handle keyFeatures (comma-separated string to array)
  if (req.body.keyFeatures) {
    if (typeof req.body.keyFeatures === 'string') {
      updateData.keyFeatures = req.body.keyFeatures
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
    }
  }

  // Handle ingredients
  if (req.body.ingredients) {
    updateData.ingredients = req.body.ingredients;
  }

  // Handle unitSize
  if (req.body.unitSize) {
    updateData.unitSize = req.body.unitSize;
  }

  console.log('Final updateData to save:', JSON.stringify(updateData, null, 2));
  
  product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  console.log('Product after update:', JSON.stringify(product, null, 2));
  console.log('=== UPDATE PRODUCT END ===');

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Vendor
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.vendor.toString() !== req.user.vendor && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this product`, 401)
    );
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  // Remove from vendor's products array
  await Vendor.findByIdAndUpdate(product.vendor, {
    $pull: { products: product._id }
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload photo for product
// @route   PUT /api/products/:id/photo
// @access  Private/Vendor
exports.productPhotoUpload = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner or admin
  if (product.vendor.toString() !== req.user.vendor && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, 401)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  const maxSize = process.env.MAX_FILE_UPLOAD || 1000000;
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${parseInt(maxSize) / 1000}KB`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${product._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add to product images array
    product.images.push(file.name);
    await product.save();

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ 
    isActive: true,
    isFeatured: true 
  })
  .limit(10)
  .populate('vendor', 'shopName logo');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ 
    category: req.params.category,
    isActive: true 
  })
  .populate('vendor', 'shopName logo');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get products by vendor
// @route   GET /api/products/vendor/:vendorId
// @access  Public
exports.getProductsByVendor = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ 
    vendor: req.params.vendorId,
    isActive: true 
  })
  .populate('vendor', 'shopName logo');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

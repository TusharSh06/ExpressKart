const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, query, param, validationResult } = require('express-validator');
const { protect, authorize, isVendor, isOwnerOrAdmin } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { cloudinary, storage } = require('../config/cloudinary');

// Multer upload middleware for Cloudinary
const upload = multer({ storage });

// Validation middleware
const validateProduct = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  // Reduce minimum description length to 5 characters
  body('description').trim().isLength({ min: 5, max: 1000 }).withMessage('Description must be at least 5 characters'),
  // Support nested price structure - don't validate the price object itself
  body('price.mrp').optional().isFloat({ min: 0 }).withMessage('Price MRP must be a positive number'),
  body('price.sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  // Support flat price structure
  body('price[mrp]').optional().isFloat({ min: 0 }).withMessage('Price MRP must be a positive number'),
  body('price[sellingPrice]').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  // Support both nested and flat inventory structure
  body('inventory.stock').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('inventory[stock]').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('stock.quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
];

// Public Routes

// Simple route to get all products without validation (for shop page)
router.get('/all', async (req, res) => {
  try {
    console.log('=== GET /products/all - Product listing with filters ===');
    console.log('Query params:', req.query);
    
    // Parse pagination params with safe defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Category filter
    if (req.query.category && req.query.category.trim() !== '') {
      filter.category = req.query.category.trim();
      console.log(`Filtering by category: ${req.query.category}`);
    }
    
    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter['price.sellingPrice'] = {};
      if (req.query.minPrice) {
        filter['price.sellingPrice'].$gte = parseFloat(req.query.minPrice);
        console.log(`Min price: ${req.query.minPrice}`);
      }
      if (req.query.maxPrice) {
        filter['price.sellingPrice'].$lte = parseFloat(req.query.maxPrice);
        console.log(`Max price: ${req.query.maxPrice}`);
      }
    }
    
    // Rating filter
    if (req.query.minRating) {
      filter['rating.average'] = { $gte: parseFloat(req.query.minRating) };
      console.log(`Min rating: ${req.query.minRating}`);
    }
    
    // Vendor filter
    if (req.query.vendor && req.query.vendor.trim() !== '') {
      filter.vendorId = req.query.vendor.trim();
      console.log(`Filtering by vendor: ${req.query.vendor}`);
    }
    
    // Search filter
    if (req.query.search && req.query.search.trim() !== '') {
      const searchRegex = { $regex: req.query.search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [new RegExp(req.query.search.trim(), 'i')] } }
      ];
      console.log(`Search query: ${req.query.search}`);
    }
    
    // Build sort object
    let sort = { createdAt: -1 }; // Default: newest
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
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
        default:
          sort = { createdAt: -1 };
      }
      console.log(`Sort by: ${req.query.sortBy}`);
    }
    
    // Count total matching products
    const totalInDb = await Product.countDocuments(filter);
    console.log(`Total products matching filters: ${totalInDb}`);
    
    // Execute query
    const products = await Product.find(filter)
      .populate('vendorId', 'shopName businessName category rating')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Returned ${products.length} products for page ${page}`);
    if (products.length > 0) {
      console.log('First product:', {
        id: products[0]._id,
        title: products[0].title,
        price: products[0].price?.sellingPrice,
        rating: products[0].rating?.average
      });
    }
    
    // Get unique vendors who have products
    const vendorsWithProducts = await Vendor.find({ products: { $exists: true, $ne: [] } })
      .select('shopName businessName')
      .limit(10)
      .lean();
    
    console.log(`Found ${vendorsWithProducts.length} vendors with products`);
    console.log('=== GET /products/all END ===');
    
    // Return response with multiple formats for compatibility
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      products: products, // Alternative format
      vendors: vendorsWithProducts, // Include vendors for filtering
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalInDb / limit),
        totalProducts: totalInDb,
        hasNextPage: page < Math.ceil(totalInDb / limit),
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Error in /products/all route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all products with filters and pagination
router.get('/', [

  query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100').optional(),
  query('category').optional({ nullable: true, checkFalsy: true }).trim(),
  query('minPrice').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Min price must be positive').optional(),
  query('maxPrice').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Max price must be positive').optional(),
  query('minRating').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 5 }).withMessage('Rating must be 0-5').optional(),
  query('sortBy').optional({ nullable: true, checkFalsy: true }).isIn(['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'popularity']).optional(),
  query('search').optional({ nullable: true, checkFalsy: true }).trim(),
  query('vendor').optional({ nullable: true, checkFalsy: true }).trim()
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

    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'newest',
      search,
      vendor
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter['price.sellingPrice'] = {};
      if (minPrice) filter['price.sellingPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.sellingPrice'].$lte = parseFloat(maxPrice);
    }
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (vendor) filter.vendorId = vendor;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'price_asc':
        sort = { 'price.sellingPrice': 1 };
        break;
      case 'price_desc':
        sort = { 'price.sellingPrice': -1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'popularity':
        sort = { sales: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendorId', 'shopName category rating')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // Add more detailed logging
    console.log('Found products in main listing:', products.length);
    if (products.length > 0) {
      console.log('First product ID:', products[0]._id);
    }
    
    // Return data in multiple formats for compatibility
    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      products: products, // Alternative format
      count: products.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
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

// Get product by ID - with relaxed validation
router.get('/detail/:id', async (req, res) => {
  console.log('GET /products/detail/:id - Fallback product detail route for ID:', req.params.id);
  try {
    // Try to find product by any field that might match the ID
    const product = await Product.findOne({
      $or: [
        { _id: req.params.id },
        { id: req.params.id },
        { slug: req.params.id },
        { sku: req.params.id }
      ]
    }).populate('vendorId', 'shopName category rating address geo deliveryRadiusKm').lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with any identifier matching: ' + req.params.id
      });
    }
    
    // Add more debugging information
    console.log(`Product ${product._id} details found via fallback route`);
    
    // Enhanced response with availability information
    const isAvailable = product.isActive !== false;
    res.json({
      success: true,
      message: 'Product retrieved successfully via fallback route',
      data: product,
      isAvailable: isAvailable,
      statusMessage: isAvailable ? 'Product is available' : 'Product is currently not active'
    });
  } catch (error) {
    console.error('Error in fallback product route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// Get product by ID - with relaxed validation
router.get('/:id', async (req, res) => {
  console.log('GET /products/:id - Product detail request for ID:', req.params.id);
  try {

    // Handle potential invalid MongoDB ID format
    let product;
    try {
      product = await Product.findById(req.params.id)
        .populate('vendorId', 'shopName category rating address geo deliveryRadiusKm')
        .lean();
    } catch (findError) {
      console.error('Error finding product by ID:', findError);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: findError.message
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Allow viewing all products regardless of active status
    // Just add a note in the response if the product is not active
    const isAvailable = product.isActive !== false;

    // Add more debugging information
    console.log(`Product ${product._id} details requested. Active status: ${product.isActive}`);
    
    // Enhanced response with availability information
    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
      isAvailable: isAvailable,
      statusMessage: isAvailable ? 'Product is available' : 'Product is currently not active'
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// Search products with suggestions
router.get('/search/suggestions', [
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
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

    const { q } = req.query;
    const searchRegex = new RegExp(q, 'i');

    const [products, categories, vendors] = await Promise.all([
      Product.find({
        title: searchRegex,
        isActive: true
      })
        .select('title category')
        .limit(5)
        .lean(),
      Product.distinct('category', { 
        category: searchRegex,
        isActive: true 
      }),
      Vendor.find({
        shopName: searchRegex,
        status: 'active'
      })
        .select('shopName category')
        .limit(3)
        .lean()
    ]);

    const suggestions = [
      ...products.map(p => ({ type: 'product', text: p.title, category: p.category })),
      ...categories.map(c => ({ type: 'category', text: c })),
      ...vendors.map(v => ({ type: 'vendor', text: v.shopName, category: v.category }))
    ];

    res.json({
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
});

// Get products by category
router.get('/category/:category', [
  param('category').trim().notEmpty().withMessage('Category is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find({
        category: { $regex: category, $options: 'i' },
        isActive: true
      })
        .populate('vendorId', 'shopName category rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments({
        category: { $regex: category, $options: 'i' },
        isActive: true
      })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      message: 'Category products retrieved successfully',
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category products',
      error: error.message
    });
  }
});

// Get trending products
router.get('/trending', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ sales: -1, rating: -1 })
      .limit(10)
      .populate('vendorId', 'shopName category rating')
      .lean();

    res.json({
      success: true,
      message: 'Trending products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products',
      error: error.message
    });
  }
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true,
      isFeatured: true 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('vendorId', 'shopName category rating')
      .lean();

    res.json({
      success: true,
      message: 'Featured products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
});

// Get nearby products (requires lat/lng coordinates)
router.get('/nearby', [
  query('lat').isFloat().withMessage('Latitude is required'),
  query('lng').isFloat().withMessage('Longitude is required'),
  query('radiusKm').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be 0.1-50 km'),
  query('category').optional().trim()
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

    const { lat, lng, radiusKm = 5, category } = req.query;
    const radiusMeters = radiusKm * 1000;

    // Find vendors within radius
    const nearbyVendors = await Vendor.find({
      status: 'active',
      geo: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusMeters
        }
      }
    }).select('_id');

    if (nearbyVendors.length === 0) {
      return res.json({
        success: true,
        message: 'No nearby products found',
        data: []
      });
    }

    // Find products from nearby vendors
    const filter = {
      vendorId: { $in: nearbyVendors.map(v => v._id) },
      isActive: true
    };

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const products = await Product.find(filter)
      .populate('vendorId', 'shopName category rating address geo')
      .sort({ rating: -1, sales: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      message: 'Nearby products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Error fetching nearby products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby products',
      error: error.message
    });
  }
});

// Private Routes (require authentication)

// Create new product (vendor only)
router.post('/', [
  protect,
  authorize('vendor'),
  upload.array('images', 6) // Multer middleware to handle image uploads
], async (req, res, next) => {
  try {
    // Log the request body and files for debugging
    console.log('=== Product Creation Request ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.files:', req.files);
    console.log('req.files length:', req.files ? req.files.length : 'undefined');
    if (req.files && req.files.length > 0) {
      console.log('First file:', {
        filename: req.files[0].filename,
        path: req.files[0].path,
        mimetype: req.files[0].mimetype,
        size: req.files[0].size
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Check if vendor has an active profile
    const vendor = await Vendor.findOne({ 
      ownerUserId: req.user._id,
      status: 'active'
    });

    console.log('Found vendor:', vendor ? `ID: ${vendor._id}, Name: ${vendor.shopName}` : 'No vendor found');

    if (!vendor) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile not found or inactive'
      });
    }
    
    if (!vendor._id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID'
      });
    }

    // Already logged the request at the beginning of the function
    
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
    
    // Handle images from Cloudinary upload
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,        // Cloudinary secure URL
        public_id: file.filename  // Cloudinary public_id for deletion
      }));
      console.log('Images uploaded to Cloudinary:', images);
    }
    
    // Transform flat data into nested structure
    const productData = {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      brand,
      vendorId: vendor._id, // Use 'vendorId' to match the schema field name
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      isActive: true, // Explicitly set to true for new products
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      images, // Add images array
      
      // Handle price - properly parse nested price object
      price: {
        mrp: req.body.price && req.body.price.mrp 
          ? Number(req.body.price.mrp) 
          : Number(req.body.mrp || 100), // Try flat field or use fallback
        sellingPrice: req.body.price && req.body.price.sellingPrice 
          ? Number(req.body.price.sellingPrice) 
          : Number(req.body.sellingPrice || 100), // Try flat field or use fallback
        discountPercentage: req.body.price && req.body.price.discountPercentage 
          ? Number(req.body.price.discountPercentage) 
          : 0
      },
      
      // Handle inventory - properly parse nested inventory object
      inventory: {
        stock: req.body.inventory && req.body.inventory.stock 
          ? Number(req.body.inventory.stock) 
          : Number(req.body.stock || 10), // Try flat field or use fallback
        unit: req.body.inventory && req.body.inventory.unit 
          ? req.body.inventory.unit 
          : (req.body.unit || 'piece') // Try flat field or use fallback
      },
      
    };
    
    console.log('Creating product with data:', JSON.stringify(productData, null, 2));
    
    // Log the parsed price and inventory values
    console.log('Parsed price values:', {
      mrp: productData.price.mrp,
      sellingPrice: productData.price.sellingPrice,
      discountPercentage: productData.price.discountPercentage
    });
    
    console.log('Parsed inventory values:', {
      stock: productData.inventory.stock,
      unit: productData.inventory.unit
    });
    
    // Create product
    const product = await Product.create(productData);

    console.log('Product created successfully:', product._id);
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // More detailed error handling
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = {};
      
      // Extract validation error messages
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Update product (owner or admin)
router.put('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid product ID'),
  upload.array('images', 6), // Multer middleware to handle image uploads
  ...validateProduct
], async (req, res) => {
  try {
    console.log('=== PUT /products/:id - Update Product ===');
    console.log('Product ID:', req.params.id);
    console.log('req.files:', req.files ? `${req.files.length} files` : 'undefined');
    console.log('req.body keys:', Object.keys(req.body));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership or admin status
    if (!isOwnerOrAdmin(req.user, product.vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,        // Cloudinary secure URL
        public_id: file.filename  // Cloudinary public_id for deletion
      }));
      console.log('New images uploaded to Cloudinary:', newImages);
      // Append new images to existing images
      product.images.push(...newImages);
    }

    // Update other fields
    const updateData = { ...req.body };
    console.log('Updating product with fields:', Object.keys(updateData));
    Object.assign(product, updateData);
    const updatedProduct = await product.save();
    console.log('Product saved successfully with', updatedProduct.images?.length || 0, 'images');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// ========== CLOUDINARY IMAGE ROUTES ==========

// Add images to a product (Cloudinary)
router.post('/:id/images', [
  protect,
  authorize(['vendor', 'admin']),
  upload.array('images', 6) // Max 6 images per upload
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership or admin status
    if (!isOwnerOrAdmin(req.user, product.vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Check max images limit (6 total)
    if (product.images.length + req.files.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 images allowed per product'
      });
    }

    // Add new images to product
    const newImages = req.files.map(file => ({
      url: file.path, // Cloudinary secure URL
      public_id: file.filename // Cloudinary public_id
    }));

    product.images.push(...newImages);
    await product.save();

    res.status(201).json({
      success: true,
      message: `${req.files.length} image(s) added successfully`,
      data: product
    });
  } catch (error) {
    console.error('Error adding product images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product images',
      error: error.message
    });
  }
});

// Delete a single image from product (and Cloudinary)
router.delete('/:id/images/:publicId', [
  protect,
  authorize(['vendor', 'admin'])
], async (req, res) => {
  try {
    const { id, publicId } = req.params;
    
    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership or admin status
    if (!isOwnerOrAdmin(req.user, product.vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Find the image in the product
    const imageIndex = product.images.findIndex(img => img.public_id === publicId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in product'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('Cloudinary delete failed:', err.message);
      // Continue to remove from DB anyway
    }

    // Remove from product images array
    product.images.splice(imageIndex, 1);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product image',
      error: error.message
    });
  }
});

// Delete all images from product (when deleting product)
router.delete('/:id/images', [
  protect,
  authorize(['vendor', 'admin'])
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership or admin status
    if (!isOwnerOrAdmin(req.user, product.vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Delete all images from Cloudinary
    for (const image of product.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (err) {
        console.warn(`Failed to delete image ${image.public_id}:`, err.message);
      }
    }

    // Clear images array
    product.images = [];
    await product.save();

    res.status(200).json({
      success: true,
      message: 'All images deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Error deleting all product images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product images',
      error: error.message
    });
  }
});

// Delete product (owner or admin)
router.delete('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership or admin status
    if (!isOwnerOrAdmin(req.user, product.vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// Get vendor's products
router.get('/vendor/me', [
  protect,
  authorize('vendor')
], async (req, res) => {
  try {
    console.log('Fetching vendor products for user:', req.user._id);
    const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
    if (!vendor) {
      console.log('Vendor not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }
    console.log('Found vendor:', vendor._id);

    const products = await Product.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Found products for vendor:', products.length);
    console.log('Product IDs:', products.map(p => p._id));

    // The frontend expects products directly in the data field, not nested
    // Format the response to match what the frontend expects
    console.log('Sending response with data length:', products.length);
    console.log('First product (if any):', products.length > 0 ? JSON.stringify(products[0], null, 2) : 'No products');
    
    // Send the response in multiple formats to ensure compatibility
    const response = {
      success: true,
      count: products.length,
      message: 'Vendor products retrieved successfully',
      data: products,  // Format 1: This is what the frontend expects as productsRes.data
      products: products  // Format 2: Alternative format some frontends might expect
    };
    
    console.log('Sending full response:', JSON.stringify(response));
    res.json(response);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor products',
      error: error.message
    });
  }
});

module.exports = router;

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { 
    items, 
    shippingAddress, 
    paymentMethod, 
    total,
    deliveryOption,
    discountCode
  } = req.body;

  console.log('=== CREATE ORDER START ===');
  console.log('Creating order with payload:', req.body);
  console.log('User ID:', req.user._id);

  if (!items || items.length === 0) {
    return next(new ErrorResponse('No order items', 400));
  }

  if (!shippingAddress) {
    return next(new ErrorResponse('Shipping address is required', 400));
  }

  if (!paymentMethod) {
    return next(new ErrorResponse('Payment method is required', 400));
  }

  // Calculate subtotal from items and get vendor info
  let subtotal = 0;
  const orderItems = [];
  let vendorId = null;
  
  console.log('Processing items:', items.length);
  for (const item of items) {
    console.log('Processing item:', item.product);
    const product = await Product.findById(item.product);
    
    if (!product) {
      console.error('Product not found:', item.product);
      return next(new ErrorResponse(`Product not found: ${item.product}`, 404));
    }
    
    console.log('Product found:', product.title, 'VendorId:', product.vendorId);
    
    // Get vendor from product - Product model uses vendorId field
    if (!vendorId && product.vendorId) {
      vendorId = product.vendorId;
      console.log('Set vendorId to:', vendorId);
    }
    
    const itemPrice = item.price || product.price?.sellingPrice || product.price;
    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;
    
    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      price: itemPrice,
      total: itemTotal
    });
  }

  // If no vendor found, log error and return
  if (!vendorId) {
    console.error('No vendor found for order items');
    return next(new ErrorResponse('No vendor found for order items', 400));
  }
  
  // Ensure vendorId is an ObjectId and validate it
  const mongoose = require('mongoose');
  if (typeof vendorId === 'string') {
    vendorId = mongoose.Types.ObjectId(vendorId);
  }
  
  // Validate vendorId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    console.error('Invalid vendorId format:', vendorId);
    return next(new ErrorResponse('Invalid vendor ID', 400));
  }
  
  // Verify vendor exists
  const Vendor = require('../models/Vendor');
  const vendorExists = await Vendor.findById(vendorId);
  if (!vendorExists) {
    console.error('Vendor not found for vendorId:', vendorId);
    return next(new ErrorResponse('Vendor not found', 404));
  }
  
  console.log('Order will be created with vendorId:', vendorId.toString(), 'for vendor:', vendorExists.businessName);

  // Calculate delivery fee based on option
  const shipping = deliveryOption === 'express' ? 100 : 50;
  
  // Generate order number
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get count of orders for today
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const orderCount = await Order.countDocuments({
    createdAt: { $gte: todayStart, $lt: todayEnd }
  });
  
  const sequence = (orderCount + 1).toString().padStart(4, '0');
  const orderNumber = `EK${year}${month}${day}${sequence}`;
  
  // Create order with Order model schema
  const order = new Order({
    orderNumber,
    userId: req.user._id,
    vendorId,
    items: orderItems,
    subtotal,
    shipping,
    tax: 0,
    discount: 0,
    total: total || (subtotal + shipping),
    paymentMethod: paymentMethod === 'credit_card' ? 'card' : paymentMethod === 'cash_on_delivery' ? 'cod' : paymentMethod,
    deliveryAddress: {
      line1: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.zipCode,
      country: shippingAddress.country || 'India'
    },
    customer: {
      name: req.user.name,
      email: req.user.email,
      phone: shippingAddress.phone,
      address: {
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.zipCode,
        country: shippingAddress.country || 'India'
      }
    },
    status: 'pending',
    paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
  });
  
  // Save order
  const createdOrder = await order.save();
  
  // Verify order was saved with correct vendorId
  if (!createdOrder.vendorId || createdOrder.vendorId.toString() !== vendorId.toString()) {
    console.error('ERROR: Order saved with incorrect vendorId!');
    console.error('Expected vendorId:', vendorId.toString());
    console.error('Saved vendorId:', createdOrder.vendorId);
    // Still return success but log the error for investigation
  }
  
  console.log('Order created successfully:', createdOrder._id, 'Order Number:', createdOrder.orderNumber, 'VendorId:', createdOrder.vendorId);
  console.log('=== CREATE ORDER END ===');
  
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: createdOrder
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res, next) => {
  try {
    console.log('Getting order by ID:', req.params.id)
    console.log('User:', req.user._id, 'Role:', req.user.role)
    
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'title price images');

    if (!order) {
      console.log('Order not found:', req.params.id)
      return next(new ErrorResponse('Order not found', 404));
    }
    
    console.log('Order found:', order._id, 'User:', order.userId._id)
    
    // Check if user is authorized to view this order
    // Allow if: user owns the order, user is admin, or user is the vendor
    const isOwner = order.userId._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    
    // For vendor check, need to look up vendor profile
    let isVendor = false
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
      if (vendor && vendor._id.toString() === order.vendorId.toString()) {
        isVendor = true
      }
    }
    
    console.log('Authorization check - isOwner:', isOwner, 'isAdmin:', isAdmin, 'isVendor:', isVendor)
    
    if (!isOwner && !isAdmin && !isVendor) {
      console.log('Not authorized to view this order')
      return next(new ErrorResponse('Not authorized to view this order', 401));
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrderById:', error)
    return next(new ErrorResponse('Error fetching order: ' + error.message, 500));
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }
  
  // Check if user is authorized
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this order', 401));
  }
  
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer.email_address,
  };
  
  const updatedOrder = await order.save();
  
  // TODO: Send email notification to user and vendors
  
  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }
  
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  
  const updatedOrder = await order.save();
  
  // TODO: Send delivery notification to user
  
  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Get logged in user orders
// @route   GET /api/orders/my/orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  console.log('Getting orders for user:', req.user._id);
  
  const orders = await Order.find({ userId: req.user._id })
    .sort({ createdAt: -1 });
  
  console.log('Found orders:', orders.length);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({})
    .populate('userId', 'id name email')
    .sort({ createdAt: -1 });
  
  console.log(`Admin fetching all orders. Found: ${orders.length} orders`);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get vendor's orders
// @route   GET /api/orders/vendor/orders
// @access  Private/Vendor
exports.getVendorOrders = asyncHandler(async (req, res, next) => {
  console.log('=== GET VENDOR ORDERS ===')
  console.log('User ID:', req.user._id)
  console.log('User Role:', req.user.role)
  
  // Check if user is a vendor
  if (req.user.role !== 'vendor') {
    return next(new ErrorResponse('Not a vendor', 400));
  }
  
  // Find the vendor profile for this user
  const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
  
  console.log('Vendor found:', vendor?._id)
  
  if (!vendor) {
    console.log('No vendor profile found for user:', req.user._id)
    return next(new ErrorResponse('Vendor profile not found', 404));
  }
  
  console.log('Searching for orders with vendorId:', vendor._id)
  
  // Find orders that have items from this vendor
  const orders = await Order.find({ vendorId: vendor._id })
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 });
  
  console.log('Orders found:', orders.length)
  if (orders.length > 0) {
    console.log('First order vendorId:', orders[0].vendorId)
    console.log('First order data:', {
      orderNumber: orders[0].orderNumber,
      userId: orders[0].userId,
      vendorId: orders[0].vendorId,
      status: orders[0].status
    })
  }
  console.log('=== END GET VENDOR ORDERS ===')
  
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new ErrorResponse('Please provide a status', 400));
  }
  
  // Validate status is one of allowed values
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
  }
  
  const order = await Order.findById(req.params.id).populate('userId');
  
  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }
  
  // Check if user is vendor and owns this order
  if (req.user.role === 'vendor') {
    // Find vendor profile
    const vendor = await Vendor.findOne({ ownerUserId: req.user._id });
    
    if (!vendor) {
      return next(new ErrorResponse('Vendor profile not found', 404));
    }
    
    // Check if this order belongs to this vendor
    if (order.vendorId.toString() !== vendor._id.toString()) {
      return next(new ErrorResponse('Not authorized to update this order', 401));
    }
  } else if (req.user.role !== 'admin') {
    // Only vendors and admins can update order status
    return next(new ErrorResponse('Not authorized to update order status', 401));
  }
  
  // Update order status
  order.status = status;
  
  // Update paymentStatus based on order status
  if (status === 'delivered') {
    order.paymentStatus = 'paid';
  } else if (status === 'cancelled') {
    order.paymentStatus = 'refunded';
  }
  
  await order.save();
  
  console.log(`Order ${order.orderNumber} status updated to ${status} by ${req.user.name}`);
  
  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }
  
  // Check if user is authorized
  if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this order', 401));
  }
  
  // Check if order can be cancelled
  if (order.status === 'cancelled') {
    return next(new ErrorResponse('Order is already cancelled', 400));
  }
  
  if (order.status === 'delivered' || order.status === 'completed') {
    return next(new ErrorResponse('Cannot cancel a delivered or completed order', 400));
  }
  
  // Update order status
  order.status = 'cancelled';
  order.paymentStatus = 'refunded';
  
  await order.save();
  
  console.log(`Order ${order.orderNumber} cancelled by ${req.user.name}`);
  
  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

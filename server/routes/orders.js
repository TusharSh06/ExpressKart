const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getOrderById, 
  getMyOrders, 
  getOrders, 
  getVendorOrders, 
  updateOrderStatus,
  updateOrderToPaid,
  updateOrderToDelivered,
  cancelOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Create order - MUST come before GET / to avoid route conflicts
router.post('/', protect, createOrder);

// Get user's orders - specific routes before generic ones
router.get('/my/orders', protect, getMyOrders);

// Get vendor's orders
router.get('/vendor/orders', protect, authorize('vendor'), getVendorOrders);

// Update order status (vendor)
router.put('/:id/status', protect, authorize('vendor'), updateOrderStatus);

// Update order to paid
router.put('/:id/pay', protect, updateOrderToPaid);

// Update order to delivered
router.put('/:id/deliver', protect, authorize('admin', 'vendor'), updateOrderToDelivered);

// Cancel order
router.put('/:id/cancel', protect, cancelOrder);

// Get order by ID - generic route after specific ones
router.get('/:id', protect, getOrderById);

// Get all orders (admin only) - MUST come last
router.get('/', protect, authorize('admin'), getOrders);

module.exports = router;

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const User = require('../models/User');

async function debugVendorOrderIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the vendor user (Arun)
    const vendorUser = await User.findOne({ email: 'arun@example.com' });
    console.log('\n=== VENDOR USER ===');
    console.log('User ID:', vendorUser?._id);
    console.log('User Name:', vendorUser?.name);
    console.log('User Email:', vendorUser?.email);

    // Get vendor profile for this user
    const vendor = await Vendor.findOne({ ownerUserId: vendorUser?._id });
    console.log('\n=== VENDOR PROFILE ===');
    console.log('Vendor ID:', vendor?._id);
    console.log('Vendor Name:', vendor?.businessName);
    console.log('Owner User ID:', vendor?.ownerUserId);

    // Get all products for this vendor
    const products = await Product.find({ vendorId: vendor?._id });
    console.log('\n=== VENDOR PRODUCTS ===');
    console.log('Total Products:', products.length);
    if (products.length > 0) {
      console.log('First Product:');
      console.log('  - ID:', products[0]._id);
      console.log('  - Title:', products[0].title);
      console.log('  - VendorId:', products[0].vendorId);
      console.log('  - VendorId matches vendor._id?', products[0].vendorId.toString() === vendor?._id.toString());
    }

    // Get all orders in the system
    const allOrders = await Order.find().populate('userId', 'name email').populate('vendorId', 'businessName');
    console.log('\n=== ALL ORDERS IN SYSTEM ===');
    console.log('Total Orders:', allOrders.length);
    
    allOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('  - Order Number:', order.orderNumber);
      console.log('  - User ID:', order.userId?._id);
      console.log('  - User Name:', order.userId?.name);
      console.log('  - Vendor ID:', order.vendorId);
      console.log('  - Vendor Name:', order.vendorId?.businessName || 'N/A');
      console.log('  - Status:', order.status);
      console.log('  - Created At:', order.createdAt);
    });

    // Check orders for this specific vendor
    const vendorOrders = await Order.find({ vendorId: vendor?._id }).populate('userId', 'name email');
    console.log('\n=== ORDERS FOR THIS VENDOR ===');
    console.log('Orders found:', vendorOrders.length);
    vendorOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('  - Order Number:', order.orderNumber);
      console.log('  - User:', order.userId?.name);
      console.log('  - Status:', order.status);
    });

    // Check if the recent order's vendorId matches any vendor
    const recentOrder = await Order.findOne().sort({ createdAt: -1 }).populate('userId', 'name email');
    if (recentOrder) {
      console.log('\n=== RECENT ORDER ANALYSIS ===');
      console.log('Order Number:', recentOrder.orderNumber);
      console.log('Order VendorId:', recentOrder.vendorId);
      console.log('Order VendorId Type:', typeof recentOrder.vendorId);
      
      const vendorForOrder = await Vendor.findById(recentOrder.vendorId);
      console.log('Vendor found for this order:', vendorForOrder?.businessName);
      console.log('Vendor Owner User ID:', vendorForOrder?.ownerUserId);
      
      // Check if this vendor's owner is the logged-in vendor user
      console.log('Is this the Arun vendor?', vendorForOrder?.ownerUserId.toString() === vendorUser?._id.toString());
    }

    await mongoose.connection.close();
    console.log('\n✅ Debug complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugVendorOrderIssue();

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function debugVendorOrders() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    console.log('Connecting to:', mongoUri.substring(0, 50) + '...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n=== DEBUGGING VENDOR ORDERS ===\n');

    // Get all vendors
    const vendors = await Vendor.find({}).select('_id ownerUserId businessName');
    console.log('Total Vendors:', vendors.length);
    vendors.forEach(v => {
      console.log(`  - ${v._id} (${v.businessName}) -> Owner: ${v.ownerUserId}`);
    });

    // Get all orders
    const orders = await Order.find({});
    console.log('\nTotal Orders:', orders.length);
    orders.forEach(o => {
      console.log(`  - ${o.orderNumber} (${o._id}) -> VendorId: ${o.vendorId}, UserId: ${o.userId}`);
      console.log(`    Items: ${o.items ? o.items.length : 0}`);
      if (o.items && o.items.length > 0) {
        o.items.forEach((item, idx) => {
          console.log(`      Item ${idx}: productId=${item.productId}, qty=${item.quantity}, price=${item.price}`);
        });
      }
    });

    // Get all products
    const products = await Product.find({}).select('_id vendorId title');
    console.log('\nTotal Products:', products.length);
    products.forEach(p => {
      console.log(`  - ${p.title} (${p._id}) -> VendorId: ${p.vendorId}`);
    });

    // Get all vendor users
    const vendorUsers = await User.find({ role: 'vendor' }).select('_id name email role password');
    console.log('\nVendor Users:', vendorUsers.length);
    vendorUsers.forEach(u => {
      console.log(`  - ${u.name} (${u._id}) - ${u.email}`);
    });
    
    // Get all users to see what's available
    const allUsers = await User.find({}).select('_id name email role');
    console.log('\nAll Users:', allUsers.length);
    allUsers.forEach(u => {
      console.log(`  - ${u.name} (${u._id}) - ${u.email} [${u.role}]`);
    });
    
    // Get user details for testing
    console.log('\n=== USER CREDENTIALS FOR TESTING ===');
    console.log('Note: Passwords are hashed, cannot retrieve them');
    console.log('Try using these emails with common passwords:');
    allUsers.forEach(u => {
      console.log(`  Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`);
    });

    // Check if vendor IDs match between products and orders
    console.log('\n=== VENDOR ID MATCHING ===');
    for (const order of orders) {
      const vendor = await Vendor.findById(order.vendorId);
      const productId = order.items && order.items.length > 0 ? order.items[0].productId : null;
      const product = productId ? await Product.findById(productId) : null;
      console.log(`Order ${order.orderNumber}:`);
      console.log(`  - Order VendorId: ${order.vendorId}`);
      console.log(`  - Vendor Found: ${vendor ? vendor.businessName : 'NOT FOUND'}`);
      console.log(`  - Product: ${product ? product.title : 'NOT FOUND'}`);
      console.log(`  - Product VendorId: ${product?.vendorId}`);
      console.log(`  - Items in order: ${order.items ? order.items.length : 0}`);
    }

    console.log('\n=== END DEBUG ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugVendorOrders();

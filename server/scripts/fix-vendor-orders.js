const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Order = require('../models/Order');
const Product = require('../models/Product');

async function fixVendorOrders() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    console.log('Connecting to:', mongoUri.substring(0, 50) + '...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n=== FIXING VENDOR ORDERS ===\n');

    // Get all orders
    const orders = await Order.find({});
    console.log('Total Orders:', orders.length);

    for (const order of orders) {
      console.log(`\nProcessing Order ${order.orderNumber}:`);
      console.log(`  Current VendorId: ${order.vendorId}`);

      if (!order.items || order.items.length === 0) {
        console.log('  ⚠️ Order has no items, skipping');
        continue;
      }

      // Get the first item's product to find the correct vendorId
      const product = await Product.findById(order.items[0].productId);
      
      if (!product) {
        console.log('  ❌ Product not found, skipping');
        continue;
      }

      console.log(`  Product VendorId: ${product.vendorId}`);

      if (order.vendorId.toString() !== product.vendorId.toString()) {
        console.log(`  🔧 Updating vendorId from ${order.vendorId} to ${product.vendorId}`);
        order.vendorId = product.vendorId;
        await order.save();
        console.log(`  ✅ Updated successfully`);
      } else {
        console.log(`  ✓ VendorId already correct`);
      }
    }

    console.log('\n=== FIX COMPLETE ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixVendorOrders();

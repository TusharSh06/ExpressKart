require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
    
    const count = await Product.countDocuments();
    console.log(`Total products in database: ${count}`);
    
    if (count > 0) {
      const products = await Product.find().limit(5).populate('vendorId', 'shopName businessName');
      console.log('Sample products:');
      products.forEach(product => {
        console.log(`- ${product.title} (Vendor: ${product.vendorId ? product.vendorId.shopName || product.vendorId.businessName : 'Unknown'})`);
      });
    }
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

async function createTestProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
    
    // Find a vendor to associate with the product
    const vendor = await Vendor.findOne();
    
    if (!vendor) {
      console.log('No vendors found. Please create a vendor first.');
      mongoose.disconnect();
      return;
    }
    
    console.log(`Found vendor: ${vendor.businessName || vendor.shopName} (${vendor._id})`);
    
    // Create a test product
    const productData = {
      title: "Test Product",
      description: "This is a test product description with details about the product.",
      shortDescription: "A test product",
      vendorId: vendor._id,
      category: "other",
      price: {
        mrp: 1000,
        sellingPrice: 800
      },
      inventory: {
        stock: 100,
        unit: "piece"
      },
      images: {
        primary: "https://via.placeholder.com/500"
      },
      isActive: true
    };
    
    const product = await Product.create(productData);
    console.log(`Created test product: ${product.title} (${product._id})`);
    
    // Add product to vendor's products array
    if (!vendor.products) vendor.products = [];
    vendor.products.push(product._id);
    await vendor.save();
    console.log(`Added product to vendor's products array`);
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

createTestProduct();

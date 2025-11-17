require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');

async function testCartAPI() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
    
    // Find a test user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('No user found. Please create a user first.');
      return;
    }
    console.log(`Found user: ${user.name} (${user._id})`);
    
    // Find a test product
    const product = await Product.findOne();
    if (!product) {
      console.log('No product found. Please create a product first.');
      return;
    }
    console.log(`Found product: ${product.title} (${product._id})`);
    
    // Check if cart exists for user
    let cart = await Cart.findOne({ user: user._id });
    if (cart) {
      console.log(`Existing cart found for user ${user._id}:`);
      console.log(`Cart has ${cart.items.length} items`);
    } else {
      console.log(`No cart found for user ${user._id}, creating new cart...`);
      cart = new Cart({
        user: user._id,
        items: []
      });
      await cart.save();
      console.log('New cart created');
    }
    
    // Add product to cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === product._id.toString()
    );
    
    if (existingItemIndex > -1) {
      console.log('Product already in cart, updating quantity...');
      cart.items[existingItemIndex].quantity += 1;
    } else {
      console.log('Adding product to cart...');
      cart.items.push({
        product: product._id,
        name: product.title,
        price: product.price?.sellingPrice || product.price || 100,
        quantity: 1,
        image: product.images?.primary || '',
        vendor: product.vendorId,
        vendorName: 'Test Vendor'
      });
    }
    
    await cart.save();
    console.log('Cart updated successfully');
    
    // Get updated cart
    cart = await Cart.findOne({ user: user._id }).populate('items.product');
    console.log('Updated cart:');
    console.log(`Cart has ${cart.items.length} items`);
    cart.items.forEach((item, index) => {
      console.log(`Item ${index + 1}: ${item.name}, Quantity: ${item.quantity}, Price: ${item.price}`);
    });
    
    console.log('Cart API test completed successfully');
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error testing cart API:', error);
  }
}

testCartAPI();

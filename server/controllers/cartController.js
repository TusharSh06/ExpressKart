const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    console.log('Getting cart for user:', req.user.id);
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'title price');
    
    if (!cart) {
      // Create a new cart if one doesn't exist
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    console.log('Adding to cart for user:', req.user.id);
    console.log('Request body:', req.body);
    
    const { productId, quantity, price, name, image, vendor, vendorName } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find the product to verify it exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }
    
    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item to cart
      const vendorObj = vendor ? await Vendor.findById(vendor).select('businessName shopName') : null;
      
      // Ensure price is an object with the required structure
      const priceData = price && typeof price === 'object' 
        ? price 
        : {
            mrp: product.price?.mrp || product.price?.sellingPrice || 0,
            sellingPrice: product.price?.sellingPrice || product.price || 0,
            discountPercentage: product.price?.discountPercentage || 0
          };
      
      cart.items.push({
        product: productId,
        name: name || product.title,
        price: priceData,
        quantity: quantity || 1,
        image: image || (product.images && product.images.primary) || '',
        vendor: vendor || product.vendorId,
        vendorName: vendorName || (vendorObj ? (vendorObj.shopName || vendorObj.businessName) : 'Unknown Vendor')
      });
    }
    
    await cart.save();
    
    // Populate product details for response
    await cart.populate('items.product', 'title price');
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = cart.items.filter(item => 
      item.product.toString() !== productId
    );
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

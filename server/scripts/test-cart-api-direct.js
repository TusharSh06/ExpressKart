require('dotenv').config();
const axios = require('axios');

// Get the token from command line arguments
const token = process.argv[2];

if (!token) {
  console.error('Please provide a token as a command line argument');
  console.log('Usage: node test-cart-api-direct.js YOUR_AUTH_TOKEN');
  process.exit(1);
}

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

async function testCartAPI() {
  try {
    console.log('Testing cart API...');
    
    // Test GET /api/cart
    console.log('\nTesting GET /api/cart...');
    try {
      const getResponse = await api.get('/cart');
      console.log('GET /api/cart response:', getResponse.data);
    } catch (error) {
      console.error('Error getting cart:', error.response?.data || error.message);
    }
    
    // Test POST /api/cart/add
    console.log('\nTesting POST /api/cart/add...');
    try {
      const addResponse = await api.post('/cart/add', {
        productId: '68fd7f18974ac10cd1ae0f85', // Replace with an actual product ID
        name: 'Test Product',
        price: 100,
        quantity: 1,
        image: 'https://via.placeholder.com/150',
        vendor: '68fd7e97974ac10cd1ae0f20', // Replace with an actual vendor ID
        vendorName: 'Test Vendor'
      });
      console.log('POST /api/cart/add response:', addResponse.data);
    } catch (error) {
      console.error('Error adding to cart:', error.response?.data || error.message);
    }
    
    // Test GET /api/cart again to see if item was added
    console.log('\nTesting GET /api/cart again...');
    try {
      const getResponse = await api.get('/cart');
      console.log('GET /api/cart response:', getResponse.data);
    } catch (error) {
      console.error('Error getting cart:', error.response?.data || error.message);
    }
    
    console.log('\nCart API test completed');
  } catch (error) {
    console.error('Error testing cart API:', error);
  }
}

testCartAPI();

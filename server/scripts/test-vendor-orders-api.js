const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function testVendorOrdersAPI() {
  try {
    console.log('\n=== TESTING VENDOR ORDERS API ===\n');

    // First, let's get a vendor user token
    // Login as Mohit (vendor)
    console.log('1. Logging in as vendor (Mohit)...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'mohit@gmail.com',
      password: 'Mohit@123'
    }).catch(err => {
      console.log('First login attempt failed, trying alternate password...');
      return axios.post(`${API_URL}/auth/login`, {
        email: 'mohit@gmail.com',
        password: 'password'
      });
    });

    const token = loginRes.data.data.token;
    const user = loginRes.data.data.user;
    console.log(`✅ Logged in as ${user.name} (${user.role})`);
    console.log(`   User ID: ${user._id}`);

    // Now fetch vendor orders
    console.log('\n2. Fetching vendor orders...');
    const ordersRes = await axios.get(`${API_URL}/orders/vendor/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Fetched vendor orders`);
    console.log(`   Total orders: ${ordersRes.data.count}`);
    
    if (ordersRes.data.data && ordersRes.data.data.length > 0) {
      console.log('\n   Orders:');
      ordersRes.data.data.forEach(order => {
        console.log(`   - ${order.orderNumber}: ${order.status} (₹${order.total})`);
        console.log(`     Items: ${order.items ? order.items.length : 0}`);
        console.log(`     VendorId: ${order.vendorId}`);
      });
    } else {
      console.log('   ⚠️ No orders found');
    }

    console.log('\n=== TEST COMPLETE ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testVendorOrdersAPI();

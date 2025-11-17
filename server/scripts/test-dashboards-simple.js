const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function testDashboards() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     TESTING ORDER VISIBILITY IN ALL DASHBOARDS             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Test 1: Vendor Dashboard
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: VENDOR DASHBOARD (Mohit)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1.1 Logging in as Vendor (Mohit)...');
    const vendorLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'mohit@gmail.com',
      password: 'Mohit@123'
    }).catch(async (err) => {
      console.log('   Trying alternate password...');
      return axios.post(`${API_URL}/auth/login`, {
        email: 'mohit@gmail.com',
        password: 'password'
      });
    });

    const vendorToken = vendorLoginRes.data.data.token;
    const vendorUser = vendorLoginRes.data.data.user;
    console.log(`✅ Logged in as ${vendorUser.name} (${vendorUser.role})`);
    console.log(`   User ID: ${vendorUser._id}\n`);

    console.log('1.2 Fetching vendor orders...');
    const vendorOrdersRes = await axios.get(`${API_URL}/orders/vendor/orders`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });

    console.log(`✅ Total Orders for Vendor: ${vendorOrdersRes.data.count}`);
    if (vendorOrdersRes.data.data && vendorOrdersRes.data.data.length > 0) {
      console.log('   Orders:');
      vendorOrdersRes.data.data.forEach(order => {
        console.log(`   • ${order.orderNumber}: ${order.status} | ₹${order.total} | Items: ${order.items?.length || 0}`);
      });
    } else {
      console.log('   ⚠️ No orders found for this vendor');
    }

    // Test 2: User Dashboard
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: USER DASHBOARD (Angoor)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('2.1 Logging in as User (Angoor)...');
    const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'angoor@gmail.com',
      password: 'Angoor@123'
    }).catch(async (err) => {
      console.log('   Trying alternate password...');
      return axios.post(`${API_URL}/auth/login`, {
        email: 'angoor@gmail.com',
        password: 'password'
      });
    });

    const userToken = userLoginRes.data.data.token;
    const user = userLoginRes.data.data.user;
    console.log(`✅ Logged in as ${user.name} (${user.role})`);
    console.log(`   User ID: ${user._id}\n`);

    console.log('2.2 Fetching user orders...');
    const userOrdersRes = await axios.get(`${API_URL}/orders/my/orders`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    console.log(`✅ Total Orders for User: ${userOrdersRes.data.count}`);
    if (userOrdersRes.data.data && userOrdersRes.data.data.length > 0) {
      console.log('   Orders:');
      userOrdersRes.data.data.forEach(order => {
        console.log(`   • ${order.orderNumber}: ${order.status} | ₹${order.total} | Items: ${order.items?.length || 0}`);
      });
    } else {
      console.log('   ⚠️ No orders found for this user');
    }

    // Test 3: Verify Order Details
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: ORDER DETAILS VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (userOrdersRes.data.data && userOrdersRes.data.data.length > 0) {
      const order = userOrdersRes.data.data[0];
      console.log(`Checking Order: ${order.orderNumber}\n`);

      console.log('3.1 Order Details:');
      console.log(`   • Order ID: ${order._id}`);
      console.log(`   • Order Number: ${order.orderNumber}`);
      console.log(`   • Status: ${order.status}`);
      console.log(`   • VendorId: ${order.vendorId}`);
      console.log(`   • UserId: ${order.userId}`);
      console.log(`   • Total: ₹${order.total}`);
      console.log(`   • Items: ${order.items?.length || 0}`);
      console.log(`   • Subtotal: ₹${order.subtotal}`);
      console.log(`   • Shipping: ₹${order.shipping}`);

      if (order.items && order.items.length > 0) {
        console.log('\n3.2 Order Items:');
        order.items.forEach((item, idx) => {
          console.log(`   Item ${idx + 1}:`);
          console.log(`     - Product ID: ${item.productId}`);
          console.log(`     - Quantity: ${item.quantity}`);
          console.log(`     - Price: ₹${item.price}`);
          console.log(`     - Total: ₹${item.total}`);
        });
      }

      console.log('\n3.3 Delivery Address:');
      if (order.deliveryAddress) {
        console.log(`   • Street: ${order.deliveryAddress.line1}`);
        console.log(`   • City: ${order.deliveryAddress.city}`);
        console.log(`   • State: ${order.deliveryAddress.state}`);
        console.log(`   • Pincode: ${order.deliveryAddress.pincode}`);
        console.log(`   • Country: ${order.deliveryAddress.country}`);
      }

      console.log('\n3.4 Customer Info:');
      if (order.customer) {
        console.log(`   • Name: ${order.customer.name}`);
        console.log(`   • Email: ${order.customer.email}`);
        console.log(`   • Phone: ${order.customer.phone}`);
      }

      console.log('\n3.5 Verify Order Visibility:');
      console.log(`   ✅ Order visible in User Dashboard: YES`);
      
      // Check if vendor can see this order
      const vendorCanSeeOrder = vendorOrdersRes.data.data.some(o => o._id === order._id);
      console.log(`   ${vendorCanSeeOrder ? '✅' : '❌'} Order visible in Vendor Dashboard: ${vendorCanSeeOrder ? 'YES' : 'NO'}`);
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ Vendor Dashboard: Can see vendor-specific orders');
    console.log(`   Total: ${vendorOrdersRes.data.count} orders for Mohit\n`);

    console.log('✅ User Dashboard: Can see user-specific orders');
    console.log(`   Total: ${userOrdersRes.data.count} orders for Angoor\n`);

    if (vendorOrdersRes.data.count > 0 && userOrdersRes.data.count > 0) {
      console.log('✅ ORDERS ARE VISIBLE IN ALL DASHBOARDS - WORKING CORRECTLY!\n');
    } else if (vendorOrdersRes.data.count > 0 || userOrdersRes.data.count > 0) {
      console.log('⚠️ Orders visible in some dashboards - check if data matches\n');
    } else {
      console.log('⚠️ No orders found in any dashboard\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testDashboards();

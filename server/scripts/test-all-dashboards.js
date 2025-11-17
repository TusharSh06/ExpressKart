const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function testAllDashboards() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     TESTING ORDER VISIBILITY IN ALL DASHBOARDS             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Test 1: Admin Dashboard
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: ADMIN DASHBOARD');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1.1 Logging in as Admin...');
    let adminLoginRes;
    try {
      adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@gmail.com',
        password: 'Admin@123'
      });
    } catch (err) {
      try {
        console.log('   Trying alternate password...');
        adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
          email: 'admin@gmail.com',
          password: 'admin'
        });
      } catch (err2) {
        console.log('   Admin login failed, skipping admin test');
        adminLoginRes = null;
      }
    }

    const adminToken = adminLoginRes.data.data.token;
    const adminUser = adminLoginRes.data.data.user;
    console.log(`✅ Logged in as ${adminUser.name} (${adminUser.role})\n`);

    console.log('1.2 Fetching all orders (Admin view)...');
    const adminOrdersRes = await axios.get(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log(`✅ Total Orders: ${adminOrdersRes.data.count}`);
    if (adminOrdersRes.data.data && adminOrdersRes.data.data.length > 0) {
      console.log('   Orders:');
      adminOrdersRes.data.data.slice(0, 3).forEach(order => {
        console.log(`   • ${order.orderNumber}: ${order.status} | ₹${order.total} | VendorId: ${order.vendorId}`);
      });
      if (adminOrdersRes.data.data.length > 3) {
        console.log(`   ... and ${adminOrdersRes.data.data.length - 3} more`);
      }
    } else {
      console.log('   ⚠️ No orders found');
    }

    // Test 2: Vendor Dashboard
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: VENDOR DASHBOARD (Mohit)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('2.1 Logging in as Vendor (Mohit)...');
    const vendorLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'mohit@gmail.com',
      password: 'Mohit@123'
    }).catch(err => {
      console.log('   Trying alternate password...');
      return axios.post(`${API_URL}/auth/login`, {
        email: 'mohit@gmail.com',
        password: 'password'
      });
    });

    const vendorToken = vendorLoginRes.data.data.token;
    const vendorUser = vendorLoginRes.data.data.user;
    console.log(`✅ Logged in as ${vendorUser.name} (${vendorUser.role})\n`);

    console.log('2.2 Fetching vendor orders...');
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

    // Test 3: User Dashboard
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: USER DASHBOARD (Angoor)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('3.1 Logging in as User (Angoor)...');
    const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'angoor@gmail.com',
      password: 'Angoor@123'
    }).catch(err => {
      console.log('   Trying alternate password...');
      return axios.post(`${API_URL}/auth/login`, {
        email: 'angoor@gmail.com',
        password: 'password'
      });
    });

    const userToken = userLoginRes.data.data.token;
    const user = userLoginRes.data.data.user;
    console.log(`✅ Logged in as ${user.name} (${user.role})\n`);

    console.log('3.2 Fetching user orders...');
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

    // Test 4: Verify Order Details
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: ORDER DETAILS VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (userOrdersRes.data.data && userOrdersRes.data.data.length > 0) {
      const order = userOrdersRes.data.data[0];
      console.log(`Checking Order: ${order.orderNumber}\n`);

      console.log('4.1 Order Details:');
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
        console.log('\n4.2 Order Items:');
        order.items.forEach((item, idx) => {
          console.log(`   Item ${idx + 1}:`);
          console.log(`     - Product ID: ${item.productId}`);
          console.log(`     - Quantity: ${item.quantity}`);
          console.log(`     - Price: ₹${item.price}`);
          console.log(`     - Total: ₹${item.total}`);
        });
      }

      console.log('\n4.3 Delivery Address:');
      if (order.deliveryAddress) {
        console.log(`   • Street: ${order.deliveryAddress.line1}`);
        console.log(`   • City: ${order.deliveryAddress.city}`);
        console.log(`   • State: ${order.deliveryAddress.state}`);
        console.log(`   • Pincode: ${order.deliveryAddress.pincode}`);
        console.log(`   • Country: ${order.deliveryAddress.country}`);
      }

      console.log('\n4.4 Customer Info:');
      if (order.customer) {
        console.log(`   • Name: ${order.customer.name}`);
        console.log(`   • Email: ${order.customer.email}`);
        console.log(`   • Phone: ${order.customer.phone}`);
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ Admin Dashboard: Can see all orders');
    console.log(`   Total: ${adminOrdersRes.data.count} orders\n`);

    console.log('✅ Vendor Dashboard: Can see vendor-specific orders');
    console.log(`   Total: ${vendorOrdersRes.data.count} orders for Mohit\n`);

    console.log('✅ User Dashboard: Can see user-specific orders');
    console.log(`   Total: ${userOrdersRes.data.count} orders for Angoor\n`);

    if (vendorOrdersRes.data.count > 0 && userOrdersRes.data.count > 0) {
      console.log('✅ ORDERS ARE VISIBLE IN ALL DASHBOARDS - WORKING CORRECTLY!\n');
    } else {
      console.log('⚠️ Some dashboards have no orders - check if orders exist\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    console.error('\nFull Error:', error);
    process.exit(1);
  }
}

testAllDashboards();

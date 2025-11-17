// Admin Setup Script - Run this in browser console to create admin account

// First, clear localStorage to remove any corrupted data
localStorage.clear();
console.log('✅ localStorage cleared');

// Function to create admin account
async function createAdmin() {
  try {
    console.log('🚀 Creating admin account...');
    
    const response = await fetch('http://localhost:5000/api/auth/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'admin123',
        phone: '9711669908'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin created successfully!');
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: admin123');
      console.log('🎯 Role: admin');
      console.log('📱 Phone: 9711669908');
      
      // Auto-login the admin
      const { token, user } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('🔐 Admin logged in automatically');
      console.log('🔄 Reloading page...');
      window.location.reload();
      
    } else {
      console.error('❌ Failed to create admin:', data.message);
      console.log('📋 Full response:', data);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

// Function to check if admin exists
async function checkAdmin() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/check-admin');
    const data = await response.json();
    console.log('🔍 Admin check result:', data);
    return data.exists;
  } catch (error) {
    console.error('❌ Error checking admin:', error);
    return false;
  }
}

// Run the setup
console.log('🔧 ExpressKart Admin Setup');
console.log('📋 Instructions:');
console.log('1. Run createAdmin() to create a new admin account');
console.log('2. Run checkAdmin() to check if admin exists');
console.log('3. Use credentials: admin@gmail.com / admin123');

// Auto-run admin creation
createAdmin();

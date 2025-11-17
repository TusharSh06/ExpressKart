const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expresskart', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      console.log('Deleting existing admin...');
      await User.findByIdAndDelete(existingAdmin._id);
      console.log('Existing admin deleted');
    }

    // Create new admin
    const adminData = {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      phone: '9711669908',
      role: 'admin',
      isEmailVerified: true
    };

    console.log('Creating new admin...');
    const admin = await User.create(adminData);
    
    console.log('✅ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

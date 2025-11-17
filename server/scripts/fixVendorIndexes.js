/**
 * Script to fix vendor indexes in MongoDB
 * This script will:
 * 1. Drop the problematic user_1 index
 * 2. Fix any vendor documents with null user field by assigning them a valid ownerUserId
 * 3. Create a proper index on ownerUserId
 */
const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');

async function fixVendorIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Get all indexes
    const indexes = await Vendor.collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the problematic user_1 index if it exists
    const userIndex = indexes.find(index => index.name === 'user_1');
    if (userIndex) {
      console.log('Found problematic user_1 index, dropping it...');
      await Vendor.collection.dropIndex('user_1');
      console.log('Dropped user_1 index');
    } else {
      console.log('No user_1 index found');
    }

    // Fix vendors with null user field by assigning them a valid ownerUserId
    const vendorsWithNullUser = await Vendor.find({ user: null });
    console.log(`Found ${vendorsWithNullUser.length} vendors with null user field`);
    
    for (const vendor of vendorsWithNullUser) {
      if (!vendor.ownerUserId) {
        // Only update if ownerUserId is not already set
        vendor.ownerUserId = new mongoose.Types.ObjectId();
        console.log(`Assigned new ownerUserId ${vendor.ownerUserId} to vendor ${vendor._id}`);
      }
      // Remove the problematic user field
      vendor.user = undefined;
      await vendor.save();
    }
    console.log(`Fixed ${vendorsWithNullUser.length} vendors with null user field`);

    // Fix vendors with user field but no ownerUserId
    const vendorsToFix = await Vendor.find({ user: { $ne: null }, ownerUserId: { $exists: false } });
    console.log(`Found ${vendorsToFix.length} vendors with user field but no ownerUserId`);
    
    for (const vendor of vendorsToFix) {
      vendor.ownerUserId = vendor.user;
      vendor.user = undefined;
      await vendor.save();
    }
    console.log(`Fixed ${vendorsToFix.length} vendors by moving user field to ownerUserId`);

    // Create proper index on ownerUserId if it doesn't exist
    const ownerUserIdIndex = indexes.find(index => index.name === 'ownerUserId_1');
    if (!ownerUserIdIndex) {
      console.log('Creating index on ownerUserId...');
      await Vendor.collection.createIndex({ ownerUserId: 1 }, { unique: true, sparse: true });
      console.log('Created index on ownerUserId with sparse option');
    } else {
      console.log('Index on ownerUserId already exists');
    }

    console.log('Vendor indexes fixed successfully');
  } catch (error) {
    console.error('Error fixing vendor indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixVendorIndexes();

/**
 * Script to drop the problematic user_1 index from the vendors collection
 * Run this script directly with: node scripts/dropUserIndex.js
 */
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function dropUserIndex() {
  try {
    console.log('Connecting to MongoDB directly via MongoClient...');
    // Connect directly to MongoDB using MongoClient
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    // Get the database and collection
    const db = client.db('test');
    const vendorsCollection = db.collection('vendors');
    
    // List all indexes
    console.log('Listing all indexes on vendors collection:');
    const indexes = await vendorsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    
    // Check if user_1 index exists
    const userIndex = indexes.find(index => index.name === 'user_1');
    if (userIndex) {
      console.log('Found problematic user_1 index, dropping it...');
      await vendorsCollection.dropIndex('user_1');
      console.log('Successfully dropped user_1 index');
    } else {
      console.log('No user_1 index found');
    }
    
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
dropUserIndex();

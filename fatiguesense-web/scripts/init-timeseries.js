#!/usr/bin/env node

/**
 * Initialize MongoDB Time-Series Collection for IMU Data
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function initializeTimeSeries() {
  console.log('🚀 Initializing Time-Series Collection...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check if collection exists
    const collections = await db.listCollections({ name: 'fatigue_imu' }).toArray();

    if (collections.length > 0) {
      console.log('⚠️  Collection "fatigue_imu" already exists');
      console.log('   Checking if it\'s a time-series collection...\n');
      
      const collInfo = await db.collection('fatigue_imu').options();
      if (collInfo.timeseries) {
        console.log('✅ Existing collection is already configured as time-series:');
        console.log(`   timeField: ${collInfo.timeseries.timeField}`);
        console.log(`   metaField: ${collInfo.timeseries.metaField}`);
        console.log(`   granularity: ${collInfo.timeseries.granularity}\n`);
      } else {
        console.log('⚠️  WARNING: Existing collection is NOT a time-series collection!');
        console.log('   You may need to drop it and recreate it.\n');
      }
    } else {
      console.log('📊 Creating time-series collection "fatigue_imu"...');
      
      await db.createCollection('fatigue_imu', {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'sessionId',
          granularity: 'seconds',
        },
      });

      console.log('✅ Time-series collection created successfully!\n');

      // Create indexes for efficient queries
      console.log('📊 Creating indexes...');
      await db.collection('fatigue_imu').createIndex({ sessionId: 1, timestamp: 1 });
      await db.collection('fatigue_imu').createIndex({ type: 1, timestamp: 1 });
      console.log('✅ Indexes created\n');
    }

    // Display collection info
    try {
      const count = await db.collection('fatigue_imu').countDocuments();
      const indexes = await db.collection('fatigue_imu').getIndexes();
      console.log('📈 Collection Statistics:');
      console.log(`   Documents: ${count}`);
      console.log(`   Indexes: ${Object.keys(indexes).length}`);
    } catch (error) {
      console.log('📈 Collection Statistics:');
      console.log(`   Collection: fatigue_imu (ready)`);
    }

    console.log('✅ Time-series initialization complete!\n');
    console.log('📝 Collection: fatigue_imu');
    console.log('   timeField: timestamp');
    console.log('   metaField: sessionId');
    console.log('   granularity: seconds\n');

  } catch (error) {
    console.error('\n❌ Initialization failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connection closed');
  }
}

initializeTimeSeries();


#!/usr/bin/env node

/**
 * Database Initialization Script
 * Tests MongoDB connection and creates necessary indexes
 */

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env.local');
  console.error('\nPlease create a .env.local file with:');
  console.error('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fatiguesense?retryWrites=true&w=majority');
  process.exit(1);
}

async function initializeDatabase() {
  console.log('🚀 Initializing FatigueSense Database...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    // Define Session Schema (same as in the app)
    const testResultSchema = new mongoose.Schema({
      type: { type: String, required: true },
      score: { type: Number, required: true },
      raw: { type: mongoose.Schema.Types.Mixed },
    });

    const sessionSchema = new mongoose.Schema(
      {
        userId: { type: String, required: true, index: true },
        timestamp: { type: Date, required: true, default: Date.now },
        results: { type: [testResultSchema], required: true },
        metadata: {
          deviceId: { type: String, required: true },
          testType: { type: String, required: true },
          durationSeconds: { type: Number, required: true },
          totalSamples: { type: Number, required: true },
        },
      },
      {
        timestamps: true,
      }
    );

    // Create compound index for efficient queries
    sessionSchema.index({ userId: 1, timestamp: -1 });

    // Get or create the model
    const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

    // Create indexes
    console.log('📊 Creating database indexes...');
    await Session.createIndexes();
    console.log('✅ Indexes created successfully!\n');

    // Get collection stats
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const sessionCollection = collections.find(c => c.name === 'sessions');

    if (sessionCollection) {
      try {
        const count = await Session.countDocuments();
        const indexes = await Session.collection.getIndexes();
        console.log('📈 Database Statistics:');
        console.log(`   Collection: sessions`);
        console.log(`   Documents: ${count}`);
        console.log(`   Indexes: ${Object.keys(indexes).length}`);
      } catch (error) {
        console.log('📈 Database Statistics:');
        console.log(`   Collection: sessions (exists)`);
        console.log(`   Ready for data`);
      }
    } else {
      console.log('📦 Collection "sessions" will be created on first insert');
    }

    console.log('\n✅ Database initialization complete!');
    console.log('\n🔗 Connection String:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

  } catch (error) {
    console.error('\n❌ Database initialization failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('\n💡 Tip: Check your MongoDB username and password');
      console.error('   Make sure special characters are URL-encoded');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Tip: Check your network connection');
      console.error('   Whitelist your IP in MongoDB Atlas Network Access');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the initialization
initializeDatabase();


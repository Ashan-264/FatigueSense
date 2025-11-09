#!/usr/bin/env node

/**
 * Mobile Data Sync Script
 * Uploads sessions from mobile app export to MongoDB
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Error: Please provide a path to the JSON file');
  console.error('\nUsage:');
  console.error('  npm run sync-mobile -- path/to/exported_sessions.json');
  console.error('  node scripts/sync-mobile.js path/to/exported_sessions.json');
  process.exit(1);
}

async function syncMobileData() {
  console.log('🚀 Starting Mobile Data Sync...\n');

  try {
    // Check if file exists
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    // Read and parse JSON file
    console.log('📄 Reading file:', fullPath);
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Determine data format and extract sessions
    let sessions = [];
    
    if (Array.isArray(data)) {
      // Direct array of sessions
      sessions = data;
    } else if (data.sessions) {
      // Wrapped in sessions property
      sessions = data.sessions;
    } else if (data.acc && data.testResults) {
      // Single session export format
      console.log('⚠️  Warning: This looks like a single session export.');
      console.log('    Converting to session format...\n');
      sessions = [{
        timestamp: data.timestamp || new Date().toISOString(),
        results: data.testResults || [],
        metadata: data.metadata || {
          deviceId: 'unknown',
          testType: 'imported',
          durationSeconds: 0,
          totalSamples: data.acc?.length || 0,
        }
      }];
    } else {
      throw new Error('Unrecognized data format. Expected array of sessions or session object.');
    }

    console.log(`📦 Found ${sessions.length} session(s) to import\n`);

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Define Session Schema
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

    const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

    // Ask for userId (in production, this would come from authentication)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const userId = await new Promise((resolve) => {
      rl.question('👤 Enter User ID (from Clerk) for these sessions: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('\n📥 Uploading sessions to MongoDB...');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sessions.length; i++) {
      try {
        const sessionData = sessions[i];
        
        // Validate session has required data
        if (!sessionData.results || sessionData.results.length === 0) {
          console.log(`   ⚠️  Session ${i + 1}: Skipped (no results)`);
          errorCount++;
          continue;
        }

        // Create session document
        const session = await Session.create({
          userId: userId,
          timestamp: sessionData.timestamp || new Date(),
          results: sessionData.results,
          metadata: sessionData.metadata || {
            deviceId: 'mobile-app',
            testType: 'imported',
            durationSeconds: 0,
            totalSamples: 0,
          }
        });

        console.log(`   ✅ Session ${i + 1}: Uploaded successfully (ID: ${session._id})`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Session ${i + 1}: Failed - ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Upload Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📦 Total: ${sessions.length}`);

    console.log('\n✅ Sync complete!');

  } catch (error) {
    console.error('\n❌ Sync failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the sync
syncMobileData();


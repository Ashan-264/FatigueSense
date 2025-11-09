# Database Scripts

This directory contains utility scripts for MongoDB database management.

## Available Scripts

### 1. `db-init.js` - Database Initialization

Initializes the MongoDB database by:
- Testing the connection
- Creating necessary indexes
- Displaying database statistics

**Usage:**
```bash
npm run db:init
```

**What it does:**
- Connects to MongoDB using `MONGODB_URI` from `.env.local`
- Creates the `sessions` collection (if needed)
- Creates indexes for efficient queries:
  - Single index on `userId`
  - Compound index on `userId` and `timestamp`
- Shows connection status and database stats

**Output:**
```
🚀 Initializing FatigueSense Database...
📡 Connecting to MongoDB...
✅ Connected to MongoDB successfully!
📊 Creating database indexes...
✅ Indexes created successfully!
📈 Database Statistics:
   Collection: sessions
   Documents: 0
   Size: 0.00 KB
   Indexes: 3
✅ Database initialization complete!
```

### 2. `sync-mobile.js` - Mobile Data Sync

Syncs session data from mobile app exports to MongoDB.

**Usage:**
```bash
npm run sync-mobile path/to/exported_sessions.json
```

**Supported Data Formats:**

1. **Array of sessions:**
```json
[
  {
    "timestamp": "2025-01-10T12:00:00Z",
    "results": [
      { "type": "tapping", "score": 85, "raw": {...} }
    ],
    "metadata": {
      "deviceId": "device123",
      "testType": "fatigue",
      "durationSeconds": 300,
      "totalSamples": 100
    }
  }
]
```

2. **Sessions wrapper:**
```json
{
  "sessions": [...]
}
```

3. **Mobile app export format:**
```json
{
  "timestamp": "2025-01-10T12:00:00Z",
  "acc": [...],
  "gyro": [...],
  "testResults": [
    { "type": "tapping", "score": 85, "raw": {...} }
  ],
  "metadata": {...}
}
```

**Interactive:**
- The script will prompt you for the User ID (from Clerk)
- Shows progress for each session
- Displays summary of successful/failed uploads

**Output:**
```
🚀 Starting Mobile Data Sync...
📄 Reading file: /path/to/file.json
📦 Found 5 session(s) to import
📡 Connecting to MongoDB...
✅ Connected!
👤 Enter User ID (from Clerk) for these sessions: user_abc123
📥 Uploading sessions to MongoDB...
   ✅ Session 1: Uploaded successfully (ID: 507f1f77bcf86cd799439011)
   ✅ Session 2: Uploaded successfully (ID: 507f1f77bcf86cd799439012)
   ✅ Session 3: Uploaded successfully (ID: 507f1f77bcf86cd799439013)
📊 Upload Summary:
   ✅ Successful: 3
   ❌ Failed: 0
   📦 Total: 3
✅ Sync complete!
```

## Requirements

Both scripts require:
- `dotenv` package (to load .env.local)
- `mongoose` package (MongoDB ODM)
- `.env.local` file with `MONGODB_URI` defined

These are automatically installed with `npm install`.

## Troubleshooting

### Script fails with "MONGODB_URI is not defined"
- Create `.env.local` in the `fatiguesense-web` directory
- Add: `MONGODB_URI=mongodb+srv://...`

### Script fails with "MongoServerError: bad auth"
- Check MongoDB username and password
- URL-encode special characters in password

### Script fails with "File not found"
- Provide correct path to JSON file
- Use absolute or relative path from `fatiguesense-web` directory

### Sessions are skipped during sync
- Make sure sessions have a `results` array
- Results array must contain at least one test result
- Check that test results have `type` and `score` fields

## Adding New Scripts

To add a new database script:

1. Create `your-script.js` in this directory
2. Add to `package.json`:
   ```json
   "scripts": {
     "your-command": "node scripts/your-script.js"
   }
   ```
3. Use the same connection pattern:
   ```javascript
   require('dotenv').config({ path: '.env.local' });
   const mongoose = require('mongoose');
   const MONGODB_URI = process.env.MONGODB_URI;
   ```

## Support

For more information, see:
- `MONGODB_SETUP.md` - Detailed MongoDB setup guide
- `QUICK_START.md` - Quick start guide
- `SETUP.md` - Complete setup instructions


# Quick Start Guide - MongoDB Setup

## 1. Create `.env.local` File

In the `fatiguesense-web` directory, create a file named `.env.local` with this content:

```bash
# MongoDB Connection (Required)
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/fatiguesense?retryWrites=true&w=majority

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Gemini AI (Optional)
GEMINI_API_KEY=your_gemini_api_key
```

## 2. Get MongoDB URI

### Option A: MongoDB Atlas (Free - Recommended)
1. Go to https://cloud.mongodb.com/
2. Sign up and create a FREE cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Change database name to `fatiguesense`

**Example:**
```
mongodb+srv://myuser:MySecurePass123@cluster0.abc123.mongodb.net/fatiguesense?retryWrites=true&w=majority
```

### MongoDB Atlas Setup Checklist:
- ✅ Create cluster (FREE tier)
- ✅ Create database user with read/write permissions
- ✅ Whitelist your IP (or use 0.0.0.0/0 for development)
- ✅ Copy connection string
- ✅ Replace `<password>` with your actual password
- ✅ Change database name to `fatiguesense`

## 3. Get Clerk Keys

1. Go to https://dashboard.clerk.com/
2. Create application (or use existing)
3. Go to "API Keys" section
4. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

## 4. Test Database Connection

```bash
npm run db:init
```

You should see:
```
✅ Connected to MongoDB successfully!
✅ Indexes created successfully!
✅ Database initialization complete!
```

## 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 6. Sync Mobile App Data (Optional)

If you have exported session data from the mobile app:

```bash
npm run sync-mobile path/to/your/exported_file.json
```

The script will ask for your User ID (from Clerk) and upload all sessions.

## Common Issues

### "MONGODB_URI is not defined"
- Make sure `.env.local` exists in `fatiguesense-web` folder
- Restart the dev server after creating .env.local

### "MongoServerError: bad auth"
- Check username/password in connection string
- Use URL encoding for special characters (e.g., `@` becomes `%40`)

### "MongoNetworkError"
- Whitelist your IP in MongoDB Atlas → Network Access
- Or allow all IPs: 0.0.0.0/0 (for development only)

### "Unauthorized" when calling APIs
- Make sure you're signed in via Clerk
- Check Clerk keys are correct in .env.local

## What's Next?

Once connected, you can:
- ✅ Upload sessions from mobile app
- ✅ View session history on web dashboard
- ✅ Run AI analysis on multiple sessions
- ✅ Export/backup data
- ✅ Share data across devices

## API Endpoints

Your MongoDB-backed API endpoints:

- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create single session
- `POST /api/sessions/upload` - Bulk upload from mobile
- `GET /api/sessions/[id]` - Get single session
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session

All endpoints require Clerk authentication!


# FatigueSense Web - Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Clerk account for authentication

## Step 1: Install Dependencies

```bash
cd fatiguesense-web
npm install
```

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `fatiguesense-web` directory with the following content:

```bash
# MongoDB Connection String
# Get this from MongoDB Atlas: https://cloud.mongodb.com/
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/fatiguesense?retryWrites=true&w=majority

# Clerk Authentication Keys
# Get these from: https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Optional: Gemini AI API Key for AI-powered fatigue analysis
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting Your MongoDB URI

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace the database name with `fatiguesense`

**Example:**
```
mongodb+srv://myuser:MyP@ssw0rd@cluster0.abc123.mongodb.net/fatiguesense?retryWrites=true&w=majority
```

### Getting Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the publishable key and secret key from the API Keys section

## Step 3: Setup Database

Run the database initialization script:

```bash
npm run db:init
```

This will:
- Test MongoDB connection
- Create necessary indexes
- Display connection status

## Step 4: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## API Endpoints Available

Once setup is complete, you'll have these endpoints:

### Sessions API
- `GET /api/sessions` - Fetch all sessions for authenticated user
- `POST /api/sessions` - Create new session
- `GET /api/sessions/[id]` - Get single session
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session
- `DELETE /api/sessions` - Delete all sessions

### Upload Mobile Data
- `POST /api/sessions/upload` - Bulk upload sessions from mobile app

## Syncing Mobile App Data

To sync data from the mobile app to MongoDB:

1. Export data from mobile app (JSON file)
2. Use the upload endpoint:

```bash
curl -X POST http://localhost:3000/api/sessions/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d @exported_sessions.json
```

Or use the included script:
```bash
npm run sync-mobile -- path/to/exported_sessions.json
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: bad auth"**
- Check username and password in MONGODB_URI
- URL-encode special characters in password

**Error: "MongoNetworkError"**
- Whitelist your IP in MongoDB Atlas Network Access
- Try allowing access from anywhere (0.0.0.0/0) for development

### Clerk Authentication Issues

**Error: "Unauthorized"**
- Verify Clerk keys are correct in .env.local
- Make sure you're signed in on the frontend

## Scripts Reference

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:init` - Initialize database and test connection
- `npm run sync-mobile` - Sync mobile app data to MongoDB


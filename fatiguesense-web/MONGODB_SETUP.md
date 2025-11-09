# MongoDB Setup Guide

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for a free account
3. Create a new cluster (select the FREE tier)

## 2. Get Your Connection String

1. In MongoDB Atlas dashboard, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string (it looks like this):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 3. Configure Environment Variables

Create a `.env.local` file in the `fatiguesense-web` folder:

```bash
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fatiguesense?retryWrites=true&w=majority

# Clerk Authentication (you should already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Gemini API for AI analysis
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:**
- Replace `username` and `password` with your MongoDB credentials
- Replace `cluster.mongodb.net` with your actual cluster URL
- The database name `fatiguesense` will be created automatically

## 4. Whitelist Your IP Address

1. In MongoDB Atlas, go to **Network Access**
2. Click **"Add IP Address"**
3. Choose **"Allow access from anywhere"** (0.0.0.0/0) for development
   - For production, add your specific IP addresses

## 5. Create a Database User

1. In MongoDB Atlas, go to **Database Access**
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Enter a username and password
5. Set role to **"Read and write to any database"**

## 6. Test the Connection

Run your Next.js development server:

```bash
npm run dev
```

The MongoDB connection will be established automatically when you access any API route.

## 7. API Endpoints

Your web app now has these MongoDB-backed API endpoints:

### Sessions

- **GET** `/api/sessions` - Fetch all sessions for the authenticated user
  - Query params: `limit` (default: 50), `skip` (default: 0)
  
- **POST** `/api/sessions` - Create a new session
  ```json
  {
    "timestamp": "2025-01-10T12:00:00Z",
    "results": [
      {
        "type": "tapping",
        "score": 85,
        "raw": { "taps": 120, "accuracy": 0.95 }
      }
    ],
    "metadata": {
      "deviceId": "device123",
      "testType": "fatigue",
      "durationSeconds": 300,
      "totalSamples": 100
    }
  }
  ```

- **GET** `/api/sessions/[id]` - Fetch a single session by ID
- **PATCH** `/api/sessions/[id]` - Update a session
- **DELETE** `/api/sessions/[id]` - Delete a session
- **DELETE** `/api/sessions` - Delete all sessions for the user

## 8. MongoDB Collections

The database will have one main collection:

### `sessions`
```javascript
{
  _id: ObjectId,
  userId: String,           // Clerk user ID
  timestamp: Date,
  results: [
    {
      type: String,         // "tapping", "balance", "movement"
      score: Number,        // 0-100
      raw: Mixed            // Raw test data
    }
  ],
  metadata: {
    deviceId: String,
    testType: String,
    durationSeconds: Number,
    totalSamples: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Connection Errors

If you see `MongoServerError: bad auth`:
- Check your username and password
- Make sure special characters in password are URL-encoded

### Network Errors

If you see `MongoNetworkError`:
- Check your IP address is whitelisted in MongoDB Atlas
- Try allowing access from anywhere (0.0.0.0/0)

### Environment Variable Not Found

If you see `MONGODB_URI environment variable is not defined`:
- Make sure `.env.local` file exists in the root of `fatiguesense-web`
- Restart your development server after creating/modifying `.env.local`


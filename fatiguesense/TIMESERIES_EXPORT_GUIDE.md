# Time-Series Export & Upload Guide

## ✅ Complete Integration Active

Your mobile app now exports **full time-series IMU data**, and the web app automatically saves it for visualization.

---

## 📱 Mobile App - Export All Sessions with IMU Data

### What Changed
The **"Export All Sessions"** button now includes:
- ✅ Test results and scores
- ✅ Session metadata
- ✅ **Raw accelerometer data** (`imuData`)
- ✅ **Raw gyroscope data** (`gyroData`)

### How to Export

1. **Open the FatigueSense mobile app**
2. **Complete some tests** (Tapping, Sway, or Movement)
3. **Tap "Export All Sessions"** button on home screen
4. **Share/Save** the JSON file

### Export Format

```json
{
  "sessions": [
    {
      "timestamp": "2025-11-09T14:30:00.000Z",
      "results": [
        {
          "type": "sway",
          "score": 75,
          "raw": {...}
        }
      ],
      "metadata": {
        "deviceId": "iOS-iPhone14",
        "testType": "sway",
        "durationSeconds": 30,
        "totalSamples": 600
      },
      "imuData": [
        {"x": 0.123, "y": -0.456, "z": 9.812, "timestamp": 1699545000000},
        {"x": 0.125, "y": -0.458, "z": 9.810, "timestamp": 1699545000050}
      ],
      "gyroData": [
        {"x": 0.001, "y": -0.002, "z": 0.003, "timestamp": 1699545000000},
        {"x": 0.002, "y": -0.003, "z": 0.004, "timestamp": 1699545000050}
      ]
    }
  ],
  "exportedAt": "2025-11-09T15:00:00.000Z",
  "totalSessions": 1,
  "deviceInfo": {...}
}
```

---

## 🌐 Web App - Automatic Time-Series Processing

### What Changed
The **`/api/sessions/upload`** endpoint now:
1. ✅ Saves session metadata to `sessions` collection
2. ✅ **Extracts IMU data automatically**
3. ✅ **Saves to `fatigue_imu` time-series collection**
4. ✅ **Links data using session ID**

### How to Upload

#### Option 1: Via Sessions Dashboard (Recommended)
1. Go to `http://localhost:3000/sessions`
2. Click **"Upload Sessions"** card
3. Select your exported JSON file
4. Wait for confirmation

#### Option 2: Via Command Line
```bash
curl -X POST http://localhost:3000/api/sessions/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @fatiguesense_all_sessions_1699545000.json
```

### Upload Response

```json
{
  "success": true,
  "uploaded": 3,
  "failed": 0,
  "total": 3,
  "timeSeriesSamples": 1800,
  "sessions": [
    {
      "_id": "673abc...",
      "timestamp": "2025-11-09T14:30:00.000Z",
      "results": [...]
    }
  ]
}
```

**Key Fields:**
- `uploaded`: Number of sessions saved
- `timeSeriesSamples`: Number of IMU samples saved (NEW!)
- `sessions`: Array of created sessions with IDs

---

## 📊 View Time-Series Charts

### After Uploading

1. **Go to Time-Series Dashboard**
   ```
   http://localhost:3000/timeseries
   ```

2. **Select a session** from the dropdown

3. **View charts:**
   - 🎯 **Sway Stability** (variance over time)
   - 🚶 **Movement Smoothness** (std deviation)
   - ⚡ **Tapping Rhythm** (taps/sec + jitter)
   - 📅 **Daily Summary** (aggregated trends)

---

## 🔄 Complete Workflow

```
┌─────────────────────┐
│  1. Mobile App      │
│  Run Tests          │
│  (Sway, Tapping)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Export All      │
│  Sessions           │
│  (with IMU data)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Web App         │
│  Upload JSON        │
│  (/sessions page)   │
└──────────┬──────────┘
           │
           ▼  Automatic Processing
┌─────────────────────┐
│  4. MongoDB         │
│  • sessions         │
│  • fatigue_imu      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  5. View Charts     │
│  /timeseries        │
└─────────────────────┘
```

---

## 🎯 What's Stored

### Sessions Collection
```javascript
{
  userId: "user_abc123",
  timestamp: ISODate("2025-11-09T14:30:00Z"),
  results: [
    { type: "sway", score: 75, raw: {...} }
  ],
  metadata: {
    deviceId: "iOS-iPhone14",
    testType: "sway",
    totalSamples: 600
  }
}
```

### Time-Series Collection (fatigue_imu)
```javascript
{
  sessionId: "673abc123...",
  timestamp: ISODate("2025-11-09T14:30:00.000Z"),
  acc: { x: 0.123, y: -0.456, z: 9.812 },
  gyro: { x: 0.001, y: -0.002, z: 0.003 },
  type: "sway"
}
// × 600 samples per session
```

---

## ✅ Verification Checklist

After uploading, verify:

1. **Sessions saved:**
   ```bash
   # Check main dashboard
   http://localhost:3000
   ```

2. **Time-series data exists:**
   ```bash
   # Check MongoDB
   db.fatigue_imu.find({sessionId: "YOUR_SESSION_ID"}).count()
   # Should return > 0
   ```

3. **Charts render:**
   ```bash
   # Visit time-series page
   http://localhost:3000/timeseries
   # Select session → Charts should appear
   ```

---

## 🐛 Troubleshooting

### Issue: "No time-series data found"

**Causes:**
1. Old exports (before this update)
2. Tests completed without IMU data
3. Upload failed silently

**Solutions:**
1. **Re-export** from mobile app (ensure latest version)
2. **Run new tests** in mobile app
3. Check upload response for `timeSeriesSamples` count

---

### Issue: Upload says 0 time-series samples

**Cause:** Sessions don't have `imuData` or `gyroData` arrays.

**Solution:**
1. Make sure you're using **"Export All Sessions"** (not individual export)
2. Ensure tests were run with sensors active
3. Check JSON file includes `imuData` and `gyroData` arrays

---

### Issue: Charts show but flat lines

**Cause:** Insufficient data variance or too few samples.

**Solution:**
1. Run longer tests (30+ seconds)
2. Ensure actual movement during tests
3. Check that sensor update rate is high (50Hz+)

---

## 📈 Data Requirements

For best results:
- **Minimum samples per session:** 100
- **Recommended samples:** 500-1000
- **Sensor update rate:** 50-100Hz
- **Test duration:** 10-30 seconds

---

## 🚀 Next Steps

1. ✅ Export sessions from mobile app
2. ✅ Upload via web dashboard
3. ✅ View time-series charts
4. 📊 Analyze fatigue trends
5. 🤖 Use AI analysis with time-series context

---

**Last Updated:** November 9, 2025  
**Status:** ✅ Fully Operational


# Automatic Time-Series Processing

## ✅ Feature Overview

The web app now **automatically extracts and saves time-series IMU data** when you upload sessions from the mobile app.

---

## 🔄 How It Works

### Before (Manual)
```
1. Upload sessions → Only saves test scores
2. Manually upload IMU data → POST /api/timeseries/insert
3. View charts
```

### Now (Automatic) ✨
```
1. Upload sessions → Automatically saves both:
   • Test scores (sessions collection)
   • IMU data (fatigue_imu collection)
2. View charts immediately!
```

---

## 📊 What Gets Processed

When you upload a session with this structure:

```json
{
  "sessions": [
    {
      "timestamp": "2025-11-09T14:30:00.000Z",
      "results": [...],
      "metadata": {...},
      "imuData": [
        {"x": 0.123, "y": -0.456, "z": 9.812, "timestamp": 1699545000000}
      ],
      "gyroData": [
        {"x": 0.001, "y": -0.002, "z": 0.003, "timestamp": 1699545000000}
      ]
    }
  ]
}
```

### The server automatically:

1. **Creates session** in `sessions` collection
2. **Extracts IMU data** from `imuData` and `gyroData` arrays
3. **Determines test type** from results (tapping/sway/movement)
4. **Formats samples** for time-series collection:
   ```javascript
   {
     sessionId: "673abc...",
     timestamp: new Date(sample.timestamp),
     acc: { x, y, z },
     gyro: { x, y, z },
     type: "sway"
   }
   ```
5. **Inserts into `fatigue_imu`** time-series collection
6. **Returns summary:**
   ```json
   {
     "uploaded": 1,
     "timeSeriesSamples": 600  // ← IMU samples saved
   }
   ```

---

## 🎯 Smart Processing Logic

### Test Type Detection
```typescript
// Priority order:
1. From first test result: results[0].type
2. From metadata: metadata.testType
3. Default: "movement"

// Validation:
validTypes = ['tapping', 'sway', 'movement']
// If invalid, defaults to 'movement'
```

### Timestamp Handling
```typescript
// For each IMU sample:
timestamp = acc.timestamp || acc.t || (Date.now() + index * 10)
// Fallback ensures sequential timestamps at 10ms intervals
```

### Error Handling
- ✅ **Non-blocking:** Time-series insert failures don't block session creation
- ✅ **Partial success:** If 5 sessions uploaded, 4 succeed → still returns 4
- ✅ **Logging:** Errors logged but upload continues

---

## 📈 Response Format

### Successful Upload with Time-Series Data
```json
{
  "success": true,
  "uploaded": 3,
  "failed": 0,
  "total": 3,
  "timeSeriesSamples": 1800,
  "sessions": [
    {
      "_id": "673abc123...",
      "timestamp": "2025-11-09T14:30:00.000Z",
      "results": [...],
      "createdAt": "2025-11-09T15:00:00.000Z"
    }
  ]
}
```

**Key Indicators:**
- `timeSeriesSamples > 0` → IMU data was saved ✅
- `timeSeriesSamples = 0` → No IMU data found (sessions only) ⚠️

---

## 🔍 Verification

### Check Sessions
```bash
curl http://localhost:3000/api/sessions
```

### Check Time-Series Data
```bash
curl http://localhost:3000/api/timeseries/session/[sessionId]
```

Should return:
```json
{
  "success": true,
  "sessionId": "673abc...",
  "labels": ["2025-11-09T14:30:00.000Z", ...],
  "avgAccX": [0.123, 0.125, ...],
  "accStd": [0.012, 0.015, ...],
  "type": "sway",
  "sampleCount": 600
}
```

---

## 💡 Benefits

1. **One-step upload:** No need to manually upload IMU data
2. **Automatic linking:** Session ID automatically assigned
3. **Immediate visualization:** Charts available right away
4. **Backward compatible:** Works with sessions that don't have IMU data
5. **Error resilient:** Continues even if time-series insert fails

---

## 🛠 Technical Details

### Database Operations
```typescript
// 1. Create session
const session = await Session.create({...});

// 2. Extract IMU data
const samples = imuData.map((acc, idx) => ({
  sessionId: session._id.toString(),
  timestamp: new Date(acc.timestamp),
  acc: { x: acc.x, y: acc.y, z: acc.z },
  gyro: { x: gyro[idx].x, y: gyro[idx].y, z: gyro[idx].z },
  type: testType
}));

// 3. Bulk insert
await TimeSeriesIMU.insertMany(samples, { ordered: false });
```

### Performance
- **Batch insert:** Uses `insertMany()` for efficiency
- **Unordered:** `ordered: false` allows parallel processing
- **Non-blocking:** Time-series errors don't affect session creation

---

## 🚦 Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Success | Check `timeSeriesSamples` in response |
| 400 | Invalid data | Check JSON format |
| 401 | Unauthorized | Sign in to web app |
| 500 | Server error | Check logs, retry |

---

## 📝 Migration Notes

### Old Uploads (Before This Update)
Sessions uploaded before this feature **don't have time-series data**.

**To add time-series data:**
1. Re-export from mobile app (includes IMU data now)
2. Re-upload via web dashboard
3. System will automatically process IMU data

### Backward Compatibility
✅ Old sessions without IMU data still work  
✅ Main dashboard unaffected  
✅ AI analysis continues to function  
⚠️ Time-series charts only work for new uploads  

---

## 🎯 Example: Complete Upload

```bash
# 1. Export from mobile app
# Creates: fatiguesense_all_sessions_1699545000.json

# 2. Upload via API
curl -X POST http://localhost:3000/api/sessions/upload \
  -H "Content-Type: application/json" \
  -d @fatiguesense_all_sessions_1699545000.json

# Response:
{
  "success": true,
  "uploaded": 3,
  "timeSeriesSamples": 1800,  // ← 600 samples × 3 sessions
  "sessions": [...]
}

# 3. View in time-series dashboard
# http://localhost:3000/timeseries
```

---

## 🐛 Troubleshooting

### timeSeriesSamples = 0

**Causes:**
1. `imuData` or `gyroData` missing from upload
2. Arrays are empty
3. Old export format (before update)

**Fix:**
- Re-export from updated mobile app
- Ensure tests were run with sensors active

---

### Upload succeeds but charts empty

**Causes:**
1. Time-series insert failed (check server logs)
2. Wrong session ID selected
3. MongoDB connection issue

**Fix:**
```bash
# Check MongoDB directly
db.fatigue_imu.find({sessionId: "YOUR_SESSION_ID"}).count()
```

---

### Partial success (some sessions fail)

**Expected behavior:** The system continues processing remaining sessions.

**Check response:**
```json
{
  "uploaded": 2,
  "failed": 1,
  "errors": [
    {"index": 1, "error": "Invalid timestamp"}
  ]
}
```

---

## 🚀 Performance Tips

1. **Batch uploads:** Upload multiple sessions at once (faster)
2. **Sample rate:** 50-100Hz optimal (balance between detail and speed)
3. **Test duration:** 10-30 seconds ideal (300-3000 samples)
4. **Connection:** Use Wi-Fi for large uploads

---

**Status:** ✅ Active  
**Version:** 1.0.0  
**Last Updated:** November 9, 2025


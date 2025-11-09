# Time-Series Quick Start

Get up and running with MongoDB time-series in 5 minutes.

---

## Step 1: Initialize Collection

```bash
cd fatiguesense-web
npm run timeseries:init
```

Expected output:
```
✅ Time-series collection created successfully!
   timeField: timestamp
   metaField: sessionId
   granularity: seconds
```

---

## Step 2: Insert Sample Data

Use the API endpoint to insert IMU samples:

```bash
curl -X POST http://localhost:3000/api/timeseries/insert \
  -H "Content-Type: application/json" \
  -d '{
    "samples": [
      {
        "sessionId": "507f1f77bcf86cd799439011",
        "timestamp": "2025-11-09T14:30:00.000Z",
        "acc": { "x": 0.123, "y": -0.456, "z": 9.812 },
        "gyro": { "x": 0.001, "y": -0.002, "z": 0.003 },
        "type": "sway"
      }
    ]
  }'
```

---

## Step 3: Query Data

Fetch aggregated data for a session:

```bash
curl http://localhost:3000/api/timeseries/session/507f1f77bcf86cd799439011
```

---

## Step 4: View Dashboard

Open your browser:

```
http://localhost:3000/timeseries
```

You should see:
- Session selector dropdown
- Interactive charts (Sway, Movement, Tapping)
- Daily summary bar chart

---

## Integration with Mobile App

### After Each Test Completion

1. **Create Session** (existing functionality)
   ```typescript
   const response = await fetch('/api/sessions', {
     method: 'POST',
     body: JSON.stringify({
       timestamp: new Date().toISOString(),
       results: testResults,
       metadata: { /* ... */ }
     })
   });
   const { session } = await response.json();
   const sessionId = session._id;
   ```

2. **Upload IMU Data** (NEW)
   ```typescript
   // Prepare IMU samples from your test
   const imuSamples = accData.map((acc, idx) => ({
     sessionId: sessionId,
     timestamp: new Date(startTime + idx * 10).toISOString(), // 10ms intervals
     acc: { x: acc.x, y: acc.y, z: acc.z },
     gyro: { x: gyroData[idx].x, y: gyroData[idx].y, z: gyroData[idx].z },
     type: testType // 'tapping', 'sway', or 'movement'
   }));

   // Upload to time-series
   await fetch('/api/timeseries/insert', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ samples: imuSamples })
   });
   ```

---

## Verification

Check that everything works:

```bash
# 1. Collection exists
npm run db:init

# 2. Data inserted
curl http://localhost:3000/api/timeseries/session/[sessionId]

# 3. Charts render
# Visit http://localhost:3000/timeseries in browser
```

---

## Common Issues

**Q: "No time-series data found"**
- Ensure IMU samples were uploaded after session creation
- Verify `sessionId` matches

**Q: Chart is empty**
- Check that session has data: `GET /api/timeseries/session/[id]`
- Ensure session type matches chart type (sway → sway chart)

**Q: "Collection is not time-series"**
- Drop collection: `db.fatigue_imu.drop()`
- Re-run: `npm run timeseries:init`

---

## What's Next?

1. Read full documentation: `TIMESERIES_README.md`
2. Integrate with mobile app IMU data collection
3. Customize charts for your use case
4. Add real-time streaming (optional)

---

**Done!** You now have a working time-series system.


# Mobile App Time-Series Integration Guide

How to upload IMU sensor data to the MongoDB time-series collection.

---

## Overview

After completing a test (tapping, sway, or movement), upload the raw IMU data to enable time-series visualization in the web dashboard.

---

## Integration Steps

### 1. Capture IMU Data During Test

Already implemented in your test modules. Example:

```typescript
// In tapping.tsx, sway.tsx, or movement.tsx
const accData: { x: number; y: number; z: number; timestamp: number }[] = [];
const gyroData: { x: number; y: number; z: number; timestamp: number }[] = [];

// During test
Accelerometer.addListener((data) => {
  accData.push({
    x: data.x,
    y: data.y,
    z: data.z,
    timestamp: Date.now()
  });
});

Gyroscope.addListener((data) => {
  gyroData.push({
    x: data.x,
    y: data.y,
    z: data.z,
    timestamp: Date.now()
  });
});
```

---

### 2. Create Session (Existing)

```typescript
const session = {
  timestamp: new Date().toISOString(),
  results: testResults,
  metadata: {
    deviceId: "mobile-app",
    testType: testType,
    durationSeconds: duration,
    totalSamples: accData.length,
  },
};

// Save to AsyncStorage
const sessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
const allSessions = sessions ? JSON.parse(sessions) : [];
allSessions.unshift(session);
await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
```

---

### 3. Upload IMU Data (NEW)

Add this function to your test modules:

```typescript
async function uploadTimeSeriesData(
  sessionId: string,
  accData: { x: number; y: number; z: number; timestamp: number }[],
  gyroData: { x: number; y: number; z: number; timestamp: number }[],
  testType: 'tapping' | 'sway' | 'movement'
) {
  try {
    // Prepare samples
    const samples = accData.map((acc, idx) => ({
      sessionId: sessionId,
      timestamp: new Date(acc.timestamp).toISOString(),
      acc: {
        x: acc.x,
        y: acc.y,
        z: acc.z,
      },
      gyro: {
        x: gyroData[idx]?.x || 0,
        y: gyroData[idx]?.y || 0,
        z: gyroData[idx]?.z || 0,
      },
      type: testType,
    }));

    // Upload to web app
    const response = await fetch('YOUR_WEB_APP_URL/api/timeseries/insert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ samples }),
    });

    const result = await response.json();
    console.log('Time-series upload:', result);
  } catch (error) {
    console.error('Failed to upload time-series data:', error);
    // Non-blocking: app continues even if upload fails
  }
}
```

---

### 4. Call After Test Completion

```typescript
// After saving session
const sessionId = session._id || generateTempId(); // Use actual session ID from backend

await uploadTimeSeriesData(sessionId, accData, gyroData, testType);
```

---

## Full Example: Tapping Test

```typescript
import { useState, useEffect } from "react";
import { Accelerometer, Gyroscope } from "expo-sensors";

export default function TappingTest() {
  const [accData, setAccData] = useState<any[]>([]);
  const [gyroData, setGyroData] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start test
  const startTest = () => {
    const accListener = Accelerometer.addListener((data) => {
      setAccData((prev) => [
        ...prev,
        { x: data.x, y: data.y, z: data.z, timestamp: Date.now() },
      ]);
    });

    const gyroListener = Gyroscope.addListener((data) => {
      setGyroData((prev) => [
        ...prev,
        { x: data.x, y: data.y, z: data.z, timestamp: Date.now() },
      ]);
    });

    Accelerometer.setUpdateInterval(10); // 100Hz
    Gyroscope.setUpdateInterval(10);
  };

  // End test
  const endTest = async () => {
    Accelerometer.removeAllListeners();
    Gyroscope.removeAllListeners();

    // Save session (existing logic)
    const session = {
      timestamp: new Date().toISOString(),
      results: calculateResults(accData),
      metadata: {
        deviceId: "mobile-app",
        testType: "tapping",
        durationSeconds: 10,
        totalSamples: accData.length,
      },
    };

    const sessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
    const allSessions = sessions ? JSON.parse(sessions) : [];
    allSessions.unshift(session);
    await AsyncStorage.setItem(
      SESSIONS_STORAGE_KEY,
      JSON.stringify(allSessions)
    );

    // NEW: Upload time-series data
    const id = allSessions[0]._id || generateId();
    await uploadTimeSeriesData(id, accData, gyroData, "tapping");
  };

  return (
    // Your UI
  );
}
```

---

## Configuration

### Set Web App URL

Create a config file:

```typescript
// config.ts
export const WEB_APP_URL =
  __DEV__
    ? "http://localhost:3000" // Development
    : "https://your-app.vercel.app"; // Production
```

Use in upload function:

```typescript
import { WEB_APP_URL } from "./config";

const response = await fetch(`${WEB_APP_URL}/api/timeseries/insert`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ samples }),
});
```

---

## Error Handling

```typescript
async function uploadTimeSeriesData(/* ... */) {
  try {
    const response = await fetch(/* ... */);

    if (!response.ok) {
      const error = await response.json();
      console.warn("Time-series upload failed:", error.message);
      return; // Non-blocking
    }

    const result = await response.json();
    console.log(`✅ Uploaded ${result.inserted} samples`);
  } catch (error) {
    console.error("Network error during time-series upload:", error);
    // App continues normally
  }
}
```

**Important:** Time-series upload should be **non-blocking**. If it fails, the app should continue working normally.

---

## Optimizations

### 1. Batch Upload

Don't upload every sample immediately. Collect and upload in batches:

```typescript
const BATCH_SIZE = 100;

const uploadBatch = async (samples: any[]) => {
  for (let i = 0; i < samples.length; i += BATCH_SIZE) {
    const batch = samples.slice(i, i + BATCH_SIZE);
    await uploadTimeSeriesData(sessionId, batch, /* ... */);
  }
};
```

### 2. Background Upload

Use Expo's background fetch:

```typescript
import * as BackgroundFetch from "expo-background-fetch";

BackgroundFetch.registerTaskAsync("upload-timeseries", {
  minimumInterval: 60 * 15, // 15 minutes
  stopOnTerminate: false,
  startOnBoot: true,
});
```

### 3. Offline Queue

Queue uploads when offline, sync when online:

```typescript
import NetInfo from "@react-native-community/netinfo";

const queuedUploads = [];

NetInfo.addEventListener((state) => {
  if (state.isConnected && queuedUploads.length > 0) {
    // Upload queued data
    queuedUploads.forEach((upload) => uploadTimeSeriesData(/* ... */));
    queuedUploads.length = 0;
  }
});
```

---

## Verification

After implementing:

1. **Run a test** in the mobile app
2. **Check logs** for upload confirmation
3. **Visit web dashboard** at `/timeseries`
4. **Select the session** and view charts

---

## Troubleshooting

**Q: "Insert failed: Invalid data"**
- Check that all samples have required fields
- Verify `type` is one of: 'tapping', 'sway', 'movement'
- Ensure timestamps are valid ISO 8601 strings

**Q: Upload is slow**
- Reduce update interval: `Accelerometer.setUpdateInterval(50)` (20Hz instead of 100Hz)
- Implement batch uploads
- Use background fetch

**Q: No data in web dashboard**
- Verify `sessionId` matches between session creation and time-series upload
- Check web app logs for errors
- Test API endpoint with curl

---

## Next Steps

1. Implement upload in all test modules (tapping, sway, movement)
2. Add offline queue for reliability
3. Monitor upload success rates
4. Optimize for battery life

---

**Done!** Your mobile app now feeds the time-series dashboard.


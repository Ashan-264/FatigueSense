# FatigueSense Export Format

## Overview

The mobile app can export IMU (Inertial Measurement Unit) data in JSON format, compatible with the FatigueSense web dashboard for advanced analysis.

## Export Process

1. Run at least one test (Sway Test or Movement Test recommended for IMU data)
2. An "Export Data" button will appear below the test cards
3. Tap "Export Data" to generate and share the JSON file
4. Share via your preferred method (email, cloud storage, etc.)

## JSON File Format

```json
{
  "timestamp": "2025-02-18T15:21:00Z",
  "metadata": {
    "deviceId": "android-xyz-123",
    "testType": "full-assessment",
    "durationSeconds": 30,
    "startTime": "2025-02-18T15:20:30Z",
    "totalSamples": 1200,
    "deviceInfo": {
      "platform": "android",
      "modelName": "Pixel 7",
      "osVersion": "14",
      "manufacturer": "Google"
    },
    "sensorConfig": {
      "accelerometerInterval": 50,
      "gyroscopeInterval": 50
    }
  },
  "acc": [
    { "x": 0.01, "y": -0.02, "z": 1.01, "t": 0 },
    { "x": 0.05, "y": -0.01, "z": 1.0, "t": 25 },
    ...
  ],
  "gyro": [
    { "x": 0.001, "y": 0.0, "z": 0.002, "t": 0 },
    { "x": 0.002, "y": 0.001, "z": 0.003, "t": 25 },
    ...
  ],
  "testResults": [
    {
      "type": "tapping",
      "score": 62,
      "raw": {
        "taps": 95,
        "tapsPerSec": 6.33,
        "avgInterval": 158,
        "jitter": 27.4
      },
      "at": 1739907000000
    },
    ...
  ]
}
```

## Field Descriptions

### `timestamp` (string, required)

ISO 8601 timestamp of when the export was created

### `metadata` (object, required)

Contains test and device metadata:

- `deviceId`: Unique device identifier
- `testType`: Type of test ("tapping", "sway", "movement", or "full-assessment" for multiple tests)
- `durationSeconds`: Total duration of all tests in seconds
- `startTime`: ISO 8601 timestamp when first test started
- `totalSamples`: Total number of accelerometer samples
- `deviceInfo`: Device information (platform, modelName, osVersion, manufacturer)
- `sensorConfig`: Sensor configuration (accelerometerInterval, gyroscopeInterval in ms)

### `acc` (array, required)

Array of accelerometer samples captured during tests. Each sample contains:

- `x`: X-axis acceleration (m/s²)
- `y`: Y-axis acceleration (m/s²)
- `z`: Z-axis acceleration (m/s²)
- `t`: Timestamp in milliseconds relative to test start

### `gyro` (array, optional)

Array of gyroscope samples captured during tests. Each sample contains:

- `x`: X-axis rotation rate (rad/s)
- `y`: Y-axis rotation rate (rad/s)
- `z`: Z-axis rotation rate (rad/s)
- `t`: Timestamp in milliseconds relative to test start

### `testResults` (array, required)

Array of completed test results from the mobile app, including:

- `type`: Test type ("tapping", "sway", or "movement")
- `score`: Computed score (0-100)
- `raw`: Raw metrics used to calculate the score
- `at`: Unix timestamp (milliseconds) when test was completed

## Web Dashboard Usage

1. Go to the FatigueSense web dashboard
2. Click "Choose File" and select your exported JSON file
3. The dashboard will:
   - Calculate advanced fatigue metrics (RMS, Jerk, Sway, Entropy)
   - Display a composite fatigue score
   - Show an accelerometer chart
   - Provide detailed metric breakdowns

## Data Collection Notes

- **Sway Test**: Captures accelerometer data at 50Hz (20ms intervals) for 20 seconds = ~400 samples
- **Movement Test**: Captures accelerometer data at 40Hz (25ms intervals) for 30 seconds = ~1,200 samples
- **Tapping Test**: Does not capture IMU data (only tap timing data)

## Privacy

All data is stored locally on your device. Export and sharing are manual actions initiated by you. No data is automatically uploaded or transmitted.

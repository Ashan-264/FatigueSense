# Export All Sessions - Usage Guide

## Overview

The mobile app now has two export options:

1. **Export Current Session** - Exports detailed IMU data for the current session
2. **Export All Sessions** - Exports all saved sessions (up to 5) for cloud sync

## Using "Export All Sessions"

### When to Use It

Use this feature when you want to:
- ✅ Sync all your sessions to the cloud (MongoDB)
- ✅ Backup your test data
- ✅ Share multiple sessions at once
- ✅ Upload to the web dashboard for analysis

### How to Use It

1. **Complete Multiple Test Sessions**
   - Run tests over several days
   - Each session is automatically saved
   - App stores up to 5 sessions

2. **Export All Sessions**
   - Look for the "Export All Sessions" button
   - It appears when you have saved sessions
   - Shows: "Export X saved session(s) for cloud sync"

3. **Share/Save the File**
   - Tap the button
   - File is named: `fatiguesense_all_sessions_[timestamp].json`
   - Share via email, cloud storage, or save locally

4. **Upload to Web App**
   - Transfer file to your computer
   - Run the sync script:
   ```bash
   cd fatiguesense-web
   npm run sync-mobile path/to/fatiguesense_all_sessions_1234.json
   ```
   - Enter your User ID when prompted
   - ✅ All sessions now in MongoDB!

## Export File Format

The exported JSON file contains:

```json
{
  "sessions": [
    {
      "timestamp": "2025-11-09T14:30:00Z",
      "results": [
        {
          "type": "tapping",
          "score": 85,
          "raw": { /* test metrics */ }
        },
        {
          "type": "sway",
          "score": 72,
          "raw": { /* test metrics */ }
        },
        {
          "type": "movement",
          "score": 90,
          "raw": { /* test metrics */ }
        }
      ],
      "metadata": {
        "deviceId": "ios-iPhone14",
        "testType": "full-assessment",
        "durationSeconds": 65,
        "totalSamples": 1500
      }
    },
    // ... more sessions (up to 5)
  ],
  "exportedAt": "2025-11-09T15:00:00Z",
  "totalSessions": 5,
  "deviceInfo": {
    "platform": "ios",
    "modelName": "iPhone 14",
    "osVersion": "17.0",
    "manufacturer": "Apple"
  }
}
```

## Differences Between Export Options

### Export Current Session
- **What**: Current session with detailed IMU data
- **When**: After completing tests in current session
- **Size**: Larger file (includes accelerometer/gyroscope data)
- **Use Case**: Detailed analysis, research, debugging
- **File Name**: `fatiguesense_[timestamp].json`

### Export All Sessions
- **What**: All saved sessions (up to 5)
- **When**: Anytime you have saved sessions
- **Size**: Smaller file (only test results and scores)
- **Use Case**: Cloud sync, backup, web dashboard
- **File Name**: `fatiguesense_all_sessions_[timestamp].json`

## Tips

- **Regular Exports**: Export all sessions weekly to keep cloud backup up-to-date
- **Before Clearing**: Always export before deleting sessions from the app
- **File Organization**: Name files by date for easy tracking
- **Web Dashboard**: Use exported files with the web app for long-term analysis

## Troubleshooting

### Button Not Visible
- Complete at least one test session
- Sessions are saved automatically
- Check "Recent Sessions" section to verify saved data

### Export Failed
- Make sure you have storage permissions
- Try restarting the app
- Check available storage on device

### Upload to Web Failed
- Verify MongoDB connection in web app
- Check that you're signed in with Clerk
- Ensure file path is correct in sync command

## Next Steps

After exporting:
1. Transfer file to computer
2. Follow web app setup guide (QUICK_START.md)
3. Run sync script to upload to MongoDB
4. View sessions on web dashboard
5. Run AI analysis on multiple sessions


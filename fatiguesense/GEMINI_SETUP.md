# Gemini API Setup for FatigueSense

## Overview

The FatigueSense mobile app now includes AI-powered fatigue analysis using Google's Gemini API. This feature analyzes your last 5 test sessions to provide personalized insights and recovery recommendations.

## Getting Your Gemini API Key

1. **Go to Google AI Studio**

   - Visit: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign in with your Google Account**

3. **Create an API Key**

   - Click "Get API Key" or "Create API Key"
   - Select a project or create a new one
   - Copy the API key

4. **Add to Environment Variables**
   - Open `.env` file in the fatiguesense folder
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

## Features

### AI Fatigue Analysis Page

The analysis page provides:

1. **Overall Fatigue Assessment**

   - Rates your current fatigue level (Fresh/Mild/Moderate/High/Severe)
   - Explains the reasoning behind the assessment

2. **Specific Fatigue Patterns**

   - Central Nervous System fatigue (from tapping test)
   - Balance/Postural Control fatigue (from sway test)
   - Muscular/Movement Quality fatigue (from movement test)

3. **Trend Analysis**

   - Shows how your scores are changing over time
   - Identifies if you're improving, declining, or stable

4. **Specific Concerns**

   - Highlights any concerning patterns or red flags
   - Points out areas that need attention

5. **Recovery Recommendations**
   - 3-5 specific, actionable recovery strategies
   - Rest recommendations
   - Nutrition strategies
   - Sleep optimization tips
   - Active recovery suggestions
   - Training return timeline

## How to Use

1. **Complete Multiple Tests**

   - Run at least one session with test results
   - The more sessions you have (up to 5), the better the analysis

2. **Navigate to Analysis**

   - From the main screen, tap the "🤖 AI Fatigue Analysis" button
   - This button appears when you have saved sessions

3. **Request Analysis**

   - Tap "Analyze My Fatigue" button
   - Wait for the AI to process your data (usually 5-10 seconds)

4. **Review Results**
   - Read the comprehensive analysis
   - Follow the personalized recovery recommendations

## Test Interpretation

### Tapping Test (Motor Speed & Rhythm)

- Measures: Central nervous system responsiveness
- Higher taps/second = Better CNS function
- Lower jitter = More consistent neural output
- Scores: 0-100 (higher is better)

### Sway Test (Balance & Stability)

- Measures: Postural control and CNS integration
- Lower variance = Better stability
- Higher score = Better balance control
- Scores: 0-100 (higher is better)

### Movement Test (Gait Quality)

- Measures: Overall neuromuscular coordination
- Lower standard deviation = Smoother movement
- Higher score = Better movement quality
- Scores: 0-100 (higher is better)

## Privacy & Data

- All analysis is done via secure HTTPS requests
- Session data is sent to Google's Gemini API for analysis
- No data is stored on Google's servers after analysis
- Your API key is stored locally in your .env file
- Sessions are stored locally on your device only

## API Limits

- Gemini API has free tier limits:
  - 60 requests per minute
  - 1,500 requests per day
- Each analysis counts as 1 request
- Typical usage: 5-10 analyses per day should stay within free limits

## Troubleshooting

### "Analysis Failed" Error

1. Check that your API key is correctly set in `.env`
2. Verify the API key is active in Google AI Studio
3. Ensure you have internet connectivity
4. Check if you've exceeded API rate limits

### "No Data" Error

- You need to complete at least one test session
- Sessions are saved automatically after completing tests

### Analysis Takes Too Long

- Normal processing time: 5-15 seconds
- Check your internet connection
- Try again if it takes longer than 30 seconds

## Cost

- **Free Tier**: 60 requests/minute, 1,500 requests/day
- **Paid Tier**: If you need more, pricing is very affordable
  - ~$0.00025 per request
  - ~$0.25 for 1,000 analyses

## Support

For issues or questions:

1. Check this guide first
2. Verify your API key setup
3. Test with a simple session
4. Contact support with error messages

---

**Note**: Keep your API key private and never commit it to public repositories!

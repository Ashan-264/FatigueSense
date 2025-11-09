import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface SessionSummary {
  sessionNumber: number;
  date: string;
  time: string;
  testType: string;
  results: {
    type: string;
    score: number;
    metrics?: Record<string, number>;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      return NextResponse.json(
        {
          error: "Configuration Error",
          message:
            "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { sessions } = body;

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Please provide at least one session to analyze",
        },
        { status: 400 }
      );
    }

    // Prepare session summary for AI
    const sessionSummary: SessionSummary[] = sessions.map(
      (session: any, idx: number) => ({
        sessionNumber: idx + 1,
        date: new Date(session.timestamp).toLocaleDateString(),
        time: new Date(session.timestamp).toLocaleTimeString(),
        testType: session.metadata?.testType || "unknown",
        results: session.results.map((r: any) => ({
          type: r.type,
          score: r.score,
          metrics: r.raw,
        })),
      })
    );

    const prompt = `You are a fatigue AI assistant for everyday users. Use simple, friendly language. 
Be concise. Never guess or make up information:





--------------------------------------------------
GUARDRAILS — VERY IMPORTANT:
--------------------------------------------------
1. If ANY required test data is missing, empty, or undefined 
   (tapping, balance, movement, or overall score),
   respond only with:

   "No data received."

2. NEVER invent numbers, trends, reasons, or scores.
   ONLY use the data provided.

3. If trend data is not included, write:
   "No trend data available."

4. limit your answer to 4 points per task consisting of 15 words or less per point

5. Focus on providing specific insights and recommendations based on the data provided and ensure its useful for the user.

--------------------------------------------------
Test Info:
--------------------------------------------------
You will receive results from up to 3 phone tests:

1. TAPPING TEST:
   - Measures: finger speed + rhythm consistency
   - Key metrics:
     * tapsPerSec: Higher = better reaction time
     * jitter: Lower = more consistent rhythm (good coordination)
     * avgInterval: Time between taps (shorter = faster)
   
2. SWAY TEST (Balance):
   - Measures: postural stability
   - Key metrics:
     * variance: Lower = better balance and stability
     * Values < 0.02 = excellent stability
     * Values > 0.06 = concerning instability
   
3. MOVEMENT TEST:
   - Measures: gait smoothness
   - Key metrics:
     * std (standard deviation): Lower = smoother, more controlled movement
     * Values < 0.01 = very smooth gait
     * Values > 0.3 = jerky, uncoordinated movement

Each score is 0–100 (higher = better).

${JSON.stringify(sessionSummary, null, 2)}

--------------------------------------------------
Your Task (ONLY if complete data is present):
--------------------------------------------------

1. Readiness Today:
   - Choose one word: "Ready", "Okay", or "Tired".
   - One sentence explaining why using BOTH scores AND specific metrics.
   - Example: "Tired. Your tapping jitter of 180 shows inconsistent rhythm, and sway variance of 0.12 indicates poor balance."

2. Detailed Performance Analysis:
   - For TAPPING: Comment on tapsPerSec AND jitter specifically
     * High jitter (>100) = mental fatigue affecting coordination
     * Low tapsPerSec (<4) = slowed reactions
   
   - For SWAY: Comment on variance value specifically
     * variance >0.06 = balance issues, possible central fatigue
     * variance <0.02 = excellent stability
   
   - For MOVEMENT: Comment on std (standard deviation) specifically
     * std >0.2 = unsteady gait, physical fatigue
     * std <0.05 = smooth, controlled movement

3. Root Cause Insights:
   - Identify THE PRIMARY weakness based on metrics
   - Explain what that specific metric value means for fatigue type
   - Example: "High movement std (0.48) suggests physical exhaustion affecting muscle control"

4. Specific Recommendations:
   - Give targeted advice based on which metrics are worst
   - If tapping jitter high: mental rest, reduce screen time
   - If sway variance high: balance exercises, core strength
   - If movement std high: rest, avoid strenuous activity
   - give what is the maxmium amount of physical exerxtion for the day

5. Trend (if multiple sessions):
   - Compare metric values across sessions
   - Say "Improving", "Stable", or "Dropping"
   - Cite specific metric changes
   - If no trend data: "No trend data available."

Tone:
- Supportive, simple, and brief.
- Never use medical terms.
- ALWAYS reference specific metric values when explaining.
`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Gemini API error: ${response.status}`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No analysis generated by AI service");
    }

    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText || generatedText.trim() === "") {
      throw new Error("AI service returned empty analysis");
    }

    return NextResponse.json({
      success: true,
      analysis: generatedText,
      sessionsAnalyzed: sessions.length,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);

    let errorMessage = "An unexpected error occurred. Please try again.";
    let statusCode = 500;

    if (error.message?.includes("API key")) {
      errorMessage =
        "Invalid or expired API key. Please check your Gemini API key configuration.";
      statusCode = 401;
    } else if (
      error.message?.includes("429") ||
      error.message?.includes("quota")
    ) {
      errorMessage =
        "Rate limit exceeded. Please wait a few minutes before trying again.";
      statusCode = 429;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: "Analysis failed", message: errorMessage },
      { status: statusCode }
    );
  }
}

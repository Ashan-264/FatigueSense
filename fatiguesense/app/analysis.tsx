import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import DrawerMenu from "../components/DrawerMenu";

const SESSIONS_STORAGE_KEY = "@fatiguesense_sessions";
const GEMINI_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface Session {
  id: string;
  timestamp: string;
  results: any[];
  metadata: {
    deviceId: string;
    testType: string;
    durationSeconds: number;
    totalSamples: number;
  };
}

export default function Analysis() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set()
  );
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const storedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        const parsedSessions: Session[] = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        // Auto-select first 5 sessions by default
        const defaultSelected = new Set<string>(
          parsedSessions.slice(0, 5).map((s) => s.id)
        );
        setSelectedSessions(defaultSelected);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedSessions(new Set(sessions.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedSessions(new Set());
  };

  const analyzeWithGemini = async () => {
    // Validate session selection
    if (selectedSessions.size === 0) {
      Alert.alert(
        "No Sessions Selected",
        "Please select at least one session to analyze."
      );
      return;
    }

    // Validate API key configuration
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      Alert.alert(
        "Configuration Error",
        "Gemini API key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file."
      );
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      // Prepare session data for analysis - only selected sessions
      const selectedSessionData = sessions.filter((s) =>
        selectedSessions.has(s.id)
      );

      // Validate that we have actual data to analyze
      if (selectedSessionData.length === 0) {
        Alert.alert(
          "No Data Available",
          "The selected sessions contain no data to analyze."
        );
        setLoading(false);
        return;
      }

      // Validate that sessions have results
      const hasValidData = selectedSessionData.some(
        (session) => session.results && session.results.length > 0
      );

      if (!hasValidData) {
        Alert.alert(
          "Invalid Data",
          "The selected sessions do not contain any test results. Please complete at least one test first."
        );
        setLoading(false);
        return;
      }

      const sessionSummary = selectedSessionData.map((session, idx) => ({
        sessionNumber: idx + 1,
        date: new Date(session.timestamp).toLocaleDateString(),
        time: new Date(session.timestamp).toLocaleTimeString(),
        testType: session.metadata.testType,
        results: session.results.map((r) => ({
          type: r.type,
          score: r.score,
          metrics: r.raw,
        })),
      }));

      // DEBUG: Log session summary being sent to AI
      console.log("=== SESSION SUMMARY DATA ===");
      console.log(JSON.stringify(sessionSummary, null, 2));
      console.log("============================");

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

      // Make API request with timeout
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      // Validate response structure
      if (!response.data) {
        throw new Error("Empty response from AI service");
      }

      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error("No analysis generated by AI service");
      }

      const generatedText =
        response.data.candidates[0]?.content?.parts[0]?.text;

      if (!generatedText || generatedText.trim() === "") {
        throw new Error("AI service returned empty analysis");
      }

      setAnalysis(generatedText);
    } catch (error: any) {
      console.error("Gemini API error:", error);

      // Handle different types of errors with specific messages
      let errorTitle = "Analysis Failed";
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorTitle = "Request Timeout";
        errorMessage =
          "The analysis is taking too long. Please check your internet connection and try again.";
      } else if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const apiError = error.response.data?.error;

        if (status === 400) {
          errorTitle = "Invalid Request";
          errorMessage =
            apiError?.message ||
            "The request data is invalid. Please try again with different sessions.";
        } else if (status === 401 || status === 403) {
          errorTitle = "Authentication Error";
          errorMessage =
            "Your API key is invalid or has expired. Please check your Gemini API key configuration.";
        } else if (status === 429) {
          errorTitle = "Rate Limit Exceeded";
          errorMessage =
            "Too many requests. Please wait a few minutes before trying again.";
        } else if (status === 500 || status === 503) {
          errorTitle = "Service Unavailable";
          errorMessage =
            "The AI service is temporarily unavailable. Please try again later.";
        } else {
          errorMessage =
            apiError?.message || `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Request made but no response
        errorTitle = "Network Error";
        errorMessage =
          "Unable to reach the AI service. Please check your internet connection.";
      } else if (error.message) {
        // Other errors (validation, etc.)
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#1a1a1a",
        }}
      >
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          style={{ marginRight: 16, padding: 8 }}
        >
          <View
            style={{
              width: 24,
              height: 2,
              backgroundColor: "white",
              marginBottom: 6,
            }}
          />
          <View
            style={{
              width: 24,
              height: 2,
              backgroundColor: "white",
              marginBottom: 6,
            }}
          />
          <View style={{ width: 24, height: 2, backgroundColor: "white" }} />
        </TouchableOpacity>
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "700",
            flex: 1,
          }}
        >
          AI Fatigue Analysis
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#3b82f6", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
      >
        <View style={{ padding: 20 }}>
          {/* Session Count */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ color: "#999", fontSize: 14 }}>
                  Sessions Selected
                </Text>
                <Text
                  style={{ color: "white", fontSize: 32, fontWeight: "700" }}
                >
                  {selectedSessions.size}
                </Text>
                <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                  of {sessions.length} total sessions
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={selectAll}
                  style={{
                    backgroundColor: "#3b82f6",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12 }}>
                    Select All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={deselectAll}
                  style={{
                    backgroundColor: "#ef4444",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12 }}>
                    Deselect All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#3b82f6",
              padding: 18,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 20,
            }}
            onPress={analyzeWithGemini}
            disabled={loading || selectedSessions.size === 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Analyze Selected Sessions ({selectedSessions.size})
              </Text>
            )}
          </TouchableOpacity>

          {/* Analysis Results */}
          {analysis && (
            <View
              style={{
                backgroundColor: "#1a1a1a",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: "#3b82f6",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 16,
                }}
              >
                📊 Analysis Results
              </Text>
              <Text style={{ color: "#ddd", fontSize: 15, lineHeight: 24 }}>
                {analysis}
              </Text>
            </View>
          )}

          {/* Info Card */}
          {!analysis && !loading && (
            <View
              style={{
                backgroundColor: "#1a1a1a",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                🤖 AI-Powered Insights
              </Text>
              <Text
                style={{
                  color: "#999",
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 8,
                }}
              >
                Our AI will analyze your recent test sessions to provide:
              </Text>
              <Text style={{ color: "#bbb", fontSize: 14, marginBottom: 4 }}>
                • Overall fatigue assessment
              </Text>
              <Text style={{ color: "#bbb", fontSize: 14, marginBottom: 4 }}>
                • Specific fatigue patterns
              </Text>
              <Text style={{ color: "#bbb", fontSize: 14, marginBottom: 4 }}>
                • Trend analysis over time
              </Text>
              <Text style={{ color: "#bbb", fontSize: 14, marginBottom: 4 }}>
                • Personalized recovery recommendations
              </Text>
            </View>
          )}

          {/* Sessions Selection List */}
          {sessions.length > 0 && (
            <View style={{ marginBottom: 40 }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                Select Sessions to Analyze
              </Text>
              {sessions.map((session) => {
                const isSelected = selectedSessions.has(session.id);
                return (
                  <TouchableOpacity
                    key={session.id}
                    onPress={() => toggleSessionSelection(session.id)}
                    style={{
                      backgroundColor: isSelected ? "#1e3a5f" : "#1a1a1a",
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? "#3b82f6" : "transparent",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#999", fontSize: 12 }}>
                          {new Date(session.timestamp).toLocaleString()}
                        </Text>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                            marginTop: 4,
                            textTransform: "capitalize",
                          }}
                        >
                          {session.metadata.testType}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            marginTop: 8,
                            gap: 8,
                          }}
                        >
                          {session.results.map((result, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: "#2a2a2a",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#3b82f6",
                                  fontSize: 12,
                                  textTransform: "capitalize",
                                }}
                              >
                                {result.type}: {result.score}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      {/* Checkbox */}
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: isSelected ? "#3b82f6" : "#666",
                          backgroundColor: isSelected
                            ? "#3b82f6"
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 12,
                        }}
                      >
                        {isSelected && (
                          <Text style={{ color: "white", fontSize: 16 }}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

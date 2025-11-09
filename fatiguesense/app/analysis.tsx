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

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const storedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const analyzeWithGemini = async () => {
    if (sessions.length === 0) {
      Alert.alert(
        "No Data",
        "No sessions available for analysis. Complete some tests first."
      );
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      // Prepare session data for analysis
      const sessionSummary = sessions.slice(0, 5).map((session, idx) => ({
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

      const prompt = `You are an expert in neuromuscular fatigue analysis and sports medicine. Analyze the following fatigue test session data from a mobile app called FatigueSense:

${JSON.stringify(sessionSummary, null, 2)}

The tests measure:
1. **Tapping Test**: Motor speed and rhythm (measures central nervous system fatigue)
   - Higher taps/second = better
   - Lower jitter = more consistent rhythm
   
2. **Sway Test**: Balance and postural stability (measures CNS and muscular fatigue)
   - Lower variance = better stability
   - Higher score = better balance
   
3. **Movement Test**: Gait smoothness and movement quality (measures overall fatigue)
   - Lower std deviation = smoother movement
   - Higher score = better movement quality

Scores range from 0-100, with higher being better.

Please provide:

1. **Overall Fatigue Assessment**: Rate the person's current fatigue level (Fresh/Mild/Moderate/High/Severe) and explain why.

2. **Specific Fatigue Patterns**: Identify which body systems show the most fatigue:
   - Central Nervous System (from tapping test)
   - Balance/Postural Control (from sway test)
   - Muscular/Movement Quality (from movement test)

3. **Trend Analysis**: How are the scores changing over time? Are they improving, declining, or stable?

4. **Specific Concerns**: Highlight any concerning patterns or red flags.

5. **Recovery Recommendations**: Provide 3-5 specific, actionable recovery strategies based on the fatigue patterns observed. Include:
   - Rest recommendations
   - Nutrition strategies
   - Sleep optimization
   - Active recovery suggestions
   - When to return to normal training

Keep your response clear, concise, and actionable. Use bullet points and sections for easy reading.`;

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
        }
      );

      const generatedText =
        response.data.candidates[0]?.content?.parts[0]?.text ||
        "No analysis generated.";

      setAnalysis(generatedText);
    } catch (error: any) {
      console.error("Gemini API error:", error);
      Alert.alert(
        "Analysis Failed",
        error.response?.data?.error?.message ||
          "Failed to analyze data. Please check your API key and try again."
      );
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#3b82f6", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "700",
            marginLeft: 20,
          }}
        >
          AI Fatigue Analysis
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
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
            <Text style={{ color: "#999", fontSize: 14 }}>
              Sessions Available
            </Text>
            <Text style={{ color: "white", fontSize: 32, fontWeight: "700" }}>
              {sessions.length}
            </Text>
            <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              Last 5 sessions will be analyzed
            </Text>
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
            disabled={loading || sessions.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Analyze My Fatigue
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

          {/* Recent Sessions Preview */}
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
                Recent Sessions
              </Text>
              {sessions.slice(0, 5).map((session) => (
                <View
                  key={session.id}
                  style={{
                    backgroundColor: "#1a1a1a",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
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
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Device from "expo-device";

import Card from "../components/Card";
import Runner from "../components/Runner";
import {
  computeSway,
  computeTappingScore,
  computeMovementScore,
} from "../utils/math";
import { TestResult } from "../types/TestResult";

const DURATIONS = {
  TAP_SECONDS: 15,
  SWAY_SECONDS: 20,
  MOVE_SECONDS: 30,
};

interface IMUSample {
  x: number;
  y: number;
  z: number;
  t: number;
}

interface GyroSample {
  x: number;
  y: number;
  z: number;
  t: number;
}

interface Session {
  id: string;
  timestamp: string;
  results: TestResult[];
  imuData: IMUSample[];
  gyroData: GyroSample[];
  metadata: {
    deviceId: string;
    testType: string;
    durationSeconds: number;
    totalSamples: number;
  };
}

const SESSIONS_STORAGE_KEY = "@fatiguesense_sessions";
const MAX_SESSIONS = 5;

export default function Index() {
  const { user } = useUser();
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState<
    null | "tapping" | "sway" | "movement"
  >(null);
  const [modal, setModal] = useState<React.ReactNode | null>(null);
  const [imuData, setImuData] = useState<IMUSample[]>([]);
  const [gyroData, setGyroData] = useState<GyroSample[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  const tap = results.filter((r) => r.type === "tapping").slice(-1)[0];
  const sway = results.filter((r) => r.type === "sway").slice(-1)[0];
  const move = results.filter((r) => r.type === "movement").slice(-1)[0];

  const fatigueScore = useMemo(() => {
    const parts = [tap, sway, move].filter(Boolean).map((r) => r!.score);
    if (!parts.length) return null;
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }, [tap, sway, move]);

  // Load sessions from storage on mount
  useEffect(() => {
    loadSessions();
    // Initialize a new session
    setCurrentSessionId(`session_${Date.now()}`);
  }, []);

  // Save current session whenever results, imuData, or gyroData change
  useEffect(() => {
    if (results.length > 0 || imuData.length > 0) {
      saveCurrentSession();
    }
  }, [results, imuData, gyroData]);

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

  const saveCurrentSession = async () => {
    if (!currentSessionId || results.length === 0) return;

    try {
      const exportTimestamp = new Date().toISOString();

      // Determine test type
      let testType = "unknown";
      if (results.length === 1) {
        testType = results[0].type;
      } else if (results.length > 1) {
        testType = "full-assessment";
      }

      // Calculate total duration in seconds
      const durationSeconds =
        results.length > 0
          ? Math.round((results[results.length - 1].at - results[0].at) / 1000)
          : 0;

      const newSession: Session = {
        id: currentSessionId,
        timestamp: exportTimestamp,
        results: results,
        imuData: imuData,
        gyroData: gyroData,
        metadata: {
          deviceId: `${Platform.OS}-${Device.modelId || "unknown"}`,
          testType: testType,
          durationSeconds: durationSeconds,
          totalSamples: imuData.length,
        },
      };

      // Load existing sessions
      const storedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      let allSessions: Session[] = storedSessions
        ? JSON.parse(storedSessions)
        : [];

      // Remove existing session with same ID if it exists
      allSessions = allSessions.filter((s) => s.id !== currentSessionId);

      // Add new session at the beginning
      allSessions.unshift(newSession);

      // Keep only the last MAX_SESSIONS sessions
      allSessions = allSessions.slice(0, MAX_SESSIONS);

      // Save back to storage
      await AsyncStorage.setItem(
        SESSIONS_STORAGE_KEY,
        JSON.stringify(allSessions)
      );
      setSessions(allSessions);
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const startNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setResults([]);
    setImuData([]);
    setGyroData([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("New Session", "Started a new recording session");
  };

  const pushResult = (r: TestResult) => setResults((prev) => [...prev, r]);

  const exportData = async () => {
    if (imuData.length === 0) {
      Alert.alert("No Data", "No IMU data to export. Run a test first.");
      return;
    }

    try {
      const exportTimestamp = new Date().toISOString();
      const firstTestTime =
        results.length > 0
          ? new Date(results[0].at).toISOString()
          : exportTimestamp;

      // Determine test type from most recent test or full-assessment if multiple
      let testType = "unknown";
      if (results.length === 1) {
        testType = results[0].type;
      } else if (results.length > 1) {
        testType = "full-assessment";
      }

      // Calculate total duration in seconds
      const durationSeconds =
        results.length > 0
          ? Math.round((results[results.length - 1].at - results[0].at) / 1000)
          : 0;

      const data = {
        timestamp: exportTimestamp,
        metadata: {
          deviceId: `${Platform.OS}-${Device.modelId || "unknown"}`,
          testType: testType,
          durationSeconds: durationSeconds,
          startTime: firstTestTime,
          totalSamples: imuData.length,
          deviceInfo: {
            platform: Platform.OS,
            modelName: Device.modelName || "unknown",
            osVersion: Device.osVersion || "unknown",
            manufacturer: Device.manufacturer || "unknown",
          },
          sensorConfig: {
            accelerometerInterval: 50,
            gyroscopeInterval: 50,
          },
        },
        acc: imuData,
        gyro: gyroData,
        testResults: results,
      };

      const jsonString = JSON.stringify(data, null, 2);
      const filename = `fatiguesense_${Date.now()}.json`;
      const file = new File(Paths.cache, filename);

      await file.write(jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Export FatigueSense Data",
        });
      } else {
        Alert.alert("Export Successful", `Data saved to ${file.uri}`);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Export Failed", `Error: ${error}`);
    }
  };

  const runTappingTest = () => {
    if (running) return;
    setRunning("tapping");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const durationMs = DURATIONS.TAP_SECONDS * 1000;
    let taps = 0;
    const intervals: number[] = [];
    let last = 0;
    let tapsPerSecond = 0;
    let liveFeedbackColor = "#999";

    Alert.alert(
      "Tapping Test",
      `Tap as fast + evenly for ${DURATIONS.TAP_SECONDS}s`,
      [
        {
          text: "Start",
          onPress: () => {
            const testStartTime = Date.now();
            let feedbackInterval: NodeJS.Timeout;

            const updateFeedback = () => {
              const elapsed = (Date.now() - testStartTime) / 1000;
              if (elapsed > 0) {
                tapsPerSecond = taps / elapsed;

                // Color coding based on speed
                if (tapsPerSecond >= 7) {
                  liveFeedbackColor = "#22c55e"; // green - excellent
                } else if (tapsPerSecond >= 5) {
                  liveFeedbackColor = "#3b82f6"; // blue - good
                } else if (tapsPerSecond >= 3) {
                  liveFeedbackColor = "#eab308"; // yellow - moderate
                } else {
                  liveFeedbackColor = "#ef4444"; // red - slow
                }

                setModal(
                  <Runner
                    label="Tap!"
                    onPress={() => {
                      const now = Date.now();
                      taps += 1;
                      if (last) intervals.push(now - last);
                      last = now;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    isDone={(_, elapsed) => elapsed >= durationMs}
                    onDone={() => {
                      clearInterval(feedbackInterval);
                      const { score, raw } = computeTappingScore(
                        taps,
                        intervals,
                        DURATIONS.TAP_SECONDS
                      );
                      pushResult({
                        type: "tapping",
                        score,
                        raw,
                        at: Date.now(),
                      });
                      setRunning(null);
                      setModal(null);
                    }}
                    liveMetric={{
                      value: tapsPerSecond,
                      label: "taps/second",
                      color: liveFeedbackColor,
                    }}
                  />
                );
              }
            };

            // Update live feedback every 300ms
            feedbackInterval = setInterval(updateFeedback, 300);
            updateFeedback();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setRunning(null),
        },
      ]
    );
  };

  const runSwayTest = () => {
    if (running) return;
    setRunning("sway");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const durationMs = DURATIONS.SWAY_SECONDS * 1000;

    Alert.alert(
      "Sway Test",
      `Hold phone against chest for ${DURATIONS.SWAY_SECONDS}s`,
      [
        {
          text: "Start",
          onPress: () => {
            const testStartTime = Date.now();
            const buffer: number[] = [];
            const imuBuffer: IMUSample[] = [];
            const gyroBuffer: GyroSample[] = [];
            let rollingVariance = 0;
            let barPosition = 50;
            let feedbackColor = "#999";
            let lastVibrate = 0;

            Accelerometer.setUpdateInterval(50);
            Gyroscope.setUpdateInterval(50);

            const accSub = Accelerometer.addListener(({ x, y, z }) => {
              const t = Date.now() - testStartTime;
              buffer.push(Math.sqrt(x * x + y * y + z * z));
              imuBuffer.push({ x, y, z, t });
            });

            const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
              const t = Date.now() - testStartTime;
              gyroBuffer.push({ x, y, z, t });
            });

            // Live feedback every 300ms
            const feedbackInterval = setInterval(() => {
              if (buffer.length > 20) {
                // Use last 20 samples (1 second at 50Hz)
                const recent = buffer.slice(-20);
                const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
                rollingVariance =
                  recent.reduce(
                    (sum, val) => sum + Math.pow(val - mean, 2),
                    0
                  ) / recent.length;

                // Map variance to bar position (0-100)
                // Lower variance = more stable = bar moves toward center
                // Typical range: 0.001 to 0.1
                const normalizedVariance = Math.min(rollingVariance * 500, 100);
                barPosition = 50 + (normalizedVariance - 50) * 0.5; // Oscillate around center

                // Color coding based on stability
                if (rollingVariance < 0.01) {
                  feedbackColor = "#22c55e"; // green - very stable
                } else if (rollingVariance < 0.03) {
                  feedbackColor = "#3b82f6"; // blue - stable
                } else if (rollingVariance < 0.06) {
                  feedbackColor = "#eab308"; // yellow - moderate sway
                } else {
                  feedbackColor = "#ef4444"; // red - unstable
                }

                // Vibrate if instability spikes
                const now = Date.now();
                if (rollingVariance > 0.08 && now - lastVibrate > 1000) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning
                  );
                  lastVibrate = now;
                }

                setModal(
                  <Runner
                    label="Hold Still"
                    subtitle="Minimize movement"
                    isDone={(_, elapsed) => elapsed >= durationMs}
                    onDone={() => {}}
                    liveMetric={{
                      value: rollingVariance * 100,
                      label: "stability score",
                      color: feedbackColor,
                      barPosition: barPosition,
                    }}
                  />
                );
              }
            }, 300);

            setTimeout(() => {
              clearInterval(feedbackInterval);
              accSub.remove();
              gyroSub.remove();
              const { score, raw } = computeSway(buffer);
              pushResult({ type: "sway", score, raw, at: Date.now() });
              setImuData((prev) => [...prev, ...imuBuffer]);
              setGyroData((prev) => [...prev, ...gyroBuffer]);
              setRunning(null);
              setModal(null);
            }, durationMs);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setRunning(null),
        },
      ]
    );
  };

  const runMovementTest = () => {
    if (running) return;
    setRunning("movement");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const durationMs = DURATIONS.MOVE_SECONDS * 1000;

    Alert.alert(
      "Movement Test",
      `Walk straight forward for ${DURATIONS.MOVE_SECONDS}s`,
      [
        {
          text: "Start",
          onPress: () => {
            const testStartTime = Date.now();
            const buffer: number[] = [];
            const imuBuffer: IMUSample[] = [];
            const gyroBuffer: GyroSample[] = [];
            let smoothnessScore = 0;
            let gaitLabel = "Starting...";
            let feedbackColor = "#999";

            Accelerometer.setUpdateInterval(25);
            Gyroscope.setUpdateInterval(25);

            const accSub = Accelerometer.addListener(({ x, y, z }) => {
              const t = Date.now() - testStartTime;
              buffer.push(Math.sqrt(x * x + y * y + z * z));
              imuBuffer.push({ x, y, z, t });
            });

            const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
              const t = Date.now() - testStartTime;
              gyroBuffer.push({ x, y, z, t });
            });

            // Live feedback every 300ms
            const feedbackInterval = setInterval(() => {
              if (buffer.length > 40) {
                // Use last 40 samples (1 second at 40Hz)
                const recent = buffer.slice(-40);
                const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
                const variance =
                  recent.reduce(
                    (sum, val) => sum + Math.pow(val - mean, 2),
                    0
                  ) / recent.length;

                // Lower variance = smoother gait
                // Typical range during walking: 0.05 to 0.3
                smoothnessScore = Math.max(0, 100 - variance * 300);

                // Gait quality classification
                if (variance < 0.08) {
                  gaitLabel = "Smooth";
                  feedbackColor = "#22c55e"; // green
                } else if (variance < 0.15) {
                  gaitLabel = "Moderate";
                  feedbackColor = "#3b82f6"; // blue
                } else if (variance < 0.25) {
                  gaitLabel = "Rough";
                  feedbackColor = "#eab308"; // yellow
                } else {
                  gaitLabel = "Irregular";
                  feedbackColor = "#ef4444"; // red
                }

                setModal(
                  <Runner
                    label="Walk forward"
                    subtitle={gaitLabel}
                    isDone={(_, elapsed) => elapsed >= durationMs}
                    onDone={() => {}}
                    liveMetric={{
                      value: smoothnessScore,
                      label: "smoothness",
                      color: feedbackColor,
                    }}
                  />
                );
              }
            }, 300);

            setTimeout(() => {
              clearInterval(feedbackInterval);
              accSub.remove();
              gyroSub.remove();
              const { score, raw } = computeMovementScore(buffer);
              pushResult({ type: "movement", score, raw, at: Date.now() });
              setImuData((prev) => [...prev, ...imuBuffer]);
              setGyroData((prev) => [...prev, ...gyroBuffer]);
              setRunning(null);
              setModal(null);
            }, durationMs);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setRunning(null),
        },
      ]
    );
  };

  return (
    <>
      <SignedOut>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              FatigueSense
            </Text>
            <Text
              style={{
                color: "#999",
                fontSize: 16,
                marginBottom: 40,
                textAlign: "center",
              }}
            >
              Sign in to track your neuromuscular readiness
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#3b82f6",
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12,
              }}
              onPress={() => router.push("/sign-in")}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingHorizontal: 32,
                paddingVertical: 16,
              }}
              onPress={() => router.push("/sign-up")}
            >
              <Text style={{ color: "#3b82f6", fontSize: 16 }}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SignedOut>

      <SignedIn>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
          <View style={{ padding: 20 }}>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
              FatigueSense
            </Text>
            <Text style={{ color: "#999", marginTop: 6 }}>
              Quick neuromuscular readiness check
            </Text>
            {user && (
              <Text style={{ color: "#666", marginTop: 4, fontSize: 12 }}>
                Signed in as {user.primaryEmailAddress?.emailAddress}
              </Text>
            )}
          </View>

          <View style={{ padding: 20, gap: 12 }}>
            <Card
              title="Tapping Test"
              subtitle="Motor speed & rhythm"
              onPress={runTappingTest}
              disabled={!!running}
            />
            <Card
              title="Sway Test"
              subtitle="Balance & CNS fatigue"
              onPress={runSwayTest}
              disabled={!!running}
            />
            <Card
              title="Movement Test"
              subtitle="30s gait/activity proxy"
              onPress={runMovementTest}
              disabled={!!running}
            />

            {imuData.length > 0 && (
              <>
                <Card
                  title="Export Data"
                  subtitle={`${imuData.length} IMU samples collected`}
                  onPress={exportData}
                  disabled={!!running}
                />
                <Card
                  title="Start New Session"
                  subtitle="Save current and start fresh"
                  onPress={startNewSession}
                  disabled={!!running}
                />
              </>
            )}

            {sessions.length > 0 && (
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Recent Sessions ({sessions.length}/{MAX_SESSIONS})
                </Text>
                {sessions.slice(0, 3).map((session) => (
                  <View
                    key={session.id}
                    style={{
                      backgroundColor: "#2a2a2a",
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#999", fontSize: 12 }}>
                      {new Date(session.timestamp).toLocaleString()}
                    </Text>
                    <Text
                      style={{ color: "white", fontSize: 14, marginTop: 4 }}
                    >
                      {session.metadata.testType} • {session.results.length}{" "}
                      tests • {session.metadata.totalSamples} samples
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {sessions.length > 0 && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#22c55e",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  marginTop: 8,
                }}
                onPress={() => router.push("/analysis")}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  🤖 AI Fatigue Analysis
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: "#1a1a1a",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 8,
              }}
              onPress={() => router.push("/profile")}
            >
              <Text
                style={{ color: "#3b82f6", fontSize: 16, fontWeight: "600" }}
              >
                View Profile
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={[tap, sway, move].filter(Boolean) as TestResult[]}
            keyExtractor={(i) => i.type + i.at}
            style={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {item.type}
                </Text>
                <Text
                  style={{ color: "white", fontSize: 30, marginBottom: 12 }}
                >
                  {item.score}
                </Text>

                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: "#333",
                    paddingTop: 12,
                  }}
                >
                  <Text
                    style={{ color: "#999", fontSize: 14, marginBottom: 8 }}
                  >
                    Metrics
                  </Text>
                  {Object.entries(item.raw).map(([key, value]) => (
                    <View
                      key={key}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ color: "#aaa", fontSize: 13 }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Text>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 13,
                          fontWeight: "500",
                        }}
                      >
                        {typeof value === "number" ? value.toFixed(2) : value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={{ marginBottom: 50 }}>
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    padding: 20,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 22 }}>
                    Fatigue Score
                  </Text>
                  <Text style={{ color: "white", fontSize: 40, marginTop: 8 }}>
                    {fatigueScore ?? "—"}
                  </Text>
                </View>
              </View>
            }
          />

          {modal}
        </SafeAreaView>
      </SignedIn>
    </>
  );
}

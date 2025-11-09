import React, { useState, useMemo } from "react";

import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Alert,
  Share,
  Platform,
} from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Device from "expo-device";

import Card from "./components/Card";
import Runner from "./components/Runner";
import {
  computeSway,
  computeTappingScore,
  computeMovementScore,
} from "./utils/math";
import { TestResult } from "./types/TestResult";

const DURATIONS = {
  TAP_SECONDS: 15,
  SWAY_SECONDS: 20,
  MOVE_SECONDS: 30,
};

interface IMUSample {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface GyroSample {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export default function App() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState<
    null | "tapping" | "sway" | "movement"
  >(null);
  const [modal, setModal] = useState<React.ReactNode | null>(null);
  const [imuData, setImuData] = useState<IMUSample[]>([]);
  const [gyroData, setGyroData] = useState<GyroSample[]>([]);

  const tap = results.filter((r) => r.type === "tapping").slice(-1)[0];
  const sway = results.filter((r) => r.type === "sway").slice(-1)[0];
  const move = results.filter((r) => r.type === "movement").slice(-1)[0];

  const fatigueScore = useMemo(() => {
    const parts = [tap, sway, move].filter(Boolean).map((r) => r!.score);
    if (!parts.length) return null;
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }, [tap, sway, move]);

  const pushResult = (r: TestResult) => setResults((prev) => [...prev, r]);

  // ---------------------
  // EXPORT DATA
  // ---------------------
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

      const data = {
        acc: imuData,
        gyro: gyroData,
        timestamp: exportTimestamp,
        testResults: results,
        metadata: {
          testType:
            results.length > 0 ? results[results.length - 1].type : "unknown",
          startTime: firstTestTime,
          endTime: exportTimestamp,
          totalSamples: imuData.length,
          deviceInfo: {
            platform: Platform.OS,
            modelName: Device.modelName || "unknown",
            osVersion: Device.osVersion || "unknown",
            manufacturer: Device.manufacturer || "unknown",
          },
          sensorConfig: {
            accelerometerInterval: 50, // ms for sway, 25 for movement
            gyroscopeInterval: 50,
          },
        },
      };

      const jsonString = JSON.stringify(data, null, 2);
      const filename = `fatiguesense_${Date.now()}.json`;
      const file = new File(Paths.cache, filename);

      // Write the JSON data to the file
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

  // ---------------------
  // TAPPING TEST
  // ---------------------
  const runTappingTest = () => {
    if (running) return;
    setRunning("tapping");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const start = Date.now();
    const durationMs = DURATIONS.TAP_SECONDS * 1000;
    let taps = 0;
    const intervals: number[] = [];
    let last = 0;

    Alert.alert(
      "Tapping Test",
      `Tap as fast + evenly for ${DURATIONS.TAP_SECONDS}s`,
      [
        {
          text: "Start",
          onPress: () => {
            setModal(
              <Runner
                label="Tap!"
                onPress={() => {
                  const now = Date.now();
                  taps += 1;
                  if (last) intervals.push(now - last);
                  last = now;
                }}
                isDone={(_, elapsed) => elapsed >= durationMs}
                onDone={() => {
                  const { score, raw } = computeTappingScore(
                    taps,
                    intervals,
                    DURATIONS.TAP_SECONDS
                  );
                  pushResult({ type: "tapping", score, raw, at: Date.now() });
                  setRunning(null);
                  setModal(null);
                }}
              />
            );
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setRunning(null);
          },
        },
      ]
    );
  };

  // ---------------------
  // SWAY TEST
  // ---------------------
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

            setModal(
              <Runner
                label="Hold Still"
                subtitle="Hold phone against chest"
                isDone={(_, elapsed) => elapsed >= durationMs}
                onDone={() => {}}
              />
            );

            const buffer: number[] = [];
            const imuBuffer: IMUSample[] = [];
            const gyroBuffer: GyroSample[] = [];

            Accelerometer.setUpdateInterval(50);
            Gyroscope.setUpdateInterval(50);

            const accSub = Accelerometer.addListener(({ x, y, z }) => {
              const timestamp = Date.now() - testStartTime;
              buffer.push(Math.sqrt(x * x + y * y + z * z));
              imuBuffer.push({ x, y, z, timestamp });
            });

            const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
              const timestamp = Date.now() - testStartTime;
              gyroBuffer.push({ x, y, z, timestamp });
            });

            setTimeout(() => {
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
          onPress: () => {
            setRunning(null);
          },
        },
      ]
    );
  };

  // ---------------------
  // MOVEMENT TEST
  // ---------------------
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

            Accelerometer.setUpdateInterval(25);
            Gyroscope.setUpdateInterval(25);

            const accSub = Accelerometer.addListener(({ x, y, z }) => {
              const timestamp = Date.now() - testStartTime;
              buffer.push(Math.sqrt(x * x + y * y + z * z));
              imuBuffer.push({ x, y, z, timestamp });
            });

            const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
              const timestamp = Date.now() - testStartTime;
              gyroBuffer.push({ x, y, z, timestamp });
            });

            setModal(
              <Runner
                label="Walk forward"
                subtitle="Walk straight for 30s"
                isDone={(_, elapsed) => elapsed >= durationMs}
                onDone={() => {}}
              />
            );

            setTimeout(() => {
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
          onPress: () => {
            setRunning(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
        <View style={{ padding: 20 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
            FatigueSense
          </Text>
          <Text style={{ color: "#999", marginTop: 6 }}>
            Quick neuromuscular readiness check
          </Text>
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
            <Card
              title="Export Data"
              subtitle={`${imuData.length} IMU samples collected`}
              onPress={exportData}
              disabled={!!running}
            />
          )}
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
              <Text style={{ color: "white", fontSize: 30, marginBottom: 12 }}>
                {item.score}
              </Text>

              {/* Individual Metrics */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#333",
                  paddingTop: 12,
                }}
              >
                <Text style={{ color: "#999", fontSize: 14, marginBottom: 8 }}>
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
  );
}

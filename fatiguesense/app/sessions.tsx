import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const SESSIONS_STORAGE_KEY = "@fatiguesense_sessions";

interface TestResult {
  type: string;
  score: number;
  raw: any;
  at: number;
}

interface Session {
  id: string;
  timestamp: string;
  results: TestResult[];
  imuData: any[];
  gyroData: any[];
  metadata: {
    deviceId: string;
    testType: string;
    durationSeconds: number;
    totalSamples: number;
  };
}

export default function Sessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

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

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedSessions = sessions.filter(
                (s) => s.id !== sessionId
              );
              await AsyncStorage.setItem(
                SESSIONS_STORAGE_KEY,
                JSON.stringify(updatedSessions)
              );
              setSessions(updatedSessions);
              setDetailsVisible(false);
              setSelectedSession(null);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Success", "Session deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete session");
            }
          },
        },
      ]
    );
  };

  const deleteAllSessions = () => {
    Alert.alert(
      "Delete All Sessions",
      "Are you sure you want to delete ALL sessions? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(SESSIONS_STORAGE_KEY);
              setSessions([]);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Success", "All sessions deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete sessions");
            }
          },
        },
      ]
    );
  };

  const viewSessionDetails = (session: Session) => {
    setSelectedSession(session);
    setDetailsVisible(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#eab308";
    return "#ef4444";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#1a1a1a",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
            Sessions
          </Text>
        </View>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={deleteAllSessions}>
            <Text style={{ color: "#ef4444", fontSize: 14 }}>Delete All</Text>
          </TouchableOpacity>
        )}
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
            <Text style={{ color: "#999", fontSize: 14 }}>Total Sessions</Text>
            <Text style={{ color: "white", fontSize: 32, fontWeight: "700" }}>
              {sessions.length}
            </Text>
            {sessions.length > 0 && (
              <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                Oldest:{" "}
                {new Date(
                  sessions[sessions.length - 1].timestamp
                ).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <View
              style={{
                backgroundColor: "#1a1a1a",
                padding: 40,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#999", fontSize: 16, textAlign: "center" }}
              >
                No sessions yet
              </Text>
              <Text
                style={{
                  color: "#666",
                  fontSize: 14,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Complete tests to create your first session
              </Text>
            </View>
          ) : (
            sessions.map((session, index) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => viewSessionDetails(session)}
                style={{
                  backgroundColor: "#1a1a1a",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#3b82f6",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        #{sessions.length - index}
                      </Text>
                      <Text
                        style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
                      >
                        {new Date(session.timestamp).toLocaleDateString()}
                      </Text>
                      <Text
                        style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
                      >
                        {new Date(session.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                        textTransform: "capitalize",
                        marginBottom: 8,
                      }}
                    >
                      {session.metadata.testType}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {session.results.map((result, idx) => (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: "#2a2a2a",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: getScoreColor(result.score),
                          }}
                        >
                          <Text
                            style={{
                              color: getScoreColor(result.score),
                              fontSize: 12,
                              fontWeight: "600",
                              textTransform: "capitalize",
                            }}
                          >
                            {result.type}: {result.score}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text style={{ color: "#3b82f6", fontSize: 20 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Session Details Modal */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#2a2a2a",
              }}
            >
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
                Session Details
              </Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                <Text style={{ color: "#3b82f6", fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ padding: 20 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
            >
              {selectedSession && (
                <>
                  {/* Session Info */}
                  <View
                    style={{
                      backgroundColor: "#0f0f0f",
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: "#999",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      Session ID
                    </Text>
                    <Text
                      style={{
                        color: "#666",
                        fontSize: 11,
                        fontFamily: "monospace",
                        marginBottom: 12,
                      }}
                    >
                      {selectedSession.id}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <View>
                        <Text style={{ color: "#999", fontSize: 12 }}>
                          Date
                        </Text>
                        <Text style={{ color: "white", fontSize: 14 }}>
                          {new Date(
                            selectedSession.timestamp
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: "#999", fontSize: 12 }}>
                          Time
                        </Text>
                        <Text style={{ color: "white", fontSize: 14 }}>
                          {new Date(
                            selectedSession.timestamp
                          ).toLocaleTimeString()}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: "#999", fontSize: 12 }}>
                          Duration
                        </Text>
                        <Text style={{ color: "white", fontSize: 14 }}>
                          {selectedSession.metadata.durationSeconds}s
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Metadata */}
                  <View
                    style={{
                      backgroundColor: "#0f0f0f",
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
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
                      Metadata
                    </Text>
                    <View style={{ gap: 8 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: "#999", fontSize: 13 }}>
                          Test Type
                        </Text>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 13,
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedSession.metadata.testType}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: "#999", fontSize: 13 }}>
                          IMU Samples
                        </Text>
                        <Text style={{ color: "white", fontSize: 13 }}>
                          {selectedSession.metadata.totalSamples}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: "#999", fontSize: 13 }}>
                          Gyro Samples
                        </Text>
                        <Text style={{ color: "white", fontSize: 13 }}>
                          {selectedSession.gyroData?.length || 0}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Test Results */}
                  <View
                    style={{
                      backgroundColor: "#0f0f0f",
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
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
                      Test Results
                    </Text>
                    {selectedSession.results.map((result, idx) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: "#1a1a1a",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 12,
                          borderLeftWidth: 4,
                          borderLeftColor: getScoreColor(result.score),
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 15,
                              fontWeight: "600",
                              textTransform: "capitalize",
                            }}
                          >
                            {result.type} Test
                          </Text>
                          <Text
                            style={{
                              color: getScoreColor(result.score),
                              fontSize: 24,
                              fontWeight: "700",
                            }}
                          >
                            {result.score}
                          </Text>
                        </View>
                        <View style={{ gap: 6 }}>
                          {Object.entries(result.raw).map(([key, value]) => (
                            <View
                              key={key}
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text style={{ color: "#999", fontSize: 12 }}>
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </Text>
                              <Text style={{ color: "#ddd", fontSize: 12 }}>
                                {typeof value === "number"
                                  ? value.toFixed(3)
                                  : String(value)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => deleteSession(selectedSession.id)}
                    style={{
                      backgroundColor: "#ef4444",
                      padding: 16,
                      borderRadius: 12,
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Delete This Session
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

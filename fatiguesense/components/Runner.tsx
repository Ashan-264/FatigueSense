import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

interface Props {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isDone: (tick: number, elapsed: number) => boolean;
  onDone: () => void;
  liveMetric?: {
    value: number;
    label: string;
    color: string;
    barPosition?: number; // 0-100 for sway stability bar
  };
}

export default function Runner({
  label,
  subtitle,
  onPress,
  isDone,
  onDone,
  liveMetric,
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const e = now - startRef.current;
      setElapsed(e);

      if (isDone(0, e)) {
        clearInterval(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDone();
      }
    }, 100);

    return () => clearInterval(id);
  }, []);

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
        {label}
      </Text>
      {subtitle && (
        <Text style={{ color: "#bbb", marginTop: 10, fontSize: 16 }}>
          {subtitle}
        </Text>
      )}

      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            paddingVertical: 18,
            paddingHorizontal: 50,
            borderRadius: 20,
            marginTop: 30,
          }}
        >
          <Text style={{ color: "white", fontSize: 20 }}>Tap</Text>
        </TouchableOpacity>
      )}

      {/* Live Feedback Display */}
      {liveMetric && (
        <View style={{ marginTop: 30, alignItems: "center", width: "100%" }}>
          <Text
            style={{
              color: liveMetric.color,
              fontSize: 48,
              fontWeight: "700",
            }}
          >
            {liveMetric.value.toFixed(1)}
          </Text>
          <Text style={{ color: "#999", fontSize: 16, marginTop: 4 }}>
            {liveMetric.label}
          </Text>

          {/* Stability Bar for Sway Test */}
          {liveMetric.barPosition !== undefined && (
            <View
              style={{
                width: "100%",
                height: 40,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                marginTop: 20,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: `${liveMetric.barPosition}%`,
                  top: 0,
                  bottom: 0,
                  width: 8,
                  backgroundColor: liveMetric.color,
                }}
              />
            </View>
          )}
        </View>
      )}

      <Text style={{ color: "#ccc", fontSize: 20, marginTop: 30 }}>
        {Math.ceil(elapsed / 1000)}s
      </Text>
    </View>
  );
}

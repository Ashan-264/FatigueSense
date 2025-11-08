import React from "react";
import { TouchableOpacity, View, Text } from "react-native";

export default function Card({
  title,
  subtitle,
  onPress,
  disabled,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "#222" : "#1a1a1a",
        padding: 18,
        borderRadius: 14,
      }}
    >
      <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: "#aaa", marginTop: 6 }}>{subtitle}</Text>
      )}
    </TouchableOpacity>
  );
}

import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Profile
          </Text>
          <Text style={{ color: "#999", marginBottom: 30 }}>
            Your account information
          </Text>

          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#999", fontSize: 14, marginBottom: 4 }}>
              Email
            </Text>
            <Text style={{ color: "white", fontSize: 18 }}>
              {user?.primaryEmailAddress?.emailAddress || "Not set"}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#999", fontSize: 14, marginBottom: 4 }}>
              User ID
            </Text>
            <Text
              style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}
            >
              {user?.id || "Not available"}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#999", fontSize: 14, marginBottom: 4 }}>
              Created At
            </Text>
            <Text style={{ color: "white", fontSize: 16 }}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: "#1a1a1a",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#3b82f6", fontSize: 16, fontWeight: "600" }}>
              Back to Tests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: "#ef4444",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

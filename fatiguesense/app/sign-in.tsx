import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Sign in failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, justifyContent: "center", flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: "700",
            marginBottom: 10,
          }}
        >
          Sign In
        </Text>
        <Text style={{ color: "#999", fontSize: 16, marginBottom: 40 }}>
          Welcome back to FatigueSense
        </Text>

        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email..."
          placeholderTextColor="#666"
          onChangeText={setEmailAddress}
          style={{
            backgroundColor: "#1a1a1a",
            color: "white",
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            fontSize: 16,
          }}
        />

        <TextInput
          value={password}
          placeholder="Password..."
          placeholderTextColor="#666"
          secureTextEntry
          onChangeText={setPassword}
          style={{
            backgroundColor: "#1a1a1a",
            color: "white",
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
            fontSize: 16,
          }}
        />

        <TouchableOpacity
          onPress={onSignInPress}
          style={{
            backgroundColor: "#3b82f6",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/sign-up")}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#3b82f6", fontSize: 16 }}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#666", fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

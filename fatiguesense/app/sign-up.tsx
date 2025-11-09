import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Sign up failed");
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Verification failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        {!pendingVerification ? (
          <>
            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              Sign Up
            </Text>
            <Text style={{ color: "#999", fontSize: 16, marginBottom: 40 }}>
              Create your FatigueSense account
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
              onPress={onSignUpPress}
              style={{
                backgroundColor: "#3b82f6",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Sign Up
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/sign-in")}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#3b82f6", fontSize: 16 }}>
                Have an account? Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#666", fontSize: 14 }}>Go Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              Verify Email
            </Text>
            <Text style={{ color: "#999", fontSize: 16, marginBottom: 40 }}>
              Enter the verification code sent to {emailAddress}
            </Text>

            <TextInput
              value={code}
              placeholder="Code..."
              placeholderTextColor="#666"
              onChangeText={setCode}
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
              onPress={onPressVerify}
              style={{
                backgroundColor: "#3b82f6",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Verify Email
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

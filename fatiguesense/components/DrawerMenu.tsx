import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.75;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [slideAnim] = React.useState(new Animated.Value(-DRAWER_WIDTH));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as any), 100);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>FatigueSense</Text>
            {user && (
              <Text style={styles.headerSubtitle}>
                {user.primaryEmailAddress?.emailAddress}
              </Text>
            )}
          </View>

          {/* Navigation Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate("/")}
            >
              <Text style={styles.menuIcon}>🏠</Text>
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate("/analysis")}
            >
              <Text style={styles.menuIcon}>🤖</Text>
              <Text style={styles.menuText}>AI Fatigue Analysis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate("/sessions")}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuText}>View All Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate("/profile")}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, { color: "#ef4444" }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: "#0f0f0f",
    borderRightWidth: 1,
    borderRightColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "#999",
    fontSize: 14,
  },
  menuItems: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  menuText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 12,
    marginHorizontal: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  footerText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
});


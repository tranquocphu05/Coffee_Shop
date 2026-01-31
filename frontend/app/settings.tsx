import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { clearAuth } from "@/lib/auth";

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.list}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/notifications")}
        >
          <View style={styles.itemIcon}>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.itemText}>Lịch sử đơn hàng</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <View style={styles.itemIcon}>
            <Ionicons name="log-out-outline" size={18} color="#F97316" />
          </View>
          <Text style={styles.itemText}>Đăng xuất</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1B2430",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
  },
  list: {
    marginTop: 6,
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121826",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1B2430",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "600",
  },
});

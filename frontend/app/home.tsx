import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { getAuthUser, clearAuth } from "@/lib/auth";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await getAuthUser();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAuth();
              router.replace("/login");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoTitle}>Thông tin tài khoản:</Text>
            <View style={styles.userInfoContent}>
              {user.email && (
                <Text style={styles.userInfoText}>
                  Email: {user.email}
                </Text>
              )}
              {user.name && (
                <Text style={styles.userInfoText}>
                  Tên: {user.name}
                </Text>
              )}
              {user.phone && (
                <Text style={styles.userInfoText}>
                  SĐT: {user.phone}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Chào mừng bạn đến với Coffee Shop!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  logoutButton: {
    backgroundColor: "#FF4D4F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  userInfo: {
    backgroundColor: "#16213E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#9BA1A6",
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF7F3F",
    marginBottom: 12,
  },
  userInfoContent: {
    gap: 8,
  },
  userInfoText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 20,
    color: "#9BA1A6",
    textAlign: "center",
  },
});

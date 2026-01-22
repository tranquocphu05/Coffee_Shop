import React, { useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuthToken } from "@/lib/auth";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        // Đã có token, chuyển đến home
        router.replace("/home");
      } else {
        // Chưa có token (lần đầu), chuyển đến welcome
        router.replace("/welcome");
      }
    } catch (error) {
      // Có lỗi, chuyển đến welcome
      router.replace("/welcome");
    }
  };

  // Hiển thị loading trong khi check
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7F3F" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

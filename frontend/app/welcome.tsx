import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Logo from "@/assets/svg/logo.svg";

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Sau 3 giây, chuyển đến màn hình login
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    // Cleanup timer nếu component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoContainer}>
        <Logo width={200} height={200} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

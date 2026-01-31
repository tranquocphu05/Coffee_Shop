import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

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
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={styles.logoImage}
          contentFit="contain"
        />
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
  logoImage: {
    width: 200,
    height: 200,
  },
});

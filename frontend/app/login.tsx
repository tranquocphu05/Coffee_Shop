import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loginApp } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import Logo from "@/assets/svg/logo.svg";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await loginApp(email.trim(), password);
      await saveAuth(token, user);
      router.replace("/(tabs)");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Logo width={120} height={120} />
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome to Lungo !!</Text>
          <Text style={styles.subtitleText}>Login to Continue</Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errorMsg) setErrorMsg(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  errorMsg ? styles.inputErrorBorder : null,
                ]}
                placeholder="Password"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMsg) setErrorMsg(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9BA1A6"
                />
              </Pressable>
            </View>
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              loading ? styles.signInButtonDisabled : null,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.signInText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.linksContainer}>
            <Text style={styles.linkText}>
              Don't have account? Click{" "}
              <Link href="/register" asChild>
                <Text style={styles.linkHighlight}>Register</Text>
              </Link>
            </Text>
            <Text style={styles.linkText}>
              Forget Password? Click{" "}
              <Link href="/reset" asChild>
                <Text style={styles.linkHighlight}>Reset</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    height: 120,
  },
  coffeeCup: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    position: "relative",
  },
  steamContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  steam: {
    width: 6,
    backgroundColor: "#FF7F3F",
    borderRadius: 3,
    shadowColor: "#FF7F3F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  steam1: {
    height: 18,
    transform: [{ translateX: -4 }],
  },
  steam2: {
    height: 26,
  },
  steam3: {
    height: 22,
    transform: [{ translateX: 4 }],
  },
  cupBody: {
    position: "relative",
    width: 70,
    height: 60,
    alignItems: "center",
  },
  cupTop: {
    width: 56,
    height: 48,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    position: "relative",
  },
  coffeeSurface: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#3A2E1E",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  cupHandle: {
    position: "absolute",
    right: -12,
    top: 12,
    width: 18,
    height: 18,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 18,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "#9BA1A6",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#16213E",
    borderWidth: 1,
    borderColor: "#9BA1A6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  passwordContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    backgroundColor: "#16213E",
    borderWidth: 1,
    borderColor: "#9BA1A6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  signInButton: {
    backgroundColor: "#FF7F3F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputErrorBorder: {
    borderColor: "#FF4D4F",
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 13,
    marginTop: -6,
    marginLeft: 4,
  },
  linksContainer: {
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    color: "#9BA1A6",
    fontSize: 14,
    textAlign: "center",
  },
  linkHighlight: {
    color: "#FF7F3F",
    fontWeight: "600",
  },
});

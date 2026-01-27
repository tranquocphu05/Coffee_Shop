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
import { registerApp } from "@/lib/auth.api";
import Logo from "@/assets/svg/logo.svg";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMsg(null);

    // Validation: Không được bỏ trống
    if (!fullName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }

    // Validation: Email phải đúng định dạng @gmail.com
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Email phải đúng định dạng @gmail.com");
      return;
    }

    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (!confirmPassword) {
      setErrorMsg("Vui lòng xác nhận mật khẩu.");
      return;
    }

    // Validation: Confirm pass phải giống với password
    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await registerApp(fullName.trim(), email.trim(), password);
      // Đăng ký thành công, chuyển về màn hình login
      router.replace("/login");
    } catch (e) {
      // Hiển thị lỗi màu đỏ dưới ô confirmPassword
      setErrorMsg(e instanceof Error ? e.message : "Đăng ký thất bại");
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
          <Text style={styles.subtitleText}>Create Account to Continue</Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9BA1A6"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errorMsg) setErrorMsg(null);
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />

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

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  errorMsg ? styles.inputErrorBorder : null,
                ]}
                placeholder="Confirm Password"
                placeholderTextColor="#9BA1A6"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errorMsg) setErrorMsg(null);
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9BA1A6"
                />
              </Pressable>
            </View>
            {/* Hiển thị lỗi màu đỏ dưới ô confirmPassword */}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              loading ? styles.registerButtonDisabled : null,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              {loading ? "Creating Account..." : "Register"}
            </Text>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.linksContainer}>
            <Text style={styles.linkText}>
              Already have account? Click{" "}
              <Link href="/login" asChild>
                <Text style={styles.linkHighlight}>Login</Text>
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
  registerButton: {
    backgroundColor: "#FF7F3F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerText: {
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

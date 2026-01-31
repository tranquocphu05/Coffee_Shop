import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { API_BASE_URL } from "@/constants/api";
import { getAccountById, updateAccountWithAddress, uploadAvatar } from "@/lib/api";
import { getAuthToken, getAuthUser, saveAuth } from "@/lib/auth";

type UserSnapshot = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
};

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadAccount = async (userId: string) => {
    const account = await getAccountById(userId);
    setFullName(account.name || "");
    setEmail(account.email || "");
    setPhone(account.phone || "");
    setAddress(account.address || "");
    setAvatarUrl(
      account.image ? `${API_BASE_URL}/images/avatars/${account.image}` : null
    );
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = (await getAuthUser()) as UserSnapshot | null;
        if (!user || !user._id) {
          setProfileError("Bạn cần đăng nhập để xem thông tin.");
          setLoading(false);
          return;
        }
        setAccountId(user._id);
        await loadAccount(user._id);
      } catch (error) {
        setProfileError(
          error instanceof Error ? error.message : "Không thể tải dữ liệu."
        );
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleSaveProfile = async () => {
    if (!accountId) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await updateAccountWithAddress(accountId, {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      const token = await getAuthToken();
      if (token) {
        await saveAuth(token, updated as Record<string, unknown>);
      }
      setIsEditing(false);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Cập nhật thất bại."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const getFileType = (uri: string) => {
    const ext = uri.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      case "jpg":
      case "jpeg":
      default:
        return "image/jpeg";
    }
  };

  const handlePickAvatar = async () => {
    if (!accountId) return;
    setProfileError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setProfileError("Bạn cần cho phép truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    try {
      setUploadingAvatar(true);
      const asset = result.assets[0];
      const name = asset.fileName || `avatar-${Date.now()}.jpg`;
      const type = getFileType(asset.uri);
      await uploadAvatar(accountId, { uri: asset.uri, name, type });
      await loadAccount(accountId);
      const token = await getAuthToken();
      if (token) {
        const updated = await getAccountById(accountId);
        await saveAuth(token, updated as Record<string, unknown>);
      }
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Tải ảnh thất bại."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Thông tin cá nhân</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF7F3F" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color="#9BA1A6" />
                  </View>
                )}
                {uploadingAvatar ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
              >
                <Text style={styles.avatarButtonText}>Đổi ảnh đại diện</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor="#9BA1A6"
                value={fullName}
                onChangeText={setFullName}
                editable={isEditing}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9BA1A6"
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={false}
                selectTextOnFocus={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor="#9BA1A6"
                value={phone}
                keyboardType="phone-pad"
                onChangeText={setPhone}
                editable={isEditing}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Địa chỉ"
                placeholderTextColor="#9BA1A6"
                value={address}
                onChangeText={setAddress}
                multiline
                editable={isEditing}
              />
              {profileError ? (
                <Text style={styles.errorText}>{profileError}</Text>
              ) : null}

              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editText}>Sửa thông tin</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      if (accountId) loadAccount(accountId);
                      setIsEditing(false);
                    }}
                    disabled={savingProfile}
                  >
                    <Text style={styles.cancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      savingProfile ? styles.saveButtonDisabled : null,
                    ]}
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    <Text style={styles.saveText}>
                      {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 24,
  },
  avatarSection: {
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1F1F1F",
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
  },
  avatarButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  input: {
    backgroundColor: "#16213E",
    borderWidth: 1,
    borderColor: "#9BA1A6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 13,
  },
  editButton: {
    backgroundColor: "#1B2028",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#2A2A2A",
  },
  cancelText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#FF7F3F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

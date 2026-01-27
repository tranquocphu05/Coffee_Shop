import { Platform } from "react-native";

// Đối với Android Emulator, localhost không hoạt động, cần dùng 10.0.2.2
// Đối với iOS Simulator và Web, có thể dùng localhost
const getDefaultApiUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
};

// export const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || getDefaultApiUrl();

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL_NGROK?.trim() || getDefaultApiUrl();

// export const API_BASE_URL = getDefaultApiUrl();

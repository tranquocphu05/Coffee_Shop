import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL } from "@/constants/api";
import { Platform } from "react-native";
import { getAuthToken } from "./auth";

// Log API URL để debug
console.log("[API Config] Platform:", Platform.OS);
console.log("[API Config] API_BASE_URL:", API_BASE_URL);

// Tạo axios instance với cấu hình mặc định
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: Thêm token vào header nếu có
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          "[API] Token added to request:",
          token.substring(0, 20) + "...",
        );
      } else {
        console.warn("[API] No token found for request:", config.url);
      }
    } catch (error) {
      console.error("[API] Error getting auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Xử lý lỗi network
    if (!error.response) {
      console.error("[API] Network error:", error);
      let networkErrorMsg = "Không thể kết nối đến server. ";

      if (
        API_BASE_URL.includes("localhost") ||
        API_BASE_URL.includes("127.0.0.1")
      ) {
        if (Platform.OS === "android") {
          networkErrorMsg +=
            "Trên Android emulator, hãy tạo file .env với: EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000";
        } else if (Platform.OS === "ios") {
          networkErrorMsg +=
            "Trên iOS simulator, hãy dùng IP của máy (ví dụ: http://192.168.x.x:3000)";
        } else {
          networkErrorMsg += "Vui lòng kiểm tra server có đang chạy không.";
        }
      } else {
        networkErrorMsg += `Vui lòng kiểm tra URL: ${API_BASE_URL}`;
      }

      return Promise.reject(new Error(networkErrorMsg));
    }

    // Xử lý lỗi từ server
    const errorMessage =
      (error.response.data as { error?: string; message?: string })?.error ||
      (error.response.data as { error?: string; message?: string })?.message ||
      error.message ||
      "Đã xảy ra lỗi";

    // Nếu là lỗi xác thực (401, 403), xóa token và redirect về login
    if (error.response.status === 401 || error.response.status === 403) {
      console.warn("[API] Authentication error, clearing token");
      const { clearAuth } = await import("./auth");
      await clearAuth();

      // Chỉ redirect nếu không phải đang ở màn hình login
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        // Redirect sẽ được xử lý bởi app logic
      }
    }

    return Promise.reject(new Error(errorMessage));
  },
);

// Export axios instance để sử dụng ở các nơi khác
export { apiClient };

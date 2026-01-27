import { apiClient } from "./apiClient";
import { AccResponse } from "./types/auth";
import { Platform } from "react-native";

export async function loginApp(email: string, pass: string) {
  const url = "/api/account/login/app";

  console.log("[API] Calling login endpoint:", url);
  console.log("[API] Platform:", Platform.OS);
  console.log("[API] Request body:", { email, pass: "***" });

  try {
    const response = await apiClient.post<AccResponse>(url, {
      email,
      pass,
    });

    console.log("[API] Response status:", response.status);
    console.log("[API] Response data:", response.data);

    const json = response.data;

    if (!json.data?.token || !json.data?.user) {
      console.error("[API] Invalid response:", json);
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    console.log("[API] Login successful");
    return json.data;
  } catch (error) {
    console.error("[API] Full error:", error);

    // Re-throw error (đã được xử lý bởi interceptor)
    throw error;
  }
}

export async function registerApp(name: string, email: string, pass: string) {
  const url = "/api/account/register";

  console.log("[API] Calling register endpoint:", url);
  console.log("[API] Platform:", Platform.OS);
  console.log("[API] Request body:", { name, email, pass: "***" });

  try {
    const response = await apiClient.post<AccResponse>(url, {
      name,
      email,
      pass,
    });

    console.log("[API] Response status:", response.status);
    console.log("[API] Response data:", response.data);

    const json = response.data;

    if (!json.data?.token || !json.data?.user) {
      console.error("[API] Invalid response:", json);
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    console.log("[API] Register successful");
    return json.data;
  } catch (error) {
    console.error("[API] Full error:", error);

    // Re-throw error (đã được xử lý bởi interceptor)
    throw error;
  }
}

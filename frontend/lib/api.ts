import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/api';
import { Platform } from 'react-native';
import { getAuthToken } from './auth';

// Log API URL để debug
console.log('[API Config] Platform:', Platform.OS);
console.log('[API Config] API_BASE_URL:', API_BASE_URL);

// Tạo axios instance với cấu hình mặc định
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: Thêm token vào header nếu có
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Xử lý lỗi network
    if (!error.response) {
      console.error('[API] Network error:', error);
      let networkErrorMsg = 'Không thể kết nối đến server. ';
      
      if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
        if (Platform.OS === 'android') {
          networkErrorMsg += 'Trên Android emulator, hãy tạo file .env với: EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000';
        } else if (Platform.OS === 'ios') {
          networkErrorMsg += 'Trên iOS simulator, hãy dùng IP của máy (ví dụ: http://192.168.x.x:3000)';
        } else {
          networkErrorMsg += 'Vui lòng kiểm tra server có đang chạy không.';
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
      'Đã xảy ra lỗi';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Export axios instance để sử dụng ở các nơi khác
export { apiClient };

type LoginAppResponse = {
  message?: string;
  data?: { user: Record<string, unknown>; token: string };
  error?: string;
};

export async function loginApp(email: string, pass: string) {
  const url = '/api/account/login/app';
  
  console.log('[API] Calling login endpoint:', url);
  console.log('[API] Platform:', Platform.OS);
  console.log('[API] Request body:', { email, pass: '***' });
  
  try {
    const response = await apiClient.post<LoginAppResponse>(url, { email, pass });
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response data:', response.data);
    
    const json = response.data;
    
    if (!json.data?.token || !json.data?.user) {
      console.error('[API] Invalid response:', json);
      throw new Error('Phản hồi từ server không hợp lệ');
    }
    
    console.log('[API] Login successful');
    return json.data;
  } catch (error) {
    console.error('[API] Full error:', error);
    
    // Re-throw error (đã được xử lý bởi interceptor)
    throw error;
  }
}

type RegisterAppResponse = {
  message?: string;
  data?: { user: Record<string, unknown>; token: string };
  error?: string;
};

export async function registerApp(name: string, email: string, pass: string) {
  const url = '/api/account/register';
  
  console.log('[API] Calling register endpoint:', url);
  console.log('[API] Platform:', Platform.OS);
  console.log('[API] Request body:', { name, email, pass: '***' });
  
  try {
    const response = await apiClient.post<RegisterAppResponse>(url, { name, email, pass });
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response data:', response.data);
    
    const json = response.data;
    
    if (!json.data?.token || !json.data?.user) {
      console.error('[API] Invalid response:', json);
      throw new Error('Phản hồi từ server không hợp lệ');
    }
    
    console.log('[API] Register successful');
    return json.data;
  } catch (error) {
    console.error('[API] Full error:', error);
    
    // Re-throw error (đã được xử lý bởi interceptor)
    throw error;
  }
}


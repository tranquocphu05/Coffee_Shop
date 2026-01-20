import { API_BASE_URL } from '@/constants/api';
import { Platform } from 'react-native';

// Log API URL để debug
console.log('[API Config] Platform:', Platform.OS);
console.log('[API Config] API_BASE_URL:', API_BASE_URL);

type LoginAppResponse = {
  message?: string;
  data?: { user: Record<string, unknown>; token: string };
  error?: string;
};

export async function loginApp(email: string, pass: string) {
  const url = `${API_BASE_URL}/api/account/login/app`;
  
  console.log('[API] Calling login endpoint:', url);
  console.log('[API] Platform:', Platform.OS);
  console.log('[API] Request body:', { email, pass: '***' });
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, pass }),
    });

    console.log('[API] Response status:', res.status);
    console.log('[API] Response headers:', res.headers);
    
    const json = (await res.json().catch((err) => {
      console.error('[API] JSON parse error:', err);
      return {};
    })) as LoginAppResponse;
    
    console.log('[API] Response data:', json);
    
    if (!res.ok) {
      const errorMsg = json.error || 'Đăng nhập thất bại';
      console.error('[API] Login failed:', errorMsg, json);
      throw new Error(errorMsg);
    }
    
    if (!json.data?.token || !json.data?.user) {
      console.error('[API] Invalid response:', json);
      throw new Error('Phản hồi từ server không hợp lệ');
    }
    
    console.log('[API] Login successful');
    return json.data;
  } catch (error) {
    console.error('[API] Full error:', error);
    
    // Xử lý lỗi network
    if (
      error instanceof TypeError || 
      (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to connect')
      ))
    ) {
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
      
      throw new Error(networkErrorMsg);
    }
    
    // Re-throw các lỗi khác
    throw error;
  }
}


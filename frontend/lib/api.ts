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
        console.log('[API] Token added to request:', token.substring(0, 20) + '...');
      } else {
        console.warn('[API] No token found for request:', config.url);
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
  async (error: AxiosError) => {
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
    
    // Nếu là lỗi xác thực (401, 403), xóa token và redirect về login
    if (error.response.status === 401 || error.response.status === 403) {
      console.warn('[API] Authentication error, clearing token');
      const { clearAuth } = await import('./auth');
      await clearAuth();
      
      // Chỉ redirect nếu không phải đang ở màn hình login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Redirect sẽ được xử lý bởi app logic
      }
    }
    
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

// Cart Types
export interface CartItem {
  _id: string;
  user_id: string;
  variants_id: {
    _id: string;
    sku: string;
    size?: string;
    price: number;
    image?: string;
    product_id: {
      _id: string;
      product_name: string;
      description?: string;
      product_code: string;
    };
  };
  quantity: number;
  price: number;
}

type CartResponse = {
  message?: string;
  data?: { carts?: CartItem[]; cart?: CartItem };
  error?: string;
};

// Get all cart items
export async function getCartItems(): Promise<CartItem[]> {
  const url = '/api/cart';
  
  try {
    const response = await apiClient.get<CartResponse>(url);
    const json = response.data;
    
    if (!json.data?.carts) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }
    
    return json.data.carts;
  } catch (error) {
    console.error('[API] Get cart items error:', error);
    throw error;
  }
}

// Create cart item
export async function createCartItem(
  variants_id: string,
  quantity: number = 1,
  price?: number
): Promise<CartItem> {
  const url = '/api/cart';
  
  try {
    const body: { variants_id: string; quantity: number; price?: number } = {
      variants_id,
      quantity,
    };
    if (price !== undefined) {
      body.price = price;
    }
    
    const response = await apiClient.post<CartResponse>(url, body);
    const json = response.data;
    
    if (!json.data?.cart) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }
    
    return json.data.cart;
  } catch (error) {
    console.error('[API] Create cart item error:', error);
    throw error;
  }
}

// Update cart item
export async function updateCartItem(
  cartId: string,
  quantity?: number,
  variants_id?: string,
  price?: number
): Promise<CartItem> {
  const url = `/api/cart/${cartId}`;
  
  try {
    const body: {
      quantity?: number;
      variants_id?: string;
      price?: number;
    } = {};
    
    if (quantity !== undefined) body.quantity = quantity;
    if (variants_id !== undefined) body.variants_id = variants_id;
    if (price !== undefined) body.price = price;
    
    const response = await apiClient.put<CartResponse>(url, body);
    const json = response.data;
    
    if (!json.data?.cart) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }
    
    return json.data.cart;
  } catch (error) {
    console.error('[API] Update cart item error:', error);
    throw error;
  }
}

// Delete cart item
export async function deleteCartItem(cartId: string): Promise<void> {
  const url = `/api/cart/${cartId}`;
  
  try {
    await apiClient.delete<CartResponse>(url);
  } catch (error) {
    console.error('[API] Delete cart item error:', error);
    throw error;
  }
}


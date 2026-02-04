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
      (error.response.data as { error?: string; message?: string; msg?: string })?.error ||
      (error.response.data as { error?: string; message?: string; msg?: string })?.message ||
      (error.response.data as { error?: string; message?: string; msg?: string })?.msg ||
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

export type Product = {
  _id: string;
  category_id?: string;
  product_code: string;
  product_name: string;
  description?: string;
  is_delete?: boolean;
};

export type Category = {
  _id: string;
  category_code: string;
  category_name: string;
  is_delete?: boolean;
};

export type ProductVariant = {
  _id: string;
  sku: string;
  product_id:
    | string
    | {
        _id: string;
        product_code?: string;
        product_name?: string;
        description?: string;
        category_id?: string;
      };
  size?: string;
  quantity: number;
  price: number;
  image?: string;
  is_delete?: boolean;
};

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  image?: string;
};

type ProductsResponse = {
  message?: string;
  data?: { products?: Product[] };
  error?: string;
};

type ProductResponse = {
  message?: string;
  data?: { product?: Product };
  error?: string;
};

type ProductVariantsResponse = {
  message?: string;
  data?: { variants?: ProductVariant[] };
  error?: string;
};

type CategoriesResponse = {
  message?: string;
  data?: { categories?: Category[] };
  error?: string;
};

export async function getProducts(): Promise<Product[]> {
  const url = '/api/product';

  try {
    const response = await apiClient.get<ProductsResponse>(url);
    const json = response.data;

    if (!json.data?.products) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.products;
  } catch (error) {
    console.error('[API] Get products error:', error);
    throw error;
  }
}

export async function getProductById(productId: string): Promise<Product> {
  const url = `/api/product/${productId}`;

  try {
    const response = await apiClient.get<ProductResponse>(url);
    const json = response.data;

    if (!json.data?.product) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.product;
  } catch (error) {
    console.error('[API] Get product by id error:', error);
    throw error;
  }
}

export async function getProductVariants(productId?: string): Promise<ProductVariant[]> {
  const url = '/api/product-variant';

  try {
    const response = await apiClient.get<ProductVariantsResponse>(url, {
      params: productId ? { product_id: productId } : undefined,
    });
    const json = response.data;

    if (!json.data?.variants) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.variants;
  } catch (error) {
    console.error('[API] Get product variants error:', error);
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  const url = '/api/category';

  try {
    const response = await apiClient.get<CategoriesResponse>(url);
    const json = response.data;

    if (!json.data?.categories) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.categories;
  } catch (error) {
    console.error('[API] Get categories error:', error);
    throw error;
  }
}

export async function getProductsWithVariants(): Promise<ProductWithVariants[]> {
  try {
    const variants = await getProductVariants();

    const productsById = variants.reduce<Record<string, ProductWithVariants>>(
      (acc, variant) => {
        const productId =
          typeof variant.product_id === "string"
            ? variant.product_id
            : variant.product_id?._id;
        if (!productId) return acc;

        if (!acc[productId]) {
          const productInfo =
            typeof variant.product_id === "string" ? null : variant.product_id;
          acc[productId] = {
            _id: productId,
            product_code: productInfo?.product_code || "",
            product_name: productInfo?.product_name || variant.sku || "Sản phẩm",
            description: productInfo?.description,
            category_id: productInfo?.category_id,
            variants: [],
            image: undefined,
          };
        }

        acc[productId].variants.push(variant);
        if (!acc[productId].image && variant.image) {
          acc[productId].image = variant.image;
        }
        return acc;
      },
      {}
    );

    return Object.values(productsById);
  } catch (error) {
    console.error('[API] Get products with variants error:', error);
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

export type Address = {
  _id: string;
  account_id: string;
  name: string;
  phone: string;
  address: string;
};

export type AddressItem = {
  _id: string;
  user_id: string;
  fullName: string;
  phone: string;
  address: string;
  is_delete?: boolean;
};

export type Account = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  addresses?: Address[];
  image?: string;
};

type CartResponse = {
  message?: string;
  data?: { carts?: CartItem[]; cart?: CartItem };
  error?: string;
};

type AccountResponse = {
  message?: string;
  data?: { customer?: Account };
  error?: string;
};

type AvatarResponse = {
  msg?: string;
  data?: Account;
};

type OrderResponse = {
  message?: string;
  data?: { order?: { _id: string } };
  error?: string;
};

type OrderDetailResponse = {
  message?: string;
  data?: { order_detail?: { _id: string } };
  error?: string;
};

export type Order = {
  _id: string;
  user_id: string;
  address_id: string;
  status: string;
  total_amount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
};

export type OrderDetail = {
  _id: string;
  order_id: string;
  variants_id: string;
  quantity: number;
  price: number;
};

type OrdersResponse = {
  message?: string;
  data?: { orders?: Order[] };
  error?: string;
};

type OrderDetailsResponse = {
  message?: string;
  data?: { order_details?: OrderDetail[] };
  error?: string;
};

type VnpayCreateResponse =
  | string
  | {
      message?: string;
      data?: string;
      url?: string;
      paymentUrl?: string;
      vnpayUrl?: string;
      error?: string;
    };

type AddressesResponse = {
  message?: string;
  data?: { addresses?: AddressItem[] };
  error?: string;
};

type AddressResponse = {
  message?: string;
  data?: { address?: AddressItem };
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

export async function getAccountById(accountId: string): Promise<Account> {
  const url = `/api/account/${accountId}`;

  try {
    const response = await apiClient.get<AccountResponse>(url);
    const json = response.data;

    if (!json.data?.customer) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.customer;
  } catch (error) {
    console.error('[API] Get account by id error:', error);
    throw error;
  }
}

export async function updateAccountWithAddress(
  accountId: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    pass?: string;
  }
): Promise<Account> {
  const url = `/api/account/${accountId}/with-address`;

  try {
    const formData = new FormData();
    if (typeof payload.name !== "undefined") formData.append("name", payload.name);
    if (typeof payload.email !== "undefined") formData.append("email", payload.email);
    if (typeof payload.phone !== "undefined") formData.append("phone", payload.phone);
    if (typeof payload.address !== "undefined") formData.append("address", payload.address);
    if (typeof payload.pass !== "undefined") formData.append("pass", payload.pass);

    const response = await apiClient.put<AccountResponse>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const json = response.data;

    if (!json.data?.customer && !(json.data as { account?: Account })?.account) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return (json.data.customer ||
      (json.data as { account?: Account }).account) as Account;
  } catch (error) {
    console.error("[API] Update account error:", error);
    throw error;
  }
}

export async function uploadAvatar(
  accountId: string,
  file: { uri: string; name: string; type: string }
): Promise<Account> {
  const url = `/api/account/${accountId}/avatar`;

  try {
    const formData = new FormData();
    formData.append("image", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    const response = await apiClient.post<AvatarResponse>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const json = response.data;

    if (!json.data) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data;
  } catch (error) {
    console.error("[API] Upload avatar error:", error);
    throw error;
  }
}

export async function createOrder(
  user_id: string,
  address_id: string,
  status: string,
  total_amount: number,
  payment_method?: "cash" | "vnpay"
): Promise<{ _id: string }> {
  const url = '/api/order';

  try {
    const response = await apiClient.post<OrderResponse>(url, {
      user_id,
      address_id,
      status,
      total_amount,
      payment_method,
    });
    const json = response.data;

    if (!json.data?.order) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.order;
  } catch (error) {
    console.error('[API] Create order error:', error);
    throw error;
  }
}

export async function createVnpayPaymentUrl(
  orderId: string,
  orderInfo?: string,
  locale: "VN" | "EN" = "VN"
): Promise<string> {
  const url = "/api/vnpay/create-payment-url";

  try {
    const response = await apiClient.post<VnpayCreateResponse>(url, {
      orderId,
      orderInfo,
      locale,
    });
    const json = response.data;
    const paymentUrl =
      typeof json === "string"
        ? json
        : json?.data || json?.url || json?.paymentUrl || json?.vnpayUrl;

    if (!paymentUrl) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return paymentUrl;
  } catch (error) {
    console.error("[API] Create VNPAY URL error:", error);
    throw error;
  }
}

export async function createVnpayPaymentUrlForCart(payload: {
  user_id: string;
  address_id: string;
  items: Array<{ variants_id: string; quantity: number; price: number }>;
  total_amount: number;
  orderInfo?: string;
  locale?: "VN" | "EN";
}): Promise<string> {
  const url = "/api/vnpay/create-payment-url";
  const locale = payload.locale || "VN";

  try {
    const response = await apiClient.post<VnpayCreateResponse>(url, {
      user_id: payload.user_id,
      address_id: payload.address_id,
      items: payload.items,
      total_amount: payload.total_amount,
      orderInfo: payload.orderInfo,
      locale,
    });
    const json = response.data;
    const paymentUrl =
      typeof json === "string"
        ? json
        : json?.data || json?.url || json?.paymentUrl || json?.vnpayUrl;

    if (!paymentUrl) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return paymentUrl;
  } catch (error) {
    console.error("[API] Create VNPAY URL error:", error);
    throw error;
  }
}

export async function createOrderDetail(
  order_id: string,
  variants_id: string,
  quantity: number,
  price: number
): Promise<{ _id: string }> {
  const url = '/api/order-detail';

  try {
    const response = await apiClient.post<OrderDetailResponse>(url, {
      order_id,
      variants_id,
      quantity,
      price,
    });
    const json = response.data;

    if (!json.data?.order_detail) {
      throw new Error('Phản hồi từ server không hợp lệ');
    }

    return json.data.order_detail;
  } catch (error) {
    console.error('[API] Create order detail error:', error);
    throw error;
  }
}

export async function getOrders(userId?: string): Promise<Order[]> {
  const url = "/api/order";

  try {
    const response = await apiClient.get<OrdersResponse>(url, {
      params: userId ? { user_id: userId } : undefined,
    });
    const json = response.data;

    if (!json.data?.orders) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.orders;
  } catch (error) {
    console.error("[API] Get orders error:", error);
    throw error;
  }
}

export async function getOrderDetails(orderId: string): Promise<OrderDetail[]> {
  const url = "/api/order-detail";

  try {
    const response = await apiClient.get<OrderDetailsResponse>(url, {
      params: { order_id: orderId },
    });
    const json = response.data;

    if (!json.data?.order_details) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.order_details;
  } catch (error) {
    console.error("[API] Get order details error:", error);
    throw error;
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const url = `/api/order/${orderId}`;

  try {
    await apiClient.delete(url);
  } catch (error) {
    console.error("[API] Delete order error:", error);
    throw error;
  }
}

// Create cart item
export async function createCartItem(
  variants_id: string,
  quantity: number = 1,
  price?: number,
  product_id?: string
): Promise<CartItem> {
  const url = '/api/cart';
  
  try {
    const body: {
      variants_id: string;
      quantity: number;
      price?: number;
      product_id?: string;
    } = {
      variants_id,
      quantity,
    };
    if (price !== undefined) {
      body.price = price;
    }
    if (product_id) {
      body.product_id = product_id;
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

export async function getAddresses(userId?: string): Promise<AddressItem[]> {
  const url = "/api/address";

  try {
    const response = await apiClient.get<AddressesResponse>(url, {
      params: userId ? { user_id: userId } : undefined,
    });
    const json = response.data;

    if (!json.data?.addresses) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.addresses;
  } catch (error) {
    console.error("[API] Get addresses error:", error);
    throw error;
  }
}

export async function createAddress(
  userId: string,
  fullName: string,
  phone: string,
  address: string
): Promise<AddressItem> {
  const url = "/api/address";

  try {
    const response = await apiClient.post<AddressResponse>(url, {
      user_id: userId,
      fullName,
      phone,
      address,
    });
    const json = response.data;

    if (!json.data?.address) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.address;
  } catch (error) {
    console.error("[API] Create address error:", error);
    throw error;
  }
}

export async function updateAddress(
  addressId: string,
  payload: Partial<Pick<AddressItem, "fullName" | "phone" | "address">> & {
    user_id?: string;
    is_delete?: boolean;
  }
): Promise<AddressItem> {
  const url = `/api/address/${addressId}`;

  try {
    const response = await apiClient.put<AddressResponse>(url, payload);
    const json = response.data;

    if (!json.data?.address) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.address;
  } catch (error) {
    console.error("[API] Update address error:", error);
    throw error;
  }
}

export async function deleteAddress(addressId: string): Promise<void> {
  const url = `/api/address/${addressId}`;

  try {
    await apiClient.delete<AddressResponse>(url);
  } catch (error) {
    console.error("[API] Delete address error:", error);
    throw error;
  }
}


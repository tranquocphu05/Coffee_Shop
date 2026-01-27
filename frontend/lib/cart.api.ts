import { apiClient } from "./apiClient";
import { CartItem, CartResponse } from "./types/cart";

// Get all cart items
export async function getCartItems(): Promise<CartItem[]> {
  const url = "/api/cart";

  try {
    const response = await apiClient.get<CartResponse>(url);
    const json = response.data;

    if (!json.data?.carts) {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.carts;
  } catch (error) {
    console.error("[API] Get cart items error:", error);
    throw error;
  }
}

// Create cart item
export async function createCartItem(
  variants_id: string,
  quantity: number = 1,
  price?: number,
): Promise<CartItem> {
  const url = "/api/cart";

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
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.cart;
  } catch (error) {
    console.error("[API] Create cart item error:", error);
    throw error;
  }
}

// Update cart item
export async function updateCartItem(
  cartId: string,
  quantity?: number,
  variants_id?: string,
  price?: number,
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
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    return json.data.cart;
  } catch (error) {
    console.error("[API] Update cart item error:", error);
    throw error;
  }
}

// Delete cart item
export async function deleteCartItem(cartId: string): Promise<void> {
  const url = `/api/cart/${cartId}`;

  try {
    await apiClient.delete<CartResponse>(url);
  } catch (error) {
    console.error("[API] Delete cart item error:", error);
    throw error;
  }
}

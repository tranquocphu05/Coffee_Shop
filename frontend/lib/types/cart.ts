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
  image?: string;
}

export type CartResponse = {
  message?: string;
  data?: { carts?: CartItem[]; cart?: CartItem };
  error?: string;
};

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  createOrder,
  createOrderDetail,
  deleteCartItem,
  getAccountById,
  getCartItems,
  updateCartItem,
  type CartItem,
} from "@/lib/api";
import { API_BASE_URL } from "@/constants/api";
import { clearAuth, getAuthUser } from "@/lib/auth";
import { useFocusEffect } from "@react-navigation/native";

interface GroupedCartItem {
  product_id: string;
  product_name: string;
  description?: string;
  image?: string;
  variants: Array<{
    cartId: string;
    variantId: string;
    size?: string;
    price: number;
    quantity: number;
  }>;
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCartItems();
    }, [])
  );

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const items = await getCartItems();
      console.log("Cart items loaded:", JSON.stringify(items, null, 2));
      setCartItems(items);
    } catch (error: any) {
      console.error("Error loading cart items:", error);
      
      // Nếu là lỗi xác thực, redirect về login
      if (
        error?.message?.includes("Không xác định") ||
        error?.message?.includes("token") ||
        error?.message?.includes("xác thực")
      ) {
        await clearAuth();
        Alert.alert(
          "Phiên đăng nhập đã hết hạn",
          "Vui lòng đăng nhập lại",
          [
            {
              text: "Đăng nhập",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      } else {
        Alert.alert("Lỗi", "Không thể tải giỏ hàng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 0) return;
    
    try {
      setUpdating(cartId);
      await updateCartItem(cartId, newQuantity);
      // Reload cart items after update
      await loadCartItems();
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng. Vui lòng thử lại.");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartId: string) => {
    Alert.alert(
      "Xóa sản phẩm",
      "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdating(cartId);
              await deleteCartItem(cartId);
              // Reload cart items after delete
              await loadCartItems();
            } catch (error) {
              console.error("Error deleting cart item:", error);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
            } finally {
              setUpdating(null);
            }
          },
        },
      ]
    );
  };

  // Nhóm cart items theo product_id
  const groupedItems = useMemo(() => {
    const grouped: Record<string, GroupedCartItem> = {};

    cartItems.forEach((item) => {
      const productId =
        item.variants_id?.product_id?._id ||
        item.variants_id?._id ||
        item._id;

      if (!grouped[productId]) {
        // Tìm variant có image đầu tiên để làm image chính
        const variantWithImage = cartItems.find(
          (i) =>
            (i.variants_id?.product_id?._id ||
              i.variants_id?._id ||
              i._id) === productId && i.variants_id?.image
        );

        grouped[productId] = {
          product_id: productId,
          product_name:
            item.variants_id?.product_id?.product_name ||
            item.variants_id?.sku ||
            "Sản phẩm",
          description:
            item.variants_id?.product_id?.description || item.variants_id?.size,
          image: variantWithImage?.variants_id?.image || item.variants_id?.image,
          variants: [],
        };
      }

      grouped[productId].variants.push({
        cartId: item._id,
        variantId: item.variants_id?._id || "",
        size: item.variants_id?.size,
        price: item.price,
        quantity: item.quantity,
      });
    });

    return Object.values(grouped);
  }, [cartItems]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const totalPrice = calculateTotal();

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) {
      console.log("No image path provided, using default image");
      return require("@/assets/images/react-logo.png");
    }
    // Nếu là URL đầy đủ
    if (imagePath.startsWith("http")) {
      console.log("Using full URL:", imagePath);
      return { uri: imagePath };
    }
    // Nếu là path tương đối từ server (ví dụ: filename hoặc /images/...)
    // Image được lưu trong public/images/product_variants/
    // Server serve static files từ public folder
    if (imagePath.startsWith("/")) {
      const fullUrl = `${API_BASE_URL}${imagePath}`;
      console.log("Using path with /:", fullUrl);
      return { uri: fullUrl };
    }
    // Nếu chỉ là filename, thêm path đầy đủ
    const fullUrl = `${API_BASE_URL}/images/product_variants/${imagePath}`;
    console.log("Using filename, constructed URL:", fullUrl);
    return { uri: fullUrl };
  };

  const removeProduct = async (productId: string) => {
    // Xóa tất cả variants của product này
    const itemsToDelete = cartItems.filter(
      (item) => item.variants_id?.product_id?._id === productId
    );

    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc chắn muốn xóa tất cả các biến thể của "${itemsToDelete[0]?.variants_id?.product_id?.product_name}" khỏi giỏ hàng?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              // Xóa tất cả items của product này
              await Promise.all(
                itemsToDelete.map((item) => deleteCartItem(item._id))
              );
              await loadCartItems();
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const handlePay = async () => {
    if (cartItems.length === 0) return;
    try {
      setPaying(true);
      const authUser = await getAuthUser();
      const userId = (authUser as { _id?: string })?._id;
      if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
        return;
      }

      const account = await getAccountById(userId);
      const addressId = account.addresses?.[0]?._id;
      if (!addressId) {
        Alert.alert("Thiếu địa chỉ", "Vui lòng cập nhật địa chỉ giao hàng.");
        return;
      }

      const order = await createOrder(userId, addressId, "pending", totalPrice);

      await Promise.all(
        cartItems.map((item) => {
          const variantId = item.variants_id?._id;
          if (!variantId) return Promise.resolve();
          return createOrderDetail(
            order._id,
            variantId,
            item.quantity,
            item.price
          );
        })
      );

      await Promise.all(cartItems.map((item) => deleteCartItem(item._id)));
      await loadCartItems();

      Alert.alert("Thành công", "Đã tạo đơn hàng.");
      router.replace("/(tabs)/notifications");
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Lỗi", "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <IconSymbol name="grid" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={styles.headerRight}>
          <View style={styles.profileIcon}>
            <IconSymbol name="person.circle.fill" size={24} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Cart Items */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
          </View>
        ) : (
          groupedItems.map((groupedItem) => {
            return (
              <View key={groupedItem.product_id} style={styles.cartItemCard}>
                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeProduct(groupedItem.product_id)}
                >
                  <IconSymbol name="trash" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Item Image */}
                <Image
                  source={getImageUrl(groupedItem.image)}
                  style={styles.itemImage}
                  contentFit="cover"
                />

                {/* Item Details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {groupedItem.product_name}
                  </Text>
                  {groupedItem.description && (
                    <Text style={styles.itemDescription}>
                      {groupedItem.description}
                    </Text>
                  )}

                  {/* Variants List */}
                  {groupedItem.variants.map((variant, variantIndex) => {
                    const isUpdating = updating === variant.cartId;
                    return (
                      <View
                        key={variant.cartId}
                        style={[
                          styles.optionRow,
                          variantIndex < groupedItem.variants.length - 1 &&
                            styles.optionRowWithMargin,
                        ]}
                      >
                        <View style={styles.optionLeft}>
                          {variant.size && (
                            <View style={styles.sizeButton}>
                              <Text style={styles.sizeButtonText}>
                                {variant.size}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.optionPrice}>
                            $ {variant.price.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={[
                              styles.quantityButton,
                              isUpdating && styles.quantityButtonDisabled,
                            ]}
                            onPress={() =>
                              updateQuantity(
                                variant.cartId,
                                variant.quantity,
                                -1
                              )
                            }
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Text style={styles.quantityButtonText}>-</Text>
                            )}
                          </TouchableOpacity>
                          <View style={styles.quantityValue}>
                            <Text style={styles.quantityText}>
                              {variant.quantity}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.quantityButton,
                              isUpdating && styles.quantityButtonDisabled,
                            ]}
                            onPress={() =>
                              updateQuantity(
                                variant.cartId,
                                variant.quantity,
                                1
                              )
                            }
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Text style={styles.quantityButtonText}>+</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Total and Pay Button */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalPrice}>$ {totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.payButton, paying && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={paying}
          >
            <Text style={styles.payButtonText}>
              {paying ? "Đang xử lý..." : "Thanh toán"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#000000",
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
  cartItemCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#2A2A2A",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionRowWithMargin: {
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sizeButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#FF6B35",
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  quantityValue: {
    backgroundColor: "#2A2A2A",
    width: 40,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  payButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 16,
    minWidth: 120,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
});

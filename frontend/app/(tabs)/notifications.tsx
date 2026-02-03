import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import {
  deleteOrder,
  getOrderDetails,
  getOrders,
  getProductVariants,
  type Order,
  type OrderDetail,
  type ProductVariant,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { formatVnd } from "@/lib/format";

type OrderItem = {
  id: string;
  name: string;
  subtitle: string;
  total: number;
  image?: string;
  variants: Array<{ size: string; price: number; qty: number }>;
};

type OrderView = {
  id: string;
  date: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
};

const formatOrderDate = (orderId: string) => {
  if (!orderId || orderId.length < 8) return "Không có";
  const timestamp = parseInt(orderId.substring(0, 8), 16) * 1000;
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString("vi-VN");
  const timePart = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
};

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) {
    return require("@/assets/images/react-logo.png");
  }
  if (imagePath.startsWith("http")) {
    return { uri: imagePath };
  }
  if (imagePath.startsWith("/")) {
    return { uri: `${API_BASE_URL}${imagePath}` };
  }
  return { uri: `${API_BASE_URL}/images/product_variants/${imagePath}` };
};

const getStatusMeta = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "pending":
    case "awaiting":
      return { label: "Chờ xử lý", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
    case "processing":
    case "in_progress":
      return { label: "Đang xử lý", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)" };
    case "shipping":
      return { label: "Đang giao", color: "#0EA5E9", bg: "rgba(14, 165, 233, 0.15)" };
    case "delivered":
      return { label: "Đã giao", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" };
    case "completed":
    case "done":
      return { label: "Đã giao", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" };
    case "cancelled":
    case "canceled":
      return { label: "Đã hủy", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
    default:
      return { label: status || "Chưa rõ", color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.15)" };
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const buildOrderViews = (
    rawOrders: Order[],
    detailsByOrder: Record<string, OrderDetail[]>,
    variantsById: Record<string, ProductVariant>
  ) => {
    return rawOrders
      .slice()
      .sort((a, b) => (a._id < b._id ? 1 : a._id > b._id ? -1 : 0))
      .map((order) => {
      const details = detailsByOrder[order._id] || [];
      const grouped: Record<string, OrderItem> = {};

      details.forEach((detail) => {
        const variant = variantsById[detail.variants_id];
        const product = variant?.product_id as
          | { _id?: string; product_name?: string; description?: string }
          | undefined;
        const productId = product?._id || detail.variants_id;
        if (!grouped[productId]) {
          grouped[productId] = {
            id: productId,
            name: product?.product_name || "Sản phẩm",
            subtitle: product?.description || "",
            total: 0,
            image: variant?.image,
            variants: [],
          };
        }

        grouped[productId].variants.push({
          size: variant?.size || variant?.sku || "Mặc định",
          price: detail.price,
          qty: detail.quantity,
        });
        grouped[productId].total += detail.price * detail.quantity;
      });

      const items = Object.values(grouped);
      const totalAmount =
        typeof order.total_amount === "number"
          ? order.total_amount
          : items.reduce((sum, item) => sum + item.total, 0);

      return {
        id: order._id,
        date: formatOrderDate(order._id),
        totalAmount,
        status: order.status,
        items,
      };
    });
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const authUser = await getAuthUser();
      const userId = (authUser as { _id?: string })?._id;
      if (!userId) {
        setOrders([]);
        setError("Bạn cần đăng nhập để xem lịch sử đơn hàng.");
        return;
      }

      const [rawOrders, variants] = await Promise.all([
        getOrders(userId),
        getProductVariants(),
      ]);
      const visibleOrders = rawOrders.filter((order) => {
        const method = (order.paymentMethod || "").toLowerCase();
        const paymentStatus = (order.paymentStatus || "").toUpperCase();
        if (method === "vnpay" && paymentStatus !== "PAID") {
          return false;
        }
        return true;
      });

      const variantsById = variants.reduce<Record<string, ProductVariant>>(
        (acc, variant) => {
          acc[variant._id] = variant;
          return acc;
        },
        {}
      );

      const detailsList = await Promise.all(
        visibleOrders.map((order) => getOrderDetails(order._id))
      );

      const detailsByOrder: Record<string, OrderDetail[]> = {};
      visibleOrders.forEach((order, index) => {
        detailsByOrder[order._id] = detailsList[index] || [];
      });

      setOrders(buildOrderViews(visibleOrders, detailsByOrder, variantsById));
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Không thể tải lịch sử đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const isDeleteBlocked = (status?: string) => {
    const normalized = (status || "").toLowerCase().trim();
    return (
      normalized === "processing" ||
      normalized === "shipping" ||
      normalized === "đang xử lý" ||
      normalized === "dang xu ly" ||
      normalized === "đang giao" ||
      normalized === "dang giao"
    );
  };

  const handleDeleteOrder = (orderId: string, status?: string) => {
    if (isDeleteBlocked(status)) {
      Alert.alert(
        "Không thể xóa",
        "Đơn hàng đang xử lý hoặc đang giao nên không thể xóa."
      );
      return;
    }
    Alert.alert("Xóa đơn hàng", "Bạn có chắc muốn xóa đơn hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteOrder(orderId);
            await loadOrders();
          } catch (err) {
            console.error("Error deleting order:", err);
            setError("Không thể xóa đơn hàng. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const normalized = (order.status || "").toLowerCase().trim();
      const isDelivered =
        normalized === "delivered" ||
        normalized === "completed" ||
        normalized === "done" ||
        normalized === "đã giao" ||
        normalized === "da giao";
      return showHistory ? isDelivered : !isDelivered;
    });
  }, [orders, showHistory]);

  const hasOrders = useMemo(() => filteredOrders.length > 0, [filteredOrders]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="grid" size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn hàng</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setShowHistory((prev) => !prev)}
          >
            <Text style={styles.historyButtonText}>
              {showHistory ? "Tất cả đơn hàng" : "Lịch sử đơn hàng"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerAvatarButton}>
          <Ionicons name="person" size={18} color="#F8FAFC" />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F0843C" />
            <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : !hasOrders ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.emptyText}>
              {showHistory
                ? "Chưa có đơn hàng đã giao."
                : "Chưa có đơn hàng nào."}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionLabel}>Ngày đặt</Text>
                  <Text style={styles.sectionValue}>{order.date}</Text>
                </View>
                <View style={styles.sectionRight}>
                  <Text style={styles.sectionLabel}>Tổng tiền</Text>
                  <Text style={styles.sectionTotal}>
                    {formatVnd(order.totalAmount)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusMeta(order.status).bg, borderColor: getStatusMeta(order.status).color },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusMeta(order.status).color }]}>
                      {getStatusMeta(order.status).label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.deleteOrderButton,
                      isDeleteBlocked(order.status)
                        ? styles.deleteOrderButtonDisabled
                        : null,
                    ]}
                    onPress={() => handleDeleteOrder(order.id, order.status)}
                    disabled={isDeleteBlocked(order.status)}
                  >
                    <Text style={styles.deleteOrderText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.sectionDivider} />

              {order.items.map((item) => (
                <View key={item.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Image
                      source={getImageUrl(item.image)}
                      style={styles.orderImage}
                      contentFit="cover"
                    />
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderName}>{item.name}</Text>
                      <Text style={styles.orderSubtitle}>
                        {item.subtitle || " "}
                      </Text>
                    </View>
                    <Text style={styles.orderTotal}>
                      {formatVnd(item.total)}
                    </Text>
                  </View>

                  <View style={styles.variantRow}>
                    {item.variants.map((variant, index) => (
                      <View key={`${variant.size}-${index}`} style={styles.variantCard}>
                        <Text style={styles.variantSize}>{variant.size}</Text>
                        <Text style={styles.variantPrice}>
                          {formatVnd(variant.price)}
                        </Text>
                        <Text style={styles.variantQty}>x {variant.qty}</Text>
                        <Text style={styles.variantSubtotal}>
                          {formatVnd(variant.price * variant.qty)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1B2430",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
  },
  historyButton: {
    marginTop: 8,
    alignSelf: "center",
    backgroundColor: "#1B2430",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2B3646",
  },
  historyButtonText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "600",
  },
  headerAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1B2430",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: "#98A2B3",
    fontSize: 14,
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#1B2430",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#223041",
  },
  retryText: {
    color: "#F8FAFC",
    fontWeight: "600",
  },
  emptyText: {
    color: "#98A2B3",
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#121826",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionLabel: {
    color: "#94A3B8",
    fontSize: 11,
    marginBottom: 4,
  },
  sectionValue: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  sectionTotal: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 14,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  deleteOrderButton: {
    marginTop: 4,
    backgroundColor: "#1B2430",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B3646",
  },
  deleteOrderButtonDisabled: {
    opacity: 0.5,
  },
  deleteOrderText: {
    color: "#FF4D4F",
    fontWeight: "600",
    fontSize: 11,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#1F2937",
    marginTop: 10,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    color: "#F8FAFC",
    fontWeight: "600",
    fontSize: 13,
  },
  orderSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  orderTotal: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 13,
  },
  variantRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  variantCard: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 72,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  variantSize: {
    color: "#F8FAFC",
    fontWeight: "600",
    fontSize: 11,
  },
  variantPrice: {
    color: "#F59E0B",
    fontWeight: "600",
    fontSize: 11,
    marginTop: 3,
  },
  variantQty: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 3,
  },
  variantSubtotal: {
    color: "#F59E0B",
    fontWeight: "600",
    marginTop: 3,
    fontSize: 11,
  },
});

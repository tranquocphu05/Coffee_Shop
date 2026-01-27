import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { createVNPayPayment } from "@/lib/apiClient";
import { getAuthUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format.money";

type PaymentMethod = "credit_card" | "wallet" | "vnpay";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const totalPrice = params.totalPrice
    ? parseFloat(params.totalPrice as string)
    : 0;

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("credit_card");
  const [cardNumber, setCardNumber] = useState("3897 8923 6745 4638");
  const [cardHolder, setCardHolder] = useState("Robert Evans");
  const [expiryDate, setExpiryDate] = useState("02/30");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getAuthUser();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handlePay = async () => {
    if (selectedMethod === "vnpay") {
      await handleVNPayPayment();
    } else if (selectedMethod === "credit_card") {
      Alert.alert("Credit Card", "Xử lý thanh toán bằng thẻ tín dụng...");
      // TODO: Implement credit card payment
    } else {
      Alert.alert("Payment", `Xử lý thanh toán bằng ${selectedMethod}...`);
    }
  };

  const handleVNPayPayment = async () => {
    if (totalPrice <= 0) {
      Alert.alert("Lỗi", "Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setLoading(true);

      // Convert USD to VND (tỷ giá tạm thời: 1 USD = 23,000 VND)
      const amountVND = Math.round(totalPrice * 23000);

      // Gọi API tạo payment URL
      // Server sẽ tự động tạo address nếu chưa có
      const { paymentUrl, orderId } = await createVNPayPayment(
        amountVND,
        `Thanh toan don hang Coffee Shop - {formatCurrency(totalPrice, "VND")}`,
      );

      console.log("VNPAY Payment URL:", paymentUrl);
      console.log("Order ID:", orderId);

      // Mở VNPAY payment URL trong browser
      const result = await WebBrowser.openBrowserAsync(paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });

      console.log("WebBrowser result:", result);

      // Kiểm tra kết quả
      if (result.type === "cancel") {
        Alert.alert("Thông báo", "Bạn đã hủy thanh toán");
      } else {
        // Redirect sẽ được xử lý bởi VNPAY return URL
        // VNPAY sẽ redirect về server, server sẽ redirect về frontend
        Alert.alert("Đang xử lý", "Vui lòng đợi xác nhận từ hệ thống...", [
          {
            text: "OK",
            onPress: () => {
              // Reload cart để cập nhật (nếu thanh toán thành công, cart sẽ bị xóa)
              router.replace("/(tabs)/cart");
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("VNPAY payment error:", error);
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể tạo thanh toán VNPAY. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Credit Card Section */}
        <TouchableOpacity
          style={[
            styles.paymentCard,
            selectedMethod === "credit_card" && styles.paymentCardSelected,
          ]}
          onPress={() => setSelectedMethod("credit_card")}
        >
          <Text style={styles.paymentCardTitle}>Credit Card</Text>

          <View style={styles.creditCard}>
            <View style={styles.creditCardHeader}>
              <View style={styles.chipIcon}>
                <View style={styles.chipInner} />
              </View>
              <Text style={styles.visaLogo}>VISA</Text>
            </View>

            <Text style={styles.cardNumber}>{cardNumber}</Text>

            <View style={styles.cardDetails}>
              <View style={styles.cardDetailItem}>
                <Text style={styles.cardDetailLabel}>Card Holder Name</Text>
                <TextInput
                  style={styles.cardDetailInput}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  placeholderTextColor="#999999"
                />
              </View>
              <View style={styles.cardDetailItem}>
                <Text style={styles.cardDetailLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.cardDetailInput}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholderTextColor="#999999"
                  maxLength={5}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Other Payment Methods */}
        <View style={styles.paymentMethods}>
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              selectedMethod === "wallet" && styles.paymentMethodButtonSelected,
            ]}
            onPress={() => setSelectedMethod("wallet")}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={styles.walletIcon}>
                <IconSymbol name="bag.fill" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.paymentMethodText}>Wallet</Text>
            </View>
            <Text style={styles.walletBalance}>$ 100.50</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              selectedMethod === "vnpay" && styles.paymentMethodButtonSelected,
            ]}
            onPress={() => setSelectedMethod("vnpay")}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={styles.vnpayIcon}>
                <Text style={styles.vnpayText}>VNPAY</Text>
              </View>
              <Text style={styles.paymentMethodText}>VNPAY</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Payment Summary */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            {formatCurrency(totalPrice, "VND")}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedMethod === "credit_card"
                ? "Pay from Credit Card"
                : selectedMethod === "vnpay"
                  ? "Pay with VNPAY"
                  : `Pay with ${selectedMethod.replace("_", " ").toUpperCase()}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#000000",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  paymentCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentCardSelected: {
    borderColor: "#FF6B35",
  },
  paymentCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  creditCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 20,
  },
  creditCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  chipIcon: {
    width: 40,
    height: 32,
    backgroundColor: "#FF6B35",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chipInner: {
    width: 24,
    height: 20,
    backgroundColor: "#FF8C5A",
    borderRadius: 4,
  },
  visaLogo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginBottom: 24,
    fontFamily: "monospace",
  },
  cardDetails: {
    flexDirection: "row",
    gap: 16,
  },
  cardDetailItem: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 8,
  },
  cardDetailInput: {
    fontSize: 16,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#444444",
    paddingBottom: 8,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  paymentMethodButtonSelected: {
    borderColor: "#FF6B35",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  vnpayIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#1A4D8C",
    justifyContent: "center",
    alignItems: "center",
  },
  vnpayText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
  },
  googlePayText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4285F4",
  },
  amazonPayText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9900",
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
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  payButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
});

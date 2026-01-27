import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function NotificationsScreen() {
  const orders = [
    {
      date: "20th March 16:23",
      items: [
        {
          id: "1",
          name: "Cappuccino",
          subtitle: "With Steamed Milk",
          total: 37.2,
          image: require("@/assets/images/react-logo.png"),
          variants: [
            { size: "S", price: 4.2, qty: 2 },
            { size: "M", price: 6.2, qty: 2 },
            { size: "L", price: 8.2, qty: 2 },
          ],
        },
        {
          id: "2",
          name: "Cappuccino",
          subtitle: "With Steamed Milk",
          total: 37.2,
          image: require("@/assets/images/react-logo.png"),
          variants: [
            { size: "S", price: 4.2, qty: 2 },
            { size: "M", price: 6.2, qty: 2 },
            { size: "L", price: 8.2, qty: 2 },
          ],
        },
      ],
    },
    {
      date: "18th March 2023",
      items: [
        {
          id: "3",
          name: "Liberica Beans",
          subtitle: "From Africa",
          total: 37.2,
          image: require("@/assets/images/react-logo.png"),
          variants: [
            { size: "250gm", price: 4.2, qty: 2 },
            { size: "500gm", price: 6.2, qty: 2 },
            { size: "1Kg", price: 8.2, qty: 2 },
          ],
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.avatar} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order, index) => (
          <View key={`${order.date}-${index}`} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionLabel}>Order Date</Text>
                <Text style={styles.sectionValue}>{order.date}</Text>
              </View>
              <View style={styles.sectionRight}>
                <Text style={styles.sectionLabel}>Total Amount</Text>
                <Text style={styles.sectionTotal}>$ 74.40</Text>
              </View>
            </View>

            {order.items.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Image source={item.image} style={styles.orderImage} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderName}>{item.name}</Text>
                    <Text style={styles.orderSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={styles.orderTotal}>$ {item.total.toFixed(2)}</Text>
                </View>

                <View style={styles.variantRow}>
                  {item.variants.map((variant) => (
                    <View key={variant.size} style={styles.variantCard}>
                      <Text style={styles.variantSize}>{variant.size}</Text>
                      <Text style={styles.variantPrice}>$ {variant.price.toFixed(2)}</Text>
                      <Text style={styles.variantQty}>x {variant.qty}</Text>
                      <Text style={styles.variantSubtotal}>
                        {((variant.price || 0) * variant.qty).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1A1C20",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#9BA1A6",
    fontSize: 12,
    marginBottom: 4,
  },
  sectionValue: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  sectionRight: {
    alignItems: "flex-end",
  },
  sectionTotal: {
    color: "#F0843C",
    fontWeight: "700",
  },
  orderCard: {
    backgroundColor: "#13161B",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  orderImage: {
    width: 46,
    height: 46,
    borderRadius: 12,
    marginRight: 10,
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  orderSubtitle: {
    color: "#9BA1A6",
    fontSize: 12,
  },
  orderTotal: {
    color: "#F0843C",
    fontWeight: "700",
  },
  variantRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  variantCard: {
    backgroundColor: "#1A1C20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 72,
    alignItems: "center",
  },
  variantSize: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  variantPrice: {
    color: "#F0843C",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 4,
  },
  variantQty: {
    color: "#9BA1A6",
    fontSize: 11,
    marginTop: 4,
  },
  variantSubtotal: {
    color: "#F0843C",
    fontWeight: "600",
    marginTop: 4,
    fontSize: 12,
  },
  downloadButton: {
    marginTop: 8,
    alignSelf: "center",
    backgroundColor: "#F0843C",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 18,
  },
  downloadText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

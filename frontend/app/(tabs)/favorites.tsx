import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/constants/api";
import { getProductsWithVariants, type ProductWithVariants } from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";

export default function FavoritesScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavoriteIds().then(setFavoriteIds).catch(() => setFavoriteIds([]));
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingFavorites(true);
      const [items, favorites] = await Promise.all([
        getProductsWithVariants(),
        loadFavoriteIds(),
      ]);
      setProducts(items);
      setFavoriteIds(favorites);
    } catch (error) {
      console.error("Error loading favorites:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách yêu thích.");
    } finally {
      setLoading(false);
      setLoadingFavorites(false);
    }
  };

  const loadFavoriteIds = async () => {
    const raw = await SecureStore.getItemAsync("favorite_products");
    if (!raw) return [];
    try {
      const ids = JSON.parse(raw) as string[];
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  };

  const saveFavoriteIds = async (ids: string[]) => {
    await SecureStore.setItemAsync("favorite_products", JSON.stringify(ids));
  };

  const favorites = useMemo(() => {
    if (!favoriteIds.length) return [];
    return products.filter((product) => favoriteIds.includes(product._id));
  }, [products, favoriteIds]);

  const handleToggleFavorite = async (productId: string) => {
    const next = favoriteIds.includes(productId)
      ? favoriteIds.filter((id) => id !== productId)
      : [...favoriteIds, productId];
    setFavoriteIds(next);
    await saveFavoriteIds(next);
  };

  const handleOpenProduct = (productId: string) => {
    router.push({ pathname: "/product/[id]", params: { id: productId } });
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

  const getPriceValue = (variants: ProductWithVariants["variants"]) => {
    const prices = variants.map((variant) => variant.price).filter(Number.isFinite);
    if (!prices.length) return null;
    return Math.min(...prices);
  };

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
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <TouchableOpacity
          style={styles.headerAvatarButton}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Ionicons name="person" size={18} color="#F8FAFC" />
        </TouchableOpacity>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.refreshText}>Tải lại</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F0843C" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
          <Text style={styles.emptyText}>
            Hãy chọn sản phẩm bạn thích để lưu lại tại đây.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.exploreText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {favorites.map((product) => {
            const priceValue = getPriceValue(product.variants);
            return (
              <TouchableOpacity
                key={product._id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => handleOpenProduct(product._id)}
              >
                <Image
                  source={getImageUrl(product.image)}
                  style={styles.cardImage}
                  contentFit="cover"
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{product.product_name}</Text>
                    <TouchableOpacity
                      onPress={() => handleToggleFavorite(product._id)}
                      style={styles.heartButton}
                      disabled={loadingFavorites}
                    >
                      <Text style={styles.heartText}>♥</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {product.description || " "}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {priceValue !== null ? `$ ${priceValue.toFixed(2)}` : "Chưa có giá"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1B2430",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1B2430",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    paddingHorizontal: 20,
    alignItems: "flex-end",
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: "#1F242A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  refreshText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#9BA1A6",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#9BA1A6",
    textAlign: "center",
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: "#F0843C",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  exploreText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1A1C20",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1F242A",
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#2A2A2A",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
  },
  heartButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  heartText: {
    color: "#F0843C",
    fontSize: 14,
  },
  cardSubtitle: {
    color: "#9BA1A6",
    fontSize: 12,
    marginTop: 6,
  },
  cardPrice: {
    color: "#F0843C",
    fontWeight: "700",
    marginTop: 10,
  },
});

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import {
  createCartItem,
  getProductById,
  getProductVariants,
  type Product,
  type ProductVariant,
} from "@/lib/api";
import { API_BASE_URL } from "@/constants/api";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadFavoriteState(id);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadFavoriteState(id);
      }
    }, [id])
  );

  useEffect(() => {
    if (!selectedVariantId && variants.length > 0) {
      setSelectedVariantId(variants[0]._id);
    }
  }, [variants, selectedVariantId]);

  const loadData = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [productData, variantData] = await Promise.all([
        getProductById(productId),
        getProductVariants(productId),
      ]);
      setProduct(productData);
      setVariants(variantData);
    } catch (err) {
      console.error("Error loading product detail:", err);
      setError("Không thể tải chi tiết sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteState = async (productId: string) => {
    const raw = await SecureStore.getItemAsync("favorite_products");
    if (!raw) {
      setIsFavorite(false);
      return;
    }
    try {
      const ids = JSON.parse(raw) as string[];
      setIsFavorite(Array.isArray(ids) && ids.includes(productId));
    } catch {
      setIsFavorite(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    const raw = await SecureStore.getItemAsync("favorite_products");
    let ids: string[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        ids = Array.isArray(parsed) ? parsed : [];
      } catch {
        ids = [];
      }
    }
    const next = ids.includes(id)
      ? ids.filter((item) => item !== id)
      : [...ids, id];
    setIsFavorite(next.includes(id));
    await SecureStore.setItemAsync("favorite_products", JSON.stringify(next));
  };

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant._id === selectedVariantId) || null,
    [variants, selectedVariantId]
  );

  const sizeOptions = useMemo(() => {
    const sizes = variants
      .map((variant) => variant.size)
      .filter((size): size is string => Boolean(size));
    return Array.from(new Set(sizes));
  }, [variants]);

  const handleSelectSize = (size: string) => {
    const matched = variants.find((variant) => variant.size === size);
    if (matched) {
      setSelectedVariantId(matched._id);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      Alert.alert("Lỗi", "Vui lòng chọn biến thể sản phẩm.");
      return;
    }
    try {
      setAdding(true);
      await createCartItem(selectedVariant._id, 1, selectedVariant.price);
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng.");
    } catch (err) {
      console.error("Error adding to cart:", err);
      Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng.");
    } finally {
      setAdding(false);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F0843C" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Không có dữ liệu."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => id && loadData(id)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image
            source={getImageUrl(selectedVariant?.image)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Text style={styles.iconButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, isFavorite && styles.iconButtonActive]}
              onPress={handleToggleFavorite}
            >
              <Text
                style={[
                  styles.iconButtonText,
                  isFavorite ? styles.iconButtonTextActive : null,
                ]}
              >
                {isFavorite ? "♥" : "♡"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{product.product_name}</Text>
              <Text style={styles.subtitle}>
                {product.description || " "}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>★ 4.5</Text>
                <Text style={styles.ratingCount}>(6.879)</Text>
              </View>
            </View>
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Cà phê</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Sữa</Text>
              </View>
              <View style={styles.tagWide}>
                <Text style={styles.tagText}>Rang vừa</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.sectionText}>
              {product.description ||
                "Chưa có mô tả chi tiết cho sản phẩm này."}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kích cỡ</Text>
            <View style={styles.sizeRow}>
              {sizeOptions.length === 0 ? (
                <Text style={styles.sectionText}>Chưa có size.</Text>
              ) : (
                sizeOptions.map((size) => {
                  const isActive =
                    selectedVariant?.size === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[styles.sizeChip, isActive && styles.sizeChipActive]}
                      onPress={() => handleSelectSize(size)}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          isActive && styles.sizeTextActive,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Giá</Text>
              <Text style={styles.priceValue}>
                ${" "}
                {selectedVariant?.price !== undefined
                  ? selectedVariant.price.toFixed(2)
                  : "0.00"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addToCartButton, adding && styles.addToCartDisabled]}
              onPress={handleAddToCart}
              disabled={adding}
            >
              <Text style={styles.addToCartText}>
                {adding ? "Đang thêm..." : "Thêm vào giỏ"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0E12",
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 360,
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: "rgba(11,14,18,0.65)",
  },
  heroActions: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(15,18,22,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    borderWidth: 1,
    borderColor: "#F0843C",
  },
  iconButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  iconButtonTextActive: {
    color: "#F0843C",
  },
  content: {
    padding: 24,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#9BA1A6",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    color: "#F0843C",
    fontWeight: "700",
  },
  ratingCount: {
    color: "#9BA1A6",
    fontSize: 12,
  },
  tags: {
    alignItems: "flex-end",
    gap: 8,
  },
  tag: {
    backgroundColor: "#1A1C20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagWide: {
    backgroundColor: "#1A1C20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    color: "#9BA1A6",
    fontSize: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionText: {
    color: "#9BA1A6",
    fontSize: 13,
    lineHeight: 18,
  },
  sizeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  sizeChip: {
    minWidth: 48,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#1A1C20",
    alignItems: "center",
  },
  sizeChipActive: {
    borderColor: "#F0843C",
  },
  sizeText: {
    color: "#9BA1A6",
    fontWeight: "600",
  },
  sizeTextActive: {
    color: "#F0843C",
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  priceLabel: {
    color: "#9BA1A6",
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    color: "#F0843C",
    fontSize: 22,
    fontWeight: "700",
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: "#F0843C",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  addToCartDisabled: {
    opacity: 0.7,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#9BA1A6",
  },
  errorText: {
    color: "#F0843C",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#1A1C20",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

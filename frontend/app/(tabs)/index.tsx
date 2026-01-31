import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { getAuthUser } from "@/lib/auth";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  createCartItem,
  getCategories,
  type Category,
  getProductsWithVariants,
  type ProductWithVariants,
} from "@/lib/api";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadFavoriteIds();
    loadAvatar();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavoriteIds();
      loadAvatar();
    }, [])
  );

  const loadAvatar = async () => {
    try {
      const user = (await getAuthUser()) as { image?: string } | null;
      if (user?.image) {
        setAvatarUrl(`${API_BASE_URL}/images/avatars/${user.image}`);
      } else {
        setAvatarUrl(null);
      }
    } catch {
      setAvatarUrl(null);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError(null);
      const items = await getProductsWithVariants();
      setProducts(items);
    } catch (error) {
      console.error("Error loading products:", error);
      setProductsError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenProduct = (productId: string) => {
    router.push({ pathname: "/product/[id]", params: { id: productId } });
  };

  const handleAddToCart = async (product: ProductWithVariants) => {
    const firstVariant = product.variants[0];
    if (!firstVariant) {
      Alert.alert("Lỗi", "Sản phẩm chưa có biến thể.");
      return;
    }
    try {
      setAddingProductId(product._id);
      await createCartItem(firstVariant._id, 1, firstVariant.price, product._id);
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng.");
    } finally {
      setAddingProductId(null);
    }
  };

  const loadFavoriteIds = async () => {
    const raw = await SecureStore.getItemAsync("favorite_products");
    if (!raw) {
      setFavoriteIds([]);
      return;
    }
    try {
      const ids = JSON.parse(raw) as string[];
      setFavoriteIds(Array.isArray(ids) ? ids : []);
    } catch {
      setFavoriteIds([]);
    }
  };

  const toggleFavorite = async (productId: string) => {
    const next = favoriteIds.includes(productId)
      ? favoriteIds.filter((id) => id !== productId)
      : [...favoriteIds, productId];
    setFavoriteIds(next);
    await SecureStore.setItemAsync("favorite_products", JSON.stringify(next));
  };

  const loadCategories = async () => {
    try {
      const items = await getCategories();
      setCategories(items);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const categoriesById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category._id] = category.category_name;
      return acc;
    }, {});
  }, [categories]);

  const getCategoryKey = (product: ProductWithVariants) => {
    const categoryId = product.category_id?.trim();
    if (categoryId && categoriesById[categoryId]) return categoryId;
    return "uncategorized";
  };

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => unique.add(getCategoryKey(product)));
    return [
      { id: "all", label: "Tất cả" },
      ...Array.from(unique).map((id) => ({
        id,
        label: id === "uncategorized" ? "Khác" : categoriesById[id],
      })),
    ];
  }, [products, categoriesById]);

  const matchesSearch = (product: ProductWithVariants, normalizedQuery: string) =>
    !normalizedQuery ||
    [product.product_name, product.product_code, product.description]
      .filter(Boolean)
      .some((value) =>
        value!.toString().toLowerCase().includes(normalizedQuery)
      );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategoryId === "all" ||
        getCategoryKey(product) === selectedCategoryId;
      return matchesCategory && matchesSearch(product, normalizedQuery);
    });
  }, [products, searchQuery, selectedCategoryId, categoriesById]);

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

  const getPriceLabel = (variants: ProductWithVariants["variants"]) => {
    const prices = variants.map((variant) => variant.price).filter(Number.isFinite);
    if (!prices.length) return null;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return `$ ${minPrice.toFixed(2)}`;
    }
    return `$ ${minPrice.toFixed(2)} - $ ${maxPrice.toFixed(2)}`;
  };

  const getPriceValue = (variants: ProductWithVariants["variants"]) => {
    const prices = variants.map((variant) => variant.price).filter(Number.isFinite);
    if (!prices.length) return null;
    return Math.min(...prices);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="grid" size={20} color="#F8FAFC" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trang chủ</Text>
            <TouchableOpacity
              style={styles.headerAvatarButton}
              onPress={() => router.push("/(tabs)/profile")}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Chào mừng bạn đến với Coffee Shop!
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm cà phê..."
              placeholderTextColor="#6E7379"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContent}
            style={styles.categoryScroll}
          >
            {categoryOptions.map((category) => {
              const isActive = category.id === selectedCategoryId;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadProducts}>
              <Text style={styles.refreshButtonText}>Tải lại</Text>
            </TouchableOpacity>
          </View>

          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
            </View>
          ) : productsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{productsError}</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {products.length === 0
                  ? "Chưa có sản phẩm nào"
                  : "Không tìm thấy sản phẩm phù hợp"}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            >
              {filteredProducts.map((product) => {
                const priceLabel = getPriceLabel(product.variants);
                const priceValue = getPriceValue(product.variants);
                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.productCard}
                    activeOpacity={0.9}
                    onPress={() => handleOpenProduct(product._id)}
                  >
                    <View style={styles.productImageWrapper}>
                      <Image
                        source={getImageUrl(product.image)}
                        style={styles.productImage}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => toggleFavorite(product._id)}
                      >
                        <Text style={styles.favoriteText}>
                          {favoriteIds.includes(product._id) ? "♥" : "♡"}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>★ 4.5</Text>
                      </View>
                    </View>
                    <View style={styles.productBody}>
                      <Text style={styles.productName}>{product.product_name}</Text>
                      <Text
                        style={styles.productDescription}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {product.description || " "}
                      </Text>
                      <View style={styles.productFooter}>
                        {priceValue !== null ? (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceCurrency}>$</Text>
                            <Text style={styles.productPriceValue}>
                              {priceValue.toFixed(2)}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.productPriceMuted}>Chưa có giá</Text>
                        )}
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => handleAddToCart(product)}
                          disabled={addingProductId === product._id}
                        >
                          <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      {priceLabel && priceValue === null ? (
                        <Text style={styles.productPriceHint}>{priceLabel}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#10131A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1B2028",
  },
  categoryScroll: {
    marginBottom: 14,
  },
  categoryContent: {
    paddingRight: 8,
    gap: 12,
  },
  categoryChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#12151C",
    borderWidth: 1,
    borderColor: "#1B2028",
  },
  categoryChipActive: {
    backgroundColor: "#1A1F28",
    borderColor: "#FF7F3F",
  },
  categoryText: {
    fontSize: 13,
    lineHeight: 16,
    color: "#9BA1A6",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#FF7F3F",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingTop: 6,
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2A2A2A",
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  welcomeText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 14,
    color: "#9BA1A6",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  refreshButton: {
    backgroundColor: "#1B2028",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#9BA1A6",
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 12,
  },
  errorText: {
    color: "#FF6B35",
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 12,
  },
  emptyText: {
    color: "#9BA1A6",
    fontSize: 14,
  },
  emptyRow: {
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  productsContainer: {
    flexDirection: "row",
    gap: 14,
    paddingBottom: 28,
    paddingRight: 8,
  },
  productCard: {
    width: 190,
    backgroundColor: "#12151C",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1B2028",
  },
  productImageWrapper: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(10,12,16,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteText: {
    color: "#FF7F3F",
    fontSize: 12,
    fontWeight: "700",
  },
  productImage: {
    width: "100%",
    height: 132,
    borderRadius: 16,
    backgroundColor: "#2A2A2A",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(10,12,16,0.8)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: "#F7A04C",
    fontSize: 11,
    fontWeight: "700",
  },
  productBody: {
    paddingTop: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 11,
    color: "#9BA1A6",
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  priceCurrency: {
    fontSize: 12,
    color: "#FF7F3F",
    fontWeight: "600",
    marginBottom: 2,
  },
  productPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF7F3F",
  },
  productPriceHint: {
    fontSize: 12,
    color: "#9BA1A6",
    marginTop: 6,
  },
  productPriceMuted: {
    fontSize: 14,
    color: "#9BA1A6",
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FF7F3F",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginTop: -2,
  },
});

import React, { useEffect, useMemo, useState } from "react";
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
import { clearAuth } from "@/lib/auth";
import { Image } from "expo-image";
import {
  createCartItem,
  getCategories,
  type Category,
  getProductsWithVariants,
  type ProductWithVariants,
} from "@/lib/api";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";

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

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadFavoriteIds();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAuth();
              router.replace("/login");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
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
            <Text style={styles.title}>Home</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Đăng xuất</Text>
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
              placeholder="Find Your Coffee..."
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
    padding: 24,
  },
  searchContainer: {
    marginBottom: 18,
  },
  searchInput: {
    backgroundColor: "#1A1C20",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1F242A",
  },
  categoryScroll: {
    marginBottom: 26,
  },
  categoryContent: {
    paddingRight: 8,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#1A1C20",
    borderWidth: 1,
    borderColor: "#1F242A",
  },
  categoryChipActive: {
    backgroundColor: "#1F242A",
    borderColor: "#F0843C",
  },
  categoryText: {
    fontSize: 14,
    color: "#9BA1A6",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#F0843C",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  logoutButton: {
    backgroundColor: "#FF4D4F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  welcomeText: {
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
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
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  refreshButton: {
    backgroundColor: "#1F242A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
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
    gap: 16,
    paddingBottom: 32,
    paddingRight: 8,
  },
  productCard: {
    width: 200,
    backgroundColor: "#1A1C20",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F242A",
  },
  productImageWrapper: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(13,16,20,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteText: {
    color: "#F0843C",
    fontSize: 12,
    fontWeight: "700",
  },
  productImage: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(13,16,20,0.8)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: "#F4A261",
    fontSize: 11,
    fontWeight: "700",
  },
  productBody: {
    paddingTop: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 11,
    color: "#9BA1A6",
    marginBottom: 12,
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
    color: "#F0843C",
    fontWeight: "600",
    marginBottom: 2,
  },
  productPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0843C",
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0843C",
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

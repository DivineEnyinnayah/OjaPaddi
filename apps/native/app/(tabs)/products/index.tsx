import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native";
import { useThemeColor } from "heroui-native";
import { useProducts } from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProductsScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";
  const { data: products, isLoading } = useProducts();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => router.push(`/(tabs)/products/${item.id}`)}
    >
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="image-outline" size={32} color="#bfc9be" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category || "No Category"}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
          <View style={[styles.stockBadge, { backgroundColor: item.quantity <= item.lowStockThreshold ? "#ffdad6" : "#eef2eb" }]}>
            <Text style={[styles.stockText, { color: item.quantity <= item.lowStockThreshold ? "#ba1a1a" : "#005129" }]}>
              {item.quantity} in stock
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#404940" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#404940"
          />
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#bfc9be" />
              <Text style={styles.emptyStateTitle}>No Products Yet</Text>
              <Text style={styles.emptyStateSubtitle}>Add your first product to start selling.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => router.push("/(tabs)/products/add")}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ebefe8",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#181d19",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f7faf3",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181d19",
  },
  productCategory: {
    fontSize: 14,
    color: "#404940",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#005129",
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#181d19",
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#404940",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

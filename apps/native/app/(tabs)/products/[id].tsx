import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useProduct } from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";
  const { data: product, isLoading } = useProduct(id as string);

  const handleShare = async () => {
    if (!product) return;
    try {
      const message = `*${product.name}* 🛍️\nPrice: ₦${parseFloat(product.price).toLocaleString()}\n\n${product.description || ""}\n\nContact: 08012345678`;
      await Share.share({
        message,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share product");
    }
  };

  if (isLoading) return <View style={[styles.container, { backgroundColor: bgColor }]} />;

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: "center", alignItems: "center" }]}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.imageContainer}>
        <View style={styles.productImageLarge}>
          <Ionicons name="image-outline" size={80} color="#bfc9be" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category || "No Category"}</Text>
          </View>
          <Text style={styles.productPrice}>₦{parseFloat(product.price).toLocaleString()}</Text>
        </View>

        <View style={styles.stockCard}>
          <View>
            <Text style={styles.stockLabel}>Available Stock</Text>
            <Text style={styles.stockValue}>{product.quantity} Units</Text>
          </View>
          <TouchableOpacity style={[styles.adjustButton, { borderColor: primaryColor }]}>
            <Text style={[styles.adjustButtonText, { color: primaryColor }]}>Adjust Stock</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {product.description || "No description provided for this product."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cost Price</Text>
            <Text style={styles.detailValue}>₦{product.costPrice ? parseFloat(product.costPrice).toLocaleString() : "0.00"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SKU</Text>
            <Text style={styles.detailValue}>{product.sku || "N/A"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Low Stock Alert</Text>
            <Text style={styles.detailValue}>{product.lowStockThreshold} Units</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.shareButton, { backgroundColor: primaryColor }]}
          onPress={handleShare}
        >
          <Ionicons name="logo-whatsapp" size={24} color="white" />
          <Text style={styles.shareButtonText}>Share Product Page</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: "#f7faf3",
    justifyContent: "center",
    alignItems: "center",
  },
  productImageLarge: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#181d19",
  },
  productCategory: {
    fontSize: 16,
    color: "#404940",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#005129",
  },
  stockCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7faf3",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  stockLabel: {
    fontSize: 14,
    color: "#404940",
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
    marginTop: 4,
  },
  adjustButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  adjustButtonText: {
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#404940",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ebefe8",
  },
  detailLabel: {
    fontSize: 15,
    color: "#404940",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181d19",
  },
  shareButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  shareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#ebefe8",
    borderRadius: 12,
  },
  editButtonText: {
    fontWeight: "600",
    color: "#181d19",
  },
  deleteButton: {
    width: 100,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffdad6",
    borderRadius: 12,
  },
  deleteButtonText: {
    fontWeight: "600",
    color: "#ba1a1a",
  },
});

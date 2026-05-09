import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCreateSale } from "@/hooks/useSales";
import { useCartStore } from "@/stores/cartStore";
import { Ionicons } from "@expo/vector-icons";

export default function RecordSaleScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";
  const { data: products } = useProducts();
  const { items, addItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const createSale = useCreateSale();

  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const handleRecordSale = async () => {
    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one product");
      return;
    }

    try {
      await createSale.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        discount: parseFloat(discount),
        paymentMethod,
        paymentStatus: "paid",
        amountPaid: getTotal() - parseFloat(discount),
      });
      clearCart();
      Alert.alert("Success", "Sale recorded successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to record sale");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Products</Text>
        <FlatList
          horizontal
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productScroll}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.productBadge}
              onPress={() => addItem({ productId: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 })}
            >
              <Text style={styles.productBadgeText}>{item.name}</Text>
              <Text style={styles.productBadgePrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={[styles.cartSection, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>Items in Cart</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                  <Ionicons name="remove-circle-outline" size={24} color="#404940" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                  <Ionicons name="add-circle-outline" size={24} color="#404940" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyCartText}>No items added to cart.</Text>
          }
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.row}>
          <Text style={styles.footerLabel}>Subtotal</Text>
          <Text style={styles.footerValue}>₦{getTotal().toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.footerLabel}>Discount</Text>
          <TextInput
            style={styles.discountInput}
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.row, { marginTop: 12, borderTopWidth: 1, borderTopColor: "#ebefe8", paddingTop: 12 }]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₦{(getTotal() - parseFloat(discount || "0")).toLocaleString()}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.recordButton, { backgroundColor: primaryColor, opacity: createSale.isPending ? 0.7 : 1 }]}
          onPress={handleRecordSale}
          disabled={createSale.isPending}
        >
          <Text style={styles.recordButtonText}>
            {createSale.isPending ? "Recording..." : "Complete Sale"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181d19",
    marginBottom: 12,
  },
  productScroll: {
    paddingBottom: 8,
  },
  productBadge: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#ebefe8",
    alignItems: "center",
  },
  productBadgeText: {
    fontWeight: "600",
    color: "#181d19",
  },
  productBadgePrice: {
    fontSize: 12,
    color: "#005129",
    marginTop: 4,
  },
  cartSection: {
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#181d19",
  },
  itemPrice: {
    fontSize: 14,
    color: "#404940",
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCartText: {
    textAlign: "center",
    color: "#bfc9be",
    marginTop: 40,
  },
  footer: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  footerLabel: {
    fontSize: 14,
    color: "#404940",
  },
  footerValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  discountInput: {
    width: 80,
    height: 32,
    backgroundColor: "#f7faf3",
    borderRadius: 6,
    textAlign: "right",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#bfc9be",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#005129",
  },
  recordButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  recordButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColor } from "heroui-native";
import { useSales } from "@/hooks/useSales";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SalesScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";
  const { data: sales, isLoading } = useSales();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.saleCard}
      onPress={() => router.push(`/(tabs)/sales/${item.id}` as any)}
    >
      <View style={styles.saleHeader}>
        <Text style={styles.saleRef}>{item.reference}</Text>
        <Text style={styles.saleDate}>{new Date(item.soldAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.saleFooter}>
        <View>
          <Text style={styles.customerName}>{item.customer?.name || "Guest Customer"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.paymentStatus === "paid" ? "#eef2eb" : "#ffdad6" }]}>
            <Text style={[styles.statusText, { color: item.paymentStatus === "paid" ? "#005129" : "#ba1a1a" }]}>
              {item.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.saleAmount}>₦{parseFloat(item.total).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <FlatList
        data={sales}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#bfc9be" />
              <Text style={styles.emptyStateTitle}>No Sales Yet</Text>
              <Text style={styles.emptyStateSubtitle}>Record your first sale to see it here.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => router.push("/(tabs)/sales/record")}
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  saleCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5ee",
    paddingBottom: 8,
  },
  saleRef: {
    fontSize: 14,
    fontWeight: "600",
    color: "#404940",
  },
  saleDate: {
    fontSize: 14,
    color: "#404940",
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181d19",
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
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

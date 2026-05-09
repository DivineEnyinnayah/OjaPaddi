import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useThemeColor } from "heroui-native";
import { useCustomers } from "@/hooks/useCustomers";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CustomersScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";
  const { data: customers, isLoading } = useCustomers();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => router.push(`/(tabs)/customers/${item.id}` as any)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerPhone}>{item.phone || "No phone number"}</Text>
      </View>
      <View style={styles.customerStats}>
        <Text style={styles.totalSpent}>₦{parseFloat(item.totalSpent).toLocaleString()}</Text>
        <Text style={styles.orderCount}>{item.orderCount} orders</Text>
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
            placeholder="Search customers..."
            placeholderTextColor="#404940"
          />
        </View>
      </View>

      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#bfc9be" />
              <Text style={styles.emptyStateTitle}>No Customers Yet</Text>
              <Text style={styles.emptyStateSubtitle}>Keep track of your regular buyers here.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: primaryColor }]}>
        <Ionicons name="person-add" size={24} color="white" />
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
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f7faf3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ebefe8",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#005129",
  },
  customerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181d19",
  },
  customerPhone: {
    fontSize: 14,
    color: "#404940",
    marginTop: 2,
  },
  customerStats: {
    alignItems: "flex-end",
  },
  totalSpent: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#181d19",
  },
  orderCount: {
    fontSize: 12,
    color: "#404940",
    marginTop: 2,
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

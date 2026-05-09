import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColor } from "heroui-native";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const textColor = useThemeColor("foreground");
  const { data: session } = authClient.useSession();

  const primaryColor = "#005129";
  const accentColor = "#F5A623";

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{session?.user?.name || "Market Friend"} 👋</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#404940" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <TouchableOpacity onPress={() => router.push("/analytics")}>
            <Text style={[styles.viewAnalytics, { color: primaryColor }]}>View Analytics</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>₦0.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sales</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Profit</Text>
            <Text style={[styles.statValue, { color: primaryColor }]}>₦0.00</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push("/(tabs)/sales/record")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#eef2eb" }]}>
            <Ionicons name="add" size={24} color={primaryColor} />
          </View>
          <Text style={styles.actionLabel}>Record Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push("/(tabs)/products/add")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#eef2eb" }]}>
            <Ionicons name="cube-outline" size={24} color={primaryColor} />
          </View>
          <Text style={styles.actionLabel}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.actionIcon, { backgroundColor: "#eef2eb" }]}>
            <Ionicons name="wallet-outline" size={24} color={primaryColor} />
          </View>
          <Text style={styles.actionLabel}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/sales")}>
            <Text style={[styles.viewAll, { color: primaryColor }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#bfc9be" />
          <Text style={styles.emptyStateText}>No sales recorded today.</Text>
          <TouchableOpacity 
            style={[styles.smallButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/(tabs)/sales/record")}
          >
            <Text style={styles.smallButtonText}>Record Your First Sale</Text>
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
  header: {
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#404940",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#181d19",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ebefe8",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    margin: 24,
    marginTop: 0,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#181d19",
  },
  viewAnalytics: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#404940",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181d19",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#ebefe8",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionItem: {
    alignItems: "center",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: "#181d19",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f7faf3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ebefe8",
    borderStyle: "dashed",
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#404940",
    marginBottom: 20,
  },
  smallButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  smallButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

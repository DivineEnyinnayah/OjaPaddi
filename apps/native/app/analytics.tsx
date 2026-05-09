import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColor } from "heroui-native";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { env } from "@ojapaddi/env/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const API_URL = `${env.EXPO_PUBLIC_SERVER_URL}/api/analytics/summary`;

export default function AnalyticsScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const json = await authClient.$fetch(API_URL);
      return (json as any).data;
    },
  });

  if (isLoading) return <View style={{ flex: 1, backgroundColor: bgColor }} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#181d19" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>₦{analytics?.total_revenue?.toLocaleString() || "0.00"}</Text>
          <Text style={styles.statSub}>Last 30 days</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Net Profit</Text>
          <Text style={[styles.statValue, { color: primaryColor }]}>₦{analytics?.net_profit?.toLocaleString() || "0.00"}</Text>
          <Text style={styles.statSub}>After expenses</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={styles.statValue}>{analytics?.total_sales_count || 0}</Text>
          <Text style={styles.statSub}>Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg. Order</Text>
          <Text style={styles.statValue}>₦{analytics?.avg_order_value?.toFixed(2) || "0.00"}</Text>
          <Text style={styles.statSub}>Per sale</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        <View style={styles.card}>
          {analytics?.top_products?.length > 0 ? (
            analytics.top_products.map((item: any, index: number) => (
              <View key={index} style={[styles.productRow, index < analytics.top_products.length - 1 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productSub}>{item.quantitySold} units sold</Text>
                </View>
                <Text style={styles.productRevenue}>₦{parseFloat(item.revenue).toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No data available yet.</Text>
          )}
        </View>
      </View>

      <View style={styles.proBanner}>
        <Ionicons name="sparkles" size={24} color="#F5A623" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.proTitle}>Unlock Pro Analytics</Text>
          <Text style={styles.proDesc}>Get detailed charts, expense breakdowns and more.</Text>
        </View>
        <TouchableOpacity style={[styles.proButton, { backgroundColor: "#F5A623" }]}>
          <Text style={styles.proButtonText}>Upgrade</Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#181d19",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
  },
  statCard: {
    width: "44%",
    backgroundColor: "white",
    margin: "3%",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#404940",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
  },
  statSub: {
    fontSize: 10,
    color: "#bfc9be",
    marginTop: 4,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181d19",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5ee",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181d19",
  },
  productSub: {
    fontSize: 13,
    color: "#404940",
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#005129",
  },
  emptyText: {
    textAlign: "center",
    color: "#bfc9be",
    paddingVertical: 20,
  },
  proBanner: {
    margin: 24,
    backgroundColor: "#181d19",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  proTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  proDesc: {
    color: "#bfc9be",
    fontSize: 12,
    marginTop: 4,
  },
  proButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proButtonText: {
    color: "black",
    fontSize: 12,
    fontWeight: "bold",
  },
});

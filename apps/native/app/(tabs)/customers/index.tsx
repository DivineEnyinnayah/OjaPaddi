import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useCustomers, type Customer } from "../../../hooks/useCustomers";
import { useProducts, type Product } from "../../../hooks/useProducts";
import { useAnalytics, type SupermarketAnalytics } from "../../../hooks/useAnalytics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";
import { Chip } from "@/components/ui/chip";
import { useToast } from "@/components/ui/toast";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Buildings,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Phone,
  Storefront,
  User,
  X,
  ChartLineUp,
} from "phosphor-react-native";
import { withUniwind } from "uniwind";
import { ILLUSTRATIONS } from "@/constants/illustrations";
import { TAB_BAR_OFFSET } from "@/lib/tab-bar";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledScrollView = withUniwind(ScrollView);

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, isLoading, error, fetchCustomers, createCustomer } = useCustomers();
  const { products, fetchProducts } = useProducts();
  const { fetchSupermarketAnalytics } = useAnalytics();
  const colors = useThemeColor();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"all" | "individual" | "supermarket">("all");
  const [search, setSearch] = useState("");

  // Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState<"individual" | "supermarket">("individual");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedPaymentDays, setExpectedPaymentDays] = useState("14");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supermarket Analytics Detail Modal
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Customer | null>(null);
  const [supermarketStats, setSupermarketStats] = useState<SupermarketAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (activeTab === "individual") {
      result = result.filter((c) => (c.customerType || "individual") === "individual");
    } else if (activeTab === "supermarket") {
      result = result.filter((c) => c.customerType === "supermarket");
    }

    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, search, activeTab]);

  const handleOpenSupermarketAnalytics = async (customer: Customer) => {
    setSelectedSupermarket(customer);
    setAnalyticsModalVisible(true);
    setLoadingAnalytics(true);
    try {
      const stats = await fetchSupermarketAnalytics(customer.id);
      setSupermarketStats(stats);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!name.trim()) {
      toast.error(createType === "supermarket" ? "Supermarket name is required" : "Customer name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        customerType: createType,
        expectedPaymentPeriodDays: createType === "supermarket" ? parseInt(expectedPaymentDays) || 14 : undefined,
        suppliedProductIds: createType === "supermarket" ? selectedProductIds : undefined,
      });

      toast.success(createType === "supermarket" ? "Supermarket added successfully!" : "Customer added successfully!");
      setModalVisible(false);
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
      setSelectedProductIds([]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const isSupermarket = item.customerType === "supermarket";

    return (
      <StyledTouchableOpacity
        onPress={() => {
          if (isSupermarket) {
            handleOpenSupermarketAnalytics(item);
          }
        }}
      >
        <Surface variant="primary" className="p-4 mb-3 rounded-card">
          <StyledView className="flex-row items-center">
            <StyledView
              className={cn(
                "w-12 h-12 rounded-full justify-center items-center mr-3",
                isSupermarket ? "bg-amber-500/20" : "bg-primary-container"
              )}
            >
              {isSupermarket ? (
                <Storefront size={24} color="#D97706" />
              ) : (
                <StyledText className="font-bold text-body-lg text-on-primary-container">
                  {getInitials(item.name)}
                </StyledText>
              )}
            </StyledView>

            <StyledView className="flex-1">
              <StyledView className="flex-row items-center gap-2">
                <StyledText className="text-base font-semibold text-on-surface" numberOfLines={1}>
                  {item.name}
                </StyledText>
                {isSupermarket && (
                  <StyledView className="bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <StyledText className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Supermarket
                    </StyledText>
                  </StyledView>
                )}
              </StyledView>

              {item.phone && (
                <StyledView className="flex-row items-center gap-1 mt-0.5">
                  <Phone size={12} color={colors.outline} />
                  <StyledText className="text-body-sm text-on-surface-variant">{item.phone}</StyledText>
                </StyledView>
              )}

              {item.address && (
                <StyledView className="flex-row items-center gap-1 mt-0.5">
                  <MapPin size={12} color={colors.outline} />
                  <StyledText className="text-xs text-on-surface-variant" numberOfLines={1}>
                    {item.address}
                  </StyledText>
                </StyledView>
              )}
            </StyledView>

            <StyledView className="items-end">
              {item.totalSpent && (
                <StyledText className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(item.totalSpent))}
                </StyledText>
              )}
              {isSupermarket ? (
                <StyledView className="flex-row items-center gap-1 mt-1 bg-primary/10 px-2 py-1 rounded-md">
                  <ChartLineUp size={13} color={colors.primary} />
                  <StyledText className="text-[11px] font-bold text-primary">Analytics</StyledText>
                </StyledView>
              ) : (
                <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
              )}
            </StyledView>
          </StyledView>

          {isSupermarket && item.expectedPaymentPeriodDays && (
            <StyledView className="mt-3 pt-2 border-t border-outline-variant/20 flex-row justify-between items-center">
              <StyledView className="flex-row items-center gap-1">
                <Clock size={13} color={colors.onSurfaceVariant} />
                <StyledText className="text-xs text-on-surface-variant">
                  Payment Period: <StyledText className="font-bold">{item.expectedPaymentPeriodDays} days</StyledText>
                </StyledText>
              </StyledView>
              {item.suppliedProductIds && item.suppliedProductIds.length > 0 && (
                <StyledText className="text-xs text-primary font-medium">
                  {item.suppliedProductIds.length} Products Supplied
                </StyledText>
              )}
            </StyledView>
          )}
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  return (
    <Container isScrollable={false} withTabBar className="bg-background">
      <StyledView className="px-6 py-4 mt-2">
        <StyledText className="text-h1 font-bold text-on-surface">Customers & Stores</StyledText>
      </StyledView>

      {/* Tabs: All / Customer / Supermarket */}
      <StyledView className="mx-6 mb-3 flex-row bg-surface-container rounded-xl p-1 border border-outline-variant/30">
        <StyledTouchableOpacity
          className={cn("flex-1 py-2 items-center rounded-lg", activeTab === "all" && "bg-primary")}
          onPress={() => setActiveTab("all")}
        >
          <StyledText
            className={cn("text-xs font-bold", activeTab === "all" ? "text-on-primary" : "text-on-surface-variant")}
          >
            All ({customers.length})
          </StyledText>
        </StyledTouchableOpacity>

        <StyledTouchableOpacity
          className={cn("flex-1 py-2 items-center rounded-lg", activeTab === "individual" && "bg-primary")}
          onPress={() => setActiveTab("individual")}
        >
          <StyledText
            className={cn(
              "text-xs font-bold",
              activeTab === "individual" ? "text-on-primary" : "text-on-surface-variant"
            )}
          >
            Customers
          </StyledText>
        </StyledTouchableOpacity>

        <StyledTouchableOpacity
          className={cn("flex-1 py-2 items-center rounded-lg", activeTab === "supermarket" && "bg-primary")}
          onPress={() => setActiveTab("supermarket")}
        >
          <StyledText
            className={cn(
              "text-xs font-bold",
              activeTab === "supermarket" ? "text-on-primary" : "text-on-surface-variant"
            )}
          >
            Supermarkets
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <StyledView className="mx-6 mb-4 flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-lg px-4 h-12">
        <MaterialIcons name="search" size={20} color={colors.outline} style={{ marginRight: 8 }} />
        <StyledTextInput
          className="flex-1 text-body-lg text-on-surface"
          placeholderTextColor={colors.outline}
          placeholder="Search by name, phone or address..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </StyledView>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchCustomers}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-20">
            <Image
              source={{ uri: ILLUSTRATIONS.emptyCustomers }}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center">
              {search.trim() ? "No results match your search." : "No entries found. Tap + to add!"}
            </StyledText>
            {!search.trim() && (
              <Button size="lg" className="mt-6" onPress={() => setModalVisible(true)}>
                Add Customer / Supermarket
              </Button>
            )}
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute right-4 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md shadow-black/30 elevation-5"
        style={{ bottom: TAB_BAR_OFFSET + 12 }}
        onPress={() => {
          setCreateType(activeTab === "supermarket" ? "supermarket" : "individual");
          setModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </StyledTouchableOpacity>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setModalVisible(false)}>
          <StyledView className="bg-background rounded-t-3xl max-h-[90%] w-full" onStartShouldSetResponder={() => true}>
            <StyledView className="items-center pt-3 pb-1">
              <StyledView className="w-12 h-1.5 rounded-full bg-outline/40" />
            </StyledView>

            <StyledScrollView className="px-6 pb-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <StyledView className="flex-row justify-between items-center my-3">
                <StyledText className="text-xl font-bold text-on-surface">Add Entry</StyledText>
                <StyledTouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={22} color={colors.onSurfaceVariant} />
                </StyledTouchableOpacity>
              </StyledView>

              {/* Toggle Customer vs Supermarket */}
              <StyledView className="flex-row bg-surface-container rounded-xl p-1 mb-4 border border-outline-variant/30">
                <StyledTouchableOpacity
                  className={cn(
                    "flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-2",
                    createType === "individual" ? "bg-primary" : "bg-transparent"
                  )}
                  onPress={() => setCreateType("individual")}
                >
                  <User size={18} color={createType === "individual" ? "#FFFFFF" : colors.onSurfaceVariant} />
                  <StyledText
                    className={cn(
                      "text-xs font-bold",
                      createType === "individual" ? "text-on-primary" : "text-on-surface-variant"
                    )}
                  >
                    Customer
                  </StyledText>
                </StyledTouchableOpacity>

                <StyledTouchableOpacity
                  className={cn(
                    "flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-2",
                    createType === "supermarket" ? "bg-primary" : "bg-transparent"
                  )}
                  onPress={() => setCreateType("supermarket")}
                >
                  <Storefront size={18} color={createType === "supermarket" ? "#FFFFFF" : colors.onSurfaceVariant} />
                  <StyledText
                    className={cn(
                      "text-xs font-bold",
                      createType === "supermarket" ? "text-on-primary" : "text-on-surface-variant"
                    )}
                  >
                    Supermarket
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>

              <StyledView className="gap-3">
                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                    {createType === "supermarket" ? "Supermarket / Store Name *" : "Customer Name *"}
                  </StyledText>
                  <StyledTextInput
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12 text-base text-on-surface"
                    placeholder={createType === "supermarket" ? "e.g. Prince Ebeano Supermarket" : "e.g. Mama Titi"}
                    placeholderTextColor={colors.outline}
                    value={name}
                    onChangeText={setName}
                  />
                </StyledView>

                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                    Phone Number for Reachout
                  </StyledText>
                  <StyledTextInput
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12 text-base text-on-surface"
                    placeholder="080..."
                    placeholderTextColor={colors.outline}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </StyledView>

                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                    {createType === "supermarket" ? "Supermarket Address *" : "Delivery Address"}
                  </StyledText>
                  <StyledTextInput
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12 text-base text-on-surface"
                    placeholder="e.g. Admiralty Way, Lekki Phase 1"
                    placeholderTextColor={colors.outline}
                    value={address}
                    onChangeText={setAddress}
                  />
                </StyledView>

                {createType === "supermarket" && (
                  <>
                    <StyledView>
                      <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                        Time Period for Expected Payment (Days)
                      </StyledText>
                      <StyledTextInput
                        className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12 text-base text-on-surface"
                        placeholder="e.g. 14"
                        placeholderTextColor={colors.outline}
                        keyboardType="numeric"
                        value={expectedPaymentDays}
                        onChangeText={setExpectedPaymentDays}
                      />
                    </StyledView>

                    <StyledView>
                      <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                        Products Supplied to This Supermarket
                      </StyledText>
                      <StyledView className="flex-row flex-wrap gap-2 pt-1">
                        {products.map((p) => {
                          const isSelected = selectedProductIds.includes(p.id);
                          return (
                            <StyledTouchableOpacity
                              key={p.id}
                              onPress={() => toggleProductSelection(p.id)}
                              className={cn(
                                "flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border",
                                isSelected ? "bg-primary border-primary" : "bg-surface-container border-outline-variant"
                              )}
                            >
                              <StyledText
                                className={cn(
                                  "text-xs font-semibold",
                                  isSelected ? "text-on-primary" : "text-on-surface"
                                )}
                              >
                                {p.name}
                              </StyledText>
                            </StyledTouchableOpacity>
                          );
                        })}
                      </StyledView>
                    </StyledView>
                  </>
                )}

                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                    Additional Notes
                  </StyledText>
                  <StyledTextInput
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface min-h-[70px]"
                    placeholder="Payment preferences, contact person..."
                    placeholderTextColor={colors.outline}
                    multiline
                    numberOfLines={2}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </StyledView>

                <Button
                  size="lg"
                  isDisabled={isSubmitting || !name.trim()}
                  onPress={handleSaveCustomer}
                  className="mt-4 mb-8"
                >
                  {isSubmitting ? "Saving..." : createType === "supermarket" ? "Save Supermarket" : "Save Customer"}
                </Button>
              </StyledView>
            </StyledScrollView>
          </StyledView>
        </Pressable>
      </Modal>

      {/* SUPERMARKET ANALYTICS MODAL */}
      <Modal
        visible={analyticsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAnalyticsModalVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setAnalyticsModalVisible(false)}>
          <StyledView className="bg-background rounded-t-3xl max-h-[90%] w-full" onStartShouldSetResponder={() => true}>
            <StyledView className="items-center pt-3 pb-1">
              <StyledView className="w-12 h-1.5 rounded-full bg-outline/40" />
            </StyledView>

            <StyledScrollView className="px-6 pb-8" showsVerticalScrollIndicator={false}>
              <StyledView className="flex-row justify-between items-center my-3">
                <StyledView className="flex-row items-center gap-2">
                  <Storefront size={22} color={colors.primary} />
                  <StyledText className="text-lg font-bold text-on-surface" numberOfLines={1}>
                    {selectedSupermarket?.name}
                  </StyledText>
                </StyledView>
                <StyledTouchableOpacity onPress={() => setAnalyticsModalVisible(false)}>
                  <X size={22} color={colors.onSurfaceVariant} />
                </StyledTouchableOpacity>
              </StyledView>

              {loadingAnalytics ? (
                <StyledView className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <StyledText className="text-sm text-on-surface-variant mt-3">Loading analytics...</StyledText>
                </StyledView>
              ) : supermarketStats ? (
                <StyledView className="gap-4">
                  {/* Summary Metric Cards */}
                  <StyledView className="flex-row gap-2">
                    <Surface variant="primary" className="flex-1 p-3 rounded-xl border border-outline-variant/30">
                      <StyledText className="text-[11px] text-on-surface-variant uppercase font-bold">
                        Total Billed
                      </StyledText>
                      <StyledText className="text-base font-black text-on-surface mt-1">
                        {formatCurrency(supermarketStats.totalBilled)}
                      </StyledText>
                    </Surface>
                    <Surface variant="primary" className="flex-1 p-3 rounded-xl border border-outline-variant/30">
                      <StyledText className="text-[11px] text-on-surface-variant uppercase font-bold">
                        Total Paid
                      </StyledText>
                      <StyledText className="text-base font-black text-success mt-1">
                        {formatCurrency(supermarketStats.totalPaid)}
                      </StyledText>
                    </Surface>
                  </StyledView>

                  <StyledView className="flex-row gap-2">
                    <Surface variant="primary" className="flex-1 p-3 rounded-xl border border-outline-variant/30">
                      <StyledText className="text-[11px] text-on-surface-variant uppercase font-bold">
                        Total Returns
                      </StyledText>
                      <StyledText className="text-base font-black text-error mt-1">
                        {formatCurrency(supermarketStats.totalReturnsAmount)}
                      </StyledText>
                    </Surface>
                    <Surface variant="primary" className="flex-1 p-3 rounded-xl border border-outline-variant/30">
                      <StyledText className="text-[11px] text-on-surface-variant uppercase font-bold">
                        Net Receivable
                      </StyledText>
                      <StyledText className="text-base font-black text-primary mt-1">
                        {formatCurrency(supermarketStats.netReceivable)}
                      </StyledText>
                    </Surface>
                  </StyledView>

                  {/* Supply terms info */}
                  <Surface variant="outline" className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
                    <StyledText className="text-sm font-bold text-on-surface mb-2">Store Profile</StyledText>
                    <StyledText className="text-xs text-on-surface-variant mb-1">
                      Phone: <StyledText className="text-on-surface font-semibold">{supermarketStats.supermarket.phone || "None"}</StyledText>
                    </StyledText>
                    <StyledText className="text-xs text-on-surface-variant mb-1">
                      Address: <StyledText className="text-on-surface font-semibold">{supermarketStats.supermarket.address || "None"}</StyledText>
                    </StyledText>
                    <StyledText className="text-xs text-on-surface-variant">
                      Payment Interval: <StyledText className="text-on-surface font-semibold">{supermarketStats.supermarket.expectedPaymentPeriodDays || 14} days</StyledText>
                    </StyledText>
                  </Surface>

                  {/* Products Supplied Table */}
                  <Surface variant="primary" className="p-4 rounded-xl border border-outline-variant/30">
                    <StyledText className="text-sm font-bold text-on-surface mb-3">
                      Products Supplied & Return History
                    </StyledText>
                    {supermarketStats.productsSupplied.length === 0 ? (
                      <StyledText className="text-xs text-on-surface-variant italic py-2">
                        No supply orders recorded yet.
                      </StyledText>
                    ) : (
                      supermarketStats.productsSupplied.map((prod) => (
                        <StyledView key={prod.productId} className="py-2.5 border-b border-outline-variant/20">
                          <StyledView className="flex-row justify-between items-center mb-1">
                            <StyledText className="text-sm font-semibold text-on-surface flex-1 mr-2">
                              {prod.productName}
                            </StyledText>
                            <StyledText className="text-sm font-bold text-primary">
                              {formatCurrency(prod.totalValue)}
                            </StyledText>
                          </StyledView>
                          <StyledView className="flex-row justify-between text-xs text-on-surface-variant">
                            <StyledText className="text-[11px] text-on-surface-variant">
                              Supplied: <StyledText className="font-bold">{prod.quantitySupplied}</StyledText>
                            </StyledText>
                            <StyledText className="text-[11px] text-error font-medium">
                              Returned: {prod.quantityReturned}
                            </StyledText>
                            <StyledText className="text-[11px] text-success font-medium">
                              Net Kept: {prod.netDelivered}
                            </StyledText>
                          </StyledView>
                        </StyledView>
                      ))
                    )}
                  </Surface>
                </StyledView>
              ) : null}
            </StyledScrollView>
          </StyledView>
        </Pressable>
      </Modal>
    </Container>
  );
}
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { withUniwind } from "uniwind";
import { MagnifyingGlass, Package, SortAscending, Plus } from "phosphor-react-native";
import { useProducts, type Product } from "../../../hooks/useProducts";
import { useThemeColor } from "@/hooks/useThemeColor";
import { imageUri } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { StyledView, StyledText, StyledTouchableOpacity } from "@/components/ui/styled";
import { TAB_BAR_OFFSET } from "@/lib/tab-bar";
import { radius, spacing } from "@/constants/tokens";
import { formatCurrency } from "@/lib/currency";

const StyledTextInput = withUniwind(TextInput);
const StyledImage = withUniwind(Image);

type StockFilter = "all" | "low" | "out" | "hidden";

const FILTERS: { key: StockFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "low", label: "Low" },
  { key: "out", label: "Out" },
  { key: "hidden", label: "Hidden" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function relativeUpdated(products: Product[]): string {
  const latest = products.reduce<string | null>((acc, p) => {
    if (!acc) return p.updatedAt;
    return new Date(p.updatedAt) > new Date(acc) ? p.updatedAt : acc;
  }, null);
  if (!latest) return "no updates yet";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(latest).getTime()) / 60000));
  if (minutes < 1) return "updated just now";
  if (minutes < 60) return `updated ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `updated ${hours}h ago`;
  return `updated ${Math.round(hours / 24)}d ago`;
}

/**
 * FigCraft `03.2 — Products` (frame 625), 390×844.
 *
 * Presentation is now a single-column stock list with status filters. Data
 * flow (`useProducts`) and search are unchanged. DEVIATION: the frame's
 * All / Low / Out / Hidden chips replace the previous category chips — the
 * frame specifies stock-status filtering, not category filtering.
 */
export default function ProductsScreen() {
  const router = useRouter();
  const { products, isLoading, error, fetchProducts } = useProducts();
  const colors = useThemeColor();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const counts = useMemo(() => {
    const low = products.filter(
      (p) => p.quantity > 0 && p.quantity <= (p.lowStockThreshold ?? 5),
    ).length;
    const out = products.filter((p) => p.quantity <= 0).length;
    const hidden = products.filter((p) => !p.isActive).length;
    return { all: products.length, low, out, hidden } as Record<StockFilter, number>;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      const threshold = product.lowStockThreshold ?? 5;
      switch (filter) {
        case "low":
          return product.quantity > 0 && product.quantity <= threshold;
        case "out":
          return product.quantity <= 0;
        case "hidden":
          return !product.isActive;
        default:
          return true;
      }
    });
  }, [products, searchQuery, filter]);

  const totals = useMemo(() => {
    let stockValue = 0;
    let margin = 0;
    products.forEach((product) => {
      const price = parseFloat(product.price);
      stockValue += price * product.quantity;
      const cost = parseFloat(product.costPrice ?? "0");
      if (!isNaN(cost) && cost > 0 && !isNaN(price)) margin += (price - cost) * product.quantity;
    });
    return { stockValue, margin };
  }, [products]);

  const renderRow = useCallback(
    ({ item }: { item: Product }) => {
      const price = parseFloat(item.price);
      const threshold = item.lowStockThreshold ?? 5;
      const isOut = item.quantity <= 0;
      const isLow = !isOut && item.quantity <= threshold;

      const noteColor = isOut ? "text-danger" : isLow ? "text-accent" : "text-brand";
      const note = isOut
        ? `OUT · reorder ${threshold}`
        : isLow
          ? `${item.quantity} left · reorder ${threshold}`
          : `${item.quantity} left`;

      const cost = parseFloat(item.costPrice ?? "0");
      const hasCost = !isNaN(cost) && cost > 0;
      const marginValue = hasCost ? price - cost : 0;

      return (
        <StyledTouchableOpacity
          className="mb-3 flex-row items-center rounded-button border border-border bg-card p-4"
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/products/[id]",
              params: { id: item.id },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${formatCurrency(price)}, ${item.quantity} in stock`}
        >
          <StyledView
            className="items-center justify-center rounded-input bg-brand-soft"
            style={{ height: 52, width: 52 }}
          >
            {item.imageUrl ? (
              <StyledImage
                source={{ uri: imageUri(item.imageUrl) }}
                className="h-full w-full rounded-input"
                resizeMode="cover"
                accessible
                accessibilityLabel={item.name}
              />
            ) : (
              <StyledText className="font-title text-brand">{getInitials(item.name)}</StyledText>
            )}
          </StyledView>

          <StyledView className="ml-3 flex-1">
            <StyledText
              className="font-title text-ink"
              style={{ fontSize: 14, lineHeight: 18 }}
              numberOfLines={1}
            >
              {item.name}
            </StyledText>
            <StyledText
              className={`mt-1 font-label ${noteColor}`}
              style={{ fontSize: 11, lineHeight: 14 }}
            >
              {note}
            </StyledText>
          </StyledView>

          <StyledView className="items-end">
            <StyledText
              className="font-extrabold text-ink"
              style={{ fontSize: 14, lineHeight: 18 }}
            >
              {formatCurrency(price)}
            </StyledText>
            {hasCost ? (
              <StyledText
                className="mt-1 font-body text-brand"
                style={{ fontSize: 10, lineHeight: 13 }}
              >
                make {formatCurrency(marginValue)}
              </StyledText>
            ) : null}
          </StyledView>
        </StyledTouchableOpacity>
      );
    },
    [router],
  );

  if (isLoading && products.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background px-gutter">
        <StyledView className="mb-3 mt-6">
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </StyledView>
        <Skeleton className="mb-4 h-12 rounded-input" />
        <StyledView className="mb-4 flex-row gap-2">
          <Skeleton className="h-8 w-16 rounded-pill" />
          <Skeleton className="h-8 w-16 rounded-pill" />
          <Skeleton className="h-8 w-16 rounded-pill" />
        </StyledView>
        <Skeleton className="mb-4 h-[74px] rounded-card" />
        <Skeleton className="mb-3 h-20 rounded-button" />
        <Skeleton className="mb-3 h-20 rounded-button" />
      </Container>
    );
  }

  if (error && products.length === 0) {
    return (
      <Container
        isScrollable={false}
        withTabBar
        className="items-center justify-center bg-background p-6"
      >
        <StyledText className="mb-4 text-center font-body text-bodySm text-danger">
          {error}
        </StyledText>
        <Button onPress={() => fetchProducts()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} withTabBar className="bg-background">
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={{
          paddingHorizontal: spacing.gutter,
          paddingTop: 24,
          paddingBottom: TAB_BAR_OFFSET + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchProducts}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
        ListHeaderComponent={
          <StyledView>
            {/* Title + meta + sort — frame y28 */}
            <StyledView className="flex-row items-start justify-between">
              <StyledView className="flex-1">
                <StyledText
                  className="font-display text-ink"
                  style={{ fontSize: 28, lineHeight: 29, letterSpacing: -0.28 }}
                >
                  Stock
                </StyledText>
                <StyledText
                  className="mt-1 font-body text-muted"
                  style={{ fontSize: 10, lineHeight: 13 }}
                >
                  {products.length} {products.length === 1 ? "item" : "items"} ·{" "}
                  {relativeUpdated(products)}
                </StyledText>
              </StyledView>

              <StyledTouchableOpacity
                className="h-10 w-12 items-center justify-center rounded-input border border-border bg-card"
                onPress={() => setFilter("all")}
                accessibilityRole="button"
                accessibilityLabel="Sort stock"
              >
                <SortAscending size={20} color={colors.ink} />
              </StyledTouchableOpacity>
            </StyledView>

            {/* Search — frame y84 */}
            <StyledView className="mt-4 h-12 flex-row items-center rounded-input border border-border bg-card px-4">
              <MagnifyingGlass size={16} color={colors.muted} />
              <StyledTextInput
                className="ml-2 flex-1 font-body text-bodySm text-ink"
                placeholder="Search rice, beans, Peak…"
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search stock"
              />
            </StyledView>

            {/* Filter chips — frame y148 */}
            <StyledView className="mt-4 flex-row gap-2">
              {FILTERS.map(({ key, label }) => {
                const isActive = filter === key;
                const count = counts[key];
                const isLow = key === "low";
                const isOut = key === "out";
                return (
                  <StyledTouchableOpacity
                    key={key}
                    onPress={() => setFilter(key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Filter: ${label}`}
                    className={`min-h-12 items-center justify-center rounded-pill border px-4 ${
                      isActive
                        ? "border-brand bg-brand"
                        : isLow
                          ? "border-accent bg-accent-soft"
                          : isOut
                            ? "border-danger bg-danger-soft"
                            : "border-border bg-card"
                    }`}
                  >
                    <StyledText
                      className={`font-label ${
                        isActive
                          ? "text-card"
                          : isLow
                            ? "text-ink"
                            : isOut
                              ? "text-danger"
                              : "text-muted"
                      }`}
                      style={{ fontSize: 11, lineHeight: 14 }}
                    >
                      {label}
                      {key !== "hidden" ? ` · ${count}` : ""}
                    </StyledText>
                  </StyledTouchableOpacity>
                );
              })}
            </StyledView>

            {/* KPI strip — frame y200 */}
            <StyledView className="mt-4 flex-row items-center rounded-card border border-border bg-card p-4">
              <StyledView className="flex-1">
                <StyledText
                  className="font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 8, lineHeight: 11 }}
                >
                  ITEMS
                </StyledText>
                <StyledText
                  className="mt-1 font-display text-ink"
                  style={{ fontSize: 18, lineHeight: 23 }}
                >
                  {products.length}
                </StyledText>
              </StyledView>

              <StyledView className="h-11 w-px bg-border" />

              <StyledView className="flex-1 pl-4">
                <StyledText
                  className="font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 8, lineHeight: 11 }}
                >
                  STOCK VALUE
                </StyledText>
                <StyledText
                  className="mt-1 font-display text-ink"
                  style={{ fontSize: 18, lineHeight: 23 }}
                >
                  {formatCurrency(totals.stockValue)}
                </StyledText>
              </StyledView>

              <StyledView className="h-11 w-px bg-border" />

              <StyledView className="flex-1 pl-4">
                <StyledText
                  className="font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 8, lineHeight: 11 }}
                >
                  MARGIN
                </StyledText>
                <StyledText
                  className="mt-1 font-extrabold text-brand"
                  style={{ fontSize: 17, lineHeight: 22 }}
                >
                  +{formatCurrency(totals.margin)}
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledView className="h-4" />
          </StyledView>
        }
        ListEmptyComponent={
          <StyledView className="mt-12 items-center px-6">
            <StyledView className="h-20 w-20 items-center justify-center rounded-input border border-border bg-card">
              <Package size={40} color={colors.muted} weight="duotone" />
            </StyledView>
            <StyledText className="mt-4 text-center font-body text-bodySm text-muted">
              {products.length === 0 ? "No stock yet" : "Nothing matches this filter"}
            </StyledText>
            {products.length === 0 ? (
              <Button size="lg" className="mt-6" onPress={() => router.push("/products/add")}>
                Add your first product
              </Button>
            ) : null}
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute right-4 h-14 w-14 items-center justify-center rounded-pill bg-brand"
        style={{ bottom: TAB_BAR_OFFSET + 12, borderRadius: radius.pill }}
        onPress={() => router.push("/products/add")}
        accessibilityRole="button"
        accessibilityLabel="Add new product"
      >
        <Plus size={28} color={colors.card} />
      </StyledTouchableOpacity>
    </Container>
  );
}

import React, { useEffect, useCallback, useMemo } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { withUniwind } from "uniwind";
import {
  Bell,
  Warning,
  Package,
  CreditCard,
  Receipt,
} from "phosphor-react-native";
import { useAuthStore } from "../../stores/authStore";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useSales, type Sale } from "../../hooks/useSales";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StyledView, StyledText, StyledTouchableOpacity } from "@/components/ui/styled";
import { TAB_BAR_OFFSET } from "@/lib/tab-bar";
import { radius, spacing } from "@/constants/tokens";
import { formatCurrency } from "@/lib/currency";

const StyledScrollView = withUniwind(ScrollView);

const PROFIT_BARS = [
  { id: "bar-1", height: 38, color: "mint" as const },
  { id: "bar-2", height: 61, color: "accent" as const },
  { id: "bar-3", height: 25, color: "mint" as const },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function initials(name?: string): string {
  if (!name) return "OP";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function saleTime(sale: Sale): string {
  return new Date(sale.soldAt).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function saleLabel(sale: Sale): string {
  const customer = sale.customer?.name ?? "Walk-in";
  const units = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${customer} — ${units} ${units === 1 ? "item" : "items"}`;
}

function saleStatus(sale: Sale): "CASH" | "CREDIT" {
  return sale.paymentStatus === "paid" ? "CASH" : "CREDIT";
}

/**
 * FigCraft `03.1 — Home` (frame 563), 390×844.
 *
 * Presentation rebuilt to the frame; the analytics/sales data flow is
 * unchanged (`useAnalytics` for the day's numbers, `useSales` for the row
 * list, both already used elsewhere in the app).
 */
export default function HomeScreen() {
  const { user } = useAuthStore();
  const { summary, isLoading, fetchSummary, error } = useAnalytics();
  const { sales, fetchSales } = useSales();
  const router = useRouter();
  const colors = useThemeColor();

  const loadData = useCallback(() => {
    fetchSummary();
    fetchSales({ limit: "5" });
  }, [fetchSummary, fetchSales]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const recentSales = useMemo(() => sales.slice(0, 2), [sales]);

  const firstName = user?.fullName?.split(" ")[0] || "Seller";

  return (
    <Container isScrollable={false} withTabBar className="flex-1 bg-background">
      <StyledScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.gutter,
          paddingTop: 24,
          paddingBottom: TAB_BAR_OFFSET + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!summary}
            onRefresh={loadData}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        }
      >
        {/* Greeting header — frame y24 */}
        <StyledView className="flex-row items-center">
          <StyledTouchableOpacity
            onPress={() => router.push("/more")}
            className="h-11 w-11 items-center justify-center rounded-pill bg-brand"
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={8}
          >
            <StyledText className="font-display text-body text-card">
              {initials(user?.fullName)}
            </StyledText>
          </StyledTouchableOpacity>

          <StyledView className="ml-3 flex-1">
            <StyledText
              className="font-label uppercase tracking-[1.5px] text-muted"
              style={{ fontSize: 9, lineHeight: 12 }}
            >
              {greeting()}
            </StyledText>
            <StyledText
              className="font-title text-ink"
              style={{ fontSize: 17, lineHeight: 22 }}
              numberOfLines={1}
            >
              {user?.fullName || firstName}
            </StyledText>
          </StyledView>

          <StyledTouchableOpacity
            onPress={() => router.push("/more")}
            className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-card"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
          >
            <Bell size={16} color={colors.ink} />
            <StyledView
              className="absolute h-2 w-2 rounded-pill bg-accent"
              style={{ top: 5, right: 5 }}
            />
          </StyledTouchableOpacity>
        </StyledView>

        {isLoading && !summary ? (
          <StyledView className="mt-6 gap-4">
            <Skeleton className="h-[108px] rounded-card" />
            <StyledView className="flex-row gap-3">
              <Skeleton className="h-20 flex-1 rounded-card" />
              <Skeleton className="h-20 flex-1 rounded-card" />
            </StyledView>
            <Skeleton className="h-[68px] rounded-card" />
            <Skeleton className="h-14 rounded-button" />
          </StyledView>
        ) : error ? (
          <StyledView
            className="mt-8 items-center rounded-card border border-border bg-card p-6"
            accessibilityRole="alert"
          >
            <StyledText className="mb-4 text-center font-label text-bodySm text-danger">
              {error}
            </StyledText>
            <Button size="sm" variant="secondary" onPress={loadData}>
              Retry
            </Button>
          </StyledView>
        ) : summary ? (
          <StyledView className="mt-6">
            {/* Profit hero — frame x24 y84, 342×108 */}
            <StyledView
              className="bg-brand-strong"
              style={{ borderRadius: 22, padding: spacing.gutter }}
            >
              <StyledView className="flex-row items-start justify-between">
                <StyledView className="flex-1">
                  <StyledText
                    className="font-label uppercase tracking-[1.5px]"
                    style={{ fontSize: 9, lineHeight: 12, color: colors.mint }}
                  >
                    PROFIT TODAY
                  </StyledText>
                  <StyledText
                    className="mt-2 font-display text-card"
                    style={{ fontSize: 39, lineHeight: 40 }}
                  >
                    {formatCurrency(summary.netProfit)}
                  </StyledText>
                </StyledView>

                {/* Three mini chart bars — frame x282 */}
                <StyledView className="flex-row items-end gap-2 self-center">
                  {PROFIT_BARS.map((bar) => (
                    <StyledView
                      key={bar.id}
                      style={{
                        width: 10,
                        height: bar.height,
                        borderRadius: radius.pill,
                        backgroundColor:
                          bar.color === "accent" ? colors.accent : colors.mint,
                      }}
                    />
                  ))}
                </StyledView>
              </StyledView>

              <StyledText
                className="mt-3 font-label"
                style={{ fontSize: 11, lineHeight: 14, color: colors.mint }}
              >
                ▲ {formatCurrency(summary.totalExpenses)} expenses today
              </StyledText>
            </StyledView>

            {/* Revenue + Sales mini cards — frame y208 */}
            <StyledView className="mt-4 flex-row gap-3">
              <StyledView className="flex-1 justify-center rounded-card border border-border bg-card p-4">
                <StyledText
                  className="font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 8, lineHeight: 11 }}
                >
                  REVENUE
                </StyledText>
                <StyledText
                  className="mt-1 font-display text-ink"
                  style={{ fontSize: 21, lineHeight: 27 }}
                >
                  {formatCurrency(summary.totalRevenue)}
                </StyledText>
                <StyledText
                  className="mt-1 font-body text-muted"
                  style={{ fontSize: 10, lineHeight: 13 }}
                  numberOfLines={1}
                >
                  Sales recorded today
                </StyledText>
              </StyledView>

              <StyledView className="flex-1 justify-center rounded-card border border-border bg-card p-4">
                <StyledText
                  className="font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 8, lineHeight: 11 }}
                >
                  SALES
                </StyledText>
                <StyledText
                  className="mt-1 font-display text-ink"
                  style={{ fontSize: 21, lineHeight: 27 }}
                >
                  {summary.totalSalesCount}
                </StyledText>
                <StyledText
                  className="mt-1 font-body text-muted"
                  style={{ fontSize: 10, lineHeight: 13 }}
                  numberOfLines={1}
                >
                  {summary.totalProducts} products in stock
                </StyledText>
              </StyledView>
            </StyledView>

            {/* Restock alert — frame y304 */}
            {summary.lowStockCount > 0 ? (
              <StyledTouchableOpacity
                onPress={() => router.push("/products")}
                className="mt-4 flex-row items-center rounded-card bg-accent-soft p-4"
                accessibilityRole="button"
                accessibilityLabel="View low stock products"
              >
                <Warning size={22} color={colors.accent} weight="bold" />
                <StyledView className="ml-3 flex-1">
                  <StyledText
                    className="font-extrabold text-ink"
                    style={{ fontSize: 13, lineHeight: 17 }}
                  >
                    {summary.lowStockCount}{" "}
                    {summary.lowStockCount === 1 ? "product is" : "products are"} running low
                  </StyledText>
                  <StyledText
                    className="mt-0.5 font-body text-ink"
                    style={{ fontSize: 11, lineHeight: 14 }}
                  >
                    Restock before you run out
                  </StyledText>
                </StyledView>
                <StyledText
                  className="font-label text-brand"
                  style={{ fontSize: 12, lineHeight: 16 }}
                >
                  Restock ›
                </StyledText>
              </StyledTouchableOpacity>
            ) : null}

            {/* Record sale CTA — frame y388 */}
            <StyledTouchableOpacity
              onPress={() => router.push("/sales/record")}
              className="mt-4 flex-row items-center rounded-button bg-accent px-4"
              style={{ minHeight: 54 }}
              accessibilityRole="button"
              accessibilityLabel="Record a sale"
            >
              <StyledText
                className="font-extrabold text-ink"
                style={{ fontSize: 17, lineHeight: 22 }}
              >
                Record sale
              </StyledText>
              <StyledView className="flex-1" />
              <StyledText
                className="font-label text-ink"
                style={{ fontSize: 11, lineHeight: 14 }}
              >
                {formatCurrency(summary.totalRevenue)} recorded today
              </StyledText>
            </StyledTouchableOpacity>

            {/* Add product / Add expense — frame y456 */}
            <StyledView className="mt-4 flex-row gap-3">
              <StyledTouchableOpacity
                onPress={() => router.push("/products/add")}
                className="min-h-12 flex-1 flex-row items-center justify-center rounded-button border border-border bg-card"
                accessibilityRole="button"
                accessibilityLabel="Add product"
              >
                <Package size={18} color={colors.brand} />
                <StyledText
                  className="ml-2 font-label text-brand"
                  style={{ fontSize: 13, lineHeight: 16 }}
                >
                  Add product
                </StyledText>
              </StyledTouchableOpacity>

              <StyledTouchableOpacity
                onPress={() => router.push("/expenses")}
                className="min-h-12 flex-1 flex-row items-center justify-center rounded-button border border-border bg-card"
                accessibilityRole="button"
                accessibilityLabel="Add expense"
              >
                <CreditCard size={18} color={colors.brand} />
                <StyledText
                  className="ml-2 font-label text-brand"
                  style={{ fontSize: 13, lineHeight: 16 }}
                >
                  Add expense
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            {/* TODAY header — frame y538 */}
            <StyledView className="mt-8 flex-row items-center justify-between">
              <StyledText
                className="font-label uppercase tracking-[1.5px] text-muted"
                style={{ fontSize: 9, lineHeight: 12 }}
              >
                TODAY
              </StyledText>
              <StyledText
                className="font-title text-ink"
                style={{ fontSize: 17, lineHeight: 22 }}
              >
                {summary.totalSalesCount} sales
              </StyledText>
            </StyledView>

            <StyledTouchableOpacity
              onPress={() => router.push("/sales")}
              className="mt-2 items-end"
              accessibilityRole="button"
              accessibilityLabel="See all sales"
            >
              <StyledText
                className="font-label text-brand"
                style={{ fontSize: 12, lineHeight: 16 }}
              >
                See all sales →
              </StyledText>
            </StyledTouchableOpacity>

            {/* Recent sale rows — frame y586 */}
            {recentSales.length === 0 ? (
              <StyledView className="mt-3 items-center rounded-button border border-border bg-card p-6">
                <Receipt size={26} color={colors.brand} weight="duotone" />
                <StyledText
                  className="mt-2 font-body text-muted"
                  style={{ fontSize: 12, lineHeight: 16 }}
                >
                  No sales recorded yet.
                </StyledText>
              </StyledView>
            ) : (
              <StyledView className="mt-3 gap-3">
                {recentSales.map((sale) => {
                  const status = saleStatus(sale);
                  const isCredit = status === "CREDIT";
                  return (
                    <StyledView
                      key={sale.id}
                      className="flex-row items-center rounded-button border border-border bg-card p-4"
                    >
                      <StyledView className="flex-1">
                        <StyledText
                          className="font-title text-ink"
                          style={{ fontSize: 12, lineHeight: 16 }}
                        >
                          {saleTime(sale)}
                        </StyledText>
                        <StyledText
                          className="mt-1 font-body text-ink"
                          style={{ fontSize: 12, lineHeight: 16 }}
                          numberOfLines={1}
                        >
                          {saleLabel(sale)}
                        </StyledText>
                      </StyledView>
                      <StyledView className="items-end">
                        <StyledText
                          className="font-extrabold text-ink"
                          style={{ fontSize: 13, lineHeight: 17 }}
                        >
                          {formatCurrency(sale.total)}
                        </StyledText>
                        <StyledText
                          className="mt-1 font-label uppercase"
                          style={{
                            fontSize: 9,
                            lineHeight: 12,
                            letterSpacing: 1,
                            color: isCredit ? colors.danger : colors.brand,
                          }}
                        >
                          {status}
                        </StyledText>
                      </StyledView>
                    </StyledView>
                  );
                })}
              </StyledView>
            )}

            {/* Empty-store nudge — kept from the previous screen */}
            {summary.totalProducts === 0 ? (
              <StyledView
                className="mt-4 items-center rounded-card border border-dashed border-brand bg-brand-soft p-6"
                style={{ borderWidth: 2 }}
              >
                <StyledView className="h-14 w-14 items-center justify-center rounded-pill bg-card">
                  <Package size={28} color={colors.brand} weight="duotone" />
                </StyledView>
                <StyledText
                  className="mt-3 text-center font-title text-ink"
                  style={{ fontSize: 20, lineHeight: 26 }}
                >
                  Welcome to OjaPaddi
                </StyledText>
                <StyledText
                  className="mt-2 text-center font-body text-muted"
                  style={{ fontSize: 13, lineHeight: 19 }}
                >
                  Add your first product and start selling.
                </StyledText>
                <Button
                  size="lg"
                  variant="primary"
                  className="mt-5 w-full"
                  onPress={() => router.push("/products/add")}
                >
                  Add your first product
                </Button>
              </StyledView>
            ) : null}
          </StyledView>
        ) : null}
      </StyledScrollView>
    </Container>
  );
}

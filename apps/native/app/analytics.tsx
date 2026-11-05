import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated, Share } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CurrencyDollar,
  Package,
  Receipt,
  Share as ShareIcon,
  ShoppingCart,
  Sparkle,
  TrendUp,
  Warning,
  Storefront,
} from "phosphor-react-native";
import { useCustomers } from "@/hooks/useCustomers";
import { type ProductAnalytics, type SupermarketAnalytics , useAnalytics, type RevenueChartPoint } from "@/hooks/useAnalytics";
import Svg, {
  Rect,
  LinearGradient,
  Defs,
  Stop,
  Polyline,
  Circle,
  G,
  Text as SvgText,
} from "react-native-svg";
import { withUniwind } from "uniwind";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useToast } from "@/components/ui/toast";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { useResponsive } from "@/lib/responsive";
import { typeScale } from "@/constants/tokens";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledScrollView = withUniwind(ScrollView);

type Period = "today" | "week" | "month";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

type ChartDay = { date: string; amount: number; transactions: number };

function getPeriodRange(period: Period): { from: Date; to: Date; days: number } {
  const to = new Date();
  const from = new Date(to);
  from.setHours(0, 0, 0, 0);
  if (period === "today") {
    return { from, to, days: 1 };
  }
  const days = period === "month" ? 30 : 7;
  from.setDate(to.getDate() - (days - 1));
  return { from, to, days };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelForDay(d: Date, period: Period): string {
  if (period === "today") return "Today";
  if (period === "month") return String(d.getDate());
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function buildChartSeries(points: RevenueChartPoint[], period: Period): ChartDay[] {
  const { from, to, days } = getPeriodRange(period);
  const byDate = new Map(points.map((p) => [p.date, p]));
  const series: ChartDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(to);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const point = byDate.get(toDateKey(d));
    series.push({
      date: labelForDay(d, period),
      amount: point?.revenue ?? 0,
      transactions: point?.count ?? 0,
    });
  }
  return series;
}

const CHART_HEIGHT = 180;

/**
 * FigCraft `06.1 — Insights` (frame 1691), 390×844.
 *
 * Layout from the frame: hairline header, hero net-profit panel, sales chart,
 * "what moves the money" driver rows and a margin warning. All analytics
 * fetching, period switching, drilldown sheets and CSV export are untouched.
 */
export default function AnalyticsScreen() {
  const {
    summary,
    isLoading,
    error,
    fetchSummary,
    fetchRevenueChart,
    fetchProductAnalytics,
    fetchSupermarketAnalytics,
  } = useAnalytics();
  const { customers, fetchCustomers } = useCustomers();
  const colors = useThemeColor();
  const toast = useToast();
  const router = useRouter();
  const responsive = useResponsive();
  const { width: screenWidth, gutter } = responsive;
  // Keep the chart readable on tablets instead of stretching it across the full width.
  const CHART_WIDTH = responsive.isTablet
    ? Math.min(screenWidth - gutter * 2, 720)
    : screenWidth - gutter * 2;
  const [period, setPeriod] = React.useState<Period>("week");
  const [chartData, setChartData] = React.useState<RevenueChartPoint[]>([]);
  const [chartLoading, setChartLoading] = React.useState(false);

  const [productModalVisible, setProductModalVisible] = React.useState(false);
  const [selectedProductStat, setSelectedProductStat] = React.useState<ProductAnalytics | null>(null);
  const [loadingProductStat, setLoadingProductStat] = React.useState(false);

  const [supermarketModalVisible, setSupermarketModalVisible] = React.useState(false);
  const [selectedSupermarketStat, setSelectedSupermarketStat] =
    React.useState<SupermarketAnalytics | null>(null);
  const [loadingSupermarketStat, setLoadingSupermarketStat] = React.useState(false);

  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const loadData = useCallback(() => {
    const { from, to } = getPeriodRange(period);
    const params = { from: from.toISOString(), to: to.toISOString() };
    fetchSummary(params);
    setChartLoading(true);
    fetchRevenueChart(params)
      .then((data) => setChartData(data ?? []))
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, [fetchSummary, fetchRevenueChart, period]);

  const handleOpenProductAnalytics = async (productId?: string) => {
    if (!productId) return;
    setProductModalVisible(true);
    setLoadingProductStat(true);
    try {
      const data = await fetchProductAnalytics(productId);
      setSelectedProductStat(data);
    } finally {
      setLoadingProductStat(false);
    }
  };

  const handleOpenStoreAnalytics = async (supermarketId: string) => {
    setSupermarketModalVisible(true);
    setLoadingSupermarketStat(true);
    try {
      const data = await fetchSupermarketAnalytics(supermarketId);
      setSelectedSupermarketStat(data);
    } finally {
      setLoadingSupermarketStat(false);
    }
  };

  const supermarkets = useMemo(() => {
    return customers.filter((c) => c.customerType === "supermarket");
  }, [customers]);

  const handleExportCSV = async () => {
    if (!summary) {
      toast.info("Please wait for the data to load.", "No data to export");
      return;
    }

    try {
      let csv = "Metric,Value\n";
      csv += `Total Revenue,${summary.totalRevenue}\n`;
      csv += `Total Sales,${summary.totalSalesCount}\n`;
      csv += `Total Expenses,${summary.totalExpenses}\n`;
      csv += `Net Profit,${summary.netProfit}\n`;
      csv += `Low Stock Count,${summary.lowStockCount}\n`;
      csv += `Total Products,${summary.totalProducts}\n\n`;

      csv += "Top Products,Quantity Sold,Revenue\n";
      summary.topProducts.forEach((p) => {
        csv += `"${p.name}",${p.quantitySold},${p.revenue}\n`;
      });

      if (chartData.length > 0) {
        csv += "\nDaily Revenue\nDate,Revenue,Sales\n";
        chartData.forEach((p) => {
          csv += `${p.date},${p.revenue},${p.count}\n`;
        });
      }

      await Share.share({
        message: csv,
        title: "Business Analytics Export",
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err), "Export Failed");
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dailySales = useMemo(() => buildChartSeries(chartData, period), [chartData, period]);

  useEffect(() => {
    if (dailySales.length > 0) {
      chartAnim.setValue(0);
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [dailySales]);

  const maxRevenue = useMemo(
    () => Math.max(...dailySales.map((d) => d.amount), 1),
    [dailySales],
  );

  const maxTransactions = useMemo(
    () => Math.max(...dailySales.map((d) => d.transactions), 1),
    [dailySales],
  );

  const averageOrderValue = useMemo(
    () =>
      summary && summary.totalSalesCount > 0
        ? summary.totalRevenue / summary.totalSalesCount
        : 0,
    [summary],
  );

  const marginPercent = useMemo(
    () =>
      summary && summary.totalRevenue > 0
        ? Math.round((summary.netProfit / summary.totalRevenue) * 100)
        : 0,
    [summary],
  );

  const periodLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase(),
    [],
  );

  const barGap = dailySales.length > 12 ? 2 : 6;
  const barWidth =
    (CHART_WIDTH - barGap * (dailySales.length - 1)) / Math.max(dailySales.length, 1);
  const chartInnerHeight = CHART_HEIGHT - 24;
  const labelStep = dailySales.length > 12 ? Math.ceil(dailySales.length / 6) : 1;

  const transactionPoints = useMemo(() => {
    return dailySales
      .map((day, idx) => {
        const x = idx * (barWidth + barGap) + barWidth / 2;
        const y =
          chartInnerHeight -
          (day.transactions / Math.max(maxTransactions, 1)) * chartInnerHeight * 0.5 -
          10;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dailySales, barWidth, barGap, chartInnerHeight, maxTransactions]);

  const maxDriverRevenue = useMemo(
    () => Math.max(...(summary?.topProducts.map((p) => p.revenue) ?? [0]), 1),
    [summary],
  );

  const summaryCards = useMemo(
    () => [
      { icon: CurrencyDollar, label: "REVENUE", value: formatCurrency(summary?.totalRevenue ?? 0), color: colors.brand },
      { icon: ShoppingCart, label: "SALES", value: `${summary?.totalSalesCount ?? 0}`, color: colors.brand },
      { icon: TrendUp, label: "PROFIT", value: formatCurrency(summary?.netProfit ?? 0), color: colors.accent },
      { icon: Receipt, label: "AVG ORDER", value: formatCurrency(averageOrderValue), color: colors.brand },
    ],
    [summary, averageOrderValue, colors],
  );

  return (
    <Container isScrollable={false} withTabBar={false} className="flex-1 bg-background">
      {/* Header — frame y18 */}
      <StyledView className="flex-row items-center gap-4 px-6 pt-4 pb-4">
        <StyledTouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-card"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </StyledTouchableOpacity>
        <StyledText
          className="flex-1 font-title text-ink"
          style={{ fontSize: typeScale.section.fontSize, lineHeight: typeScale.section.lineHeight }}
        >
          Insights
        </StyledText>
        <StyledTouchableOpacity
          onPress={handleExportCSV}
          className="h-10 w-11 items-center justify-center rounded-input border border-border bg-card"
          accessibilityRole="button"
          accessibilityLabel="Export analytics as CSV"
        >
          <ShareIcon size={17} color={colors.ink} />
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading && !!summary} onRefresh={loadData} colors={[colors.brand]} />
        }
      >
        {isLoading && !summary ? (
          /* FigCraft `07.1 — Loading shop`: quiet skeleton blocks */
          <StyledView className="mt-2 gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-[116px] w-full rounded-card" />
            <Skeleton className="h-[154px] w-full rounded-card" />
            <Skeleton className="h-3 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-pill" />
            ))}
          </StyledView>
        ) : error ? (
          <StyledView className="mt-20 items-center px-6" accessibilityRole="alert">
            <Surface variant="warning" className="items-center p-6">
              <Warning size={36} color={colors.accent} />
              <StyledText className="mt-3 mb-4 text-center font-body text-body text-ink">{error}</StyledText>
              <StyledTouchableOpacity
                className="min-h-12 items-center justify-center rounded-button bg-accent px-6"
                onPress={loadData}
                accessibilityRole="button"
                accessibilityLabel="Retry"
              >
                <StyledText className="font-label text-body text-ink">Retry</StyledText>
              </StyledTouchableOpacity>
            </Surface>
          </StyledView>
        ) : summary ? (
          <>
            {/* Period + selector — frame y66 */}
            <StyledText className="pt-1 font-label text-micro uppercase tracking-[1.5px] text-muted">
              {periodLabel}
            </StyledText>
            <StyledScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
            >
              {PERIODS.map((p) => {
                const active = period === p.key;
                return (
                  <StyledTouchableOpacity
                    key={p.key}
                    onPress={() => setPeriod(p.key)}
                    className={`min-h-10 items-center justify-center rounded-pill border px-4 ${
                      active ? "border-brand bg-brand" : "border-border bg-card"
                    }`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show ${p.label}`}
                  >
                    <StyledText className={`font-label text-label ${active ? "text-card" : "text-muted"}`}>
                      {p.label}
                    </StyledText>
                  </StyledTouchableOpacity>
                );
              })}
            </StyledScrollView>

            {/* Hero net profit — frame y90 */}
            <Surface variant="hero" className="mt-1 overflow-hidden rounded-[22px] p-4">
              <StyledText className="font-label text-[8px] uppercase tracking-[1px]" style={{ color: colors.mint }}>
                Net profit · after expenses
              </StyledText>
              <StyledView className="mt-2 flex-row items-start justify-between">
                <StyledView className="flex-1">
                  <StyledText
                    className="font-display text-card"
                    style={{ fontSize: typeScale.hero.fontSize, lineHeight: typeScale.hero.lineHeight }}
                  >
                    {formatCurrency(summary.netProfit)}
                  </StyledText>
                  <StyledText className="mt-1 font-label text-micro" style={{ color: colors.accent }}>
                    {`${summary.totalSalesCount} sales · ${formatCurrency(summary.totalRevenue)} revenue`}
                  </StyledText>
                </StyledView>
                <StyledView className="items-end">
                  <StyledText
                    className="font-display"
                    style={{ fontSize: 26, lineHeight: 26, color: colors.mint }}
                  >
                    {marginPercent}%
                  </StyledText>
                  <StyledText className="font-body text-[9px]" style={{ color: colors.mint }}>
                    margin
                  </StyledText>
                </StyledView>
              </StyledView>
            </Surface>

            {/* Chart — frame y220 */}
            <Surface variant="primary" className="mt-4 rounded-card p-4">
              <StyledView className="flex-row items-center justify-between">
                <StyledText className="font-label text-micro uppercase tracking-[1px] text-muted">
                  Sales — {period === "today" ? "today" : period === "month" ? "last 30 days" : "last 7 days"}
                </StyledText>
                <StyledText className="font-label text-label text-brand">
                  {formatCurrency(averageOrderValue)} avg
                </StyledText>
              </StyledView>

              {chartLoading && chartData.length === 0 ? (
                <StyledView className="h-[154px] items-center justify-center">
                  <Skeleton className="h-[120px] w-full rounded-input" />
                </StyledView>
              ) : dailySales.every((d) => d.amount === 0) ? (
                <StyledView className="h-[154px] items-center justify-center">
                  <StyledText className="font-body text-body-sm text-muted">
                    No sales recorded in this period.
                  </StyledText>
                </StyledView>
              ) : (
                <Animated.View
                  className="mt-3"
                  style={{
                    opacity: chartAnim,
                    transform: [
                      { translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                    ],
                  }}
                >
                  <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    <Defs>
                      <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors.brand} stopOpacity="1" />
                        <Stop offset="1" stopColor={colors.mint} stopOpacity="0.55" />
                      </LinearGradient>
                    </Defs>
                    {dailySales.map((day, idx) => {
                      const isLast = idx === dailySales.length - 1;
                      const barHeight = Math.max(
                        (day.amount / Math.max(maxRevenue, 1)) * (chartInnerHeight - 20),
                        4,
                      );
                      const x = idx * (barWidth + barGap);
                      const y = chartInnerHeight - barHeight;
                      return (
                        <G key={idx}>
                          <Rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={Math.min(barWidth / 2, 12)}
                            fill={isLast ? colors.accent : "url(#barGrad)"}
                          />
                        </G>
                      );
                    })}
                    <Polyline
                      points={transactionPoints}
                      fill="none"
                      stroke={colors.muted}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {dailySales.map((day, idx) => {
                      const cx = idx * (barWidth + barGap) + barWidth / 2;
                      const cy =
                        chartInnerHeight -
                        (day.transactions / Math.max(maxTransactions, 1)) * chartInnerHeight * 0.5 -
                        10;
                      return <Circle key={`dot-${idx}`} cx={cx} cy={cy} r={3} fill={colors.muted} />;
                    })}
                    {dailySales.map((day, idx) =>
                      idx % labelStep === 0 ? (
                        <SvgText
                          key={`label-${idx}`}
                          x={idx * (barWidth + barGap) + barWidth / 2}
                          y={CHART_HEIGHT - 4}
                          fontSize={9}
                          fontWeight="600"
                          fill={colors.muted}
                          textAnchor="middle"
                        >
                          {day.date}
                        </SvgText>
                      ) : null,
                    )}
                  </Svg>
                  <StyledView className="mt-2 flex-row items-center justify-center gap-4">
                    <StyledView className="flex-row items-center gap-1.5">
                      <StyledView className="h-2.5 w-2.5 rounded-sm bg-brand" />
                      <StyledText className="font-label text-micro text-muted">Revenue</StyledText>
                    </StyledView>
                    <StyledView className="flex-row items-center gap-1.5">
                      <StyledView className="h-0.5 w-3.5 rounded-pill bg-muted" />
                      <StyledText className="font-label text-micro text-muted">Transactions</StyledText>
                    </StyledView>
                  </StyledView>
                </Animated.View>
              )}
            </Surface>

            {/* Metric rows — 2×2 grid */}
            <StyledView className="mt-4 flex-row flex-wrap gap-3">
              {summaryCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <Surface key={card.label} variant="primary" className="w-[47.6%] rounded-card p-4">
                    <StyledView className="flex-row items-center gap-2">
                      <StyledView className="h-7 w-7 items-center justify-center rounded-pill bg-brand-soft">
                        <IconComponent size={15} color={card.color} />
                      </StyledView>
                      <StyledText className="font-label text-micro uppercase tracking-[0.5px] text-muted">
                        {card.label}
                      </StyledText>
                    </StyledView>
                    <StyledText className="mt-2 font-title text-ink" style={{ fontSize: 20, lineHeight: 24 }}>
                      {card.value}
                    </StyledText>
                  </Surface>
                );
              })}
            </StyledView>

            {/* What moves the money — frame y388 */}
            <StyledText className="mt-6 font-label text-micro uppercase tracking-[1px] text-muted">
              What moves the money
            </StyledText>
            <StyledView className="mt-1">
              {summary.topProducts.length === 0 ? (
                <StyledView className="mt-3 items-center rounded-card border border-dashed border-border p-6">
                  <Package size={32} color={colors.muted} />
                  <StyledText className="mt-2 font-body text-body-sm text-muted">
                    No products sold yet.
                  </StyledText>
                </StyledView>
              ) : (
                summary.topProducts.slice(0, 4).map((product, idx) => {
                  const pct =
                    summary.totalRevenue > 0
                      ? Math.round((product.revenue / summary.totalRevenue) * 100)
                      : 0;
                  const barPct = Math.max((product.revenue / maxDriverRevenue) * 100, 4);
                  return (
                    <StyledTouchableOpacity
                      key={product.id ?? `driver-${idx}`}
                      onPress={() => handleOpenProductAnalytics(product.id)}
                      className="mt-4 active:opacity-70"
                      accessibilityRole="button"
                      accessibilityLabel={`${product.name}, ${formatCurrency(product.revenue)}, ${pct}% of sales. View breakdown.`}
                    >
                      <StyledView className="flex-row items-start justify-between">
                        <StyledText className="flex-1 pr-3 font-label text-label text-ink" numberOfLines={1}>
                          {product.name}
                        </StyledText>
                        <StyledText className="font-title text-ink" style={{ fontSize: 16, lineHeight: 21 }}>
                          {formatCurrency(product.revenue)}
                        </StyledText>
                      </StyledView>
                      <StyledView className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-border">
                        <StyledView
                          className="h-full rounded-pill bg-brand"
                          style={{ width: `${barPct}%` }}
                        />
                      </StyledView>
                      <StyledText className="mt-1.5 font-label text-[8px] uppercase tracking-[0.5px] text-muted">
                        {pct}% of sales · {product.quantitySold} sold
                      </StyledText>
                    </StyledTouchableOpacity>
                  );
                })
              )}
            </StyledView>

            {summary.topProducts.length > 0 ? (
              <StyledTouchableOpacity
                onPress={() => router.push("/products")}
                className="mt-4 min-h-12 flex-row items-center justify-center gap-1.5"
                accessibilityRole="button"
                accessibilityLabel="See all products"
              >
                <StyledText className="font-label text-label text-brand">See all products</StyledText>
                <ArrowRight size={15} color={colors.brand} />
              </StyledTouchableOpacity>
            ) : null}

            {/* Margin warning — frame y608 */}
            <Surface variant="warning" className="mt-4 flex-row gap-3 rounded-input p-4">
              <Warning size={20} color={colors.accent} />
              <StyledView className="flex-1">
                <StyledText className="font-label text-micro text-ink">
                  {summary.lowStockCount > 0
                    ? `${summary.lowStockCount} products are running low on stock.`
                    : "Review your sell prices to protect your margin."}
                </StyledText>
                <StyledTouchableOpacity
                  onPress={() => router.push("/products")}
                  className="mt-1.5 min-h-8 justify-center self-start"
                  accessibilityRole="button"
                  accessibilityLabel="Fix prices in stock"
                >
                  <StyledText className="font-label text-micro text-brand">Fix price in stock →</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </Surface>

            {/* Smart recommendations */}
            <Surface variant="quiet" className="mt-4 flex-row items-center rounded-card p-4">
              <Sparkle size={20} color={colors.brand} />
              <StyledView className="ml-3 flex-1 pr-3">
                <StyledText className="font-title text-card-title text-brand-strong">
                  Smart recommendations
                </StyledText>
                <StyledText className="mt-0.5 font-body text-micro text-muted">
                  See which products your customers buy together.
                </StyledText>
              </StyledView>
              <StyledTouchableOpacity
                className="min-h-10 items-center justify-center rounded-button bg-brand px-4"
                onPress={() => router.push("/mba")}
                accessibilityRole="button"
                accessibilityLabel="View smart recommendations"
              >
                <StyledText className="font-label text-label text-card">View</StyledText>
              </StyledTouchableOpacity>
            </Surface>

            {/* Supermarket performance */}
            {supermarkets.length > 0 && (
              <>
                <StyledText className="mt-6 font-label text-micro uppercase tracking-[1px] text-muted">
                  Supermarket performance
                </StyledText>
                <Surface variant="primary" className="mt-2 overflow-hidden rounded-card p-0">
                  {supermarkets.map((sm, idx) => (
                    <StyledTouchableOpacity
                      key={sm.id}
                      onPress={() => handleOpenStoreAnalytics(sm.id)}
                      className={`min-h-16 flex-row items-center justify-between px-4 py-3 active:opacity-70 ${
                        idx < supermarkets.length - 1 ? "border-b border-border" : ""
                      }`}
                      accessibilityRole="button"
                      accessibilityLabel={`${sm.name}. View store analytics.`}
                    >
                      <StyledView className="flex-1 flex-row items-center gap-3">
                        <StyledView className="h-10 w-10 items-center justify-center rounded-pill bg-brand-soft">
                          <Storefront size={18} color={colors.brand} />
                        </StyledView>
                        <StyledView className="flex-1">
                          <StyledText className="font-label text-body text-ink" numberOfLines={1}>
                            {sm.name}
                          </StyledText>
                          <StyledText className="font-body text-micro text-muted">
                            {sm.expectedPaymentPeriodDays || 14} days payment term
                          </StyledText>
                        </StyledView>
                      </StyledView>
                      <StyledView className="items-end">
                        <StyledText className="font-label text-label text-brand">
                          {formatCurrency(parseFloat(sm.totalSpent || "0"))}
                        </StyledText>
                        <StyledText className="font-body text-micro text-muted">Store analytics →</StyledText>
                      </StyledView>
                    </StyledTouchableOpacity>
                  ))}
                </Surface>
              </>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* PRODUCT ANALYTICS DRILLDOWN */}
      <BottomSheet
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        title={selectedProductStat?.product.name || "Product Breakdown"}
        subtitle="Performance for this product across all sales."
        icon={<Package size={20} color={colors.brand} />}
        contentClassName="pt-4 pb-2"
      >
        {loadingProductStat ? (
          <StyledView className="items-center py-16">
            <StyledText className="font-body text-body-sm text-muted">Loading product metrics...</StyledText>
          </StyledView>
        ) : selectedProductStat ? (
          <StyledView className="gap-3">
            <Surface variant="quiet" className="rounded-input p-3.5">
              <StyledText className="font-label text-label text-muted">
                Current retail price:{" "}
                <StyledText className="font-label text-ink">
                  {formatCurrency(parseFloat(selectedProductStat.product.price))}
                </StyledText>
              </StyledText>
              <StyledText className="mt-1 font-label text-label text-muted">
                In-stock inventory:{" "}
                <StyledText className="font-label text-ink">
                  {selectedProductStat.product.quantity} units
                </StyledText>
              </StyledText>
            </Surface>

            <StyledView className="flex-row gap-2">
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Net units sold</StyledText>
                <StyledText className="mt-1 font-title text-brand" style={{ fontSize: 22, lineHeight: 26 }}>
                  {selectedProductStat.totalSold}
                </StyledText>
              </Surface>
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Units returned</StyledText>
                <StyledText className="mt-1 font-title text-danger" style={{ fontSize: 22, lineHeight: 26 }}>
                  {selectedProductStat.totalReturned}
                </StyledText>
              </Surface>
            </StyledView>

            <StyledView className="flex-row gap-2">
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Gross revenue</StyledText>
                <StyledText className="mt-1 font-label text-body text-ink">
                  {formatCurrency(selectedProductStat.grossRevenue)}
                </StyledText>
              </Surface>
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Net revenue</StyledText>
                <StyledText className="mt-1 font-label text-body text-brand">
                  {formatCurrency(selectedProductStat.netRevenue)}
                </StyledText>
              </Surface>
            </StyledView>

            <Surface variant="primary" className="rounded-input p-3.5">
              <StyledText className="font-label text-label text-muted">
                Distinct sales transactions:{" "}
                <StyledText className="font-label text-ink">{selectedProductStat.orderCount}</StyledText>
              </StyledText>
            </Surface>
          </StyledView>
        ) : null}
      </BottomSheet>

      {/* SUPERMARKET ANALYTICS DRILLDOWN */}
      <BottomSheet
        visible={supermarketModalVisible}
        onClose={() => setSupermarketModalVisible(false)}
        title={selectedSupermarketStat?.supermarket.name || "Store Analytics"}
        subtitle="Invoiced, paid, and returned value for this store."
        icon={<Storefront size={20} color={colors.brand} />}
        contentClassName="pt-4 pb-2"
      >
        {loadingSupermarketStat ? (
          <StyledView className="items-center py-16">
            <StyledText className="font-body text-body-sm text-muted">Loading store metrics...</StyledText>
          </StyledView>
        ) : selectedSupermarketStat ? (
          <StyledView className="gap-3">
            <StyledView className="flex-row gap-2">
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Total invoiced</StyledText>
                <StyledText className="mt-1 font-title text-ink" style={{ fontSize: 18, lineHeight: 22 }}>
                  {formatCurrency(selectedSupermarketStat.totalBilled)}
                </StyledText>
              </Surface>
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Total paid</StyledText>
                <StyledText className="mt-1 font-title text-brand" style={{ fontSize: 18, lineHeight: 22 }}>
                  {formatCurrency(selectedSupermarketStat.totalPaid)}
                </StyledText>
              </Surface>
            </StyledView>

            <StyledView className="flex-row gap-2">
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Returned value</StyledText>
                <StyledText className="mt-1 font-title text-danger" style={{ fontSize: 18, lineHeight: 22 }}>
                  {formatCurrency(selectedSupermarketStat.totalReturnsAmount)}
                </StyledText>
              </Surface>
              <Surface variant="primary" className="flex-1 rounded-input p-3">
                <StyledText className="font-label text-micro uppercase text-muted">Receivable due</StyledText>
                <StyledText className="mt-1 font-title text-brand-strong" style={{ fontSize: 18, lineHeight: 22 }}>
                  {formatCurrency(selectedSupermarketStat.netReceivable)}
                </StyledText>
              </Surface>
            </StyledView>

            <Surface variant="primary" className="mt-1 rounded-input p-4">
              <StyledText className="mb-2 font-label text-body text-ink">
                Supplied products & return rates
              </StyledText>
              {selectedSupermarketStat.productsSupplied.length === 0 ? (
                <StyledText className="font-body text-label italic text-muted">
                  No deliveries recorded
                </StyledText>
              ) : (
                selectedSupermarketStat.productsSupplied.map((item) => (
                  <StyledView key={item.productId} className="border-b border-border py-2">
                    <StyledView className="flex-row items-center justify-between">
                      <StyledText className="mr-2 flex-1 font-label text-label text-ink">
                        {item.productName}
                      </StyledText>
                      <StyledText className="font-label text-label text-brand">
                        {formatCurrency(item.totalValue)}
                      </StyledText>
                    </StyledView>
                    <StyledText className="mt-0.5 font-body text-micro text-muted">
                      Supplied: {item.quantitySupplied} | Returned: {item.quantityReturned} | Net:{" "}
                      {item.netDelivered}
                    </StyledText>
                  </StyledView>
                ))
              )}
            </Surface>
          </StyledView>
        ) : null}
      </BottomSheet>
    </Container>
  );
}

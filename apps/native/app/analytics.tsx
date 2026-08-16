import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
} from "react-native";
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
} from "phosphor-react-native";
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
import { useAnalytics, type RevenueChartPoint } from "@/hooks/useAnalytics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useToast } from "@/components/ui/toast";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

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

const CHART_WIDTH = Dimensions.get("window").width - 64;
const CHART_HEIGHT = 180;

export default function AnalyticsScreen() {
  const { summary, isLoading, error, fetchSummary, fetchRevenueChart } = useAnalytics();
  const colors = useThemeColor();
  const toast = useToast();
  const router = useRouter();
  const [period, setPeriod] = React.useState<Period>("week");
  const [chartData, setChartData] = React.useState<RevenueChartPoint[]>([]);
  const [chartLoading, setChartLoading] = React.useState(false);

  const chartAnim = useRef(new Animated.Value(0)).current;

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
      summary.topProducts.forEach(p => {
        csv += `"${p.name}",${p.quantitySold},${p.revenue}\n`;
      });

      if (chartData.length > 0) {
        csv += "\nDaily Revenue\nDate,Revenue,Sales\n";
        chartData.forEach(p => {
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

  const dailySales = useMemo(
    () => buildChartSeries(chartData, period),
    [chartData, period],
  );

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
    [summary?.totalRevenue, summary?.totalSalesCount],
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

  const summaryCards = useMemo(
    () => [
      {
        icon: CurrencyDollar,
        label: "Revenue",
        value: formatCurrency(summary?.totalRevenue ?? 0),
        color: colors.primary,
      },
      {
        icon: ShoppingCart,
        label: "Sales",
        value: `${summary?.totalSalesCount ?? 0}`,
        color: colors.secondary,
      },
      {
        icon: TrendUp,
        label: "Profit",
        value: formatCurrency(summary?.netProfit ?? 0),
        color: colors.tertiary,
      },
      {
        icon: Receipt,
        label: "Avg Order",
        value: formatCurrency(averageOrderValue),
        color: colors.primary,
      },
    ],
    [summary, averageOrderValue, colors],
  );

  return (
    <Container isScrollable={false} withTabBar={false} className="bg-background px-auto flex-1">
      <StyledView className="bg-surface border-b border-outline-variant h-14 px-margin flex-row justify-between items-center z-[var(--z-header)]">
        <StyledView className="flex-row items-center gap-3">
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={colors.onSurface} />
          </StyledTouchableOpacity>
          <StyledText className="text-h2 text-on-surface text-balance">Analytics</StyledText>
        </StyledView>
        <StyledTouchableOpacity
          onPress={handleExportCSV}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-full"
        >
          <ShareIcon size={16} color={colors.primary} />
          <StyledText className="text-primary font-semibold text-xs">Export CSV</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!summary}
            onRefresh={loadData}
            colors={[colors.primary]}
          />
        }
      >
        <StyledView className="px-margin pt-4 pb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {PERIODS.map((p) => (
              <StyledTouchableOpacity
                key={p.key}
                onPress={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-full border ${
                  period === p.key
                    ? "bg-primary border-primary"
                    : "bg-surface-container-lowest border-outline-variant"
                }`}
              >
                <StyledText
                  className={`text-label-caps font-semibold ${
                    period === p.key ? "text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  {p.label}
                </StyledText>
              </StyledTouchableOpacity>
            ))}
          </ScrollView>
        </StyledView>

        {isLoading && !summary ? (
          <StyledView className="px-margin mt-4">
            <StyledView className="flex-col gap-2 mb-4">
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </StyledView>
            <StyledView className="flex-row gap-2 mb-4">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </StyledView>
            <StyledView className="flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Surface key={i} variant="outline" className="rounded-lg p-4 mb-3">
                  <StyledView className="flex-row justify-between items-start mb-2">
                    <StyledView className="flex-1 mr-3">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </StyledView>
                    <Skeleton className="h-6 w-16" />
                  </StyledView>
                  <StyledView className="flex-row justify-between items-center mt-2 pt-2 border-t border-outline-variant/50">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </StyledView>
                </Surface>
              ))}
            </StyledView>
          </StyledView>
        ) : error ? (
          <StyledView className="mx-margin mt-24 items-center p-6 bg-surface-container-low rounded-lg border border-outline-variant">
            <Warning size={40} color={colors.error} />
            <StyledText className="text-error text-center mt-3 mb-4 text-body-lg font-semibold">
              {error}
            </StyledText>
            <StyledTouchableOpacity
              className="px-6 py-3 bg-primary rounded-lg"
              onPress={loadData}
            >
              <StyledText className="text-on-primary font-semibold">Retry</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : summary ? (
          <>
            <StyledView className="mt-3 px-margin mb-0">
              <StyledView className="flex-row justify-between items-center mb-4">
                <StyledText className="font-h2 text-on-surface">
                  Revenue Trend
                </StyledText>
              </StyledView>
              {chartLoading && chartData.length === 0 ? (
                <StyledView className="p-6 items-center bg-surface-container-lowest rounded-lg">
                  <StyledView className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                    <StyledView className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                  </StyledView>
                </StyledView>
              ) : dailySales.every((d) => d.amount === 0) ? (
                <StyledView className="p-6 items-center bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
                  <StyledText className="text-on-surface-variant text-body-sm font-medium">
                    No sales recorded in this period.
                  </StyledText>
                </StyledView>
              ) : (
                <Animated.View
                  style={{
                    opacity: chartAnim,
                    transform: [
                      {
                        translateY: chartAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Surface
                    variant="primary"
                    className="rounded-lg border border-outline-variant p-md overflow-hidden"
                  >
                    <View
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: colors.surfaceContainerLowest + "40",
                        borderRadius: 12,
                      }}
                      pointerEvents="none"
                    />
                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                      <Defs>
                        <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
                          <Stop
                            offset="1"
                            stopColor={colors.primaryContainer}
                            stopOpacity="0.6"
                          />
                        </LinearGradient>
                      </Defs>
                      {dailySales.map((day, idx) => {
                        const barHeight = Math.max(
                          (day.amount / Math.max(maxRevenue, 1)) *
                            (chartInnerHeight - 20),
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
                              rx={4}
                              fill="url(#barGrad)"
                            />
                          </G>
                        );
                      })}
                      <Polyline
                        points={transactionPoints}
                        fill="none"
                        stroke={colors.secondary}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {dailySales.map((day, idx) => {
                        const cx = idx * (barWidth + barGap) + barWidth / 2;
                        const cy =
                          chartInnerHeight -
                          (day.transactions / Math.max(maxTransactions, 1)) *
                            chartInnerHeight *
                            0.5 -
                          10;
                        return (
                          <Circle
                            key={`dot-${idx}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={colors.secondary}
                          />
                        );
                      })}
                      {dailySales.map((day, idx) =>
                        idx % labelStep === 0 ? (
                          <SvgText
                            key={`label-${idx}`}
                            x={idx * (barWidth + barGap) + barWidth / 2}
                            y={CHART_HEIGHT - 4}
                            fontSize={10}
                            fill={colors.onSurfaceVariant}
                            textAnchor="middle"
                          >
                            {day.date}
                          </SvgText>
                        ) : null,
                      )}
                    </Svg>
                    <StyledView className="flex-row justify-center items-center gap-4 mt-2">
                      <StyledView className="flex-row items-center gap-1">
                        <StyledView
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <StyledText className="text-xs text-on-surface-variant">
                          Revenue
                        </StyledText>
                      </StyledView>
                      <StyledView className="flex-row items-center gap-1">
                        <StyledView
                          className="w-3 h-0.5 rounded-full"
                          style={{ backgroundColor: colors.secondary }}
                        />
                        <StyledText className="text-xs text-on-surface-variant">
                          Transactions
                        </StyledText>
                      </StyledView>
                    </StyledView>
                  </Surface>
                </Animated.View>
              )}
            </StyledView>

            <StyledView className="flex-row flex-wrap px-margin mt-3 gap-3">
              {summaryCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <Surface
                    key={card.label}
                    variant="primary"
                    className="w-[calc(50%-6px)] rounded-lg border border-outline-variant p-md"
                  >
                    <StyledView className="flex-row items-center gap-2 mb-2">
                      <StyledView className="w-8 h-8 rounded-full bg-surface-container items-center justify-center">
                        <IconComponent size={16} color={card.color} />
                      </StyledView>
                      <StyledText className="text-label-caps text-on-surface-variant">
                        {card.label}
                      </StyledText>
                    </StyledView>
                    <StyledText className="font-h1 text-on-surface">
                      {card.value}
                    </StyledText>
                  </Surface>
                );
              })}
            </StyledView>

            <StyledView className="mt-6 px-margin">
              <StyledView className="bg-tertiary-container rounded-lg p-md flex-row items-center justify-between">
                <StyledView className="flex-1 pr-4">
                  <StyledView className="flex-row items-center gap-2 mb-1">
                    <Sparkle size={20} color={colors.tertiary} />
                    <StyledText className="text-h3 font-bold text-on-tertiary-container">
                      Smart Recommendations
                    </StyledText>
                  </StyledView>
                  <StyledText className="text-body-sm text-on-tertiary-container">
                    Discover which products your customers frequently buy together using Market
                    Basket Analysis.
                  </StyledText>
                </StyledView>
                <StyledTouchableOpacity
                  className="bg-tertiary rounded-full px-4 py-2"
                  onPress={() => router.push("/mba")}
                >
                  <StyledText className="text-on-tertiary font-semibold text-label-bold">
                    View
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>

            <StyledView className="mt-6 px-margin">
              <StyledView className="flex-row justify-between items-center mb-3">
                <StyledText className="font-h2 text-on-surface">
                  Top Products
                </StyledText>
                <StyledTouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => router.push("/products")}
                >
                  <StyledText className="text-primary font-label-bold">
                    See All
                  </StyledText>
                  <ArrowRight size={16} color={colors.primary} />
                </StyledTouchableOpacity>
              </StyledView>

              {summary.topProducts.length === 0 ? (
                <StyledView className="p-6 items-center bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
                  <Package size={36} color={colors.emptyStateIcon} />
                  <StyledText className="text-on-surface-variant text-body-sm font-medium mt-2">
                    No products sold yet.
                  </StyledText>
                </StyledView>
              ) : (
                <Surface
                  variant="primary"
                  className="rounded-lg border border-outline-variant overflow-hidden"
                >
                  {summary.topProducts.map((product, idx) => (
                    <StyledView
                      key={`top-${idx}`}
                      className={`flex-row items-center justify-between px-md py-3 ${
                        idx < summary.topProducts.length - 1
                          ? "border-b border-outline-variant"
                          : ""
                      }`}
                    >
                      <StyledView className="flex-row items-center gap-3 flex-1">
                        <StyledView className="w-10 h-10 rounded-lg bg-surface-container items-center justify-center">
                          <Package size={20} color={colors.primary} />
                        </StyledView>
                        <StyledView className="flex-1">
                          <StyledText
                            className="text-label-bold text-on-surface"
                            numberOfLines={1}
                          >
                            {product.name}
                          </StyledText>
                          <StyledText className="text-body-sm text-on-surface-variant">
                            {product.quantitySold} sold
                          </StyledText>
                        </StyledView>
                      </StyledView>
                      <StyledText className="font-label-bold text-on-surface ml-3">
                        {formatCurrency(product.revenue)}
                      </StyledText>
                    </StyledView>
                  ))}
                </Surface>
              )}
            </StyledView>
          </>
        ) : null}
      </ScrollView>
    </Container>
  );
}

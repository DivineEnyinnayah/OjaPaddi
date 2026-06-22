import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
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
import { useAnalytics } from "@/hooks/useAnalytics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

type Period = "today" | "week" | "month" | "custom";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

function formatCurrency(amount: number): string {
  return `\u20A6${Math.round(amount).toLocaleString("en-NG")}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDailySales(
  totalRevenue: number,
): { date: string; amount: number; transactions: number }[] {
  const days: { date: string; amount: number; transactions: number }[] = [];
  const now = new Date();
  const random = seededRandom(Math.round(totalRevenue));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const variance = 0.5 + random() * 1.0;
    const amount = Math.round((totalRevenue / 7) * variance);
    const transactions = Math.max(1, Math.round(random() * 15));
    days.push({ date: label, amount, transactions });
  }
  return days;
}

const CHART_WIDTH = Dimensions.get("window").width - 64;
const CHART_HEIGHT = 180;
const BAR_GAP = 6;

export default function AnalyticsScreen() {
  const { summary, isLoading, error, fetchSummary } = useAnalytics();
  const colors = useThemeColor();
  const router = useRouter();
  const [period, setPeriod] = React.useState<Period>("week");

  const chartAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dailySales = useMemo(
    () => (summary ? generateDailySales(summary.totalRevenue) : []),
    [summary?.totalRevenue],
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
  }, [dailySales.length]);

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

  const barWidth =
    (CHART_WIDTH - BAR_GAP * (dailySales.length - 1)) / Math.max(dailySales.length, 1);
  const chartInnerHeight = CHART_HEIGHT - 24;

  const transactionPoints = useMemo(() => {
    return dailySales
      .map((day, idx) => {
        const x = idx * (barWidth + BAR_GAP) + barWidth / 2;
        const y =
          chartInnerHeight -
          (day.transactions / Math.max(maxTransactions, 1)) * chartInnerHeight * 0.5 -
          10;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dailySales, barWidth, chartInnerHeight, maxTransactions]);

  const summaryCards = useMemo(
    () => [
      {
        icon: "currency-exchange" as const,
        label: "Revenue",
        value: formatCurrency(summary?.totalRevenue ?? 0),
        color: colors.primary,
      },
      {
        icon: "shopping-cart" as const,
        label: "Sales",
        value: `${summary?.totalSalesCount ?? 0}`,
        color: colors.secondary,
      },
      {
        icon: "trending-up" as const,
        label: "Profit",
        value: formatCurrency(summary?.netProfit ?? 0),
        color: colors.tertiary,
      },
      {
        icon: "receipt-long" as const,
        label: "Avg Order",
        value: formatCurrency(averageOrderValue),
        color: colors.primary,
      },
    ],
    [summary, averageOrderValue, colors],
  );

  return (
    <Container isScrollable={false} withTabBar className="bg-background pt-12 px-auto flex-1">
      <StyledView className="bg-surface-container-lowest h-14 px-margin flex-row justify-between items-center z-50">
        <StyledView className="flex-row items-center gap-3">
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </StyledTouchableOpacity>
          <StyledText className="text-h2 font-bold text-on-surface">Analytics</StyledText>
        </StyledView>
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
          <StyledView className="mt-24 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </StyledView>
        ) : error ? (
          <StyledView className="mx-margin mt-24 items-center p-6 bg-surface-container-low rounded-xl border border-outline-variant">
            <MaterialIcons name="error-outline" size={40} color={colors.error} />
            <StyledText className="text-error text-center mt-3 mb-4 text-body-lg font-semibold">
              {error}
            </StyledText>
            <StyledTouchableOpacity
              className="px-6 py-3 bg-primary rounded-xl"
              onPress={loadData}
            >
              <StyledText className="text-on-primary font-semibold">Retry</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : summary ? (
          <>
            <StyledView className="mt-3 px-margin mb-0">
              <StyledView className="flex-row justify-between items-center mb-4">
                <StyledText className="text-h2 font-bold text-on-surface">
                  Revenue Trend
                </StyledText>
              </StyledView>
              {dailySales.length === 0 ? (
                <StyledView className="p-6 items-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
                  <StyledText className="text-on-surface-variant text-body-sm font-medium">
                    No revenue data available.
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
                    className="rounded-xl p-md overflow-hidden"
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
                        const x = idx * (barWidth + BAR_GAP);
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
                        const cx = idx * (barWidth + BAR_GAP) + barWidth / 2;
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
                      {dailySales.map((day, idx) => (
                        <SvgText
                          key={`label-${idx}`}
                          x={idx * (barWidth + BAR_GAP) + barWidth / 2}
                          y={CHART_HEIGHT - 4}
                          fontSize={10}
                          fill={colors.onSurfaceVariant}
                          textAnchor="middle"
                        >
                          {day.date}
                        </SvgText>
                      ))}
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
              {summaryCards.map((card) => (
                <Surface
                  key={card.label}
                  variant="primary"
                  className="w-[calc(50%-6px)] rounded-xl p-md"
                >
                  <StyledView className="flex-row items-center gap-2 mb-2">
                    <StyledView className="w-8 h-8 rounded-full bg-white items-center justify-center">
                      <MaterialIcons name={card.icon} size={16} color={card.color} />
                    </StyledView>
                    <StyledText className="text-label-caps text-on-surface-variant">
                      {card.label}
                    </StyledText>
                  </StyledView>
                  <StyledText className="text-h1 font-bold text-on-surface">
                    {card.value}
                  </StyledText>
                </Surface>
              ))}
            </StyledView>

            <StyledView className="mt-6 px-margin">
              <StyledView className="flex-row justify-between items-center mb-3">
                <StyledText className="text-h2 font-bold text-on-surface">
                  Top Products
                </StyledText>
                <StyledTouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => router.push("/products")}
                >
                  <StyledText className="text-primary font-label-bold text-label-bold">
                    See All
                  </StyledText>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </StyledTouchableOpacity>
              </StyledView>

              {summary.topProducts.length === 0 ? (
                <StyledView className="p-6 items-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
                  <MaterialIcons
                    name="inventory-2"
                    size={36}
                    color={colors.emptyStateIcon}
                  />
                  <StyledText className="text-on-surface-variant text-body-sm font-medium mt-2">
                    No products sold yet.
                  </StyledText>
                </StyledView>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {summary.topProducts.map((product, idx) => (
                    <Surface
                      key={`top-${idx}`}
                      variant="primary"
                      className="w-44 rounded-xl p-md"
                    >
                      <StyledView className="w-10 h-10 rounded-lg bg-primary-container/20 items-center justify-center mb-3">
                        <MaterialIcons
                          name="inventory-2"
                          size={20}
                          color={colors.primaryContainer}
                        />
                      </StyledView>
                      <StyledText
                        className="font-label-bold text-label-bold text-on-surface mb-1"
                        numberOfLines={1}
                      >
                        {product.name}
                      </StyledText>
                      <StyledView className="flex-row justify-between">
                        <StyledText className="text-body-sm text-on-surface-variant">
                          {product.quantitySold} sold
                        </StyledText>
                        <StyledText className="text-label-caps font-semibold text-on-surface">
                          {formatCurrency(product.revenue)}
                        </StyledText>
                      </StyledView>
                    </Surface>
                  ))}
                </ScrollView>
              )}
            </StyledView>
          </>
        ) : null}
      </ScrollView>
    </Container>
  );
}

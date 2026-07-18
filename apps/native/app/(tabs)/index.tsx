import React, { useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image,
  ScrollView, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity, 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledImage = withUniwind(Image);

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { summary, isLoading, fetchSummary, error } = useAnalytics();
  const router = useRouter();
  const colors = useThemeColor();

  const loadData = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Container isScrollable={false} withTabBar className="bg-background pt-24 px-auto flex-1">
      <StyledView className="bg-surface-container-lowest border-b border-outline-variant/30 h-14 px-margin flex-row justify-between items-center z-50">
        <StyledView className="flex-row items-center gap-3">
          <StyledTouchableOpacity 
            onPress={() => router.push('/more')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary justify-center items-center bg-primary"
          >
            <StyledText className="text-on-primary font-body-lg font-bold">
                {user?.fullName?.charAt(0).toUpperCase() || 'O'}
              </StyledText>
          </StyledTouchableOpacity>
          <StyledView className="flex-col">
            <StyledText className="font-label-bold text-label-bold text-on-surface-variant">Welcome back</StyledText>
            <StyledText className="font-h1 text-h1 font-bold text-primary leading-tight">OjaPaddi</StyledText>
          </StyledView>
        </StyledView>
        <StyledTouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-surface-container active:scale-95">
          <MaterialIcons name="notifications" size={24} color={colors.primary} />
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading && !!summary} 
            onRefresh={loadData} 
            colors={[colors.primary]} 
          />
        }
      >
        {isLoading && !summary ? (
          <StyledView className="mt-24 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </StyledView>
        ) : error ? (
          <StyledView className="mt-24 items-center p-6 bg-surface-container-low rounded-xl border border-outline-variant">
            <StyledText className="text-error text-center mb-4 text-body-lg font-semibold">{error}</StyledText>
            <StyledTouchableOpacity className="px-6 py-3 bg-primary rounded-xl" onPress={loadData}>
              <StyledText className="text-on-primary font-semibold">Retry</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : summary ? (
          <>
            <StyledView className="flex-col gap-1 mb-gutter">
              <StyledText className="font-extrabold text-2xl text-on-surface">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Seller'} 👋
              </StyledText>
              <StyledText className="font-body-lg text-body-lg text-on-surface-variant">Here's how your shop is performing today.</StyledText>
            </StyledView>

            <StyledView className="flex-col gap-gutter mb-gutter">
              <Surface variant="primary" className="rounded-xl shadow-md p-lg">
                <StyledView className="flex-row justify-between items-start">
                  <StyledView className="flex-1 items-center justify-center">
                    <StyledText className="font-label-caps text-label-caps text-primary/80 mb-2">REVENUE</StyledText>
                    <StyledText className="text-3xl font-extrabold text-primary">{formatCurrency(summary.totalRevenue)}</StyledText>
                  </StyledView>
                  {/* <StyledView className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                    <MaterialIcons name="trending-up" size={20} color="#ffffff" />
                  </StyledView> */}
                </StyledView>
              </Surface>

              <Surface variant="outline" className="rounded-xl p-lg">
                  <StyledView className="flex-row justify-center items-center">
                  {/* <StyledView className="w-10 h-10 rounded-full bg-surface-container items-center justify-center">
                    <MaterialIcons name="shopping-bag" size={20} color={colors.primary} />
                  </StyledView> */}
                  <StyledView className="flex-1 items-center justify-center">
                    <StyledText className="font-label-caps text-label-caps text-on-surface-variant mb-2">SALES</StyledText>
                    <StyledText className="text-3xl font-extrabold text-on-surface">{summary.totalSalesCount}</StyledText>
                    <StyledText className="mt-2 text-on-surface-variant font-body-sm text-body-sm">Transactions processed</StyledText>
                  </StyledView>
                </StyledView>
              </Surface>

              <Surface variant="secondary" className="rounded-xl p-lg">
                <StyledView className="flex-row justify-between items-start">
                  <StyledView className="flex-1 items-center justify-center">
                    <StyledText className="font-label-caps text-label-caps text-on-secondary-container mb-2">PROFIT</StyledText>
                    <StyledText className="text-3xl font-extrabold text-on-secondary-container">{formatCurrency(summary.netProfit)}</StyledText>
                  </StyledView>
                  {/* <StyledView className="w-10 h-10 rounded-full bg-black/10 items-center justify-center">
                    <MaterialIcons name="account-balance-wallet" size={20} color={colors.onSecondaryContainer} />
                  </StyledView> */}
                </StyledView>
              </Surface>
            </StyledView>

            {summary.lowStockCount > 0 && (
              <StyledView className="bg-secondary-container/20 border border-secondary-container rounded-xl p-md flex-row items-center gap-md mb-gutter">
                <StyledView className="w-10 h-10 rounded-full bg-secondary-container/30 items-center justify-center">
                  <MaterialIcons name="warning" size={20} color={colors.secondary} />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="font-label-bold text-label-bold text-on-secondary-container">
                    {summary.lowStockCount} {summary.lowStockCount === 1 ? 'product is' : 'products are'} running low on stock
                  </StyledText>
                  <StyledText className="text-xs text-secondary font-medium uppercase tracking-wider">Restock needed soon</StyledText>
                </StyledView>
                <StyledTouchableOpacity 
                  className="bg-on-secondary-container px-3 py-1.5 rounded-lg"
                  onPress={() => router.push('/products')}
                >
                  <StyledText className="font-label-bold text-label-bold text-secondary-container">View</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            )}

            <StyledView className="flex-row gap-sm mb-gutter">
              <StyledTouchableOpacity 
                onPress={() => router.push('/sales/record')}
                className="flex-1 items-center justify-center p-md bg-primary rounded-xl active:scale-95 shadow-sm"
              >
                <MaterialIcons name="shopping-cart" size={24} color="#ffffff" />
                <StyledText className="font-label-bold text-label-bold text-on-primary mt-1">Record Sale</StyledText>
              </StyledTouchableOpacity>

              <StyledTouchableOpacity 
                onPress={() => router.push('/products/add')}
                className="flex-1 items-center justify-center p-md bg-surface-container-lowest border border-outline-variant rounded-xl active:scale-95"
              >
                <MaterialIcons name="inventory-2" size={24} color={colors.primary} />
                <StyledText className="font-label-bold text-label-bold text-on-surface mt-1">Add Product</StyledText>
              </StyledTouchableOpacity>

              <StyledTouchableOpacity 
                onPress={() => router.push('/more')}
                className="flex-1 items-center justify-center p-md bg-surface-container-lowest border border-outline-variant rounded-xl active:scale-95"
              >
                <MaterialIcons name="payments" size={24} color={colors.tertiary} />
                <StyledText className="font-label-bold text-label-bold text-on-surface mt-1">Add Expense</StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            {summary.totalProducts === 0 ? (
              <StyledView className="mb-6">
                <StyledView className="bg-primary/5 rounded-2xl border-2 border-dashed border-primary/30 p-6 items-center">
                  <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                    <StyledImage
                      source={{ uri: ILLUSTRATIONS.homeWelcome }}
                      className="w-[44px] h-[44px]"
                      resizeMode="contain"
                    />
                  </StyledView>
                  <StyledText className="text-h2 font-bold text-on-surface text-center mb-2">Welcome to OjaPaddi!</StyledText>
                  <StyledText className="text-body-lg text-on-surface-variant text-center mb-6">
                    Your first step to market success — add your first product and start selling!
                  </StyledText>
                  <Button
                    size="lg"
                    variant="primary"
                    onPress={() => router.push('/products/add')}
                  >
                    Add Your First Product
                  </Button>
                  <StyledTouchableOpacity
                    className="mt-4 flex-row items-center gap-2"
                    onPress={() => router.push('/sales/record')}
                  >
                    <MaterialIcons name="trending-up" size={18} color={colors.primary} />
                    <StyledText className="text-label-bold text-primary">I already made a sale</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
              </StyledView>
            ) : (
              <StyledView className="mb-6">
                <StyledView className="flex-row justify-between items-center mb-4">
                  <StyledText className="font-h2 text-h2 font-bold text-on-surface">Recent Sales</StyledText>
                  <StyledTouchableOpacity 
                    onPress={() => router.push('/products')}
                    className="flex-row items-center gap-1"
                  >
                    <StyledText className="text-primary font-label-bold text-label-bold">See All</StyledText>
                    <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                  </StyledTouchableOpacity>
                </StyledView>

                {!summary.topProducts || summary.topProducts.length === 0 ? (
                  <StyledView className="p-8 items-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
                    <StyledImage
                      source={{ uri: ILLUSTRATIONS.noSalesYet }}
                      className="w-[64px] h-[64px]"
                      resizeMode="contain"
                    />
                    <StyledText className="text-on-surface-variant text-body-sm font-medium mt-2">No sales recorded yet.</StyledText>
                    <StyledText className="text-on-surface-variant text-body-sm mt-1">Start by recording your first sale!</StyledText>
                  </StyledView>
                ) : (
                  <StyledView className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                    {summary.topProducts.map((product, index, arr) => (
                      <StyledView 
                        key={`product-${index}`} 
                        className={`flex-row items-center p-md ${index !== arr.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
                      >
                        <StyledView className="w-10 h-10 rounded-lg bg-surface-container items-center justify-center">
                          <MaterialIcons name="receipt-long" size={20} color={colors.primaryContainer} />
                        </StyledView>
                        <StyledView className="flex-1 ml-3">
                          <StyledText className="font-label-bold text-label-bold text-on-surface">{product.name}</StyledText>
                          <StyledText className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{product.quantitySold ?? 0} sold</StyledText>
                        </StyledView>
                        <StyledText className="font-label-bold text-label-bold text-on-surface">
                          {formatCurrency(product.revenue || 0)}
                        </StyledText>
                      </StyledView>
                    ))}
                  </StyledView>
                )}
              </StyledView>
            )}
          </>
        ) : null}
      </ScrollView>

      <StyledTouchableOpacity 
        onPress={() => router.push('/products/add')}
        className="absolute bottom-18 right-4 w-14 h-14 bg-secondary-container rounded-full shadow-lg items-center justify-center z-50 active:scale-95"
      >
        <MaterialIcons name="add" size={28} color={colors.onSecondaryContainer} />
      </StyledTouchableOpacity>
    </Container>
  );
}

import React, { useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { withUniwind } from 'uniwind';

// Uniwind wrapped core layout primitives
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

  // Clean implementation keeping original precision formatting
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  };

  return (
    <Container isScrollable={false} className="bg-background pt-12 flex-1">
      {/* TopAppBar Block */}
      <StyledView className="bg-surface border-b border-outline-variant/30 h-14 px-margin flex-row justify-between items-center z-50">
        <StyledView className="flex-row items-center gap-3">
          <StyledTouchableOpacity 
            onPress={() => router.push('/more')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed justify-center items-center bg-primary"
          >
            {user?.avatarUrl ? (
              <StyledImage 
                source={{ uri: user.profilePicture }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <StyledText className="text-on-primary text-body-lg font-bold">
                {user?.fullName?.charAt(0).toUpperCase() || 'O'}
              </StyledText>
            )}
          </StyledTouchableOpacity>
          <StyledView className="flex-col">
            <StyledText className="font-label-bold text-label-bold text-on-surface-variant">Welcome back</StyledText>
            <StyledText className="font-h1 text-h1 font-bold text-primary leading-tight">OjaPaddi</StyledText>
          </StyledView>
        </StyledView>
        <StyledTouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-surface-container/10 active:scale-95">
          <MaterialIcons name="notifications" size={24} className="text-primary" />
        </StyledTouchableOpacity>
      </StyledView>

      {/* Main Content Area */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading && !!summary} 
            onRefresh={loadData} 
            colors={[colors.primary]} 
          />
        }
      >
        {/* Loading Boundary */}
        {isLoading && !summary ? (
          <StyledView className="mt-24 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </StyledView>
        ) : error ? (
          /* Error Fallback Boundary */
          <StyledView className="mt-24 items-center p-6 bg-surface-container-low rounded-xl border border-outline-variant">
            <StyledText className="text-error text-center mb-4 text-body-lg font-semibold">{error}</StyledText>
            <StyledTouchableOpacity className="px-6 py-3 bg-primary rounded-xl" onPress={loadData}>
              <StyledText className="text-on-primary font-semibold">Retry Performance Load</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : summary ? (
          <>
            {/* Dynamic Welcome Greeting */}
            <StyledView className="flex-col gap-1 mb-gutter">
              <StyledText className="font-bold text-2xl pt-4 text-on-surface">
                Good morning, {user?.fullName?.split(' ')[0] || 'Seller'} 👋
              </StyledText>
              <StyledText className="font-body-lg text-body-lg text-on-surface-variant">Here's how your shop is performing today.</StyledText>
            </StyledView>

            {/* Performance Metric Cards utilizing design surfaces */}
            <StyledView className="flex-col gap-gutter mb-gutter">
              {/* Revenue Metric */}
              <Surface variant="primary-solid" className="rounded-xl p-lg items-center justify-center min-h-[110px]">
                <StyledText className="font-label-caps text-label-caps text-white/80 mb-2">REVENUE</StyledText>
                <StyledText className="text-3xl font-extrabold text-white">{formatCurrency(summary.totalRevenue)}</StyledText>
              </Surface>

              {/* Transactions Count Metric */}
              <Surface variant="outline" className="rounded-xl p-lg items-center justify-center min-h-[110px]">
                <StyledText className="font-label-caps text-label-caps text-on-surface-variant mb-2">SALES</StyledText>
                <StyledText className="text-3xl font-extrabold text-on-surface">{summary.totalSalesCount}</StyledText>
                <StyledText className="mt-2 text-on-surface-variant font-body-sm text-body-sm">Transactions processed</StyledText>
              </Surface>

              {/* Profit Metric */}
              <Surface variant="secondary-solid" className="rounded-xl p-lg items-center justify-center min-h-[110px]">
                <StyledText className="font-label-caps text-label-caps text-on-secondary-container mb-2">PROFIT</StyledText>
                <StyledText className="text-3xl font-extrabold text-on-secondary-container">{formatCurrency(summary.netProfit)}</StyledText>
              </Surface>
            </StyledView>

            {/* Contextual Warning Banner based on API inventory status */}
            {summary.lowStockCount > 0 && (
              <StyledView className="bg-secondary-container/20 border border-secondary-container rounded-xl p-md flex-row items-center gap-md mb-gutter">
                <StyledView className="w-10 h-10 rounded-full bg-secondary-container/20 items-center justify-center">
                  <MaterialIcons name="warning" size={20} className="text-secondary" />
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

            {/* Core Action Direct Routes */}
            <StyledView className="flex-row gap-sm mb-gutter">
              <StyledTouchableOpacity 
                onPress={() => router.push('/sales')}
                className="flex-1 items-center justify-center p-md bg-primary rounded-xl shadow-md active:scale-95"
              >
                <MaterialIcons name="shopping-cart" size={24} className="text-on-primary mb-1" />
                <StyledText className="font-label-bold text-label-bold text-on-primary">Record Sale</StyledText>
              </StyledTouchableOpacity>

              <StyledTouchableOpacity 
                onPress={() => router.push('/products/add')}
                className="flex-1 items-center justify-center p-md bg-surface-container-lowest border border-outline-variant rounded-xl active:scale-95"
              >
                <MaterialIcons name="inventory" size={24} className="text-primary mb-1" />
                <StyledText className="font-label-bold text-label-bold text-on-surface">Add Product</StyledText>
              </StyledTouchableOpacity>

              <StyledTouchableOpacity 
                onPress={() => router.push('/more')}
                className="flex-1 items-center justify-center p-md bg-surface-container-lowest border border-outline-variant rounded-xl active:scale-95"
              >
                <MaterialIcons name="payments" size={24} className="text-tertiary mb-1" />
                <StyledText className="font-label-bold text-label-bold text-on-surface">Add Expense</StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            {/* Dynamic Rendering of Top Products via Hook Payload */}
            <StyledView className="mb-6">
              <StyledView className="flex-row justify-between items-center mb-4">
                <StyledText className="font-h2 text-h2 text-on-surface">Top Products</StyledText>
                <StyledTouchableOpacity 
                  onPress={() => router.push('/products')}
                  className="flex-row items-center gap-1"
                >
                  <StyledText className="text-primary font-label-bold text-label-bold">See All</StyledText>
                  <MaterialIcons name="arrow-forward" size={16} className="text-primary" />
                </StyledTouchableOpacity>
              </StyledView>

              {!summary.topProducts || summary.topProducts.length === 0 ? (
                <StyledView className="p-8 items-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
                  <StyledText className="text-on-surface-variant text-body-sm font-medium">No sales recorded yet.</StyledText>
                </StyledView>
              ) : (
                <Surface variant="outline" className="overflow-hidden p-0 border border-outline-variant/50 rounded-xl bg-surface-container-lowest">
                  {summary.topProducts.map((product, index, arr) => (
                    <StyledView 
                      key={product.id || index} 
                      className={`flex-row justify-between items-center p-md ${index !== arr.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
                    >
                      <StyledView className="flex-row items-center gap-md">
                        <StyledView className="w-12 h-12 rounded-lg bg-surface-container items-center justify-center">
                          <MaterialIcons name="receipt-long" size={24} className="text-primary-container" />
                        </StyledView>
                        <StyledView>
                          <StyledText className="font-label-bold text-label-bold text-on-surface">{product.name}</StyledText>
                          <StyledText className="font-body-sm text-body-sm text-on-surface-variant">{product.quantitySold ?? 0} sold</StyledText>
                        </StyledView>
                      </StyledView>
                      <StyledText className="font-label-bold text-label-bold text-primary">
                        {formatCurrency(product.revenue || 0)}
                      </StyledText>
                    </StyledView>
                  ))}
                </Surface>
              )}
            </StyledView>
          </>
        ) : null}
      </ScrollView>

      {/* Primary Contextual FAB */}
      <StyledTouchableOpacity 
        onPress={() => router.push('/sales')}
        className="absolute bottom-6 right-4 w-14 h-14 bg-secondary-container rounded-full shadow-lg items-center justify-center z-50 active:scale-95"
      >
        <MaterialIcons name="add" size={28} className="text-on-secondary-container" />
      </StyledTouchableOpacity>
    </Container>
  );
}
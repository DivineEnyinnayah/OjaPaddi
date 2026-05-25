import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { summary, isLoading, fetchSummary, error } = useAnalytics();
  const router = useRouter();

  const loadData = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Container isScrollable={false} className="bg-background pt-12">
      <StyledView className="flex-row justify-between items-center px-4 py-4 mt-2">
        <StyledView>
          <StyledText className="text-[24px] font-black text-on-surface tracking-tight">Hello, {user?.fullName?.split(' ')[0] || 'Seller'} 👋</StyledText>
          <StyledText className="text-body-sm text-on-surface-variant mt-1">Here's how your business is doing</StyledText>
        </StyledView>
        <StyledTouchableOpacity className="shadow-sm shadow-black/10 elevation-2" onPress={() => router.push('/more')}>
          <StyledView className="w-11 h-11 rounded-full bg-primary justify-center items-center">
            <StyledText className="text-on-primary text-body-lg font-bold">{user?.fullName?.charAt(0).toUpperCase() || 'O'}</StyledText>
          </StyledView>
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading && !!summary} onRefresh={loadData} colors={['#1A6B3C']} />}
      >
        {isLoading && !summary ? (
          <StyledView className="mt-24 items-center">
            <ActivityIndicator size="large" color="#1A6B3C" />
          </StyledView>
        ) : error ? (
          <StyledView className="mt-24 items-center p-6">
            <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
            <StyledTouchableOpacity className="px-6 py-3 bg-primary rounded-xl" onPress={loadData}>
              <StyledText className="text-on-primary font-semibold">Retry</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : summary ? (
          <>
            <StyledView className="flex-row flex-wrap gap-3 mb-8 justify-between">
              <Surface variant="primary-solid" className="w-[48%] p-4 justify-between min-h-[110px]">
                <StyledText className="text-body-sm text-white/80 font-semibold mb-3">Total Revenue</StyledText>
                <StyledText className="text-[22px] font-extrabold text-white">{formatCurrency(summary.totalRevenue)}</StyledText>
              </Surface>

              <Surface variant="secondary-solid" className="w-[48%] p-4 justify-between min-h-[110px]">
                <StyledText className="text-body-sm text-on-secondary-container font-semibold mb-3">Net Profit</StyledText>
                <StyledText className="text-[22px] font-extrabold text-on-secondary-container">{formatCurrency(summary.netProfit)}</StyledText>
              </Surface>

              <Surface variant="outline" className="w-[48%] p-4 justify-between min-h-[110px]">
                <StyledText className="text-body-sm text-on-surface font-semibold mb-3">Total Sales</StyledText>
                <StyledText className="text-[22px] font-extrabold text-on-surface">{summary.totalSalesCount}</StyledText>
              </Surface>

              <Surface variant={summary.lowStockCount > 0 ? "warning" : "outline"} className="w-[48%] p-4 justify-between min-h-[110px]">
                <StyledText className={`text-body-sm font-semibold mb-3 ${summary.lowStockCount > 0 ? 'text-on-error-container' : 'text-on-surface'}`}>Low Stock Items</StyledText>
                <StyledText className={`text-[22px] font-extrabold ${summary.lowStockCount > 0 ? 'text-error' : 'text-on-surface'}`}>{summary.lowStockCount}</StyledText>
              </Surface>
            </StyledView>

            <StyledView className="mb-6">
              <StyledView className="flex-row justify-between items-center mb-4">
                <StyledText className="text-[18px] font-bold text-on-surface">Top Products</StyledText>
              </StyledView>

              {summary.topProducts?.length === 0 ? (
                <StyledView className="p-8 items-center bg-surface rounded-2xl border border-dashed border-outline">
                  <StyledText className="text-on-surface-variant text-body-sm">No sales recorded yet.</StyledText>
                </StyledView>
              ) : (
                <Surface variant="primary" className="overflow-hidden p-0 border border-outline-variant">
                  {summary.topProducts?.map((product, index) => (
                    <StyledView key={index} className="flex-row justify-between items-center p-4 border-b border-surface-variant">
                      <StyledView className="flex-row items-center gap-3">
                        <StyledView>
                          <StyledText className="text-[15px] font-semibold text-on-surface mb-1">{product.name}</StyledText>
                          <StyledText className="text-[13px] text-on-surface-variant">{product.quantitySold} sold</StyledText>
                        </StyledView>
                      </StyledView>
                      <StyledText className="text-[15px] font-bold text-primary">{formatCurrency(product.revenue)}</StyledText>
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

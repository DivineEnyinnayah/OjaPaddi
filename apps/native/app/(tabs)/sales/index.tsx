import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSales, type Sale } from '../../../hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Chip } from '@/components/ui/chip';
import { Plus, User, ShoppingCart } from 'phosphor-react-native';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { Skeleton } from '@/components/ui/skeleton';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

const PERIODS = [
  { label: 'Today', key: 'today' as const },
  { label: 'This Week', key: 'week' as const },
  { label: 'This Month', key: 'month' as const },
];

const PAYMENT_FILTERS = ['All', 'Paid', 'Unpaid', 'Partial'];

export default function SalesScreen() {
  const router = useRouter();
  const { sales, isLoading, error, fetchSales } = useSales();
  const colors = useThemeColor();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchSales();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success' as const;
      case 'unpaid': return 'error' as const;
      case 'partial': return 'warning' as const;
      default: return 'default' as const;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.soldAt);
      const now = new Date();

      if (selectedPeriod === 'today') {
        if (saleDate.toDateString() !== now.toDateString()) return false;
      } else if (selectedPeriod === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        if (saleDate < startOfWeek) return false;
      } else if (selectedPeriod === 'month') {
        if (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear()) return false;
      }

      if (paymentFilter !== 'all' && sale.paymentStatus !== paymentFilter) return false;

      return true;
    });
  }, [sales, selectedPeriod, paymentFilter]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
  }, [filteredSales]);

  const renderSale = ({ item }: { item: Sale }) => {
    const total = parseFloat(item.total);
    const itemCount = item.items?.length || 0;

    return (
      <StyledTouchableOpacity onPress={() => router.push(`/sales/${item.id}`)}>
        <Surface variant="outline" className="flex-row items-center p-4 mb-3 rounded-lg border border-outline-variant/30">
          <StyledView className={`size-11 rounded-full items-center justify-center mr-3 ${item.customerId ? 'bg-secondary-container/30' : 'bg-surface-container-highest'}`}>
            {item.customerId ? (
              <User size={22} color={colors.secondary} weight="bold" />
            ) : (
              <ShoppingCart size={22} color={colors.onSurfaceVariant} weight="bold" />
            )}
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-body-sm text-on-surface-variant mb-0.5">{item.reference}</StyledText>
            <StyledText className="text-body-lg font-bold text-on-surface text-balance leading-tight">
              {item.customerId ? 'Customer Sale' : 'Walk-in Customer'}
            </StyledText>
            <StyledText className="text-body-sm text-on-surface-variant mt-0.5 text-pretty">
              {formatDate(item.soldAt)}
            </StyledText>
          </StyledView>
          <StyledView className="items-end ml-3">
            <StyledText className="text-lg font-bold text-primary tabular-nums">
              ₦{total.toLocaleString()}
            </StyledText>
            <StyledText className="text-body-sm text-on-surface-variant mt-1 tabular-nums">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </StyledText>
            <Chip variant={getStatusColor(item.paymentStatus)} className="mt-1">
              {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
            </Chip>
          </StyledView>
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && sales?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background px-margin">
        <StyledView className="flex-col gap-2 mb-4">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </StyledView>
        <StyledView className="flex-row gap-2 mb-4 pl-6">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </StyledView>
        <StyledView className="flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} variant="outline" className="p-4 mb-3">
              <StyledView className="flex-row justify-between items-start mb-2">
                <StyledView className="flex-1 mr-3">
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-5 w-32 mb-1" />
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
      </Container>
    );
  }

  if (error && sales?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
        <Button onPress={() => fetchSales()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} withTabBar className="bg-background">
      <StyledView className="px-margin pt-2 pb-4">
        <StyledView className="flex-row justify-between items-end mb-4">
          <StyledView className="flex-1">
            <StyledText className="font-label-caps text-on-surface-variant">Total Revenue</StyledText>
            <StyledText className="font-h2 font-extrabold text-primary tabular-nums">
              ₦{totalRevenue.toLocaleString()}
            </StyledText>
          </StyledView>
          <StyledView className="bg-primary-container px-3 py-1.5 rounded-full">
            <StyledText className="font-label-bold text-on-primary-container">
              {filteredSales.length} sales
            </StyledText>
          </StyledView>
        </StyledView>

        <StyledView className="flex-row gap-2 mb-4">
          {PERIODS.map((period) => {
            const isActive = selectedPeriod === period.key;
            return (
              <StyledTouchableOpacity
                key={period.key}
                className={`flex-1 py-2.5 rounded-lg items-center ${isActive ? 'bg-primary' : 'bg-surface-container-lowest border border-outline-variant'}`}
                onPress={() => setSelectedPeriod(period.key)}
                accessibilityLabel={`Filter by ${period.label}`}
                accessibilityRole="button"
              >
                <StyledText className={`font-label-bold ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {period.label}
                </StyledText>
              </StyledTouchableOpacity>
            );
          })}
        </StyledView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {PAYMENT_FILTERS.map((filter) => {
            const filterKey = filter.toLowerCase();
            const isActive = paymentFilter === filterKey;
            return (
              <StyledTouchableOpacity
                key={filter}
                className={`px-4 py-1.5 rounded-full mr-2 border ${isActive ? 'bg-primary border-primary' : 'bg-surface-container-lowest border-outline-variant'}`}
                onPress={() => setPaymentFilter(filterKey)}
                accessibilityLabel={`Filter by ${filter}`}
                accessibilityRole="button"
              >
                <StyledText className={`text-label-caps font-semibold ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {filter}
                </StyledText>
              </StyledTouchableOpacity>
            );
          })}
        </ScrollView>
      </StyledView>

      <StyledView className="px-margin mb-2 flex-row justify-between items-center">
        <StyledText className="font-h2 text-on-surface text-balance">Sales History</StyledText>
        <StyledText className="font-body-sm text-on-surface-variant">{filteredSales.length} transactions</StyledText>
      </StyledView>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSales} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-24 px-6">
            <Image
              source={{ uri: ILLUSTRATIONS.emptySales }}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center text-pretty">
              No sales recorded yet. Record your first sale!
            </StyledText>
            <Button size="lg" className="mt-6" onPress={() => router.push('/sales/record')}>
              Record a Sale
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute right-4 size-14 rounded-full bg-primary justify-center items-center shadow-md z-[var(--z-fab)] active:scale-95"
        style={{ bottom: TAB_BAR_OFFSET + 12 }}
        onPress={() => router.push('/sales/record')}
        accessibilityLabel="Record new sale"
        accessibilityRole="button"
      >
        <Plus size={28} color={colors.onPrimary} />
      </StyledTouchableOpacity>
    </Container>
  );
}

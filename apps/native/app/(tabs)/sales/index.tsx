import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSales, type Sale } from '../../../hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Chip } from '@/components/ui/chip';
import { Plus, User, ShoppingCart, Storefront, Bell, Receipt } from 'phosphor-react-native';
import { withUniwind } from 'uniwind';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { radius, spacing } from '@/constants/tokens';

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

  const dueReminders = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.orderType !== 'supermarket' || !s.expectedPaymentDate || s.paymentStatus === 'paid') {
        return false;
      }
      const dueDate = new Date(s.expectedPaymentDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 2; // due within 2 days or overdue
    });
  }, [sales]);

  const renderSale = ({ item }: { item: Sale }) => {
    const total = parseFloat(item.total);
    const itemCount = item.items?.length || 0;
    const isSupermarket = item.orderType === 'supermarket';
    const isOverdue = item.paymentStatus === 'unpaid' && !!item.expectedPaymentDate && new Date(item.expectedPaymentDate) < new Date();

    return (
      <StyledTouchableOpacity
        onPress={() => router.push(`/sales/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`View sale ${item.reference}`}
      >
        <StyledView
          className={`mb-3 flex-row items-center rounded-card border bg-card p-4 ${
            isOverdue ? 'border-danger bg-danger-soft' : 'border-border'
          }`}
        >
          <StyledView
            className={`mr-3 h-11 w-11 items-center justify-center rounded-full ${
              isSupermarket ? 'bg-accent-soft' : item.customerId ? 'bg-brand-soft' : 'bg-card border border-border'
            }`}
          >
            {isSupermarket ? (
              <Storefront size={22} color={colors.accent} weight="bold" />
            ) : item.customerId ? (
              <User size={22} color={colors.brand} weight="bold" />
            ) : (
              <ShoppingCart size={22} color={colors.muted} weight="bold" />
            )}
          </StyledView>
          <StyledView className="flex-1">
            <StyledView className="mb-0.5 flex-row items-center gap-1.5">
              <StyledText className="text-body-sm text-muted">{item.reference}</StyledText>
              {isSupermarket && (
                <StyledView className="rounded bg-accent-soft px-1.5 py-0.5">
                  <StyledText className="text-label-sm font-bold text-accent">Store</StyledText>
                </StyledView>
              )}
            </StyledView>
            <StyledText className="text-body-lg font-bold leading-tight text-ink">
              {isSupermarket ? 'Supermarket Supply' : item.customerId ? 'Customer Sale' : 'Walk-in Customer'}
            </StyledText>
            {isSupermarket && item.expectedPaymentDate ? (
              <StyledText className="mt-0.5 text-label-bold font-semibold text-accent">
                Due: {new Date(item.expectedPaymentDate).toLocaleDateString()}
              </StyledText>
            ) : (
              <StyledText className="mt-0.5 text-body-sm text-muted">
                {formatDate(item.soldAt)}
              </StyledText>
            )}
          </StyledView>
          <StyledView className="ml-3 items-end">
            <StyledText className="text-card-title font-bold tabular-nums text-ink">
              ₦{total.toLocaleString()}
            </StyledText>
            <StyledText className="mt-1 text-body-sm tabular-nums text-muted">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </StyledText>
            <Chip variant={getStatusColor(item.paymentStatus)} className="mt-1">
              {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
            </Chip>
          </StyledView>
        </StyledView>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && sales?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background px-gutter">
        <StyledView className="mb-4 flex-col gap-2">
          <Skeleton className="mb-2 h-10 w-3/4" />
          <Skeleton className="h-12 w-full rounded-input" />
        </StyledView>
        <StyledView className="mb-4 flex-row gap-2 pl-6">
          <Skeleton className="h-8 w-16 rounded-pill" />
          <Skeleton className="h-8 w-20 rounded-pill" />
          <Skeleton className="h-8 w-24 rounded-pill" />
        </StyledView>
        <StyledView className="flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StyledView key={i} className="mb-3 rounded-card border border-border bg-card p-4">
              <StyledView className="mb-2 flex-row justify-between">
                <StyledView className="mr-3 flex-1">
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="mb-1 h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </StyledView>
                <Skeleton className="h-6 w-16" />
              </StyledView>
            </StyledView>
          ))}
        </StyledView>
      </Container>
    );
  }

  if (error && sales?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background items-center justify-center p-6">
        <StyledText className="mb-4 text-center text-body-lg text-danger">{error}</StyledText>
        <Button onPress={() => fetchSales()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} withTabBar className="bg-background">
      <StyledView className="px-gutter pt-2 pb-4">
        {/* Due Payment Reminder Alert Banner */}
        {dueReminders.length > 0 && (
          <StyledView className="mb-4 rounded-card border border-accent/30 bg-accent-soft p-3.5">
            <StyledView className="mb-1.5 flex-row items-center gap-2">
              <Bell size={18} color={colors.accent} weight="fill" />
              <StyledText className="text-body-sm font-bold text-accent">
                Payment Due Reminders ({dueReminders.length})
              </StyledText>
            </StyledView>
            {dueReminders.slice(0, 2).map((rem) => (
              <StyledTouchableOpacity
                key={rem.id}
                onPress={() => router.push(`/sales/${rem.id}`)}
                className="min-h-[44px] flex-row items-center justify-between py-1"
                accessibilityRole="button"
                accessibilityLabel={`View overdue sale ${rem.reference}`}
              >
                <StyledText className="text-label-bold font-medium text-accent">
                  {rem.reference} (Due: {new Date(rem.expectedPaymentDate!).toLocaleDateString()})
                </StyledText>
                <StyledText className="text-label-bold font-bold text-accent">
                  ₦{parseFloat(rem.total).toLocaleString()}
                </StyledText>
              </StyledTouchableOpacity>
            ))}
          </StyledView>
        )}

        <StyledView className="mb-4 flex-row items-end justify-between">
          <StyledView className="flex-1">
            <StyledText className="text-label font-label-caps text-muted">Total Revenue</StyledText>
            <StyledText className="text-hero font-extrabold tabular-nums text-ink">
              ₦{totalRevenue.toLocaleString()}
            </StyledText>
          </StyledView>
          <StyledView className="rounded-pill bg-brand-soft px-3 py-1.5">
            <StyledText className="text-label-bold text-brand">
              {filteredSales.length} sales
            </StyledText>
          </StyledView>
        </StyledView>

        <StyledView className="mb-4 flex-row gap-2">
          {PERIODS.map((period) => {
            const isActive = selectedPeriod === period.key;
            return (
              <StyledTouchableOpacity
                key={period.key}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-input py-2.5 ${
                  isActive ? 'bg-brand' : 'border border-border bg-card'
                }`}
                onPress={() => setSelectedPeriod(period.key)}
                accessibilityLabel={`Filter by ${period.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <StyledText className={`text-label-bold ${isActive ? 'text-card' : 'text-muted'}`}>
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
                className={`mr-2 min-h-[44px] items-center justify-center rounded-pill border px-4 py-1.5 ${
                  isActive ? 'border-brand bg-brand' : 'border-border bg-card'
                }`}
                onPress={() => setPaymentFilter(filterKey)}
                accessibilityLabel={`Filter by ${filter}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <StyledText className={`text-label-caps font-semibold ${isActive ? 'text-card' : 'text-muted'}`}>
                  {filter}
                </StyledText>
              </StyledTouchableOpacity>
            );
          })}
        </ScrollView>
      </StyledView>

      <StyledView className="mb-2 flex-row items-center justify-between px-gutter">
        <StyledText className="text-section font-bold text-ink">Sales History</StyledText>
        <StyledText className="text-body-sm text-muted">{filteredSales.length} transactions</StyledText>
      </StyledView>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: TAB_BAR_OFFSET + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSales} tintColor={colors.brand} colors={[colors.brand]} />
        }
        ListEmptyComponent={
          <StyledView className="mt-24 items-center px-6">
            <StyledView className="mb-4 h-20 w-20 items-center justify-center rounded-input border border-border bg-card">
              <Receipt size={40} color={colors.muted} weight="duotone" />
            </StyledView>
            <StyledText className="mt-4 text-center text-body-lg text-muted">
              No sales recorded yet. Record your first sale!
            </StyledText>
            <Button size="lg" className="mt-6" onPress={() => router.push('/sales/record')}>
              Record a Sale
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute right-4 h-14 w-14 items-center justify-center rounded-pill bg-brand shadow-lg active:scale-95"
        style={{ bottom: TAB_BAR_OFFSET + 12, borderRadius: radius.pill }}
        onPress={() => router.push('/sales/record')}
        accessibilityLabel="Record new sale"
        accessibilityRole="button"
      >
        <Plus size={28} color={colors.card} />
      </StyledTouchableOpacity>
    </Container>
  );
}
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSales, type Sale } from '../../../hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Chip } from '@/components/ui/chip';
import { MaterialIcons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';

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

  const renderSale = ({ item }: { item: Sale }) => {
    const total = parseFloat(item.total);
    const itemCount = item.items?.length || 0;

    return (
      <StyledTouchableOpacity onPress={() => {}}>
        <Surface variant="outline" className="flex-col p-4 mb-3">
          <StyledView className="flex-row justify-between items-start mb-2">
            <StyledView className="flex-1 mr-3">
              <StyledText className="text-body-sm text-outline mb-0.5">{item.reference}</StyledText>
              <StyledText className="text-base font-semibold text-on-surface">
                {item.customerId ? 'Customer Sale' : 'Walk-in Customer'}
              </StyledText>
              <StyledText className="text-body-sm text-on-surface-variant mt-0.5">
                {formatDate(item.soldAt)}
              </StyledText>
            </StyledView>
            <StyledView className="items-end">
              <StyledText className="text-lg font-bold text-primary">
                ₦{total.toLocaleString()}
              </StyledText>
            </StyledView>
          </StyledView>

          <StyledView className="flex-row justify-between items-center mt-2 pt-2 border-t border-outline-variant/50">
            <StyledText className="text-body-sm text-on-surface-variant">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </StyledText>
            <Chip variant={getStatusColor(item.paymentStatus)}>
              {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
            </Chip>
          </StyledView>
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && sales?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  if (error && sales?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background pt-12 items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
        <Button onPress={() => fetchSales()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} withTabBar className="bg-background pt-12">
      <StyledView className="px-6 py-4 mt-2">
        <StyledText className="text-4xl font-black text-on-surface tracking-tight">Sales History</StyledText>
      </StyledView>

      <StyledView className="flex-row mx-6 mb-4 bg-surface-container rounded-lg p-1">
        {PERIODS.map((period) => {
          const isActive = selectedPeriod === period.key;
          return (
            <StyledTouchableOpacity
              key={period.key}
              className={`flex-1 py-2 rounded-md items-center ${isActive ? 'bg-surface-container-lowest shadow-sm' : ''}`}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <StyledText className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                {period.label}
              </StyledText>
            </StyledTouchableOpacity>
          );
        })}
      </StyledView>

      <StyledView className="mb-4 pl-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PAYMENT_FILTERS.map((filter) => {
            const filterKey = filter.toLowerCase();
            const isActive = paymentFilter === filterKey;
            return (
              <StyledTouchableOpacity
                key={filter}
                className={`px-4 py-1.5 rounded-full mr-2 border ${isActive ? 'bg-primary border-primary' : 'bg-surface-container-lowest border-outline-variant'}`}
                onPress={() => setPaymentFilter(filterKey)}
              >
                <StyledText className={`text-label-caps font-semibold ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {filter}
                </StyledText>
              </StyledTouchableOpacity>
            );
          })}
        </ScrollView>
      </StyledView>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSales} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-24">
            <Image
              source={{ uri: ILLUSTRATIONS.emptySales }}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center">
              No sales recorded yet. Record your first sale!
            </StyledText>
            <Button size="lg" className="mt-6" onPress={() => router.push('/sales/record')}>
              Record a Sale
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md shadow-black/30 elevation-5"
        onPress={() => router.push('/sales/record')}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </StyledTouchableOpacity>
    </Container>
  );
}

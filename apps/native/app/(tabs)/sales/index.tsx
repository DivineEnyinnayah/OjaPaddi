import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSales, type Sale } from '../../../hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Chip } from '@/components/ui/chip';
import { Ionicons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

export default function SalesScreen() {
  const router = useRouter();
  const { sales, isLoading, error, fetchSales } = useSales();
  const colors = useThemeColor();

  useEffect(() => {
    fetchSales();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'unpaid': return 'error';
      case 'partial': return 'warning';
      default: return 'outline';
    }
  };

  const renderSale = ({ item }: { item: Sale }) => {
    const total = parseFloat(item.total);

    return (
      <StyledTouchableOpacity onPress={() => {/* router.push({ pathname: '/sales/[id]', params: { id: item.id } }) */}}>
        <Surface variant="outline" className="flex-col p-4 mb-3">
          <StyledView className="flex-row justify-between items-center mb-2">
            <StyledView>
              <StyledText className="text-base font-semibold text-on-surface">{item.customerId ? 'Customer Sale' : 'Walk-in Customer'}</StyledText>
              <StyledText className="text-body-sm text-on-surface-variant">{item.reference} • {formatDate(item.soldAt)}</StyledText>
            </StyledView>
            <StyledText className="text-lg font-bold text-primary">₦{total.toLocaleString()}</StyledText>
          </StyledView>
          
          <StyledView className="flex-row justify-between items-center mt-2">
            <StyledText className="text-body-sm text-on-surface-variant">{item.items?.length || 0} items</StyledText>
            <Chip variant={getStatusColor(item.paymentStatus) as any}>
              {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
            </Chip>
          </StyledView>
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && sales?.length === 0) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  if (error && sales?.length === 0) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
        <Button onPress={() => fetchSales()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} className="bg-background pt-12">
      <StyledView className="flex-row justify-between items-center px-6 py-4 mt-2">
        <StyledText className="text-4xl font-black text-on-surface tracking-tight">Sales</StyledText>
      </StyledView>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSales} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-24">
            <Ionicons name="receipt-outline" size={64} color={colors.emptyStateIcon} />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center">No sales recorded yet. Record your first sale!</StyledText>
            <Button
              size="lg"
              className="mt-6"
              onPress={() => {/* router.push('/sales/add') */}}
            >
              Record a Sale
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md shadow-black/30 elevation-5"
        onPress={() => {/* router.push('/sales/add') */}}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </StyledTouchableOpacity>
    </Container>
  );
}

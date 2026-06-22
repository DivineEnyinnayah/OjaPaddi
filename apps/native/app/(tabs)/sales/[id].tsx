import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { Chip } from '@/components/ui/chip';
import { useSales, type Sale, type SaleItem } from '../../../hooks/useSales';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

const PAYMENT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  cash: 'payments',
  transfer: 'account-balance',
  pos: 'credit-card',
  other: 'more-horiz',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Transfer',
  pos: 'POS',
  other: 'Other',
};

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getSaleById, voidSale, isLoading } = useSales();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const [sale, setSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (!id) return;
    getSaleById(id as string).then((fetched) => {
      if (fetched) setSale(fetched);
    });
  }, [id]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success' as const;
      case 'unpaid': return 'error' as const;
      case 'partial': return 'warning' as const;
      default: return 'default' as const;
    }
  };

  const handleVoidSale = () => {
    Alert.alert(
      'Void Sale',
      'Are you sure you want to void this sale? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void Sale',
          style: 'destructive',
          onPress: async () => {
            try {
              await voidSale(id as string);
              Alert.alert('Sale voided', 'The sale has been successfully voided.');
              router.back();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to void sale');
            }
          },
        },
      ]
    );
  };

  if (isLoading && !sale) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  if (!sale) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <StyledText className="text-base text-on-surface-variant mb-4">Sale not found</StyledText>
        <Button onPress={() => router.back()}>Go Back</Button>
      </Container>
    );
  }

  const total = parseFloat(sale.total);
  const subtotal = parseFloat(sale.subtotal);
  const discount = parseFloat(sale.discount);
  const amountPaid = parseFloat(sale.amountPaid);
  const balance = total - amountPaid;

  return (
    <Container isScrollable={false} className="bg-background">
      <StyledView className="absolute top-12 left-6 z-10 w-12 h-12 bg-surface rounded-full justify-center items-center shadow-sm shadow-black/10 elevation-2">
        <StyledTouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingTop: 88, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StyledView className="px-6">
          <StyledText className="text-2xl font-bold text-on-surface mb-5">Sale Details</StyledText>

          <Surface variant="outline" className="p-4 mb-4">
            <StyledView className="flex-row justify-between items-start mb-3">
              <StyledView className="flex-1 mr-3">
                <StyledText className="text-body-sm text-outline mb-1">{sale.reference}</StyledText>
                <StyledText className="text-base text-on-surface-variant">{formatDate(sale.soldAt)}</StyledText>
              </StyledView>
              <Chip variant={getStatusVariant(sale.paymentStatus)}>
                {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
              </Chip>
            </StyledView>
            <StyledView className="h-[1px] bg-outline-variant/30 my-3" />
            <StyledView className="flex-row items-center">
              <MaterialIcons name="person-outline" size={20} color={colors.onSurfaceVariant} />
              <StyledText className="text-base text-on-surface ml-2">
                {sale.customerId ? 'Customer Sale' : 'Walk-in Customer'}
              </StyledText>
            </StyledView>
          </Surface>

          <Surface variant="outline" className="p-4 mb-4">
            <StyledView className="flex-row items-center mb-2">
              <MaterialIcons name={PAYMENT_ICONS[sale.paymentMethod] || 'more-horiz'} size={20} color={colors.primary} />
              <StyledText className="text-base font-semibold text-on-surface ml-2">
                {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
              </StyledText>
            </StyledView>
          </Surface>

          <Surface variant="outline" className="p-4 mb-4">
            <StyledText className="text-base font-bold text-on-surface mb-4">Items</StyledText>

            <StyledView className="flex-row pb-2 border-b border-outline-variant/30">
              <StyledText className="flex-[3] text-label-caps text-outline font-semibold">Product</StyledText>
              <StyledText className="flex-1 text-label-caps text-outline font-semibold text-right">Qty</StyledText>
              <StyledText className="flex-[2] text-label-caps text-outline font-semibold text-right">Price</StyledText>
              <StyledText className="flex-[2] text-label-caps text-outline font-semibold text-right">Total</StyledText>
            </StyledView>

            {sale.items.map((item, index) => (
              <StyledView
                key={item.productId || index}
                className="flex-row py-3 items-center border-b border-outline-variant/10"
              >
                <StyledText className="flex-[3] text-body-sm text-on-surface" numberOfLines={1}>{item.productName}</StyledText>
                <StyledText className="flex-1 text-body-sm text-on-surface-variant text-right">{item.quantity}</StyledText>
                <StyledText className="flex-[2] text-body-sm text-on-surface-variant text-right">{formatCurrency(item.unitPrice)}</StyledText>
                <StyledText className="flex-[2] text-body-sm text-on-surface font-semibold text-right">{formatCurrency(item.total)}</StyledText>
              </StyledView>
            ))}

            <StyledView className="h-[1px] bg-outline-variant/30 my-3" />

            <StyledView className="flex-row justify-between mb-1">
              <StyledText className="text-body-sm text-on-surface-variant">Subtotal</StyledText>
              <StyledText className="text-body-sm text-on-surface">{formatCurrency(subtotal)}</StyledText>
            </StyledView>

            {discount > 0 && (
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-body-sm text-on-surface-variant">Discount</StyledText>
                <StyledText className="text-body-sm text-on-surface-variant">-{formatCurrency(discount)}</StyledText>
              </StyledView>
            )}

            <StyledView className="flex-row justify-between mt-2 pt-2 border-t border-outline-variant/30">
              <StyledText className="text-base font-bold text-on-surface">Total</StyledText>
              <StyledText className="text-lg font-bold text-primary">{formatCurrency(total)}</StyledText>
            </StyledView>

            {sale.paymentStatus !== 'paid' && (
              <>
                <StyledView className="h-[1px] bg-outline-variant/30 my-3" />
                <StyledView className="flex-row justify-between mb-1">
                  <StyledText className="text-body-sm text-on-surface-variant">Amount Paid</StyledText>
                  <StyledText className="text-body-sm text-on-surface">{formatCurrency(amountPaid)}</StyledText>
                </StyledView>
                <StyledView className="flex-row justify-between">
                  <StyledText className="text-body-sm font-semibold text-error">Balance</StyledText>
                  <StyledText className="text-body-sm font-semibold text-error">{formatCurrency(balance)}</StyledText>
                </StyledView>
              </>
            )}
          </Surface>

          {sale.notes ? (
            <Surface variant="outline" className="p-4 mb-4">
              <StyledView className="flex-row items-center mb-2">
                <MaterialIcons name="notes" size={20} color={colors.onSurfaceVariant} />
                <StyledText className="text-base font-semibold text-on-surface ml-2">Notes</StyledText>
              </StyledView>
              <StyledText className="text-body-sm text-on-surface-variant leading-5">{sale.notes}</StyledText>
            </Surface>
          ) : null}
        </StyledView>
      </ScrollView>

      <StyledView
        className="absolute left-0 right-0 px-5 py-4 bg-surface border-t border-outline-variant/20"
        style={{ bottom: insets.bottom + TAB_BAR_OFFSET }}
      >
        <StyledTouchableOpacity
          className="w-full py-3.5 rounded-button border-2 border-error justify-center items-center flex-row active:opacity-80"
          onPress={handleVoidSale}
        >
          <MaterialIcons name="delete-outline" size={20} color={colors.error} />
          <StyledText className="text-base font-semibold text-error ml-2">Void Sale</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </Container>
  );
}

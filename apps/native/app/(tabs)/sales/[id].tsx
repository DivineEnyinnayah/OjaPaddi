import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Person,
  CreditCard,
  Bank,
  DotsThree,
  FileText,
  Trash,
  ArrowUUpLeft,
  Storefront,
  Calendar,
  Money,
  CheckCircle,
  X,
} from 'phosphor-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { Chip } from '@/components/ui/chip';
import { useSales, type Sale, type SaleItem } from '../../../hooks/useSales';
import { withUniwind } from 'uniwind';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledScrollView = withUniwind(ScrollView);

const PAYMENT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  cash: CreditCard,
  transfer: Bank,
  pos: CreditCard,
  cheque: Money,
  other: DotsThree,
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Transfer',
  pos: 'POS',
  cheque: 'Cheque',
  other: 'Other',
};

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getSaleById, voidSale, returnProducts, isLoading } = useSales();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [sale, setSale] = useState<Sale | null>(null);

  // Return modal states
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, string>>({});
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSaleById(id as string).then((fetched) => {
      if (fetched) setSale(fetched);
    });
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success' as const;
      case 'unpaid':
        return 'error' as const;
      case 'partial':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const handleVoidSale = () => {
    toast.confirm({
      title: 'Void Sale',
      message: 'Are you sure you want to void this sale? This action cannot be undone.',
      confirmLabel: 'Void Sale',
      destructive: true,
      onConfirm: async () => {
        try {
          await voidSale(id as string);
          toast.success('The sale has been successfully voided.', 'Sale voided');
          router.back();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Failed to void sale');
        }
      },
    });
  };

  const handleProcessReturn = async () => {
    if (!sale) return;

    const returnEntries: { saleItemId: string; quantity: number }[] = [];

    for (const item of sale.items) {
      const key = item.id || item.productId;
      const qty = parseInt(returnQuantities[key] || '0', 10);
      if (qty > 0) {
        returnEntries.push({
          saleItemId: item.id || item.productId,
          quantity: qty,
        });
      }
    }

    if (returnEntries.length === 0) {
      toast.error('Please specify at least 1 product return quantity');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const updated = await returnProducts(sale.id, {
        returns: returnEntries,
        notes: returnNotes.trim() || undefined,
      });
      setSale(updated);
      setReturnModalVisible(false);
      setReturnQuantities({});
      setReturnNotes('');
      toast.success('Products returned and sale recalculated successfully!', 'Return Processed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record return');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (isLoading && !sale) {
    return (
      <Container isScrollable={false} className="bg-background px-margin">
        <StyledView className="flex-col gap-2 mb-4">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </StyledView>
        <StyledView className="flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} variant="outline" className="p-4 mb-3">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </Surface>
          ))}
        </StyledView>
      </Container>
    );
  }

  if (!sale) {
    return (
      <Container isScrollable={false} className="bg-background items-center justify-center">
        <StyledText className="text-base text-on-surface-variant mb-4">Sale not found</StyledText>
        <Button onPress={() => router.back()}>Go Back</Button>
      </Container>
    );
  }

  const total = parseFloat(sale.total);
  const subtotal = parseFloat(sale.subtotal);
  const discount = parseFloat(sale.discount || '0');
  const returnedAmount = parseFloat(sale.returnedAmount || '0');
  const amountPaid = parseFloat(sale.amountPaid);
  const balance = total - amountPaid;
  const PaymentIcon = PAYMENT_ICONS[sale.paymentMethod] || DotsThree;
  const isSupermarket = sale.orderType === 'supermarket';

  return (
    <Container isScrollable={false} className="bg-background">
      <StyledView className="absolute top-4 left-6 z-10 w-12 h-12 bg-surface rounded-full justify-center items-center shadow-sm shadow-black/10 elevation-2">
        <StyledTouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingTop: 88, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StyledView className="px-6">
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledText className="text-2xl font-bold text-on-surface">Order Details</StyledText>
            {isSupermarket && (
              <StyledView className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                <StyledText className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Supermarket Order
                </StyledText>
              </StyledView>
            )}
          </StyledView>

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

            {isSupermarket && sale.expectedPaymentDate && (
              <StyledView className="my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-row items-center gap-2">
                <Calendar size={18} color="#D97706" />
                <StyledView>
                  <StyledText className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    Payment Due Date: {new Date(sale.expectedPaymentDate).toLocaleDateString()}
                  </StyledText>
                  <StyledText className="text-[11px] text-amber-700 dark:text-amber-400">
                    Reminder notification active
                  </StyledText>
                </StyledView>
              </StyledView>
            )}

            <StyledView className="h-[1px] bg-outline-variant/30 my-3" />
            <StyledView className="flex-row items-center">
              {isSupermarket ? (
                <Storefront size={20} color={colors.primary} />
              ) : (
                <Person size={20} color={colors.onSurfaceVariant} />
              )}
              <StyledText className="text-base text-on-surface ml-2 font-semibold">
                {sale.customer?.name || (sale.customerId ? 'Registered Client' : 'Walk-in Customer')}
              </StyledText>
            </StyledView>
            {sale.customer?.address && (
              <StyledText className="text-xs text-on-surface-variant ml-7 mt-0.5">
                {sale.customer.address}
              </StyledText>
            )}
          </Surface>

          <Surface variant="outline" className="p-4 mb-4">
            <StyledView className="flex-row items-center mb-1">
              <PaymentIcon size={20} color={colors.primary} />
              <StyledText className="text-base font-semibold text-on-surface ml-2">
                {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
              </StyledText>
            </StyledView>
          </Surface>

          <Surface variant="outline" className="p-4 mb-4">
            <StyledView className="flex-row justify-between items-center mb-3">
              <StyledText className="text-base font-bold text-on-surface">Items</StyledText>
              <StyledTouchableOpacity
                onPress={() => setReturnModalVisible(true)}
                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg active:opacity-70"
              >
                <ArrowUUpLeft size={16} color={colors.primary} />
                <StyledText className="text-xs font-bold text-primary">Record Return</StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            <StyledView className="flex-row pb-2 border-b border-outline-variant/30">
              <StyledText className="flex-[3] text-label-caps text-outline font-semibold">Product</StyledText>
              <StyledText className="flex-1 text-label-caps text-outline font-semibold text-right">Qty</StyledText>
              <StyledText className="flex-[2] text-label-caps text-outline font-semibold text-right">Price</StyledText>
              <StyledText className="flex-[2] text-label-caps text-outline font-semibold text-right">Total</StyledText>
            </StyledView>

            {sale.items.map((item, index) => {
              const ret = item.returnedQuantity || 0;
              const netQty = item.quantity - ret;
              return (
                <StyledView
                  key={item.id || item.productId || index}
                  className="py-3 border-b border-outline-variant/10"
                >
                  <StyledView className="flex-row items-center">
                    <StyledText className="flex-[3] text-body-sm text-on-surface font-medium" numberOfLines={1}>
                      {item.productName}
                    </StyledText>
                    <StyledText className="flex-1 text-body-sm text-on-surface-variant text-right">
                      {item.quantity}
                    </StyledText>
                    <StyledText className="flex-[2] text-body-sm text-on-surface-variant text-right">
                      {formatCurrency(item.unitPrice)}
                    </StyledText>
                    <StyledText className="flex-[2] text-body-sm text-on-surface font-semibold text-right">
                      {formatCurrency(item.total)}
                    </StyledText>
                  </StyledView>
                  {ret > 0 && (
                    <StyledView className="mt-1 flex-row justify-between bg-error/10 px-2 py-1 rounded">
                      <StyledText className="text-[11px] font-semibold text-error">
                        Returned: {ret} unit(s)
                      </StyledText>
                      <StyledText className="text-[11px] font-bold text-on-surface">
                        Net kept: {netQty} ({formatCurrency(netQty * item.unitPrice)})
                      </StyledText>
                    </StyledView>
                  )}
                </StyledView>
              );
            })}

            <StyledView className="h-[1px] bg-outline-variant/30 my-3" />

            <StyledView className="flex-row justify-between mb-1">
              <StyledText className="text-body-sm text-on-surface-variant">Subtotal</StyledText>
              <StyledText className="text-body-sm text-on-surface">{formatCurrency(subtotal)}</StyledText>
            </StyledView>

            {discount > 0 && (
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-body-sm text-on-surface-variant">Discount</StyledText>
                <StyledText className="text-body-sm text-error">-{formatCurrency(discount)}</StyledText>
              </StyledView>
            )}

            {returnedAmount > 0 && (
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-body-sm text-error font-medium">Returns Deducted</StyledText>
                <StyledText className="text-body-sm font-bold text-error">
                  -{formatCurrency(returnedAmount)}
                </StyledText>
              </StyledView>
            )}

            <StyledView className="flex-row justify-between mt-2 pt-2 border-t border-outline-variant/30">
              <StyledText className="text-base font-bold text-on-surface">Recalculated Total</StyledText>
              <StyledText className="text-lg font-bold text-primary">{formatCurrency(total)}</StyledText>
            </StyledView>

            <StyledView className="h-[1px] bg-outline-variant/30 my-3" />
            <StyledView className="flex-row justify-between mb-1">
              <StyledText className="text-body-sm text-on-surface-variant">Amount Paid</StyledText>
              <StyledText className="text-body-sm text-on-surface">{formatCurrency(amountPaid)}</StyledText>
            </StyledView>
            <StyledView className="flex-row justify-between">
              <StyledText className="text-body-sm font-semibold text-error">Balance Due</StyledText>
              <StyledText className="text-body-sm font-semibold text-error">
                {formatCurrency(Math.max(0, balance))}
              </StyledText>
            </StyledView>
          </Surface>

          {sale.notes ? (
            <Surface variant="outline" className="p-4 mb-4">
              <StyledView className="flex-row items-center mb-2">
                <FileText size={20} color={colors.onSurfaceVariant} />
                <StyledText className="text-base font-semibold text-on-surface ml-2">Notes & Terms</StyledText>
              </StyledView>
              <StyledText className="text-body-sm text-on-surface-variant leading-5">{sale.notes}</StyledText>
            </Surface>
          ) : null}

          <StyledView className="mt-4 pt-4 border-t border-outline-variant/20 gap-3">
            <StyledTouchableOpacity
              className="w-full py-3.5 rounded-button border-2 border-error bg-error/10 justify-center items-center flex-row active:opacity-80"
              onPress={handleVoidSale}
            >
              <Trash size={20} color={colors.error} />
              <StyledText className="text-base font-semibold text-error ml-2">Void Sale</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* RECORD PRODUCT RETURN MODAL */}
      <Modal
        visible={returnModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setReturnModalVisible(false)}>
          <StyledView className="bg-background rounded-t-3xl max-h-[85%] w-full" onStartShouldSetResponder={() => true}>
            <StyledView className="items-center pt-3 pb-1">
              <StyledView className="w-12 h-1.5 rounded-full bg-outline/40" />
            </StyledView>

            <StyledScrollView className="px-6 pb-8" keyboardShouldPersistTaps="handled">
              <StyledView className="flex-row justify-between items-center my-3">
                <StyledText className="text-lg font-bold text-on-surface">Record Returned Products</StyledText>
                <StyledTouchableOpacity onPress={() => setReturnModalVisible(false)}>
                  <X size={22} color={colors.onSurfaceVariant} />
                </StyledTouchableOpacity>
              </StyledView>

              <StyledText className="text-xs text-on-surface-variant mb-4">
                Specify quantities returned from this delivery. The overall sale total and customer ledger will automatically recalculate.
              </StyledText>

              {sale.items.map((item) => {
                const key = item.id || item.productId;
                const maxReturnable = item.quantity - (item.returnedQuantity || 0);

                return (
                  <Surface key={key} variant="primary" className="p-3.5 mb-3 rounded-xl border border-outline-variant/20">
                    <StyledView className="flex-row justify-between items-start mb-2">
                      <StyledView className="flex-1 mr-2">
                        <StyledText className="text-sm font-bold text-on-surface">{item.productName}</StyledText>
                        <StyledText className="text-xs text-on-surface-variant">
                          Supplied: {item.quantity} | Available to return: {maxReturnable}
                        </StyledText>
                      </StyledView>
                      <StyledText className="text-xs font-bold text-primary">
                        {formatCurrency(item.unitPrice)} each
                      </StyledText>
                    </StyledView>

                    <StyledView className="flex-row items-center gap-2">
                      <StyledText className="text-xs font-medium text-on-surface-variant">
                        Quantity Returned:
                      </StyledText>
                      <StyledTextInput
                        className="bg-surface-container rounded-lg px-3 py-1.5 text-center text-sm font-bold text-on-surface w-20 border border-outline-variant/40"
                        placeholder="0"
                        placeholderTextColor={colors.outline}
                        keyboardType="numeric"
                        value={returnQuantities[key] || ''}
                        onChangeText={(txt) => {
                          const val = parseInt(txt || '0', 10);
                          if (val > maxReturnable) {
                            toast.error(`Cannot exceed ${maxReturnable}`);
                            return;
                          }
                          setReturnQuantities((prev) => ({ ...prev, [key]: txt }));
                        }}
                      />
                    </StyledView>
                  </Surface>
                );
              })}

              <StyledView className="mt-2 mb-4">
                <StyledText className="text-xs font-semibold text-on-surface-variant mb-1">
                  Reason / Notes for Return
                </StyledText>
                <StyledTextInput
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface min-h-[60px]"
                  placeholder="Damaged in transit, expired, rejected by store..."
                  placeholderTextColor={colors.outline}
                  multiline
                  numberOfLines={2}
                  value={returnNotes}
                  onChangeText={setReturnNotes}
                />
              </StyledView>

              <Button
                size="lg"
                isDisabled={isSubmittingReturn}
                onPress={handleProcessReturn}
                className="w-full mb-6"
              >
                {isSubmittingReturn ? 'Recalculating...' : 'Confirm Return & Recalculate'}
              </Button>
            </StyledScrollView>
          </StyledView>
        </Pressable>
      </Modal>
    </Container>
  );
}
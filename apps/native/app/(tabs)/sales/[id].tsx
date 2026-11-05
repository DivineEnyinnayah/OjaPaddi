import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
} from "phosphor-react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import { Chip } from "@/components/ui/chip";
import { useSales, type Sale } from "../../../hooks/useSales";
import { withUniwind } from "uniwind";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { radius } from "@/constants/tokens";

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
  cash: "Cash",
  transfer: "Transfer",
  pos: "POS",
  cheque: "Cheque",
  other: "Other",
};

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getSaleById, voidSale, returnProducts, isLoading } = useSales();
  const colors = useThemeColor();
  const toast = useToast();
  const [sale, setSale] = useState<Sale | null>(null);

  // Return modal states
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, string>>({});
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSaleById(id as string).then((fetched) => {
      if (fetched) setSale(fetched);
    });
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success" as const;
      case "unpaid":
        return "error" as const;
      case "partial":
        return "warning" as const;
      default:
        return "default" as const;
    }
  };

  const handleVoidSale = () => {
    toast.confirm({
      title: "Void Sale",
      message: "Are you sure you want to void this sale? This action cannot be undone.",
      confirmLabel: "Void Sale",
      destructive: true,
      onConfirm: async () => {
        try {
          await voidSale(id as string);
          toast.success("The sale has been successfully voided.", "Sale voided");
          router.back();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed to void sale");
        }
      },
    });
  };

  const handleProcessReturn = async () => {
    if (!sale) return;

    const returnEntries: { saleItemId: string; quantity: number }[] = [];

    for (const item of sale.items) {
      const key = item.id || item.productId;
      const qty = parseInt(returnQuantities[key] || "0", 10);
      if (qty > 0) {
        returnEntries.push({
          saleItemId: item.id || item.productId,
          quantity: qty,
        });
      }
    }

    if (returnEntries.length === 0) {
      toast.error("Please specify at least 1 product return quantity");
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
      setReturnNotes("");
      toast.success("Products returned and sale recalculated successfully!", "Return Processed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record return");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (isLoading && !sale) {
    return (
      <Container isScrollable={false} className="bg-background px-gutter">
        <StyledView className="mb-4 flex-col gap-2">
          <Skeleton className="mb-2 h-10 w-3/4" />
          <Skeleton className="h-12 w-full rounded-input" />
        </StyledView>
        <StyledView className="flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} variant="primary" className="mb-3 p-4">
              <Skeleton className="mb-2 h-6 w-32" />
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
        <StyledText className="mb-4 text-body-lg text-muted">Sale not found</StyledText>
        <Button onPress={() => router.back()}>Go Back</Button>
      </Container>
    );
  }

  const total = parseFloat(sale.total);
  const subtotal = parseFloat(sale.subtotal);
  const discount = parseFloat(sale.discount || "0");
  const returnedAmount = parseFloat(sale.returnedAmount || "0");
  const amountPaid = parseFloat(sale.amountPaid);
  const balance = total - amountPaid;
  const PaymentIcon = PAYMENT_ICONS[sale.paymentMethod] || DotsThree;
  const isSupermarket = sale.orderType === "supermarket";

  return (
    <Container isScrollable={false} className="bg-background">
      <StyledTouchableOpacity
        onPress={() => router.back()}
        className="absolute left-6 top-4 z-10 h-12 w-12 items-center justify-center rounded-pill bg-background shadow-sm"
        style={{ borderRadius: radius.pill }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.ink} />
      </StyledTouchableOpacity>

      <StyledScrollView contentContainerStyle={{ paddingTop: 88, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StyledView className="px-gutter">
          <StyledView className="mb-4 flex-row items-center justify-between">
            <StyledText className="text-title font-bold text-ink">Order Details</StyledText>
            {isSupermarket && (
              <StyledView className="rounded-pill border border-accent/30 bg-accent-soft px-3 py-1">
                <StyledText className="text-label-bold font-bold text-accent">
                  Supermarket Order
                </StyledText>
              </StyledView>
            )}
          </StyledView>

          <Surface variant="primary" className="mb-4 p-4">
            <StyledView className="mb-3 flex-row items-start justify-between">
              <StyledView className="mr-3 flex-1">
                <StyledText className="mb-1 text-body-sm text-muted">{sale.reference}</StyledText>
                <StyledText className="text-body-lg text-muted">{formatDate(sale.soldAt)}</StyledText>
              </StyledView>
              <Chip variant={getStatusVariant(sale.paymentStatus)}>
                {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
              </Chip>
            </StyledView>

            {isSupermarket && sale.expectedPaymentDate && (
              <StyledView className="my-2 flex-row items-center gap-2 rounded-xl border border-accent/20 bg-accent-soft p-2.5">
                <Calendar size={18} color={colors.accent} />
                <StyledView>
                  <StyledText className="text-label-bold font-bold text-accent">
                    Payment Due Date: {new Date(sale.expectedPaymentDate).toLocaleDateString()}
                  </StyledText>
                  <StyledText className="text-label-bold text-accent">
                    Reminder notification active
                  </StyledText>
                </StyledView>
              </StyledView>
            )}

            <StyledView className="my-3 h-px bg-border" />
            <StyledView className="flex-row items-center">
              {isSupermarket ? (
                <Storefront size={20} color={colors.brand} />
              ) : (
                <Person size={20} color={colors.muted} />
              )}
              <StyledText className="ml-2 text-body-lg font-semibold text-ink">
                {sale.customer?.name || (sale.customerId ? "Registered Client" : "Walk-in Customer")}
              </StyledText>
            </StyledView>
            {sale.customer?.address && (
              <StyledText className="ml-7 mt-0.5 text-label-bold text-muted">
                {sale.customer.address}
              </StyledText>
            )}
          </Surface>

          <Surface variant="primary" className="mb-4 p-4">
            <StyledView className="flex-row items-center">
              <PaymentIcon size={20} color={colors.brand} />
              <StyledText className="ml-2 text-body-lg font-semibold text-ink">
                {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
              </StyledText>
            </StyledView>
          </Surface>

          <Surface variant="primary" className="mb-4 p-4">
            <StyledView className="mb-3 flex-row items-center justify-between">
              <StyledText className="text-card-title font-bold text-ink">Items</StyledText>
              <StyledTouchableOpacity
                onPress={() => setReturnModalVisible(true)}
                className="min-h-[44px] flex-row items-center gap-1.5 rounded-button bg-brand-soft px-3 py-1.5 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Record returned products"
              >
                <ArrowUUpLeft size={16} color={colors.brand} />
                <StyledText className="text-label-bold font-bold text-brand">Record Return</StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            <StyledView className="flex-row border-b border-border/30 pb-2">
              <StyledText className="flex-[3] text-label font-semibold text-muted">Product</StyledText>
              <StyledText className="flex-1 text-right text-label font-semibold text-muted">Qty</StyledText>
              <StyledText className="flex-[2] text-right text-label font-semibold text-muted">Price</StyledText>
              <StyledText className="flex-[2] text-right text-label font-semibold text-muted">Total</StyledText>
            </StyledView>

            {sale.items.map((item, index) => {
              const ret = item.returnedQuantity || 0;
              const netQty = item.quantity - ret;
              return (
                <StyledView
                  key={item.id || item.productId || index}
                  className="border-b border-border/10 py-3"
                >
                  <StyledView className="flex-row items-center">
                    <StyledText className="flex-[3] text-body-sm font-medium text-ink" numberOfLines={1}>
                      {item.productName}
                    </StyledText>
                    <StyledText className="flex-1 text-right text-body-sm text-muted">
                      {item.quantity}
                    </StyledText>
                    <StyledText className="flex-[2] text-right text-body-sm text-muted">
                      {formatCurrency(item.unitPrice)}
                    </StyledText>
                    <StyledText className="flex-[2] text-right text-body-sm font-semibold text-ink">
                      {formatCurrency(item.total)}
                    </StyledText>
                  </StyledView>
                  {ret > 0 && (
                    <StyledView className="mt-1 flex-row justify-between rounded bg-danger-soft px-2 py-1">
                      <StyledText className="text-label-bold font-semibold text-danger">
                        Returned: {ret} unit(s)
                      </StyledText>
                      <StyledText className="text-label-bold font-bold text-ink">
                        Net kept: {netQty} ({formatCurrency(netQty * item.unitPrice)})
                      </StyledText>
                    </StyledView>
                  )}
                </StyledView>
              );
            })}

            <StyledView className="my-3 h-px bg-border" />

            <StyledView className="mb-1 flex-row justify-between">
              <StyledText className="text-body-sm text-muted">Subtotal</StyledText>
              <StyledText className="text-body-sm text-ink">{formatCurrency(subtotal)}</StyledText>
            </StyledView>

            {discount > 0 && (
              <StyledView className="mb-1 flex-row justify-between">
                <StyledText className="text-body-sm text-muted">Discount</StyledText>
                <StyledText className="text-body-sm text-danger">-{formatCurrency(discount)}</StyledText>
              </StyledView>
            )}

            {returnedAmount > 0 && (
              <StyledView className="mb-1 flex-row justify-between">
                <StyledText className="text-body-sm font-medium text-danger">Returns Deducted</StyledText>
                <StyledText className="text-body-sm font-bold text-danger">
                  -{formatCurrency(returnedAmount)}
                </StyledText>
              </StyledView>
            )}

            <StyledView className="mt-2 flex-row justify-between border-t border-border/30 pt-2">
              <StyledText className="text-card-title font-bold text-ink">Recalculated Total</StyledText>
              <StyledText className="text-card-title font-bold text-brand">{formatCurrency(total)}</StyledText>
            </StyledView>

            <StyledView className="my-3 h-px bg-border" />
            <StyledView className="mb-1 flex-row justify-between">
              <StyledText className="text-body-sm text-muted">Amount Paid</StyledText>
              <StyledText className="text-body-sm text-ink">{formatCurrency(amountPaid)}</StyledText>
            </StyledView>
            <StyledView className="flex-row justify-between">
              <StyledText className="text-body-sm font-semibold text-danger">Balance Due</StyledText>
              <StyledText className="text-body-sm font-semibold text-danger">
                {formatCurrency(Math.max(0, balance))}
              </StyledText>
            </StyledView>
          </Surface>

          {sale.notes ? (
            <Surface variant="primary" className="mb-4 p-4">
              <StyledView className="mb-2 flex-row items-center">
                <FileText size={20} color={colors.muted} />
                <StyledText className="ml-2 text-card-title font-semibold text-ink">Notes & Terms</StyledText>
              </StyledView>
              <StyledText className="text-body-sm leading-5 text-muted">{sale.notes}</StyledText>
            </Surface>
          ) : null}

          <StyledView className="mt-4 gap-3 border-t border-border/20 pt-4">
            <StyledTouchableOpacity
              className="w-full flex-row items-center justify-center rounded-button border-2 border-danger bg-danger-soft py-3.5 active:opacity-80"
              onPress={handleVoidSale}
              accessibilityRole="button"
              accessibilityLabel="Void this sale"
              accessibilityHint="Permanently cancels this sale and returns stock to inventory"
            >
              <Trash size={20} color={colors.danger} />
              <StyledText className="ml-2 text-body-lg font-semibold text-danger">Void Sale</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledScrollView>

      {/* RECORD PRODUCT RETURN */}
      <BottomSheet
        visible={returnModalVisible}
        onClose={() => setReturnModalVisible(false)}
        title="Record Returned Products"
        subtitle="Totals and the customer ledger recalculate automatically."
        icon={<ArrowUUpLeft size={20} color={colors.brand} />}
        contentClassName="pt-4 pb-2"
        footer={
          <Button
            size="lg"
            isDisabled={isSubmittingReturn}
            onPress={handleProcessReturn}
            className="w-full"
          >
            {isSubmittingReturn ? "Recalculating..." : "Confirm Return & Recalculate"}
          </Button>
        }
      >
        <StyledText className="mb-4 text-label-bold text-muted">
          Specify quantities returned from this delivery.
        </StyledText>

        {sale.items.map((item) => {
          const key = item.id || item.productId;
          const maxReturnable = item.quantity - (item.returnedQuantity || 0);

          return (
            <Surface key={key} variant="primary" className="mb-3 rounded-xl border border-border/20 p-3.5">
              <StyledView className="mb-2 flex-row items-start justify-between">
                <StyledView className="mr-2 flex-1">
                  <StyledText className="text-body-sm font-bold text-ink">{item.productName}</StyledText>
                  <StyledText className="text-label-bold text-muted">
                    Supplied: {item.quantity} | Available to return: {maxReturnable}
                  </StyledText>
                </StyledView>
                <StyledText className="text-label-bold text-brand">
                  {formatCurrency(item.unitPrice)} each
                </StyledText>
              </StyledView>

              <StyledView className="flex-row items-center gap-2">
                <StyledText className="text-label-bold text-muted">
                  Quantity Returned:
                </StyledText>
                <StyledTextInput
                  className="w-20 rounded-input border border-border/40 bg-card px-3 py-1.5 text-center text-body-sm font-bold text-ink"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={returnQuantities[key] || ""}
                  onChangeText={(txt) => {
                    const val = parseInt(txt || "0", 10);
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

        <StyledView className="mt-2">
          <StyledText className="mb-1.5 text-label-bold text-muted">
            Reason / Notes for Return
          </StyledText>
          <StyledTextInput
            className="min-h-[60px] rounded-input border border-border bg-card px-4 py-3 text-body-sm text-ink"
            placeholder="Damaged in transit, expired, rejected by store..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={2}
            value={returnNotes}
            onChangeText={setReturnNotes}
          />
        </StyledView>
      </BottomSheet>
    </Container>
  );
}
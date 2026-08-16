import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { withUniwind } from "uniwind";
import { WarningCircle, CheckCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Chip } from "@/components/ui/chip";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/stores/authStore";
import { buildReceiptMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/currency";
import { useSales, type Sale } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledScrollView = withUniwind(ScrollView);

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

function getStatusVariant(status: string): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "unpaid":
      return "error";
    default:
      return "default";
  }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  transfer: "Transfer",
  pos: "POS",
  other: "Other",
};

export default function ReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const toast = useToast();
  const { user } = useAuthStore();
  const { getSaleById } = useSales();
  const params = useLocalSearchParams<{ sale?: string; saleId?: string }>();
  
  const [sale, setSale] = React.useState<Sale | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (params.saleId) {
      getSaleById(params.saleId)
        .then((res) => {
          if (res) setSale(res);
        })
        .finally(() => setLoading(false));
    } else if (params.sale) {
      try {
        setSale(JSON.parse(params.sale) as Sale);
      } catch {}
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [params.saleId, params.sale]);

  if (loading) {
    return (
      <StyledView className="flex-1 bg-background items-center justify-center gap-3">
        <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
          <StyledView className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
        </StyledView>
        <StyledText className="text-sm text-on-surface-variant font-medium">Loading receipt...</StyledText>
      </StyledView>
    );
  }

  if (!sale) {
    return (
      <StyledView className="flex-1 bg-background items-center justify-center p-6">
        <WarningCircle size={64} color={colors.error} />
        <StyledText className="text-body-lg text-on-surface-variant text-center mt-4 mb-6">
          Sale receipt could not be loaded. The sale data may be missing or invalid.
        </StyledText>
        <Button onPress={() => router.replace("/sales")}>Go Home</Button>
      </StyledView>
    );
  }

  const paid = parseFloat(sale.amountPaid);
  const total = parseFloat(sale.total);
  const difference = paid - total;

  const handleWhatsAppShare = () => {
    const message = buildReceiptMessage(sale, user?.businessName);
    shareViaWhatsApp(message);
  };

  return (
    <StyledView className="flex-1 bg-background">
      <StyledScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        className="flex-1"
      >
        <StyledView style={{ paddingTop: insets.top + 16 }} className="items-center px-6 pt-4">
          <StyledView className="w-16 h-16 rounded-full bg-success-container items-center justify-center mb-3">
            <CheckCircle size={40} color={colors.primary} />
          </StyledView>
          <StyledText className="text-2xl font-bold text-on-surface">Sale Recorded!</StyledText>
          <StyledText className="text-body-lg text-on-surface-variant mt-1 mb-6">Receipt</StyledText>

          <StyledView className="w-full mb-4">
            <Surface variant="primary" className="w-full rounded-card p-5">
              <StyledView className="items-center mb-4">
                <StyledText className="text-h3 font-bold text-on-surface">
                  {user?.businessName || "Your Store"}
                </StyledText>
                <StyledText className="text-body-sm text-on-surface-variant mt-0.5">
                  {formatDate(sale.soldAt)}
                </StyledText>
              </StyledView>

              <StyledView className="border-t border-dashed border-outline-variant pt-4">
                <StyledView className="flex-row justify-between items-center mb-3">
                  <StyledText className="text-body-sm text-on-surface-variant">Reference</StyledText>
                  <StyledText className="text-body-sm font-semibold text-on-surface">
                    {sale.reference}
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row justify-between items-center mb-3">
                  <StyledText className="text-body-sm text-on-surface-variant">Date & Time</StyledText>
                  <StyledText className="text-body-sm text-on-surface">
                    {formatDate(sale.soldAt)}
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row justify-between items-center mb-4">
                  <StyledText className="text-body-sm text-on-surface-variant">Payment</StyledText>
                  <StyledView className="flex-row items-center gap-2 bg-surface-container rounded-lg px-3 py-1.5">
                    <CheckCircle size={16} color={colors.primary} />
                    <StyledText className="text-body-sm text-on-surface capitalize">
                      {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                    </StyledText>
                    <Chip variant={getStatusVariant(sale.paymentStatus)}>
                      {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
                    </Chip>
                  </StyledView>
                </StyledView>

                <StyledView className="border-t border-dashed border-outline-variant pt-4">
                  <StyledText className="text-label-caps text-on-surface-variant mb-2">Items</StyledText>
                  {sale.items.map((item, index) => (
                    <StyledView
                      key={item.productId || index}
                      className={`flex-row justify-between items-start ${
                        index < sale.items.length - 1
                          ? "mb-3 pb-3 border-b border-dashed border-outline-variant"
                          : ""
                      }`}
                    >
                      <StyledView className="flex-1 mr-4">
                        <StyledText className="text-body-sm text-on-surface" numberOfLines={2}>
                          {item.productName}
                        </StyledText>
                        <StyledText className="text-body-xs text-on-surface-variant">
                          {item.quantity} \u00D7 {formatCurrency(item.unitPrice)}
                        </StyledText>
                      </StyledView>
                      <StyledText className="text-body-sm font-semibold text-on-surface">
                        {formatCurrency(item.total)}
                      </StyledText>
                    </StyledView>
                  ))}
                </StyledView>

                <StyledView className="border-t border-dashed border-outline-variant mt-4 pt-4">
                  <StyledView className="flex-row justify-between items-center mb-1">
                    <StyledText className="text-body-sm text-on-surface-variant">Subtotal</StyledText>
                    <StyledText className="text-body-sm text-on-surface">
                      {formatCurrency(sale.subtotal)}
                    </StyledText>
                  </StyledView>

                  {parseFloat(sale.discount) > 0 && (
                    <StyledView className="flex-row justify-between items-center mb-1">
                      <StyledText className="text-body-sm text-on-surface-variant">Discount</StyledText>
                      <StyledText className="text-body-sm text-error">
                        -{formatCurrency(sale.discount)}
                      </StyledText>
                    </StyledView>
                  )}

                  <StyledView className="flex-row justify-between items-center mt-2 pt-2 border-t border-dashed border-outline-variant">
                    <StyledText className="text-h3 font-bold text-on-surface">Total</StyledText>
                    <StyledText className="text-h3 font-bold text-primary">
                      {formatCurrency(sale.total)}
                    </StyledText>
                  </StyledView>
                </StyledView>

                <StyledView className="border-t border-dashed border-outline-variant mt-4 pt-4">
                  <StyledView className="flex-row justify-between items-center mb-1">
                    <StyledText className="text-body-sm text-on-surface-variant">Amount Paid</StyledText>
                    <StyledText className="text-body-sm font-semibold text-on-surface">
                      {formatCurrency(sale.amountPaid)}
                    </StyledText>
                  </StyledView>

                  {difference >= 0 ? (
                    <StyledView className="flex-row justify-between items-center">
                      <StyledText className="text-body-sm text-success">Change</StyledText>
                      <StyledText className="text-body-sm font-semibold text-success">
                        {formatCurrency(difference)}
                      </StyledText>
                    </StyledView>
                  ) : (
                    <StyledView className="flex-row justify-between items-center">
                      <StyledText className="text-body-sm text-error">Balance Due</StyledText>
                      <StyledText className="text-body-sm font-semibold text-error">
                        {formatCurrency(Math.abs(difference))}
                      </StyledText>
                    </StyledView>
                  )}

                  {sale.notes ? (
                    <StyledView className="mt-3 pt-3 border-t border-dashed border-outline-variant">
                      <StyledText className="text-body-xs text-on-surface-variant">Notes</StyledText>
                      <StyledText className="text-body-sm text-on-surface mt-0.5">{sale.notes}</StyledText>
                    </StyledView>
                  ) : null}
                </StyledView>

                <StyledView className="border-t border-dashed border-outline-variant mt-4 pt-4 items-center">
                  <StyledText className="text-body-sm text-on-surface-variant">
                    Thank you for your patronage!
                  </StyledText>
                  <StyledText className="text-body-xs text-on-surface-variant mt-1">
                    Powered by OjaPaddi
                  </StyledText>
                </StyledView>
              </StyledView>
            </Surface>
          </StyledView>
        </StyledView>
      </StyledScrollView>

      <StyledView
        className="px-6 pb-4 gap-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button variant="primary" size="lg" onPress={handleWhatsAppShare}>
          Share via WhatsApp
        </Button>
        <Button variant="secondary" size="lg" onPress={() => router.replace("/sales")}>
          Done
        </Button>
        <Button variant="secondary" size="lg" onPress={() => toast.info("Printing receipt functionality is not yet available.", "Coming Soon")}>
          Print Receipt
        </Button>
      </StyledView>
    </StyledView>
  );
}

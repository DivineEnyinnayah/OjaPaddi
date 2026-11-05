import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WarningCircle, CheckCircle, Printer, ArrowLeft } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/stores/authStore";
import { buildReceiptMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/currency";
import { useSales, type Sale } from "@/hooks/useSales";
import { StyledView, StyledText, StyledScrollView, StyledTouchableOpacity } from "@/components/ui/styled";
import { typeScale } from "@/constants/tokens";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  transfer: "Transfer",
  pos: "POS",
  cheque: "Cheque",
  other: "Other",
};

function formatReceiptDate(dateString: string) {
  const date = new Date(dateString);
  const day = date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { day, time };
}

/**
 * FigCraft `04.2 — Receipt` (frame 891), 390×844.
 *
 * Receipt as a paper card: brand-strong store lockup, mono ledger rows, an
 * explicit TOTAL rule and a first-class WhatsApp share action. The receipt
 * fetch (`saleId` / `sale` params) and the WhatsApp share call are unchanged.
 */
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
      <StyledView className="flex-1 items-center justify-center gap-3 bg-background">
        <StyledView className="h-16 w-16 items-center justify-center rounded-pill bg-brand-soft">
          <StyledView className="h-10 w-10 rounded-pill bg-brand opacity-40" />
        </StyledView>
        <StyledText className="font-body text-body-sm text-muted">Loading receipt...</StyledText>
      </StyledView>
    );
  }

  if (!sale) {
    return (
      <StyledView className="flex-1 items-center justify-center bg-background p-6">
        <WarningCircle size={64} color={colors.danger} />
        <StyledText className="mb-6 mt-4 text-center font-body text-body text-muted">
          Sale receipt could not be loaded. The sale data may be missing or invalid.
        </StyledText>
        <Button onPress={() => router.replace("/sales")}>Go Home</Button>
      </StyledView>
    );
  }

  const paid = parseFloat(sale.amountPaid);
  const total = parseFloat(sale.total);
  const difference = paid - total;
  const { day, time } = formatReceiptDate(sale.soldAt);
  const isSupermarket = sale.orderType === "supermarket";

  const handleWhatsAppShare = () => {
    const message = buildReceiptMessage(sale, user?.businessName);
    shareViaWhatsApp(message);
  };

  const ledgerRow = (label: string, value: string) => (
    <StyledView className="flex-row items-center justify-between py-2">
      <StyledText className="font-body text-body-sm text-muted">{label}</StyledText>
      <StyledText className="font-ledger text-body-sm text-ink">{value}</StyledText>
    </StyledView>
  );

  return (
    <StyledView className="flex-1 bg-background">
      <StyledView
        className="flex-row items-center px-6 pb-2"
        style={{ paddingTop: insets.top + 8 }}
      >
        <StyledTouchableOpacity
          className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-card active:opacity-70"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} weight="bold" />
        </StyledTouchableOpacity>
      </StyledView>

      <StyledScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <StyledView className="items-center px-6">
          <StyledView className="mb-3 h-16 w-16 items-center justify-center rounded-pill bg-brand-soft">
            <CheckCircle size={40} color={colors.brand} weight="fill" />
          </StyledView>
          <StyledText
            className="text-center font-display text-ink"
            style={{ fontSize: typeScale.title.fontSize, lineHeight: typeScale.title.lineHeight }}
          >
            {isSupermarket ? "Order logged" : "Sale recorded"}
          </StyledText>
          <StyledText className="mb-5 mt-1 font-body text-body-sm text-muted">
            {isSupermarket ? "Invoice & delivery note" : "Receipt"}
          </StyledText>

          {/* Receipt card — frame 891 */}
          <StyledView className="w-full rounded-card border border-border bg-card p-6">
            <StyledView className="items-center">
              <StyledText
                className="text-center font-display tracking-[0.5px] text-brand-strong"
                style={{ fontSize: typeScale.cardTitle.fontSize, lineHeight: typeScale.cardTitle.lineHeight }}
              >
                {(user?.businessName || "Your Store").toUpperCase()}
              </StyledText>
              {user?.whatsappNumber ? (
                <StyledText className="mt-1 font-body text-micro text-muted">
                  {user.whatsappNumber}
                </StyledText>
              ) : null}
            </StyledView>

            <StyledView className="my-4 h-px bg-border" />

            <StyledView className="flex-row items-center justify-between">
              <StyledText className="font-label text-micro text-ink">{day}</StyledText>
              <StyledText className="font-label text-micro text-ink">{time}</StyledText>
            </StyledView>
            <StyledText className="mt-1 font-ledger text-micro text-muted">
              REF {sale.reference}
            </StyledText>

            {isSupermarket && (
              <StyledView className="mt-3 flex-row items-center justify-between rounded-input bg-brand-soft px-3 py-2">
                <StyledText className="font-label text-label text-brand">Supermarket supply</StyledText>
                {sale.expectedPaymentDate ? (
                  <StyledText className="font-label text-label text-brand">
                    Due {new Date(sale.expectedPaymentDate).toLocaleDateString("en-GB")}
                  </StyledText>
                ) : null}
              </StyledView>
            )}

            {/* Column header — frame 891 */}
            <StyledView className="mt-4 flex-row items-center border-b border-border pb-1">
              <StyledText className="w-8 font-label text-micro text-muted">QTY</StyledText>
              <StyledText className="flex-1 font-label text-micro text-muted">ITEM</StyledText>
              <StyledText className="font-label text-micro text-muted">AMOUNT</StyledText>
            </StyledView>

            {sale.items.map((item, index) => (
              <StyledView key={item.productId || index} className="flex-row items-start py-2">
                <StyledText className="w-8 font-label text-body-sm text-ink">{item.quantity}</StyledText>
                <StyledText className="flex-1 pr-3 font-body text-body-sm text-ink" numberOfLines={2}>
                  {item.productName}
                </StyledText>
                <StyledText className="font-ledger text-body-sm text-ink">
                  {formatCurrency(item.total)}
                </StyledText>
              </StyledView>
            ))}

            <StyledView className="my-4 h-px bg-border" />

            {ledgerRow("Subtotal", formatCurrency(sale.subtotal))}
            {parseFloat(sale.discount) > 0 &&
              ledgerRow("Discount", `−${formatCurrency(sale.discount)}`)}
            {parseFloat(sale.returnedAmount || "0") > 0 &&
              ledgerRow("Returns", `−${formatCurrency(sale.returnedAmount || "0")}`)}

            <StyledView className="mt-2 flex-row items-end justify-between border-t border-border pt-3">
              <StyledText className="font-label text-body-sm text-brand-strong">TOTAL</StyledText>
              <StyledText
                className="font-display text-brand-strong"
                style={{ fontSize: typeScale.title.fontSize, lineHeight: typeScale.title.lineHeight }}
              >
                {formatCurrency(total)}
              </StyledText>
            </StyledView>

            <StyledView className="mt-4 h-0.5 bg-brand" />

            <StyledText className="mt-3 font-label text-micro text-brand">
              {PAYMENT_METHOD_LABELS[sale.paymentMethod]?.toUpperCase() || sale.paymentMethod.toUpperCase()}
            </StyledText>
            {ledgerRow("Amount paid", formatCurrency(paid))}
            {difference >= 0
              ? ledgerRow("Change", formatCurrency(difference))
              : ledgerRow("Balance due", formatCurrency(Math.abs(difference)))}

            {sale.notes ? (
              <StyledView className="mt-3 border-t border-border pt-3">
                <StyledText className="font-label text-micro text-muted">Notes</StyledText>
                <StyledText className="mt-0.5 font-body text-body-sm text-ink">{sale.notes}</StyledText>
              </StyledView>
            ) : null}

            <StyledView className="mt-5 items-center">
              <StyledText className="font-label text-body-sm text-ink">
                Thank you — come again tomorrow.
              </StyledText>
              <StyledText className="mt-1 font-ledger text-micro text-muted">
                {sale.reference}
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledScrollView>

      <StyledView className="gap-3 px-6 pt-2" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button variant="primary" size="lg" onPress={handleWhatsAppShare}>
          Share on WhatsApp
        </Button>
        <StyledView className="flex-row gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onPress={() => router.replace("/sales")}
          >
            Done
          </Button>
          <StyledTouchableOpacity
            className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-button border border-mint bg-card active:opacity-80"
            onPress={() =>
              toast.info("Printing receipt functionality is not yet available.", "Coming soon")
            }
            accessibilityRole="button"
            accessibilityLabel="Print receipt"
          >
            <Printer size={18} color={colors.brand} />
            <StyledText className="font-label text-body text-brand">Print</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}

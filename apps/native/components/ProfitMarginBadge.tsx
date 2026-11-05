import React from "react";
import { View, Text } from "react-native";
import { withUniwind } from "uniwind";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

interface ProfitMarginBadgeProps {
  sellingPrice: string;
  costPrice: string;
}

/** Profit margin chip — FigCraft `03 — Components` (chips: good / fair / low). */
export function ProfitMarginBadge({ sellingPrice, costPrice }: ProfitMarginBadgeProps) {
  const sell = parseFloat(sellingPrice);
  const cost = parseFloat(costPrice);

  if (isNaN(sell) || isNaN(cost) || sell <= 0 || cost < 0) {
    return null;
  }

  const profit = sell - cost;
  const marginPercentage = (profit / sell) * 100;

  let badge = "border-brand-soft bg-brand-soft";
  let label = "text-brand";
  let marginText = "Good margin";

  if (marginPercentage < 10) {
    badge = "border-danger-soft bg-danger-soft";
    label = "text-danger";
    marginText = "Low margin";
  } else if (marginPercentage < 30) {
    badge = "border-accent-soft bg-accent-soft";
    label = "text-ink";
    marginText = "Fair margin";
  }

  return (
    <StyledView
      className={`mb-2 flex-row items-center justify-between rounded-input border p-2 ${badge}`}
    >
      <StyledText className={`font-label text-label tabular-nums ${label}`}>
        Profit: ₦{profit.toFixed(2)} ({marginPercentage.toFixed(1)}%)
      </StyledText>
      <StyledText className={`font-label text-micro uppercase ${label}`}>{marginText}</StyledText>
    </StyledView>
  );
}

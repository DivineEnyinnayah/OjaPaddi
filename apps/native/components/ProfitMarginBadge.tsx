import React from 'react';
import { View, Text } from 'react-native';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

interface ProfitMarginBadgeProps {
  sellingPrice: string;
  costPrice: string;
}

export function ProfitMarginBadge({ sellingPrice, costPrice }: ProfitMarginBadgeProps) {
  const sell = parseFloat(sellingPrice);
  const cost = parseFloat(costPrice);

  if (isNaN(sell) || isNaN(cost) || sell <= 0 || cost < 0) {
    return null;
  }

  const profit = sell - cost;
  const marginPercentage = (profit / sell) * 100;

  let badgeColor = 'bg-success/15 border-success/30';
  let textColor = 'text-success';
  let marginText = 'Good Margin';

  if (marginPercentage < 10) {
    badgeColor = 'bg-error/15 border-error/30';
    textColor = 'text-error';
    marginText = 'Low Margin';
  } else if (marginPercentage < 30) {
    badgeColor = 'bg-warning/15 border-warning/30';
    textColor = 'text-warning';
    marginText = 'Fair Margin';
  }

  return (
    <StyledView className={`flex-row items-center justify-between p-2 rounded-lg border ${badgeColor} mb-2`}>
      <StyledText className={`text-xs font-semibold ${textColor} tabular-nums`}>
        Profit: ₦{profit.toFixed(2)} ({marginPercentage.toFixed(1)}%)
      </StyledText>
      <StyledText className={`text-[10px] font-bold uppercase ${textColor}`}>
        {marginText}
      </StyledText>
    </StyledView>
  );
}

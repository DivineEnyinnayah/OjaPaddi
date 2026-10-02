import { type PropsWithChildren } from "react";
import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { cn } from "../lib/utils";
import { TAB_BAR_OFFSET } from "../lib/tab-bar";

const StyledView = withUniwind(View);

type Props = ViewProps & {
  className?: string;
  isScrollable?: boolean;
  withTabBar?: boolean;
  withSafeAreaTop?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

export function Container({
  children,
  className,
  isScrollable = true,
  withTabBar = false,
  withSafeAreaTop = true,
  scrollViewProps,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();

  const topPadding = withSafeAreaTop ? Math.max(insets.top, 16) : 0;
  const bottomPadding = isScrollable
    ? 0
    : withTabBar
    ? 0
    : insets.bottom;

  return (
    <StyledView
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      }}
      {...props}
    >
      {isScrollable ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: withTabBar ? TAB_BAR_OFFSET + insets.bottom : insets.bottom + 16,
          }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <StyledView className="flex-1">{children}</StyledView>
      )}
    </StyledView>
  );
}


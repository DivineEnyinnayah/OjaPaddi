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
  withSafeAreaTop = false,
  scrollViewProps,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();

  const extraBottom = withTabBar ? TAB_BAR_OFFSET : 0;

  return (
    <StyledView
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingTop: withSafeAreaTop ? insets.top : 8,
        paddingBottom: isScrollable ? insets.bottom : insets.bottom + extraBottom,
      }}
      {...props}
    >
      {isScrollable ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            ...(withTabBar ? { paddingBottom: TAB_BAR_OFFSET } : {}),
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

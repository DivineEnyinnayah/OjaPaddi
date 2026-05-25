import { type PropsWithChildren } from "react";
import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { cn } from "../lib/utils";

const StyledView = withUniwind(View);

type Props = ViewProps & {
  className?: string;
  isScrollable?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

export function Container({
  children,
  className,
  isScrollable = true,
  scrollViewProps,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();

  return (
    <StyledView
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingBottom: insets.bottom,
      }}
      {...props}
    >
      {isScrollable ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </StyledView>
  );
}

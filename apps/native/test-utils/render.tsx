import React, { type ReactElement, type ReactNode } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react-native";
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";
import { AppThemeProvider } from "@/contexts/app-theme-context";

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <AppThemeProvider>{children}</AppThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Render helper that mirrors the app's real provider tree, so hooks such as
 * `useThemeColor()` and `useSafeAreaInsets()` resolve as they do at runtime.
 */
export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react-native";

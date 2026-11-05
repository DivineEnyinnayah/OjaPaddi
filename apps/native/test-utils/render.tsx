import React, { type ReactElement, type ReactNode } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react-native";
import { AppThemeProvider } from "@/contexts/app-theme-context";

function AllProviders({ children }: { children: ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}

/**
 * Render helper that mirrors the app's real provider tree, so hooks such as
 * `useThemeColor()` resolve the same way they do at runtime.
 */
export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react-native";

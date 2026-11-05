import { renderHook } from "@testing-library/react-native";
import React from "react";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useThemeColor } from "./useThemeColor";
import { colorTokens } from "@/constants/tokens";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}

describe("useThemeColor", () => {
  it("exposes every FigCraft colour token", () => {
    const { result } = renderHook(() => useThemeColor(), { wrapper });
    for (const name of Object.keys(colorTokens)) {
      expect(result.current).toHaveProperty(name);
    }
  });

  it("returns the light value by default", () => {
    const { result } = renderHook(() => useThemeColor(), { wrapper });
    expect(result.current.background).toBe(colorTokens.background.light);
    expect(result.current.ink).toBe(colorTokens.ink.light);
  });

  it("exposes a status bar style for the current surface", () => {
    const { result } = renderHook(() => useThemeColor(), { wrapper });
    expect(["light", "dark"]).toContain(result.current.statusBarStyle);
  });

  it("no longer exposes the removed Material token names", () => {
    const { result } = renderHook(() => useThemeColor(), { wrapper });
    expect(result.current).not.toHaveProperty("onSurface");
    expect(result.current).not.toHaveProperty("surfaceContainer");
  });
});

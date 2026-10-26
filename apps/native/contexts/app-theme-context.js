import React, { createContext, useCallback, useContext, useMemo } from "react";
import { Uniwind, useUniwind } from "uniwind";
const AppThemeContext = createContext(undefined);
export const AppThemeProvider = ({ children }) => {
    const { theme } = useUniwind();
    const isLight = useMemo(() => {
        return theme === "light";
    }, [theme]);
    const isDark = useMemo(() => {
        return theme === "dark";
    }, [theme]);
    const setTheme = useCallback((newTheme) => {
        Uniwind.setTheme(newTheme);
    }, []);
    const toggleTheme = useCallback(() => {
        Uniwind.setTheme(theme === "light" ? "dark" : "light");
    }, [theme]);
    const value = useMemo(() => ({
        currentTheme: theme,
        isLight,
        isDark,
        setTheme,
        toggleTheme,
    }), [theme, isLight, isDark, setTheme, toggleTheme]);
    return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};
export function useAppTheme() {
    const context = useContext(AppThemeContext);
    if (!context) {
        throw new Error("useAppTheme must be used within AppThemeProvider");
    }
    return context;
}

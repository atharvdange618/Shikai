import { createContext, useCallback, useContext, useState } from "react";

import { themes, type Theme, type ThemeName } from "@/constants/themes";
import { mmkv } from "@/lib/mmkv";

const THEME_KEY = "shikai-theme";

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredThemeName(): ThemeName {
  const stored = mmkv.getString(THEME_KEY);
  if (stored && stored in themes) return stored as ThemeName;
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] =
    useState<ThemeName>(getStoredThemeName);

  const setThemeName = useCallback((name: ThemeName) => {
    mmkv.set(THEME_KEY, name);
    setThemeNameState(name);
  }, []);

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}

export function useTheme() {
  const { theme } = useThemeContext();
  return theme;
}

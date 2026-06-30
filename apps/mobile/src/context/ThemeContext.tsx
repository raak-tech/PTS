import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { DEFAULT_THEME_ID, getTheme, ThemeColors, ThemeId, THEMES } from '@/themes';

const STORAGE_KEY = 'pts_theme_id';

type ThemeContextValue = {
  themeId: ThemeId;
  colors: ThemeColors;
  setThemeId: (id: ThemeId) => Promise<void>;
  themes: typeof THEMES;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readStoredTheme(): Promise<ThemeId | null> {
  try {
    if (Platform.OS === 'web') {
      return (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? null;
    }
    return (await SecureStore.getItemAsync(STORAGE_KEY)) as ThemeId | null;
  } catch {
    return null;
  }
}

async function writeStoredTheme(id: ThemeId): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, id);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, id);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    readStoredTheme().then((stored) => {
      if (stored && THEMES.some((t) => t.id === stored)) {
        setThemeIdState(stored);
      }
    });
  }, []);

  const setThemeId = useCallback(async (id: ThemeId) => {
    setThemeIdState(id);
    await writeStoredTheme(id);
  }, []);

  const colors = useMemo(() => getTheme(themeId).colors, [themeId]);

  const value = useMemo(
    () => ({ themeId, colors, setThemeId, themes: THEMES }),
    [themeId, colors, setThemeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

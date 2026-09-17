import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

interface ThemeContextType {
  themePreference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_preference';

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'system' (device preference) as requested
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'system' || stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

  // Listen to OS system color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  // Compute effective theme
  const effectiveTheme: EffectiveTheme =
    themePreference === 'system' ? systemTheme : themePreference;

  // Apply effective theme to document root (HTML class and data attributes)
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.setAttribute('data-theme', 'light');
    }
  }, [effectiveTheme]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (e) {
      console.error('Failed to persist theme preference:', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themePreference, effectiveTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

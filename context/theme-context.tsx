'use client';

import React, {
  useEffect,
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
} from 'react';

type Theme = 'light' | 'dark';

type ThemeContextProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

// Store for theme state with subscription support
let currentTheme: Theme = 'light';
const listeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return 'light';
}

function subscribeToTheme(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setThemeValue(newTheme: Theme): void {
  currentTheme = newTheme;
  listeners.forEach((listener) => listener());
}

export default function ThemeContextProvider({
  children,
}: ThemeContextProviderProps) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerSnapshot
  );

  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setThemeValue(newTheme);
    window.localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Initialize theme from localStorage/system preference on mount
  useEffect(() => {
    const localTheme = window.localStorage.getItem('theme') as Theme | null;
    let initialTheme: Theme = 'light';

    if (localTheme) {
      initialTheme = localTheme;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
    }

    // Update external store (not React state)
    setThemeValue(initialTheme);

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync the DOM class with the theme on subsequent changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }

  return context;
}

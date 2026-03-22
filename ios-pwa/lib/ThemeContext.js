'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadString, saveString } from './storage';

const THEME_KEY = 'celestia_theme';

// Exact color values from native ThemeContext.js
const themes = {
  dark: {
    bg: '#0F0E1A',
    card: '#171529',
    cardAlt: '#1D1A30',
    cardElevated: '#222040',
    text: '#EDE6D8',
    textSecondary: '#8B85A0',
    textMuted: '#5E587A',
    heading: '#F5EDE3',
    border: 'rgba(200,168,75,0.08)',
    divider: 'rgba(200,168,75,0.05)',
    inputBg: '#1D1A30',
    inputBorder: 'rgba(200,168,75,0.12)',
    inputPlaceholder: '#5E587A',
    tabBarBg: 'rgba(15,14,26,0.92)',
    headerBg: 'rgba(15,14,26,0.92)',
    success: '#5CB868',
    warning: '#E8A840',
    error: '#E86060',
    gold: '#C8A84B',
    goldLt: '#E2C46A',
    goldDim: 'rgba(200,168,75,0.15)',
    terra: '#C17F59',
    rose: '#C4918A',
    lavender: '#9B8EC4',
    sage: '#8B9E7E',
    sky: '#7BA7C4',
    navy: '#0E0E22',
    modalBg: '#171529',
    modalOverlay: 'rgba(0,0,0,0.5)',
  },
  light: {
    bg: '#FAF8F2',
    card: '#FFFFFF',
    cardAlt: '#F3EDE2',
    cardElevated: '#FFFFFF',
    text: '#2A2418',
    textSecondary: '#97907F',
    textMuted: '#B0A898',
    heading: '#2A2418',
    border: '#EAE3D6',
    divider: '#EDE6D8',
    inputBg: '#FFFFFF',
    inputBorder: '#EAE3D6',
    inputPlaceholder: '#B0A898',
    tabBarBg: 'rgba(250,248,242,0.96)',
    headerBg: 'rgba(250,248,242,0.96)',
    success: '#4CAF50',
    warning: '#F5A623',
    error: '#E85050',
    gold: '#C8A84B',
    goldLt: '#E2C46A',
    goldDim: 'rgba(200,168,75,0.12)',
    terra: '#C17F59',
    rose: '#C4918A',
    lavender: '#9B8EC4',
    sage: '#8B9E7E',
    sky: '#7BA7C4',
    navy: '#0E0E22',
    modalBg: '#FFFFFF',
    modalOverlay: 'rgba(0,0,0,0.4)',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('dark');

  // Load saved theme on mount AND apply to DOM
  useEffect(() => {
    (async () => {
      const saved = await loadString(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', saved);
        }
      }
    })();
  }, []);

  // Keep DOM in sync whenever mode changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }, [mode]);

  const setMode = useCallback(async (m) => {
    setModeState(m);
    await saveString(THEME_KEY, m);
  }, []);

  const colors = themes[mode];
  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { mode: 'dark', setMode: () => {}, colors: themes.dark, isDark: true };
  return ctx;
};

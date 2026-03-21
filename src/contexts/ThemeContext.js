import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { loadString, saveString } from '../services/storage';

const ThemeContext = createContext();

// ── Desert Dawn (Light) ─────────────────────────────────────
const LIGHT = {
  // Backgrounds
  bg: '#FAF8F2',
  card: '#FFFFFF',
  cardAlt: '#F3EDE2',
  cardElevated: '#FFFFFF',
  // Text
  text: '#2A2418',
  textSecondary: '#97907F',
  textMuted: '#B0A898',
  heading: '#2A2418',
  // Borders
  border: '#EAE3D6',
  divider: '#EDE6D8',
  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#EAE3D6',
  inputPlaceholder: '#B0A898',
  // Navigation
  tabBarBg: 'rgba(250,248,242,0.96)',
  headerBg: 'rgba(250,248,242,0.96)',
  // Semantic
  success: '#4CAF50',
  warning: '#F5A623',
  error: '#E85050',
  // Accents (shared across both modes)
  gold: '#C8A84B',
  goldLt: '#E2C46A',
  goldDim: 'rgba(200,168,75,0.12)',
  terra: '#C17F59',
  rose: '#C4918A',
  lavender: '#9B8EC4',
  sage: '#8B9E7E',
  sky: '#7BA7C4',
  navy: '#0E0E22',
  // Hero gradients (already dark — shared)
  heroGradient: ['#0E0E22', '#1A1535', '#0F1628'],
  // Modal overlays
  modalBg: '#FFFFFF',
  modalOverlay: 'rgba(0,0,0,0.4)',
  // Status bar
  statusBarStyle: 'light', // light text on dark hero
};

// ── Celestial Night (Dark) ───────────────────────────────────
// Navy-plum family — matches the existing hero gradients seamlessly.
// NOT brown/charcoal (clashes with cosmic identity).
// NOT cold black (that's Co-Star). Our plum undertone is warm.
const DARK = {
  // Backgrounds — cosmic navy-plum, flows from hero to body seamlessly
  bg: '#0F0E1A',            // Deep cosmic navy (close to hero #0E0E22)
  card: '#171529',           // Plum-navy cards (float above bg)
  cardAlt: '#1D1A30',        // Mid plum (alternating sections, inputs)
  cardElevated: '#222040',   // Lighter plum (modals, elevated surfaces)
  // Text — warm cream (NOT pure white — softer on eyes at 10pm)
  text: '#EDE6D8',           // Warm cream on navy = candlelight on night sky
  textSecondary: '#8B85A0',  // Lavender-gray (plum undertone, not neutral gray)
  textMuted: '#5E587A',      // Deep lavender-gray (timestamps, hints)
  heading: '#F5EDE3',        // Bright cream for headings
  // Borders — gold-tinted translucent (carries the accent subtly)
  border: 'rgba(200,168,75,0.08)',
  divider: 'rgba(200,168,75,0.05)',
  // Inputs
  inputBg: '#1D1A30',        // Same as cardAlt — inputs feel embedded
  inputBorder: 'rgba(200,168,75,0.12)',
  inputPlaceholder: '#5E587A',
  // Navigation
  tabBarBg: 'rgba(15,14,26,0.92)',   // Navy-plum with blur
  headerBg: 'rgba(15,14,26,0.92)',
  // Semantic
  success: '#5CB868',
  warning: '#E8A840',
  error: '#E86060',
  // Accents (identical in both modes — gold on navy-plum is stunning)
  gold: '#C8A84B',
  goldLt: '#E2C46A',
  goldDim: 'rgba(200,168,75,0.15)',
  terra: '#C17F59',
  rose: '#C4918A',
  lavender: '#9B8EC4',
  sage: '#8B9E7E',
  sky: '#7BA7C4',
  navy: '#0E0E22',
  // Hero gradients — SAME as light mode! Body bg is so close to hero bg that they flow seamlessly
  heroGradient: ['#0E0E22', '#1A1535', '#0F1628'],
  // Modal overlays
  modalBg: '#171529',
  modalOverlay: 'rgba(0,0,0,0.5)',
  // Status bar
  statusBarStyle: 'light',
};

const THEME_STORAGE_KEY = 'celestia_theme_pref';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState('light'); // 'light' | 'dark' | 'system' — default light
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadString(THEME_STORAGE_KEY).then(v => {
      if (v && ['light', 'dark', 'system'].includes(v)) setPreference(v);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
  const colors = useMemo(() => isDark ? DARK : LIGHT, [isDark]);

  const setThemePreference = async (pref) => {
    setPreference(pref);
    await saveString(THEME_STORAGE_KEY, pref);
  };

  const value = useMemo(() => ({
    isDark,
    colors,
    preference,
    setThemePreference,
    loaded,
  }), [isDark, colors, preference, loaded]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// Re-export palettes for direct access where context isn't available (e.g., PDF generation)
export { LIGHT, DARK };

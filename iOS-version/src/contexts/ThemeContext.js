import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { loadString, saveString } from '../services/storage';

const ThemeContext = createContext();

// ── Desert Dawn (Light) — V1.2 Light Liquid Glass ──────────
// Heroes are no longer dark slabs; the ivory canvas dominates and
// burgundy/clay is reserved for actions, pills, and key accents.
const LIGHT = {
  // Backgrounds
  bg: '#FAF8F2',
  card: '#FFFFFF',
  cardAlt: '#F3EDE2',
  cardElevated: '#FFFFFF',
  // Text — slightly darker textMuted for HIG-compliant contrast
  text: '#2A2418',
  textSecondary: '#6E5E64',
  textMuted: '#9B8E8F',
  heading: '#2A2418',
  // Borders
  border: '#EAE3D6',
  divider: '#EDE6D8',
  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#EAE3D6',
  inputPlaceholder: '#9B8E8F',
  // Navigation
  tabBarBg: 'rgba(250,248,242,0.96)',
  headerBg: 'rgba(250,248,242,0.96)',
  // Semantic
  success: '#4CAF50',
  warning: '#F5A623',
  error: '#E85050',
  // Accents — clay primary in light mode (was gold), gold reserved for milestones
  accent: '#5C2434',           // primary action / active state
  accentDim: 'rgba(92,36,52,0.10)',
  gold: '#C8A84B',
  goldLt: '#E2C46A',
  goldDim: 'rgba(200,168,75,0.12)',
  brass: '#B89968',
  terra: '#C17F59',
  rose: '#C4918A',
  lavender: '#A88BA0',  // warm mauve, pairs with burgundy
  sage: '#8B9E7E',
  sky: '#7B8FA4',       // warm slate, pairs with burgundy
  navy: '#3A1A28',
  clay: '#5C2434',
  // Hero gradients — light ivory ramp (was dark burgundy slab)
  heroGradient: ['#F4ECE5', '#F0E4DC', '#ECDCD3'],
  // Modal overlays
  modalBg: '#FFFFFF',
  navyOnGoldText: '#3A1A28', // alias for buttons that need readable dark-on-gold
  modalOverlay: 'rgba(0,0,0,0.4)',
  // Status bar
  statusBarStyle: 'dark',  // dark text on light hero
};

// ── Celestial Night (Dark) ───────────────────────────────────
// Burgundy family — replaces former navy-plum to differentiate from cosmic-blue
// astrology category. Warm wine tones read intimate / relationship, not cosmic.
const DARK = {
  // Backgrounds — warm burgundy near-black, flows from hero to body seamlessly
  bg: '#171018',            // Warm wine near-black (was #0F0E1A cool navy)
  card: '#211724',           // Burgundy-tinted cards
  cardAlt: '#2A1A28',        // Mid burgundy (alternating sections, inputs)
  cardElevated: '#3A2030',   // Lighter burgundy (modals, elevated surfaces)
  // Text — warm cream (NOT pure white — softer on eyes at 10pm)
  text: '#EDE6D8',           // Warm cream on burgundy = candlelight on wine
  textSecondary: '#9A8A8E',  // Warm gray with burgundy undertone
  textMuted: '#6E5E64',      // Deeper warm gray (timestamps, hints)
  heading: '#F5EDE3',        // Bright cream for headings
  // Borders — gold-tinted translucent (carries the accent subtly)
  border: 'rgba(200,168,75,0.08)',
  divider: 'rgba(200,168,75,0.05)',
  // Inputs
  inputBg: '#2A1A28',        // Match cardAlt — inputs feel embedded
  inputBorder: 'rgba(200,168,75,0.12)',
  inputPlaceholder: '#6E5E64',
  // Navigation
  tabBarBg: 'rgba(23,16,24,0.92)',   // Burgundy near-black with blur
  headerBg: 'rgba(23,16,24,0.92)',
  // Semantic
  success: '#5CB868',
  warning: '#E8A840',
  error: '#E86060',
  // Accents — gold stays primary in dark mode (gold-on-burgundy is the signature)
  accent: '#C8A84B',           // primary action / active state in dark
  accentDim: 'rgba(200,168,75,0.15)',
  gold: '#C8A84B',
  goldLt: '#E2C46A',
  goldDim: 'rgba(200,168,75,0.15)',
  brass: '#B89968',
  terra: '#C17F59',
  rose: '#C4918A',
  lavender: '#A88BA0',  // warm mauve, pairs with burgundy
  sage: '#8B9E7E',
  sky: '#7B8FA4',       // warm slate, pairs with burgundy
  navy: '#3A1A28',
  clay: '#5C2434',
  // Hero gradients — burgundy ramp (dark mode keeps the dramatic version)
  heroGradient: ['#5A2840', '#3A1A28', '#1F0F18'],
  // Modal overlays
  modalBg: '#211724',
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

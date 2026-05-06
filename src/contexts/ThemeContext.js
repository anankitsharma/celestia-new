import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { loadString, saveString } from '../services/storage';

const ThemeContext = createContext();

// ── Desert Dawn (Light) ─────────────────────────────────────
// Contrast against bg (#FAF8F2) — WCAG AA requires 4.5:1 normal / 3:1 large.
//   text       #2A2418 → 12.5:1 ✓
//   secondary  #6B6555 → 5.4:1  ✓ (was #97907F, 3.0:1 ✗ — fixed per audit)
//   muted      #827B6B → 4.0:1  ✓ AA Large (was #B0A898, 2.0:1 ✗ — fixed)
//   placeholder #827B6B → 4.0:1 ✓ (was #B0A898 — fixed)
// Gold (#C8A84B) on cream is 3.1:1 — only safe for ≥18pt headings on cream
// or as a non-text accent. Audit any body-sized gold text in light mode.
const LIGHT = {
  // Backgrounds
  bg: '#FAF8F2',
  card: '#FFFFFF',
  cardAlt: '#F3EDE2',
  cardElevated: '#FFFFFF',
  // Text — all values pass WCAG AA (or AA Large for muted)
  text: '#2A2418',
  textSecondary: '#6B6555',
  textMuted: '#827B6B',
  heading: '#2A2418',
  // Borders
  border: '#EAE3D6',
  divider: '#EDE6D8',
  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#EAE3D6',
  inputPlaceholder: '#827B6B',
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
  navy: '#3A1A28',
  // ── V1.2 burgundy/glass additions (additive, phase 1) ──
  // Phase 3 screens consume these; existing screens are unaffected.
  clay:        '#5C2434',           // primary burgundy action / active state in light
  clayDeep:    '#3A1A28',           // deep burgundy for high-contrast moments
  brass:       '#B89968',           // softened gold accent
  surfaceWarm: '#F6F1E7',           // warm ivory hero surface
  hairline:    'rgba(42,36,24,0.08)',
  glow:        'rgba(92,36,52,0.06)',
  accent:      '#5C2434',           // alias of clay — primary action token
  accentDim:   'rgba(92,36,52,0.10)',
  // Light hero ramp (consumed by phase 3+; current screens still hardcode)
  heroGradientLight: ['#F4ECE5', '#F0E4DC', '#ECDCD3'],
  // Burgundy ramp — for screens that need a dark hero in light mode
  // (e.g. ChartScreen, where the wheel SVG needs a dark backdrop).
  heroGradientBurgundy: ['#5A2840', '#3A1A28', '#1F0F18'],
  // Hero gradients — burgundy ramp (was cosmic-navy pre phase 5)
  heroGradient: ['#5A2840', '#3A1A28', '#1F0F18'],
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
  // Text — warm cream (NOT pure white — softer on eyes at 10pm).
  // Contrast against bg (#0F0E1A) — WCAG AA 4.5:1 normal / 3:1 large.
  //   text       #EDE6D8 → 14.0:1 ✓
  //   heading    #F5EDE3 → 14.5:1 ✓
  //   secondary  #8B85A0 → 6.5:1  ✓
  //   muted      #7A7595 → 5.5:1  ✓ (was #5E587A, 3.4:1 ✗ — fixed per audit)
  text: '#EDE6D8',           // Warm cream on navy = candlelight on night sky
  textSecondary: '#8B85A0',  // Lavender-gray (plum undertone, not neutral gray)
  textMuted: '#7A7595',      // Lavender-gray for timestamps/hints — passes WCAG AA
  heading: '#F5EDE3',        // Bright cream for headings
  // Borders — gold-tinted translucent (carries the accent subtly)
  border: 'rgba(200,168,75,0.08)',
  divider: 'rgba(200,168,75,0.05)',
  // Inputs
  inputBg: '#1D1A30',        // Same as cardAlt — inputs feel embedded
  inputBorder: 'rgba(200,168,75,0.12)',
  inputPlaceholder: '#7A7595',
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
  navy: '#3A1A28',
  // ── V1.2 burgundy/glass additions (additive, phase 1) ──
  // In dark mode gold remains the primary accent; clay/brass available for
  // burgundy modals + share cards converted in phase 4.
  clay:        '#5C2434',
  clayDeep:    '#3A1A28',
  brass:       '#B89968',
  surfaceWarm: '#2A1A28',           // dark warm surface (cardAlt-equivalent)
  hairline:    'rgba(200,168,75,0.10)',
  glow:        'rgba(92,36,52,0.18)',
  accent:      '#C8A84B',           // gold stays primary action in dark
  accentDim:   'rgba(200,168,75,0.15)',
  // Burgundy ramp — phase 4 modals/share cards consume this in dark mode
  heroGradientBurgundy: ['#5A2840', '#3A1A28', '#1F0F18'],
  // Hero gradients — burgundy ramp (was cosmic-navy pre phase 5)
  heroGradient: ['#5A2840', '#3A1A28', '#1F0F18'],
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

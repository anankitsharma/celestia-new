# Celestia — Dark Mode Plan (Through Mia's Eyes)

> **Current state:** No dark mode. The app is a hybrid — dark navy hero headers + light cream body. No theme toggle. No system theme detection.
>
> **Plan position on dark mode:** The original product plan says "Warm, earthy, Desert Dawn palette. NOT dark mode. Because Mia shops at Free People, saves boho Pinterest boards — every competitor is dark mode. We own warmth."
>
> **The tension:** Mia uses the app at 10:30pm in bed. Her phone brightness is low. A fully light app can be blinding. She needs dark mode — but it can't feel like every other cold, tech-dark astrology app.

---

## The Strategy: "Warm Dark" — Not Cold Dark

### The Key Insight

The plan is right that Co-Star's cold blue-black dark mode feels clinical. But Mia IS using this at 10:47pm in bed with lights off. A pure cream/white app would be painful.

**The solution: TWO dark modes, neither of them cold.**

| Mode | When | Feel |
|------|------|------|
| **Desert Dawn (Light)** | Default. Daytime. Sharing screenshots. | Warm cream (#FAF8F2), terracotta accents, sand tones. "Free People journal" energy. |
| **Midnight Desert (Dark)** | 10pm in bed. System dark mode. Manual toggle. | Deep warm charcoal (#1A1714), muted gold, soft sand text. "Candlelit desert" energy. NOT cold navy/blue. |

**The critical difference:** Our dark mode uses WARM darks (charcoal-brown, not blue-black) and WARM lights (sand/cream text, not pure white). It should feel like reading by candlelight in a desert tent — not like staring at a NASA terminal.

---

## Color Palette: Midnight Desert (Dark Mode)

### Backgrounds
| Role | Light (Desert Dawn) | Dark (Midnight Desert) | Notes |
|------|-------------------|----------------------|-------|
| **Primary bg** | `#FAF8F2` (cream) | `#1A1714` (warm charcoal) | NOT #000000 or #0E0E22. Warm brown undertone. |
| **Card bg** | `#FFFFFF` (white) | `#242018` (dark sand) | Slightly lighter than bg. Subtle depth. |
| **Card bg alt** | `#F3EDE2` (warm) | `#2C2620` (deeper sand) | For alternating sections. |
| **Hero gradient** | `#0E0E22 → #1A1535` (navy) | `#14120E → #1E1A14` (warm midnight) | Current navy stays fine — it already IS dark. Warm it slightly. |

### Text
| Role | Light | Dark | Notes |
|------|-------|------|-------|
| **Primary text** | `#2A2418` (ink) | `#F0E8DC` (warm sand) | NOT pure white. Cream/sand feels softer on eyes. |
| **Secondary text** | `#97907F` (stone) | `#8A8070` (muted sand) | Slightly lighter stone for dark bg. |
| **Muted text** | `#B0A898` | `#5C5448` | For timestamps, hints. |
| **Heading text** | `#2A2418` (ink) | `#F5EDE3` (cream) | Playfair Display headings. |

### Accents (Same in both modes)
| Role | Color | Notes |
|------|-------|-------|
| **Gold** | `#C8A84B` | Primary accent — same in both modes. Gold on dark = stunning. |
| **Terracotta** | `#C17F59` | Bridge buttons, nudge boxes. Same warmth. |
| **Rose** | `#C4918A` | Love accents. |
| **Lavender** | `#9B8EC4` | Spiritual/chart accents. |
| **Sage** | `#8B9E7E` | Growth/social accents. |

### Borders & Dividers
| Role | Light | Dark |
|------|-------|------|
| **Card border** | `#EAE3D6` | `rgba(240,232,220,0.08)` |
| **Divider** | `#EDE6D8` | `rgba(240,232,220,0.06)` |
| **Input border** | `#EAE3D6` | `rgba(200,168,75,0.15)` |

---

## What Mia Sees: Screen-by-Screen Dark Mode

### Splash Screen
- **Light:** Gold orbits on cream — current design.
- **Dark:** Gold orbits on warm charcoal (#1A1714). Stars more visible. More magical. Better.
- **Mia at 10pm:** "The dark splash feels more cosmic. Like opening a portal."

### Hero Headers (All Tabs)
- **Already dark** — navy/plum gradients. In dark mode, WARM the navy slightly:
  - Current: `#0E0E22 → #1A1535` (blue undertone)
  - Dark mode: `#14120E → #1E1A14 → #16131E` (brown/plum undertone)
- Big 3 pills, moon strip, greeting text — already light-on-dark. No change needed.

### Body Content (All Tabs)
- **Light:** Cream bg (#FAF8F2), dark text (#2A2418), white cards
- **Dark:** Warm charcoal bg (#1A1714), sand text (#F0E8DC), dark sand cards (#242018)
- Key: cards should be SLIGHTLY lighter than bg (not floating on black void)

### Navigator Briefing Card (Today Tab)
- **Light:** Dark header gradient + white body
- **Dark:** Same dark header + warm charcoal body (#242018)
- Navigate Toward arrows: gold on both modes
- Navigate Around icons: same styling, just on dark card bg
- Nudge box: terracotta left border stays. Bg becomes `rgba(193,127,89,0.08)` on dark.

### Chat Screen
- **Light:** Cream bg, white input field, gold accent
- **Dark:** Charcoal bg, dark sand input (#2C2620), gold accent
- User bubbles: gold tint (`rgba(200,168,75,0.12)` → `rgba(200,168,75,0.15)`)
- AI bubbles: white on light → dark sand (#2C2620) on dark
- Input field placeholder: `#B0A898` → `#5C5448`

### Chart Screen
- **Already mostly dark** — hero + chart wheel are navy. No major change.
- Planet list cards: white → dark sand
- At-a-glance pattern cards: cream bg → charcoal bg
- Element balance bars: same colors, darker track

### Compatibility Screen
- Orbit visualization: already dark — no change
- Partner cards, result sections: white → dark sand
- Blurred premium sections: work better on dark (more mysterious)
- Celebrity chips: cream bg → dark sand bg

### Reports Screen
- Report tiles: white → dark sand
- **Report PDFs: STAY LIGHT MODE.** The plan is explicit: "Reports are LIGHT MODE. They feel like printed material." PDF output is always warm/light regardless of app theme.

### Profile Screen
- Cosmic ID Card: dark-on-light → could work both ways. Light border on dark bg.
- Settings rows: cream → charcoal
- Badge carousel: same styling

---

## When to Switch: Three Triggers

### 1. System Theme Detection (Primary)
```javascript
import { useColorScheme } from 'react-native';
const systemTheme = useColorScheme(); // 'light' | 'dark'
```
If Mia's iPhone is in dark mode, Celestia follows automatically. Zero friction.

### 2. Manual Toggle (Profile Settings)
- Setting: "Appearance" → Light / Dark / System (default)
- Stored in AsyncStorage under `StorageKeys.SETTINGS`
- Accessible from ProfileScreen settings list

### 3. Time-Based Auto (Optional Enhancement)
- If "System" is selected AND it's after 10pm, nudge toward dark
- Not forced — just auto-switch if she hasn't set a preference
- Respects her 10:30pm-midnight Celestia window

---

## Architecture: ThemeContext

### New File: `src/contexts/ThemeContext.js`
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { loadString, saveString } from '../services/storage';

const ThemeContext = createContext();

// Desert Dawn (Light) palette
const LIGHT = {
  bg: '#FAF8F2',
  card: '#FFFFFF',
  cardAlt: '#F3EDE2',
  text: '#2A2418',
  textSecondary: '#97907F',
  textMuted: '#B0A898',
  heading: '#2A2418',
  border: '#EAE3D6',
  divider: '#EDE6D8',
  inputBg: '#FFFFFF',
  inputBorder: '#EAE3D6',
  // Accents (shared)
  gold: '#C8A84B',
  goldDim: 'rgba(200,168,75,0.12)',
  terra: '#C17F59',
  rose: '#C4918A',
  lavender: '#9B8EC4',
  sage: '#8B9E7E',
  navy: '#0E0E22',
  // Hero gradients (shared, already dark)
  heroGradient: ['#0E0E22', '#1A1535', '#0F1628'],
};

// Midnight Desert (Dark) palette
const DARK = {
  bg: '#1A1714',
  card: '#242018',
  cardAlt: '#2C2620',
  text: '#F0E8DC',
  textSecondary: '#8A8070',
  textMuted: '#5C5448',
  heading: '#F5EDE3',
  border: 'rgba(240,232,220,0.08)',
  divider: 'rgba(240,232,220,0.06)',
  inputBg: '#2C2620',
  inputBorder: 'rgba(200,168,75,0.15)',
  // Accents (same)
  gold: '#C8A84B',
  goldDim: 'rgba(200,168,75,0.15)',
  terra: '#C17F59',
  rose: '#C4918A',
  lavender: '#9B8EC4',
  sage: '#8B9E7E',
  navy: '#0E0E22',
  // Hero gradients (slightly warmer)
  heroGradient: ['#14120E', '#1E1A14', '#16131E'],
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState('system'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    loadString('celestia_theme_pref').then(v => { if (v) setPreference(v); });
  }, []);

  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
  const colors = isDark ? DARK : LIGHT;

  const setThemePreference = async (pref) => {
    setPreference(pref);
    await saveString('celestia_theme_pref', pref);
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, preference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Usage in Screens
```javascript
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Hello Mia</Text>
      <View style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        ...
      </View>
    </View>
  );
}
```

### Migration Strategy
Replace hardcoded colors gradually:
1. `T.cream` → `colors.bg`
2. `'white'` / `'#FFFFFF'` → `colors.card`
3. `T.ink` → `colors.text`
4. `T.stone` → `colors.textSecondary`
5. `T.warm` → `colors.cardAlt`
6. `T.border` → `colors.border`

Accents (gold, terra, rose, lavender, sage) stay the same in both modes.

---

## Implementation Phases

### Phase 1: Foundation (1-2 days)
- [ ] Create `ThemeContext.js` with LIGHT/DARK palettes
- [ ] Wrap App.js with `<ThemeProvider>`
- [ ] Add "Appearance" setting to ProfileScreen (Light / Dark / System)
- [ ] Update `theme.js` to export both palettes
- [ ] Update StatusBar to respond to theme

### Phase 2: Core Screens (2-3 days)
- [ ] HomeScreen — body bg, cards, nudge box, journal, evening section
- [ ] ChatScreen — bg, bubbles, input field, suggestion chips
- [ ] ChartScreen — planet list, house list, at-a-glance cards
- [ ] CompatibilityScreen — partner cards, result sections, celebrity chips
- [ ] ReportsScreen — tile bg, price badges (NOT PDF content — PDFs stay light)

### Phase 3: Supporting Screens (1-2 days)
- [ ] ProfileScreen — settings rows, badges, cosmic ID
- [ ] OnboardingScreen — form fields, persona cards, notification toggles
- [ ] WelcomeScreen — already mostly dark, minor tweaks
- [ ] PaywallScreen — already dark, no change needed
- [ ] SplashScreen — already dark, warm the background slightly

### Phase 4: Components (1 day)
- [ ] TabBar — bg color + icon colors
- [ ] CosmicTooltip — modal bg
- [ ] ShareCards — decide if cards follow theme or stay light (for IG sharing, light is better)
- [ ] Modals (deep dive, journal, moon ritual) — bg + text colors
- [ ] QuestCard, BadgeUnlockModal, StreakMilestoneModal, LevelUpModal

### Phase 5: Polish (1 day)
- [ ] Test all screens in both modes
- [ ] Verify accent colors have enough contrast on dark bg
- [ ] Check share cards look good on both modes
- [ ] Ensure PDF reports ALWAYS render in light mode
- [ ] Verify keyboard/input styling in dark mode
- [ ] Test on iPhone + Android

**Total estimate: 5-8 days**

---

## What NOT to Change in Dark Mode

1. **PDF Reports** — Always light. "Reports feel like printed material."
2. **Share Cards** — Stay light for IG Stories visibility. Light bg pops on dark IG feed.
3. **Hero Headers** — Already dark. Just warm the undertone slightly.
4. **Chart Wheel SVG** — Already on dark bg. Works in both modes.
5. **Gold/Terracotta/Rose accents** — Same in both modes. They pop beautifully on dark.
6. **PaywallScreen** — Already dark themed. No change.

---

## Why "Warm Dark" Matters for Mia

| Co-Star Dark Mode | Celestia Midnight Desert |
|---|---|
| Cold blue-black (#000000) | Warm charcoal (#1A1714) |
| Pure white text (harsh on eyes) | Sand/cream text (#F0E8DC, soft) |
| Clinical, NASA-terminal feel | Candlelit, desert-tent feel |
| "I'm using a tech product" | "I'm reading my journal by firelight" |
| Blue accent = cold | Gold accent = warm |

**Mia's reaction:** "I turned on dark mode and it didn't turn into Co-Star. It still feels warm. It still feels like Celestia. It just... fits my 10pm vibe better."

---

## The Mia Test for Dark Mode

1. Can she read comfortably at 10:30pm in bed with low brightness? (YES — warm charcoal + sand text)
2. Does it still feel like Celestia, not a competitor? (YES — warm tones, gold accents, same personality)
3. Do screenshots still look good on IG Stories? (YES — share cards stay light; dark app bg makes gold pop)
4. Does she know how to toggle it? (YES — Profile → Appearance, or follows her phone's system setting)
5. Does it surprise her with quality? (YES — "even their dark mode is different from everyone else's")

---

*Created: March 2026. To be implemented as a dedicated sprint after core feature polish.*

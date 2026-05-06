# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start dev server (scan QR with Expo Go)
npx expo start --ios    # Launch iOS simulator
npx expo start --android # Launch Android emulator
node -c src/path/file.js # Syntax check (no linter/test suite configured)
```

No test framework, linter, or build pipeline is configured. Use `node -c` to verify syntax after edits.

## Architecture

**Expo SDK 54 / React Native 0.81.5** mobile app (portrait-only, iOS-first). All source code is JavaScript (no TypeScript enforcement despite tsconfig).

### Navigation Flow
`SplashScreen → OnboardingFlowScreen → WelcomeScreen → MainTabs (6 tabs)`

**Tab order:** Today → Ask AI → Chart → Match → Sky → Reports

Stack navigator wraps tabs; Profile, JournalHistory, NotificationSettings, Auth, and QuickChart are stack-pushed modals. Custom `TabBar.js` replaces default bottom tabs. All screens use `headerShown: false` with custom hero headers.

### Data Flow: Local-First
- **SQLite** (`expo-sqlite`, db: `celestia_v1.db`) is the source of truth. Schema in `src/services/database/schema.js`.
- **AsyncStorage** caches settings, counters, and lightweight state. Wrapper: `src/services/storage.js`.
- **Supabase** provides optional cloud backup and email auth. Client in `src/services/supabase/client.js`.
- Repository pattern: each SQLite table has a `rep_*.js` file in `src/services/database/`.

### AI Integration
`src/services/geminiService.js` calls Google Gemini with a 3-model fallback chain: `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-3-flash-preview`. All AI functions return structured JSON via Gemini's function calling. Key functions: `generateDailyInsight`, `generateFullReport`, `generateChatResponse`, `generateMatchCore/Details/Insights`, `generatePlacementDeepDive`, `fetchExtendedForecast`.

### Astronomy Engine
`src/services/astrologyService.js` wraps the `astronomy-engine` library for real planetary position calculations, house cusps, transit detection, aspect analysis, moon phases, and cosmic windows.

### Engagement System
Streaks (`streakService.js`), XP/levels (`xpService.js`, 5 tiers), 20 badges (`achievementService.js`), haptic feedback (`hapticService.js`), and push notifications (`notificationService.js` + `notificationContentEngine.js` template engine).

## Design System

### Colors (from `src/constants/theme.js`)
- Primary: `T.navy` (#3A1A28, deep burgundy — token name kept for back-compat post V1.2 migration), `T.gold` (#C8A84B), `T.cream` (#FAF8F2)
- Burgundy/glass tokens: `T.clay` (#5C2434, primary action), `T.clayDeep` (#3A1A28), `T.brass` (#B89968), `T.surfaceWarm` (#F6F1E7)
- Supporting: `T.warm` (#F3EDE2), `T.stone` (#7E776A), `T.ink` (#2A2418), `T.hairline`, `T.glow`
- Per-tab signal hues live in `SIGNAL` (today/connections/ask/profile/sky/chart/journey)

### Typography
- Headings: Playfair Display (`FONTS.serif*`)
- Body: DM Sans (`FONTS.sans*`)

### Hero Headers
All tab screens use consistent hero patterns:
- `LinearGradient` with warm muted tones (plum-charcoal family, NOT electric blue/purple)
- `borderBottomLeftRadius: 24, borderBottomRightRadius: 24` (no fade overlays)
- Safe area: `paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16`

### Educational Layer
- `CosmicTooltip` component: "?" button → modal explainer (~50 entries). Has `light` prop for dark backgrounds.
- `AstroText` component: auto-highlights 40 astrology terms with tap-to-learn modals.
- Both are integrated across Chart, Home, Transits, and Compatibility screens.

## Key Conventions

- Screens manage their own data fetching and state (no global store beyond contexts)
- `UserProfileContext` and `AuthContext` are the only React contexts
- Zodiac constants, symbols, and element mappings live in `src/constants/AstrologyCore.js`
- XP levels defined in `src/constants/levels.js`, badge catalog in `src/constants/badges.js`
- PDF reports use `expo-print` with A4 sizing (`width: 210mm; height: 297mm`) and inline HTML/CSS
- App entry: `App.js` loads fonts, initializes SQLite schema, wraps in AuthProvider → UserProfileProvider

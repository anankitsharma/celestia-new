# Theme Migration Plan — Cosmic Navy → Burgundy / Light Liquid Glass

**Goal:** adopt the `iOS-version` palette as the primary look — burgundy (`#3A1A28` / clay `#5C2434`) replaces cosmic navy, and light Liquid Glass heroes replace dark gradient slabs. Dark mode keeps a burgundy ramp for night use.

**Reference target:** `iOS-version/src/contexts/ThemeContext.js` and `iOS-version/src/constants/theme.js`. The architecture (LIGHT/DARK palettes + `useTheme()` + system preference + persistence) is already identical in `Celestia-new` — only values and a few tokens differ.

## Scope (audited)

- **18 screens** hardcode `#0E0E22 / #1A1535 / #0F1628` gradient stops.
- **19 components** (modals, share cards, sigils) hardcode the same.
- **27 files** reference `T.navy` directly. Its value flips from `#0E0E22` (cosmic) → `#3A1A28` (burgundy), which is a silent visual change everywhere.
- **`Stars.js`** appears in 7 surfaces. It needs the dark backdrop, so usage must be gated by `isDark` or restricted to surfaces that stay dark (splash, paywall, share cards).
- **`CosmicTooltip`** has a `light` prop whose meaning is "host has dark background." With light heroes, the prop's truth value flips — every call site needs re-checking.
- **Status bar** is currently always `light` content. Light heroes need `dark` content; should follow `colors.statusBarStyle`.

## Strategy: phased, no big-bang

Risk: a one-shot swap of `T.navy` from cosmic → burgundy will silently re-tint 27 files. We avoid that by adding new tokens first (additive, non-breaking), migrating call sites to those new tokens, then flipping the legacy values last.

## Phase 1 — Foundation (no visible change)

- Extend `src/constants/theme.js`:
  - Add light-glass tokens: `canvas`, `surface`, `surfaceWarm`, `clay`, `clayDeep`, `brass`, `inkDim`, `inkSoft`, `hairline`, `glow`.
  - Add `SIGNAL` map (per-tab hue): `today`, `connections`, `ask`, `profile`, `sky`, `chart`, `journey`.
  - **Do not change `T.navy` value yet** — keep `#0E0E22` until phase 5. New code uses `T.clay` / `T.canvas` / `colors.heroGradient`.
- Extend `src/contexts/ThemeContext.js` LIGHT/DARK to mirror iOS-version values:
  - LIGHT: `bg #FAF8F2`, `accent #5C2434` (clay), `heroGradient ['#F4ECE5','#F0E4DC','#ECDCD3']`, `statusBarStyle 'dark'`, add `clay`, `brass`.
  - DARK: `bg #171018`, `card #211724`, `cardAlt #2A1A28`, `accent #C8A84B` (gold stays primary in dark), `heroGradient ['#5A2840','#3A1A28','#1F0F18']`.
  - Default preference stays `light`.
- Acceptance: app renders identically to current state. Tokens exist but are unused.

## Phase 2 — Primitives (cross-cutting)

- **StatusBar**: in `App.js` and any per-screen `<StatusBar>`, drive `style` from `colors.statusBarStyle`.
- **Stars.js**: gate render by `isDark` in tab/today surfaces; keep unconditionally on splash/paywall/share cards (those stay dark).
- **CosmicTooltip**: re-derive `light` prop from host theme rather than hardcoded callsites; or replace prop with `useTheme()` lookup inside the component.
- **`Pressable` overlays we just added** (e.g. `WelcomeBackModal`): no change needed.
- Acceptance: dark mode toggle still flips correctly; no contrast regressions on cream backgrounds.

## Phase 3 — Hero migration (screen by screen)

Each screen replaces hardcoded `['#0E0E22','#1A1535','#0F1628']` with `colors.heroGradient`. Where the iOS-version uses content/time-aware gradient maps (Today screen has `HERO_GRADIENTS` keyed by morning/afternoon/evening/latenight + `CONTENT_GRADIENTS` keyed by content type), port those maps too — but only for the Today hero in this phase.

Order (anchor first):

1. `HomeScreen.js` — Today is the daily anchor; biggest visual impact, validates the approach.
2. `ChartScreen.js` — second-most-used surface.
3. `ReportsScreen.js`.
4. `CompatibilityScreen.js` (Circle).
5. `TransitsScreen.js` (Sky) and `JourneyScreen.js`.
6. `ProfileScreen.js`, `JournalScreen.js`, `JournalHistoryScreen.js`.
7. `AuthScreen.js`, `OnboardingFlowScreen.js`, `OnboardingScreen.js`, `WelcomeScreen.js`, `WelcomeBackScreen.js`, `WelcomeToProScreen.js`, `YearInReviewScreen.js`, `NotificationSettingsScreen.js`, `QuickChartScreen.js`, `CancelFlowScreen.js`, `PaywallScreen.js`, `SplashScreen.js`.

For each screen: hero gradient, body bg, hero text colors (cream → `colors.heading` so they invert in dark mode), pill chips, hairlines.

## Phase 4 — Modals & share cards

Modals can remain darker than the page for premium feel — switch them from cosmic-navy to `clayDeep` + brass accents (this is what iOS-version `BadgeUnlockModal`, `LevelUpModal`, `StreakMilestoneModal` do). Share cards stay dark on purpose: dark social cards have higher contrast when reposted to light feeds.

Files: `WelcomeBackModal.js`, `BadgeUnlockModal.js`, `LevelUpModal.js`, `StreakMilestoneModal.js`, `NotificationPermissionModal.js`, `BrandModal.js`, `BrandSheet.js`, all `*ShareCard.js`, `LunarEventCard.js`, `MercuryRxCard.js`, `CosmicIDCard.js`, `CosmicRarityCard.js`, `MonthlyRecapCard.js`.

## Phase 5 — Token cutover (the breaking change)

- Flip `T.navy` value from `#0E0E22` → `#3A1A28` in `src/constants/theme.js`.
- Audit all 27 direct-usage files: most use `T.navy` as text or accent on cream → silently becomes burgundy ink, which is the desired end state. A handful use it as a background slab — those should already have been migrated to `colors.heroGradient` in phase 3; verify none remain.
- Update `CLAUDE.md` color section.

## Phase 6 — Polish & QA

- Per-tab `SIGNAL` hue washes behind hero titles (10–14% opacity over `surfaceWarm`).
- Spot-check WCAG AA on cream backgrounds (gold body text, stone secondary).
- Dark mode regression sweep: every migrated screen rendered in `preference='dark'`.
- Update screenshots in `plan/screenshots/` if used for App Store.
- Update `MEMORY.md` design system section to reflect new palette.

## Out of scope

- PDF report styling (HTML/CSS embedded; can stay dark for print-friendliness).
- App icon / splash asset re-render (separate task if pursued).
- Per-tab signal hues beyond the seven defined; new tabs need a hue assignment.

## Risk register

- **`T.navy` flip surprises**: mitigated by phase 3 doing all hero migration first and the flip happening last.
- **Stars on light bg**: addressed in phase 2 by gating.
- **Dark-mode regression**: each phase verifies dark mode still renders before moving on.
- **CosmicTooltip prop semantics**: phase 2 normalizes via context lookup, eliminating the per-call decision.

## Effort estimate

- Phase 1: ~1 hour (token additions, no visible change).
- Phase 2: ~2 hours (3 cross-cutting components).
- Phase 3: ~1–1.5 days (18 screens, mechanical but needs visual review per screen).
- Phase 4: ~3 hours (19 components, mostly modal hero swaps).
- Phase 5: ~30 min (one-line value flip + grep audit).
- Phase 6: ~half day (per-tab signal hues + QA sweep).

Total: ~3 days of focused work, shippable phase-by-phase. After phase 1 + 2 the app is no different visually but technically ready. After phase 3 the daily-use surfaces (Today, Chart, Circle, Reports) are converted — the perceptible change to a user. Phases 4–6 are tail polish.

# 07 — Burgundy Theme Swap

**Files:** `src/constants/theme.js`, `src/contexts/ThemeContext.js`, every screen with hard-coded gradient hex stops
**Effort:** 1 hour
**Impact:** Visual differentiation — moves Celestia out of the cosmic-navy/purple zone every astrology competitor occupies.

---

## Why we're moving

Current `T.navy` is `#0E0E22` — near-black with a slight purple cast. It's the same family every direct competitor uses:

- Co-Star → black
- The Pattern → cream + terracotta (different lane)
- Stellar / Nebula / Sanctuary → cosmic purple-black
- Chani → cream + sage
- TimePassages → purple-blue (close to current Celestia)

A reviewer scrolling through the App Store sees Celestia's hero, sees navy-purple, and bins it with Stellar. Same goes for users browsing astrology apps — we look like another one.

**Burgundy is empty in this category.** No direct competitor uses it as primary. It reads warm, intimate, evening-conversation — relationship-app territory, not horoscope-newsletter territory.

---

## Target palette

Replace navy with a 4-stop burgundy ramp:

| Token | Old (navy) | New (burgundy) | Use |
|---|---|---|---|
| `T.navy` | `#0E0E22` | `#3A1A28` | Primary dark — buttons, text-on-gold, dark surfaces |
| Hero dark stop | `#0E0E22`, `#0F1220`, `#0C2040`, `#0C1840` | `#1F0F18` | Almost-black wine — gradient anchor |
| Hero mid stop | `#1A1535`, `#171428`, `#14122A`, `#12082A` | `#3A1A28` | Deep burgundy |
| Hero light stop | `#1A1060`, `#2A1060`, `#2A1A6E` | `#5A2840` | Clear burgundy — gradient lift |
| Dramatic accent | `#1A1060` (rare) | `#7A2840` | Vivid wine — used sparingly for splashes |

**Keep unchanged:**
- `T.gold` `#C8A84B` — pairs naturally with burgundy (jewelry logic)
- `T.cream` `#FAF8F2`
- `T.warm` `#F3EDE2`
- `T.stone` `#97907F`
- `T.ink` `#2A2418`

**Dark mode bg:** shift from `#0F0E1A` (cool blue-tinted near-black) to `#171018` (warm burgundy-tinted near-black). Preserves dark-mode contrast but removes the cool cast.

---

## Why burgundy specifically

- **Truly unclaimed in this category** — no direct astrology/relationship competitor uses it as primary.
- **Reads relationship, not cosmic** — burgundy is the color of wine bars, intimate conversations, leather journals. Not horoscope category default.
- **Mature without being heavy** — important for the 18-30 audience aging out of teen-Costar visual language.
- **Pairs with gold** — classic jewelry pairing, no need to redo the accent.
- **Forgiving in light + dark mode** — dark stops still anchor a dark theme; mid-burgundy still reads on light surfaces as a tinted accent.

---

## Risks

| Risk | Mitigation |
|---|---|
| Burgundy at wrong saturation reads "winery brand" or "law firm" | The chosen ramp stays in the cabernet-glass zone — deep red-warm, not pink, not brown. Verify on simulator before committing. |
| Some hard-coded hex is intentional (text-on-gold contrast wants `T.navy` for readability) | The `T.navy` token still exists; only its value changes. Text-on-gold automatically becomes burgundy-text-on-gold, which still has WCAG-passing contrast. Verify with the WCAG check. |
| Existing dark-mode bg `#0F0E1A` is referenced by user-set wallpaper / share cards | Search for that exact hex specifically; only update it where it appears in app chrome, leave any export/share-card hex intact (those have their own visual identity). |

---

## Execution plan

### Step 1 — theme tokens

`src/constants/theme.js` — change one value:

```js
navy: "#3A1A28",  // was #0E0E22 — burgundy primary, v1.x reshape
```

`src/contexts/ThemeContext.js` — change three places (light theme, dark theme, heroGradient arrays):

```js
// Light theme:
navy: '#3A1A28',
heroGradient: ['#5A2840', '#3A1A28', '#1F0F18'],

// Dark theme:
navy: '#3A1A28',
heroGradient: ['#5A2840', '#3A1A28', '#1F0F18'],
bg: '#171018', // was #0F0E1A
```

### Step 2 — gradient hex sweeps

For each screen with hard-coded gradient stops, find-and-replace the navy-family hex:

| Old hex | New hex |
|---|---|
| `#0E0E22` | `#1F0F18` |
| `#0F0E22` | `#1F0F18` |
| `#0F1220` | `#1F0F18` |
| `#0F1628` | `#1F0F18` |
| `#0C2040` | `#1F0F18` |
| `#0C1840` | `#1F0F18` |
| `#08081A` | `#1F0F18` |
| `#1A1535` | `#3A1A28` |
| `#171428` | `#3A1A28` |
| `#14122A` | `#3A1A28` |
| `#14112A` | `#3A1A28` |
| `#12082A` | `#3A1A28` |
| `#2A1320` | `#3A1A28` |
| `#1A1060` | `#5A2840` |
| `#2A1060` | `#5A2840` |
| `#2A1A6E` | `#5A2840` |
| `#1A1A40` | `#5A2840` |
| `#101320` | `#1F0F18` |

Most of these appear in 3-stop hero gradients of the form `['#171428', '#14122A', '#0F1220']`. After sweep they become `['#3A1A28', '#3A1A28', '#1F0F18']` — coherent burgundy fade.

### Step 3 — screens to touch

- `src/screens/SplashScreen.js` — orb gradient + CTA
- `src/screens/OnboardingFlowScreen.js` — onboarding hero
- `src/screens/WelcomeScreen.js` — chart-reveal hero
- `src/screens/HomeScreen.js` — multiple gradients (already has briefingCard removed; remaining ones still need swap)
- `src/screens/CompatibilityScreen.js` — connection detail hero, deep-dive cards
- `src/screens/ChatScreen.js` — Celestia orb gradient `['#0E0E22', '#1A1060']`
- `src/screens/ProfileScreen.js` — profile hero
- `src/screens/ChartScreen.js` — chart wheel hero
- `src/screens/ReportsScreen.js` — featured card + report tiles
- `src/screens/JournalScreen.js` — journal hero
- `src/screens/JournalHistoryScreen.js` — verify
- `src/screens/TransitsScreen.js` (TodaysSky) — sky hero
- `src/screens/JourneyScreen.js` — streak hero
- `src/screens/PaywallScreen.js` — paywall hero
- `src/components/Stars.js` — verify star background still reads against burgundy

### Step 4 — verification

- `node -c` on every modified file
- Final grep: `grep -nE "#0E0E22|#1A1535|#171428|#14122A|#0F1220|#1A1060|#2A1A6E"` should return only intentional uses (text colors, share-card exports)
- Walk every tab on simulator — confirm burgundy reads cohesively, no jarring purple stops left

---

## After approval

If burgundy feels too dark in some surfaces post-launch, the lightest stop `#5A2840` can be brightened to `#7A2840` for more drama, or to `#4A2030` for more restraint. The token system means we adjust in one place.

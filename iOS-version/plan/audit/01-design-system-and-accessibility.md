# 01 — Design System + Accessibility Deep Dive

---

## 1. COLOR SYSTEM

### Tokens defined (`src/constants/theme.js` + `src/contexts/ThemeContext.js`)

**Light mode (Desert Dawn):**
| Role | Token | Hex |
|---|---|---|
| Background | `bg` | `#FAF8F2` cream |
| Card | `card` | `#FFFFFF` white |
| Card alt | `cardAlt` | `#F3EDE2` warm |
| Text primary | `text` | `#2A2418` ink |
| Text secondary | `textSecondary` | `#97907F` stone |
| Text muted | `textMuted` | `#B0A898` |
| Heading | `heading` | `#2A2418` ink |
| Border | `border` | `#EAE3D6` |
| Divider | `divider` | `#EDE6D8` |
| Accent (gold) | `gold` | `#C8A84B` |
| Accent light | `goldLt` | `#E2C46A` |
| Navy | `navy` | `#0E0E22` |

**Dark mode (Celestial Night):**
| Role | Token | Hex |
|---|---|---|
| Background | `bg` | `#0F0E1A` cosmic navy |
| Card | `card` | `#171529` plum-navy |
| Card alt | `cardAlt` | `#1D1A30` mid plum |
| Card elevated | `cardElevated` | `#222040` lighter plum |
| Text primary | `text` | `#EDE6D8` warm cream |
| Text secondary | `textSecondary` | `#8B85A0` lavender-gray |
| Text muted | `textMuted` | `#5E587A` |
| Heading | `heading` | `#F5EDE3` bright cream |

### WCAG contrast audit (key text-on-background pairs)

Calculated using sRGB luminance formula.

**Light mode:**
| Pair | Ratio | WCAG AA (4.5:1 normal / 3:1 large) | Verdict |
|---|---|---|---|
| `text` `#2A2418` on `bg` `#FAF8F2` | **13.4 : 1** | ✅ AAA |
| `textSecondary` `#97907F` on `bg` `#FAF8F2` | **3.4 : 1** | ⚠️ Borderline — passes 3:1 large only |
| `textMuted` `#B0A898` on `bg` `#FAF8F2` | **2.4 : 1** | ❌ FAILS AA. Only safe for decorative text. |
| `gold` `#C8A84B` on `bg` `#FAF8F2` | **2.7 : 1** | ❌ FAILS AA for body. ✅ for large text 18pt+ |
| `gold` `#C8A84B` on `navy` `#0E0E22` | **9.0 : 1** | ✅ AAA — this is what hero gradients use |

**Dark mode:**
| Pair | Ratio | Verdict |
|---|---|---|
| `text` `#EDE6D8` on `bg` `#0F0E1A` | **15.0 : 1** | ✅ AAA |
| `textSecondary` `#8B85A0` on `bg` `#0F0E1A` | **5.4 : 1** | ✅ AA |
| `textMuted` `#5E587A` on `bg` `#0F0E1A` | **2.8 : 1** | ❌ FAILS AA. Decorative only |
| `gold` `#C8A84B` on `bg` `#0F0E1A` | **8.6 : 1** | ✅ AAA |

### Issues
1. **`textMuted` fails WCAG AA in both modes.** Used for timestamps, hint text, subtle metadata. If used for anything informational, it's an a11y violation.
2. **`gold` on cream fails for body-sized text.** Used as accent (CTAs) — fine for 18pt+ but not 12pt labels. Several gold 11pt labels exist. Bump to 14pt OR move to higher-contrast.
3. **`textSecondary` light-mode is borderline 3.4:1.** Passes 3:1 for large text only — but is used for body sub-copy in many cards.

### Recommendations

| Fix | Detail |
|---|---|
| Darken `textSecondary` light | `#97907F` → `#7A745F` (raises ratio to 4.5:1) |
| Darken `textMuted` | `#B0A898` → `#8C8475` (raises to 3.0:1) — still decorative-only |
| Use `gold` for ≥14pt only | Audit 11/12pt gold labels and bump |
| Add a `success`/`warning`/`error` text-on-card contrast verification step | Not yet checked |

**Verdict:** Color tokens are well-architected. Two values fail AA contrast and need adjustment. Otherwise on-brand premium-feminine palette that the audience will love.

---

## 2. TYPOGRAPHY

### Stack
- **Serif (display):** Playfair Display 400 / 400 Italic / 500 / 600
- **Sans (body):** DM Sans 300 / 400 / 500 / 600

Both Google Fonts loaded at App startup via `expo-font`. **Editorial-feminine pairing** — exactly what the audience expects from premium astrology / wellness apps. Same family used by The Pattern, similar aesthetic to Sanctuary.

### Sizes used (frequency)

| Size | Count | Use case observed | Verdict |
|---|---|---|---|
| 8pt | 12 | Tiny letter-spaced ALL-CAPS labels | ❌ below absolute minimum |
| 9pt | 79 | Section labels (uppercase letterspaced) | ❌ below 11pt mobile minimum |
| 10pt | 126 | Captions, sub-labels, badges | ⚠️ below 11pt minimum but uppercase-letterspaced often readable |
| 11pt | 139 | Body sub-text, secondary copy | ✅ minimum acceptable |
| 12pt | 135 | Body sub-text | ✅ |
| 13pt | 141 | Body | ✅ borderline — recommend 14pt body |
| 14pt | 145 | Body | ✅ recommended body size |
| 15pt | 54 | Body / button labels | ✅ |
| 16pt | 72 | Buttons, primary CTAs | ✅ |
| 18pt | 44 | Card titles | ✅ |
| 20-28pt | 60+ | Section heads, big numbers | ✅ |

### Issues
1. **9pt and 8pt labels are sub-minimum.** Even with uppercase + letterspacing, they fail accessibility for users with vision issues or Dynamic Type cranked up.
2. **fontSize: 13 used heavily for body.** Recommend 14pt minimum (audience is general but iOS Dynamic Type goes ≤ 70% in xSmall).
3. **No support for Dynamic Type.** All sizes are fixed numbers. iOS users who scale type system-wide get nothing.

### Recommendations

| Fix | Effort | Impact |
|---|---|---|
| Bump all `fontSize: 8` → 11 | 30 min | Legibility |
| Bump all `fontSize: 9` → 11 | 1 hr | Legibility |
| Bump section labels `fontSize: 10` → 11 + tighter letterspace | 30 min | Polish + a11y |
| Move body 13pt → 14pt where possible | 30 min | Audience comfort |
| Add `allowFontScaling` audits | 15 min | Dynamic Type support (Apple wants this) |

### Recommended typography scale (replace ad-hoc fontSizes)

```js
export const TYPE = {
  // Display (Playfair)
  hero: { family: FONTS.serif, size: 32, lineHeight: 40 },
  display: { family: FONTS.serif, size: 24, lineHeight: 32 },
  title: { family: FONTS.serifMedium, size: 20, lineHeight: 28 },
  // Body (DM Sans)
  body: { family: FONTS.sans, size: 16, lineHeight: 24 },
  bodySm: { family: FONTS.sans, size: 14, lineHeight: 20 },
  caption: { family: FONTS.sans, size: 12, lineHeight: 17 },
  // Labels (uppercase, letterspaced)
  label: { family: FONTS.sansSemiBold, size: 11, letterSpacing: 1.5, lineHeight: 14, textTransform: 'uppercase' },
  // Buttons
  btn: { family: FONTS.sansMedium, size: 16, letterSpacing: 0.3 },
};
```

---

## 3. SPACING

### Values used (frequency, from HomeScreen / ProfileScreen / CompatibilityScreen)
| Value | Count | Pattern |
|---|---|---|
| 14 | 32 | Card padding |
| 16 | 21 | Card padding (alt) |
| 8 | 19 | Vertical breathing |
| 16 | 18 | Horizontal padding |
| 20 | 14 | Section padding |
| 12 | 13 | Tighter padding |
| 20 | 12 | Section padding |
| 10 | 11 | Vertical |
| 4 | 10 | Tight |

### Issues
**Not a strict grid.** Mixing 12/14/16/20 creates micro-inconsistencies. iOS HIG and Material both recommend an 8pt grid (with 4pt for fine-grained).

### Recommended spacing scale

```js
export const SPACE = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

Migrate ad-hoc 14 → 16, 10 → 8 or 12, 18 → 16. Not urgent — design works — but a single refactor reduces visual noise.

---

## 4. CORNER RADIUS

### Values used
| Radius | Count | Use case |
|---|---|---|
| 14 | 78 | Standard cards |
| 100 | 55 | Pills (CTAs) |
| 16 | 51 | Larger cards |
| 12 | 48 | Tight cards |
| 10 | 32 | Smaller cards |
| 2 | 25 | Progress bars |
| 24 | 22 | Hero rounded-bottom |
| 20 | 22 | Modals |
| 18 | 18 | Misc |

### Issues
**No defined scale.** 10/12/14/16/18/20/24 all used. PDF-like aesthetic actually benefits from this softness, but visual consistency suffers.

### Recommended radius scale

```js
export const RADIUS = {
  sm: 8,    // chips, small buttons
  md: 14,   // standard cards (preserve current dominant value)
  lg: 20,   // larger cards, modals
  xl: 28,   // pill buttons (or use SPACE.xxl)
  pill: 100, // fully-pill CTAs
  hero: 24,  // hero bottom corners
};
```

Migrate 10/12 → 8 or 14. 16/18 → 14 or 20. Not urgent.

---

## 5. COMPONENT INVENTORY

Looking at `src/components/` (30 files):

**Atoms** (basic, reusable):
- `Stars.js` — animated background ✅
- `CelestialSigil.js` — SVG mark
- `ChartWheel.js` — SVG chart
- (no shared `Button.js`, `Chip.js`, `Card.js` — buttons inlined per-screen)

**Molecules:**
- `CosmicTooltip.js` — tooltip explainer
- `AstroText.js` — auto-highlights terms
- `QuestCard.js`
- `CosmicIDCard.js`, `CosmicRarityCard.js`
- `LunarEventCard.js`, `MercuryRxCard.js` (now hidden)

**Organisms:**
- `BadgeUnlockModal.js`, `LevelUpModal.js`, `StreakMilestoneModal.js`
- `WelcomeBackModal.js`, `NotificationPermissionModal.js`
- `TabBar.js`
- `LockedFeatureOverlay.js`

**Share cards (organisms):**
- `DailyShareCard.js`, `DailyStoryCard.js`
- `MonthlyRecapCard.js`, `BadgeShareCard.js`
- `LevelUpShareCard.js`, `MatchStoryCard.js`
- `WhisperShareCard.js`, `BigThreeShareCard.js`
- `StreakShareCard.js`, `TransitShareCard.js`
- `CompatibilityShareCard.js`, `ShareCard.js` (frame)

### Issues
1. **No shared `Button` / `Chip` / `Card` atoms.** Every screen inlines its own button styles. Causes the radius inconsistency above. ~25-30 distinct button instantiations across screens.
2. **Modals don't share a base.** Each modal reimplements overlay + card.
3. **Share cards are well-isolated** but very many — 12 different cards. Code duplication.

### Recommendations

| Fix | Effort | Impact |
|---|---|---|
| Extract `Button` atom (4 variants: primary gold gradient, secondary outlined, ghost, destructive) | 2 hr | Visual + behavioral consistency |
| Extract `Chip` atom (filled, outlined, selected) | 1 hr | Suggested-question chips, relationship-type pills |
| Extract `Card` atom (default, elevated, alt-bg) | 1 hr | Standardize radius + padding |
| Extract `BaseModal` with overlay + card + dismiss | 1 hr | Removes duplication across 5 modals |

**Not urgent for v1 submission.** Post-approval refactor.

---

## 6. ACCESSIBILITY (a11y) — 🔴 THE CRITICAL ISSUE

### What we have
- ✅ Color contrast (mostly — see §1)
- ✅ Haptic feedback on key actions (`haptic.light()`, `haptic.medium()`, etc.)
- ✅ Touch target sizes (mostly 44pt+)

### What we DON'T have
**Zero `accessibilityLabel`. Zero `accessibilityRole`. Zero `accessibilityHint`. Zero `accessibilityState`.**

This means:
- VoiceOver reads literal text only — buttons announce as "button" instead of "Add a partner, button"
- Icons-only buttons (share ↗, close ×, back ‹) are silent to screen readers
- Toggle states (the Show astrology details switch) don't announce as switches
- Tab bar items announce as touchable areas, not tabs
- Modal open/close announces nothing
- Loading states ignored by screen readers

**Apple's review process includes basic accessibility checks since iOS 17.** Reviewer turns on VoiceOver, taps around. If a button is silent or labelled wrong, it's a design-quality issue under guideline 4.0.

### Code we need to add

For every `TouchableOpacity` that's an interactive element:

```jsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add someone to your circle"
  accessibilityHint="Opens form to enter their name and birth date"
  ...>
```

For toggles:
```jsx
<TouchableOpacity
  accessibilityRole="switch"
  accessibilityState={{ checked: showAstrology }}
  accessibilityLabel="Show astrology details"
  ...>
```

For tabs (in TabBar.js):
```jsx
<TouchableOpacity
  accessibilityRole="tab"
  accessibilityState={{ selected: active }}
  accessibilityLabel={tab.label}
  ...>
```

For images / decorative icons:
```jsx
<Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✦</Text>
```

For headings:
```jsx
<Text accessibilityRole="header">Today</Text>
```

### Surfaces that MUST get labels (priority order)

| # | Surface | Element count |
|---|---|---|
| 1 | TabBar (4 tabs) | 4 |
| 2 | Onboarding back/continue buttons | 12 × 2 = 24 |
| 3 | Profile rows (Privacy, Terms, Support, Reset, etc.) | ~10 |
| 4 | Today screen cards (Daily Reflection, Quick-add, Drift, Briefing, Share button) | ~6 |
| 5 | Connections add modal + relationship pills | ~12 |
| 6 | Connections detail (back, score, share button) | ~5 |
| 7 | Chat send button + suggested chips | unbounded but loop (~10) |
| 8 | Modals (close buttons, primary actions) | ~8 modals × 2 = 16 |
| 9 | Share cards (decorative, mark as hidden) | 12 cards |

**Total: ~100 elements to label.** ~3-4 hr of focused work.

### Quick wins (2 hr)

1. Add `accessibilityRole="tab"` + `accessibilityLabel={tab.label}` to TabBar items
2. Add `accessibilityRole="button"` + label to all CTAs in Today / Connections / Profile
3. Add `accessibilityRole="header"` to all main screen headings
4. Add `accessibilityElementsHidden` to all decorative emoji/glyph Text elements
5. Mark loading states with `accessibilityLiveRegion="polite"` (Android) / appropriate iOS hint

### Long-tail (1-2 hr)

6. Per-modal accessibility (focus management, dismiss labels)
7. Per-onboarding-step `accessibilityLabel` on option cards
8. Chat bubble `accessibilityLabel` (concatenated speaker + text)

---

## 7. PERFORMANCE

### List rendering
- 0 `FlatList` / 0 `SectionList` usages
- 142 `.map()` direct renders

For our app's lists:
- **Connections grid** (typical 0-15 partners) — `.map()` is fine
- **Reports grid** (7 tiles, fixed) — `.map()` is fine
- **Badges grid** (~24 badges) — `.map()` is fine
- **Chat history** — `.map()` over messages. **This grows unboundedly.** Should be `FlatList` with `inverted` for scroll-from-bottom.

### Memoization
- 1 `React.memo` total. Extensive prop-drilling without memo.
- HomeScreen is 2900+ lines, re-renders heavily on state change.

### Recommendations

| Fix | Effort | Impact |
|---|---|---|
| Convert ChatScreen messages → `FlatList inverted` | 1 hr | Avoids janky scroll on long chats |
| Convert JournalHistoryScreen → `FlatList` | 30 min | Long history performance |
| Add `React.memo` to TabBar item, QuestCard, share cards | 1 hr | Reduces re-render cost |
| Extract HomeScreen sections into smaller components | 2-3 hr | Easier to memoize, easier to test |

**Not blocking submission.** Performance is fine on iPhone 14+ at current data volumes.

---

## 8. iOS HIG ALIGNMENT

| HIG principle | Status |
|---|---|
| Tab bar at bottom (3-5 items) | ✅ 4 tabs |
| Back button top-left | ✅ in stack screens |
| Primary action top-right | ⚠️ inconsistent (Profile uses bottom CTA, others use top-right) |
| Large titles | ❌ custom heroes everywhere (intentional brand decision) |
| Modal swipe-to-dismiss | ⚠️ presentation: `fullScreenModal` blocks swipe-to-dismiss; consider `modal` for less-critical modals |
| System fonts | ❌ custom Google Fonts (intentional — editorial brand) |
| Haptic feedback | ✅ integrated |
| Dark mode | ✅ comprehensive |
| Dynamic Type | ❌ no `allowFontScaling` audit |
| Safe area | ✅ uses `useSafeAreaInsets` |
| Status bar style | ✅ controlled via `<StatusBar style="light" />` |
| 44pt touch targets | ⚠️ mostly OK, some gaps |

### HIG deviations that are *intentional* (don't change):
- Custom heroes instead of large titles — required by editorial brand
- Custom fonts (Playfair + DM Sans) — required by audience aesthetic
- Custom blur tab bar — distinctive, on-brand, still hits HIG functional requirements

### HIG deviations to fix:
- Add Dynamic Type support (or document explicitly why not)
- Audit small touch targets (share ↗ icons, close × buttons, sign chip taps)

---

## 9. AUDIENCE-FIT FRAME (women 18-30, US/UK/AU, iOS-heavy)

### What this audience expects (from competitor benchmarking)

| Element | Co-Star | The Pattern | Sanctuary | Celestia |
|---|---|---|---|---|
| Color register | Brutalist black/white | Lavender pastel | Purple gradient | **Cream/navy/gold** ← differentiated |
| Font register | Helvetica Neue | Editorial serif | Custom display | **Playfair + DM Sans** ← editorial-modern |
| Tone | Cold/poetic | Mystical-warm | Clinical-mystic | **Warm-direct** (post-V1_OVERRIDE) |
| Animation | Minimal | Heavy gradient | Gradient + stars | **Stars + orbs (subtle)** |
| Share assets | Heavily-stylized cards | Plain | Plain | **Branded cards w/ gold trim** |
| Voice/Tone | Sass | Therapeutic | Mystic | **Best-friend who reads charts** |

### What Celestia hits

✅ **Premium-feminine without being saccharine** — cream-gold-navy is the sweet spot. Audience screenshots and re-shares the palette. ✅ Strong differentiation from Co-Star (cold) and The Pattern (washed-out).

✅ **Warm AI tone** — V1_LANGUAGE_OVERRIDE mandates psychological lead with astrology mid-sentence. Reads as a smart friend, not a guru. Audience trust signal.

✅ **Discoverable depth** — daily reflection prompt + Connections + Ask + Profile-with-toggle = both windows served (PDF balance).

### What Celestia misses (audience-side)

⚠️ **Big-Three identity moment is gated.** The audience came for the Sun/Moon/Rising reveal. We hide it by default. The discovery banner solves this BUT requires 3 Profile visits to surface trust. Risk: audience bounces before banner triggers.

⚠️ **Empty states feel utilitarian.** Empty Connections is "Add Someone" + relationship-type legend. Could be warmer ("Who's the first person you want to understand better?")

⚠️ **No celebrity/famous-person hook.** Audience wants the "Comparing me to my celebrity crush" template. PDF defers to v2 (5.2 IP risk). Acceptable for v1.

### Recommendations

| Fix | Effort | Impact |
|---|---|---|
| Discovery banner copy A/B for the 3-visits — soften it | 15 min | Higher banner engagement |
| Connections empty state — warmer, less utility | 30 min | First-add conversion |
| Profile birth-info display — when astrology is ON, make it a beautiful card not text-only | 1 hr | Audience screenshot |
| Add a "I want to understand…" empty state hint on Ask | 30 min | First-message engagement |

---

## 10. SUMMARY TABLE — design system gaps

| Pillar | Current state | Recommended action | Priority |
|---|---|---|---|
| Color tokens | Light + dark, complete | Fix `textMuted` contrast (P1) | P1 |
| Typography | Ad-hoc fontSizes | Define TYPE scale; bump <11pt (P1) | P1 |
| Spacing | Mostly 4pt-aligned | Document SPACE constant (P3) | P3 |
| Corner radius | Range 2-100, no scale | Document RADIUS constant (P3) | P3 |
| Components | No shared atoms | Extract Button / Chip / Card / BaseModal (P3) | P3 |
| **Accessibility** | **0 a11y props** | **Add labels/roles/hints (P0)** | **P0** |
| Performance | `.map()` everywhere | Convert long lists to FlatList (P2) | P2 |
| Dark mode | Comprehensive ✓ | None | — |
| Haptics | Integrated ✓ | None | — |
| Animations | Tasteful ✓ | None | — |

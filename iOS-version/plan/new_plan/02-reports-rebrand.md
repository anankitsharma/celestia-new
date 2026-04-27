# 02 — Reports Tab: Relational Rebrand

**File:** `src/screens/ReportsScreen.js`
**Effort:** 1 hour
**Impact:** High — second-strongest 4.3(b) tell after Today.

---

## The problem

Report names are already mostly relational ("Love Compass", "Career & Colleagues", "Life Patterns", "Year of Patterns") — that work was done. But:

1. **Icons are planetary glyphs** — `♀ ♄ ☽ ☊ ♃ ☿ ☉` (lines ~258–266 of `ReportsScreen.js`). On a 2-second skim of the grid, the icons read as a horoscope catalogue.
2. **Featured card** is a giant purple card with a `☽` moon glyph and the headline "Your November Forecast." Straight horoscope-app behavior.
3. **Section heading** "DEEP READINGS" or no heading — fine.

---

## Target state

A grid of relational cards that happen to use astrological data underneath. Visual cues should read as relationship/psychology, not zodiac.

### Icon swap

| Report | Type | Current icon | New icon |
|---|---|---|---|
| Love Compass | love | ♀ | ♡ |
| Career & Colleagues | career | ♄ | ◆ |
| Cycles & Energy | lunar | ☽ | ◐ |
| Life Patterns | purpose | ☊ | ✦ |
| Year of Patterns | yearly | ♃ | ↗ |
| Right Now | transit | ☿ | ⚡ |
| Year Map {YEAR} | solar_return | ☉ | ◎ |

The replacements are still glyphs (consistent visual style) but they don't map to specific planets. They map to the *theme* of the report.

### Featured card reframe

Current: "Your {Month} Forecast" headline + giant `☽` glyph + zodiac-energy subtitle ("Capricorn season is here…").

New: "Pattern of the Month" headline + `✦` icon (no moon) + relational subtitle. Strip the `MONTH_ZODIAC_ENERGY[CURRENT_MONTH]` call from the description — replace with a relational lead.

```jsx
<Text style={[styles.featuredDesc, { color: colors.textSecondary }]}>
  {sunSign
    ? `What's shifting in your relationships and rhythms this month — week by week.`
    : `What's shifting this month — patterns to watch in love, work, and your own rhythm.`}
</Text>
```

Featured card gradient stays (the dark plum reads as "premium content card" not "astrology"). Just swap the `☽` for `✦` and rewrite the copy.

### Section label

Add a section header above the grid: `RELATIONSHIP & PATTERN READINGS`. Currently the grid has no label — adding one frames the section.

---

## Specific changes

### Change 1: REPORTS array icon swap

**Location:** Lines 258–266.

Change to:

```js
const REPORTS = [
  { icon: '♡', bg: ['#3A0A3A', '#1A1060'], accent: '#E85090', name: 'Love Compass', desc: 'How you do attachment, intimacy, and conflict', type: 'love', tier: 'pro' },
  { icon: '◆', bg: ['#0A2A3A', '#1A1060'], accent: '#5090E8', name: 'Career & Colleagues', desc: 'Your working style, what energizes vs drains', type: 'career', tier: 'pro' },
  { icon: '◐', bg: ['#1A0A3A', '#0E0E22'], accent: '#A080E0', name: 'Cycles & Energy', desc: 'How your weekly rhythm shifts', type: 'lunar', tier: 'pro' },
  { icon: '✦', bg: ['#2A1A0A', '#1A1060'], accent: '#C8A84B', name: 'Life Patterns', desc: 'Themes worth paying attention to', type: 'purpose', tier: 'pro' },
  { icon: '↗', bg: ['#0A1A2A', '#0E0E22'], accent: '#4ECDC4', name: 'Year of Patterns', desc: `Month-by-month outlook for ${CURRENT_YEAR}`, type: 'yearly', tier: 'pro' },
  { icon: '⚡', bg: ['#1A0A1A', '#2A0A2A'], accent: '#FF6B6B', name: 'Right Now', desc: 'What\'s shaping your week', type: 'transit', tier: 'pro' },
  { icon: '◎', bg: ['#0E0E22', '#2A1A6E'], accent: '#C8A84B', name: `Year Map ${CURRENT_YEAR}`, desc: 'Your year ahead from birthday to birthday', type: 'solar_return', tier: 'pro' },
];
```

Also update the "Cycles & Energy" desc — current is "How lunar rhythms shape your week" which is too astro-coded. New: "How your weekly rhythm shifts."

### Change 2: Featured card glyph + copy

**Location:** Lines ~1340–1344.

```jsx
<LinearGradient colors={['#12082A', '#2A1060', '#0C1840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredImg}>
  <Text style={{ fontSize: 56, color: '#B388FF' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✦</Text>
  <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>{MONTH_NAME.toUpperCase()}</Text></View>
</LinearGradient>
```

(`☽` → `✦`)

**Location:** Featured headline + description, lines ~1345–1350.

```jsx
<Text style={[styles.featuredTitle, { color: colors.heading }]}>Pattern of the Month</Text>
<Text style={[styles.featuredDesc, { color: colors.textSecondary }]}>
  What's shifting in your relationships and rhythms this {MONTH_NAME.toLowerCase()} — week by week.
</Text>
```

Drop `MONTH_ZODIAC_ENERGY[CURRENT_MONTH]` from the description string.

CTA button text: "Get {MONTH_NAME} Report" → "Read Your {MONTH_NAME}" (less newsletter-y).

### Change 3: Add section heading above grid

**Location:** Lines ~1366 (just before `<View style={styles.grid}>`).

```jsx
<Text accessibilityRole="header" style={[styles.gridHeading, { color: colors.textSecondary }]}>
  RELATIONSHIP & PATTERN READINGS
</Text>
```

Add a style:
```js
gridHeading: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, marginTop: 8, marginBottom: 12, paddingHorizontal: 4 },
```

### Change 4: Hero text on the screen itself

**Location:** Find the screen title (likely the first big Text in the hero LinearGradient).

If it's "Reports" or "Your Reports" — keep. If it's "Cosmic Reports" or "Astrology Reports" — change to "Reports".

The subtitle/tagline should read "Deep readings for relationships, patterns, and your year ahead" — confirm and adjust.

---

## Files to touch

- `src/screens/ReportsScreen.js` (only)

No PDF generator changes — those run when a user taps a report and stay astrology-rich, which is fine because that's an opt-in detail surface, not the catalogue.

---

## Risks

| Risk | Mitigation |
|---|---|
| Glyph substitutes not present in the loaded font | All chosen glyphs are common Unicode (♡ ◆ ◐ ✦ ↗ ⚡ ◎). Test render on simulator. |
| PDF report titles still say "Lunar Guide" / "Solar Return" | That's inside the generator (line 286). Leave for v1 — those are inside the PDF, not on app surface. |
| Featured card looks empty without zodiac energy text | The new copy is shorter but still says something. If it feels thin, add a second line: "Themes to watch in love, work, and your own rhythm." |

---

## Verification

1. `node -c src/screens/ReportsScreen.js` passes
2. Open Reports tab — grid shows 7 tiles with non-planetary icons
3. Featured card headline reads "Pattern of the Month", uses `✦`, no zodiac-energy phrase
4. Tap any report — modal generates correctly, PDF still works
5. Compare side-by-side with old screenshot to confirm visual is no longer "horoscope catalogue"

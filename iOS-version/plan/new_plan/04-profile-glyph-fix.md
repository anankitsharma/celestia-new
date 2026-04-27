# 04 — Profile: Hide Hero Zodiac Glyph When Astrology Off

**File:** `src/screens/ProfileScreen.js`
**Effort:** 5 minutes
**Impact:** Low (bug fix), but it's a visible leak so worth fixing.

---

## The problem

The Profile hero renders a giant zodiac glyph in the background:

```jsx
<View style={styles.heroGlyph}>
  <Text style={{ fontFamily: FONTS.serif, fontSize: 128, color: 'rgba(200,168,75,0.04)' }}>
    {signGlyph}
  </Text>
</View>
```

Even when `showAstrology=false` and the sign badges row is hidden, the giant background glyph still renders (`rgba(200,168,75,0.04)` — faint, but visible on dark backgrounds). It's a 128pt zodiac symbol on the screen most users will visit.

We already gate the sign badges row (`{showAstrology && (<View style={styles.signsRow}>...)`) but missed this one.

---

## Target state

The `heroGlyph` block is wrapped in the same `showAstrology` gate as the sign badges row. Default: hidden. Toggle ON: appears.

---

## Specific change

**Location:** `src/screens/ProfileScreen.js` line ~266 (in the recently edited Tier 0 a11y pass it has the `accessibilityElementsHidden` props).

Find:
```jsx
<View style={styles.heroGlyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
  <Text style={{ fontFamily: FONTS.serif, fontSize: 128, color: 'rgba(200,168,75,0.04)' }}>
    {signGlyph}
  </Text>
</View>
```

Wrap in `{showAstrology && (...)}`:

```jsx
{showAstrology && (
  <View style={styles.heroGlyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Text style={{ fontFamily: FONTS.serif, fontSize: 128, color: 'rgba(200,168,75,0.04)' }}>
      {signGlyph}
    </Text>
  </View>
)}
```

`showAstrology` is already plumbed into ProfileScreen — no extra wiring.

---

## Risks

None. It's a one-line wrap.

---

## Verification

1. `node -c src/screens/ProfileScreen.js` passes
2. Open Profile with toggle OFF — confirm the faint giant zodiac glyph in hero background is gone
3. Toggle ON — confirm it reappears

# 06 — Connections: Orbit Visual + Celebrity Match Cleanup

**File:** `src/screens/CompatibilityScreen.js`
**Effort:** 1 hour
**Impact:** Medium-low — Connections already reads as a relationship app. These are the two remaining astro-coded surfaces.

---

## The problem

### 1. Empty-state orbit visual

When a user has no saved connections, the empty-state shows a rotating concentric orbit system:
- Center orb = "you" with zodiac glyph
- 3 rotating rings (partner / family / friends categories)
- Animated rotation
- Pulsing glow

Visual reading: solar system. Apple reviewer scrolling: "this is an astrology app."

### 2. Celebrity Match section

A horizontal scroll of celebrity zodiac matches ("Are you compatible with your crush?" + scrollable celebrity chips with sun signs). This is the strongest "horoscope-fan service" surface in the app — it's classic astrology-app behavior (Co-Star, The Pattern, etc. all have this).

---

## Target state

### Empty-state replacement

Replace the rotating orbit system with a quiet **people grid mockup** + clear CTA. Shows "this is what your circle will look like" using initials in circles, not orbits.

```
┌─────────────────────────┐
│   YOUR CIRCLE           │
│                         │
│   ⊙  ⊙  ⊙               │  ← faded placeholder dots
│   ⊙  ⊙  ⊙               │
│                         │
│   Add someone to start  │
│   ┌─────────────────┐   │
│   │  + Add Someone  │   │
│   └─────────────────┘   │
└─────────────────────────┘
```

The Add Someone CTA already exists below — keep that. Replace the orbit visual above it.

### Celebrity Match treatment — three options

**Option A (recommended):** Hide the entire Celebrity Match section behind `{showAstrology && (...)}`. Reasoning: it's the most horoscope-coded feature in Connections, and users curious about it can find it after they opt in.

**Option B:** Rename and reframe — "Test the Connection" with a generic prompt ("Try the app with someone you don't know personally"). Same data, different framing.

**Option C:** Cut from v1 entirely. Reintroduce in v1.x.

Recommendation: **A**. It keeps the feature for users who want it without surfacing it on the default review path.

---

## Specific changes

### Change 1: Replace orbit empty-state visual

**Location:** Lines ~807–918 (the `{partnerProfiles.length === 0 && <View style={styles.orbitSystemWrap}>...</View>}` block).

Replace with:

```jsx
{partnerProfiles.length === 0 && (
  <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 }}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {/* 6 placeholder circles — 2 rows × 3 */}
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cardAlt, opacity: 0.5 }} />
      ))}
    </View>
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cardAlt, opacity: 0.3 }} />
      ))}
    </View>
    <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.heading, textAlign: 'center', marginBottom: 4 }}>
      Your circle starts here
    </Text>
    <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
      Add the people in your life — partners, friends, family, colleagues — to see how you connect.
    </Text>
  </View>
)}
```

Delete the rotating animation refs/setup that fed the orbit system (`pulseScale`, `pulseOpacity`, `orbitRotations`, `orbitCounterRotations`). These animations are now dead code.

Keep the gold "Add Someone" CTA block at lines ~921–937 — it still serves the same role.

The Orbit Legend block (lines ~944–962) — keep or drop. It currently lists relationship type counts ("Partner 0", "Friend 0"). With no orbit visual above, it reads like a legend with nothing to legend. **Drop it for v1**.

### Change 2: Gate Celebrity Match

**Location:** Lines ~1016–1079 (the `<View style={styles.celebSection}>` block).

Wrap the entire `<View style={styles.celebSection}>` block in `{showAstrology && (...)}`.

Plumb `showAstrology` into CompatibilityScreen if not already there (mirror Profile pattern: `loadBoolean('celestia_show_astrology_v1', false)` in useEffect).

### Change 3: (Optional) clean up rotating animation code

If you delete the orbit visual, the `pulseScale`/`pulseOpacity`/`orbitRotations`/`orbitCounterRotations` Animated.Values and their `Animated.loop` setup useEffects become dead code. Remove them to keep the file clean. Search for `pulseScale` and `orbitRotations` to find all references.

If you'd rather leave them (animations don't cost much when their consumer isn't rendered), leave them. v1.x cleanup.

---

## Files to touch

- `src/screens/CompatibilityScreen.js` (only)

---

## Risks

| Risk | Mitigation |
|---|---|
| Empty state looks too plain without the orbit | The 6-circle grid + headline + sub conveys the same "this is where your people will go" without the astro visual. Designed to be quiet, not flashy. |
| Removing Celebrity Match cuts a viral feature | It's still there for opt-in users. Default users can find it via the Profile toggle + return to Connections. |
| Unused animation code stays in the file | Acceptable for v1 — dead code doesn't ship to production any worse than live code. Clean up post-approval. |

---

## Verification

1. `node -c src/screens/CompatibilityScreen.js` passes
2. Fresh install → onboard → Connections tab → confirm empty state shows the 6-circle placeholder grid, no rotating animation
3. Tap "+ Add Someone" → modal works
4. Add a partner → empty state goes away, Your Connections list appears (existing behavior)
5. Profile → toggle showAstrology ON → return to Connections → confirm Celebrity Match section reappears
6. Toggle OFF → confirm Celebrity Match disappears

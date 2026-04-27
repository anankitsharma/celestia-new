# 03 — Journal: Gate Astro Surfaces Behind Toggle

**Files:** `src/screens/JournalScreen.js`, `src/screens/JournalHistoryScreen.js`
**Effort:** 30 minutes
**Impact:** Medium — astrology visible on a screen every user reaches, regardless of toggle.

---

## The problem

A user with `showAstrology=false` who taps "Write in Journal" today sees:

1. **Hero sky strip** at top — `{moonIcon} {moonPhase} in {moonSign}` + 3 planet glyph chips with signs
2. **Cosmic context panel** below the writing area — `THE SKY RIGHT NOW` block with full moon data + planets list with degrees + retrograde marks

Both are visible by default. They make Journal feel like a cosmic-themed surface, not a journal.

The cosmic snapshot data is *useful* — saving "the sky was X when you wrote this" gives the entry context for later review. We keep saving it. We just don't render it visually unless the user opts in.

---

## Target state

**JournalScreen** (writing view):

- Sky strip at top of hero — wrap in `{showAstrology && (...)}`. Default: hidden.
- Cosmic context panel below writing area — wrap in `{showAstrology && (...)}`. Default: hidden.
- The hero stays clean: date + "Journal" title + saved badge. No moon, no planets.
- Snapshot still saves silently with the entry (`cosmic_snapshot` column in DB).

**JournalHistoryScreen** (calendar/history):

- "Moon in [sign]" chip on recent entry rows — wrap in `{showAstrology && (...)}`.
- Mood emoji and date stay (those are journal-app, not horoscope-app).
- Calendar dot indicator for "has entry" stays — fine.

---

## Specific changes

### JournalScreen — hero sky strip

**Location:** `src/screens/JournalScreen.js` lines ~206–218.

Find:
```jsx
<View style={styles.skyStrip}>
  <View style={styles.skyItem}>
    <Text style={styles.skyEmoji}>{moonIcon}</Text>
    <Text style={styles.skyText}>{moonData?.phaseName || 'Moon'} in {moonData?.sign || '—'}</Text>
  </View>
  <View style={styles.skyDivider} />
  {planets.slice(0, 3).map((p, i) => (
    <View key={i} style={styles.skyPlanetChip}>
      <Text style={styles.skyPlanetGlyph}>{PLANET_GLYPHS[p.name] || '★'}</Text>
      <Text style={styles.skyPlanetText}>{p.sign}</Text>
    </View>
  ))}
</View>
```

Wrap the entire `<View style={styles.skyStrip}>` block in:
```jsx
{showAstrology && (
  <View style={styles.skyStrip}>
    ...
  </View>
)}
```

### JournalScreen — cosmic context panel

**Location:** Lines ~296–312 (the `<View style={[styles.cosmicContext, ...]}>` block).

Wrap the entire block in `{showAstrology && (...)}`. Keep the snapshot save logic intact — that runs at save time, not render time.

### JournalScreen — plumb showAstrology

**Location:** Top of component.

Add (mirror Profile pattern):

```js
import { loadBoolean } from '../services/storage';

// Inside component, near other useState hooks:
const [showAstrology, setShowAstrology] = useState(false);

useEffect(() => {
  loadBoolean('celestia_show_astrology_v1', false).then(setShowAstrology);
}, []);
```

If `loadBoolean` already exists in storage.js (it does — used in Profile), just import it. If not, fall back to `loadObject`.

### JournalHistoryScreen — recent entry moon chip

**Location:** `src/screens/JournalHistoryScreen.js` line ~321.

Find:
```jsx
{snapshot?.moon && <Text style={[s.recentMoon, { color: colors.textSecondary }]}>{MOON_ICONS[snapshot.moon.phase] || '🌘'} {snapshot.moon.sign}</Text>}
```

Change to:
```jsx
{showAstrology && snapshot?.moon && <Text style={[s.recentMoon, { color: colors.textSecondary }]}>{MOON_ICONS[snapshot.moon.phase] || '🌘'} {snapshot.moon.sign}</Text>}
```

Plumb `showAstrology` the same way (useEffect + loadBoolean) at top of component.

### JournalHistoryScreen — entry detail rendering

**Location:** Wherever `renderEntry()` is defined — search for `renderEntry`. If it surfaces the cosmic snapshot in the detail view, gate that too.

If it doesn't (just shows content + tags + mood), no change needed. Verify on simulator.

---

## Files to touch

- `src/screens/JournalScreen.js`
- `src/screens/JournalHistoryScreen.js`

No DB schema or service changes. The `cosmic_snapshot` column keeps being written.

---

## Risks

| Risk | Mitigation |
|---|---|
| Layout looks empty without sky strip | The hero still has date + "Journal" title + saved badge. It's a cleaner journal screen, not an empty one. |
| User toggles astrology ON later, expects to see snapshot for *past* entries | The snapshot was saved — the chip will appear retroactively. Verify on simulator. |
| `showAstrology` state flips after entry save and the saved snapshot is now gated | Snapshot is in DB; UI just toggles visibility. No data loss. |

---

## Verification

1. `node -c` passes for both files
2. Profile → toggle showAstrology OFF → tap "Write in Journal"
3. Confirm: no moon chip, no planet chips at top, no cosmic context panel below
4. Write entry, save
5. Profile → toggle showAstrology ON → return to Journal
6. Confirm: sky strip + cosmic panel reappear; the entry just saved shows snapshot in history
7. JournalHistory → recent entries list — confirm moon chip appears/disappears with the toggle

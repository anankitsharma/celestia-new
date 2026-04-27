# 05 — TodaysSky: Gate Entry Behind Astrology Toggle

**Files:** `src/screens/HomeScreen.js`, `src/screens/TodaysSkyScreen.js` (verify only)
**Effort:** 30 minutes (most of the work happens in spec 01)
**Impact:** Medium — TodaysSky is pure astrology, reachable on default flow via the "Right Now" card on Today.

---

## The problem

`TodaysSky` is a full transit/sky deep-view screen. It's reached via the "Right Now" card on the Today tab (currently around line ~1292 of `HomeScreen.js`).

After spec 01 ("Today restructure"), the "Right Now" card is already wrapped in `{showAstrology && (...)}`, which means:

- showAstrology=false → the card is hidden → TodaysSky is unreachable from Today ✓
- showAstrology=true → the card appears → TodaysSky reachable ✓

If spec 01 ships, this spec is largely a verification pass. The work here is making sure no *other* entry point to TodaysSky exists on the default flow.

---

## Target state

TodaysSky is unreachable when `showAstrology=false`. No card, button, deep link, or notification leads to it on the default surface.

---

## Audit other entry points

Run a search:

```bash
grep -rn "TodaysSky" src/
```

Expected results (from current code):
- `src/screens/HomeScreen.js` — the "Right Now" card (gated in spec 01) ✓
- `src/navigation/AppNavigator.js` — Stack.Screen registration (keep — needs to exist for opt-in users)
- `src/services/notificationContentEngine.js` — possibly a deep-link route from a notification

If notifications deep-link to TodaysSky:
- Confirm the relevant template is in `V1_DISABLED_TEMPLATES`
- If not, add it

If any *other* surface (TransitsScreen, ChartScreen, Reports) has a "View today's sky →" button — wrap in `{showAstrology && (...)}` or remove for v1.

---

## Specific changes

### Step 1: Verify Today's "Right Now" card is gated

After spec 01 lands, the block at HomeScreen.js line ~1292 should be inside `{showAstrology && (...)}`. If it's not, gate it now:

```jsx
{showAstrology && activeTab === 'today' && (
  <TouchableOpacity style={styles.skyCard} ... onPress={() => navigation.navigate('TodaysSky')}>
    ...
  </TouchableOpacity>
)}
```

(Note: spec 01 also drops `activeTab === 'today'` since period tabs are gone — adjust accordingly.)

### Step 2: Audit other entry points

Run:
```bash
grep -rn "TodaysSky\|navigate.*Sky" src/ | grep -v node_modules
```

For each match:
- HomeScreen → handled in spec 01
- AppNavigator stack registration → keep (required for opt-in users)
- Notification deep-link → verify template is disabled in `V1_DISABLED_TEMPLATES`
- Any other → wrap in `{showAstrology && (...)}` or remove

### Step 3: TodaysSky screen itself

The screen contents are pure astrology. We do *not* need to gut them — they're only reached when astrology is on. But verify:

- No marketing copy that reads as horoscope ("Your daily horoscope") — should be "Today's transits" or similar.
- The screen has `headerShown: false` and a back button (existing pattern).

If the screen title at the top reads "Today's Horoscope" or anything similar, rename to "Today's Transits" or "What's Active Today".

---

## Files to touch

- `src/screens/HomeScreen.js` — covered by spec 01
- `src/services/notificationContentEngine.js` — verify template-block list (likely already done)
- `src/screens/TodaysSkyScreen.js` — verify title copy only

No new files. No service changes if templates are already blocked.

---

## Risks

| Risk | Mitigation |
|---|---|
| TodaysSky reached via deep link we missed | Search exhaustively (grep above). Confirm no `linking` config maps a URL scheme to it. |
| Notification still fires and deep-links to TodaysSky | Confirm `cm_transit_*` and `cm_sky_*` templates are in V1_DISABLED_TEMPLATES. |
| Removing card breaks "Right Now" preview that opt-in users like | The card still appears for opt-in users. We only remove it from default. |

---

## Verification

1. `grep -rn "TodaysSky" src/` — every match accounted for
2. Default flow: showAstrology=OFF → walk every tab → confirm no path reaches TodaysSky
3. Toggle astrology ON → confirm "Right Now" card appears on Today → tap → TodaysSky opens
4. Trigger any local notification (if dev tools exist) → confirm none link to TodaysSky on default flow

# 99 — Implementation Order & Verification Gates

How to actually ship the 6 specs in this folder without breaking anything.

---

## Sequencing

The specs are mostly independent — you can do them in any order — but there's a sensible flow that minimizes context-switching and lets you verify each one in isolation.

### Recommended order

```
1.  04-profile-glyph-fix.md        (5 min — warm-up, builds confidence)
2.  03-journal-gating.md           (30 min — small, contained)
3.  02-reports-rebrand.md          (1 hr — visual swap, low risk)
4.  06-connections-cleanup.md      (1 hr — empty-state replacement)
5.  01-today-restructure.md        (2–3 hr — biggest reshape)
6.  05-todays-sky-gating.md        (verify — most work happens in spec 01)
```

**Rationale:** Start with the smallest changes to confirm the toolchain (`node -c`, simulator reload) works. Build up to the biggest reshape (Today) last when you've already touched related screens. End with TodaysSky as a verification pass since spec 01 does most of the gating.

### If you want to ship to TestFlight in stages

Each spec is independently shippable. After every spec:

1. Run `node -c <file>` on every modified file
2. Reload Expo Go
3. Walk the affected tab — confirm no regressions
4. Commit to a feature branch

Don't push to main until all 6 specs land + final verification gate passes.

---

## Plumbing prerequisite

Several specs need the `showAstrology` value from AsyncStorage. Profile already does this. Confirm/add this helper pattern to each affected screen:

```js
import { loadBoolean } from '../services/storage';

// inside component:
const [showAstrology, setShowAstrology] = useState(false);

useEffect(() => {
  loadBoolean('celestia_show_astrology_v1', false).then(setShowAstrology);
}, []);

// Re-load on focus (in case user toggled it on Profile then came back):
useFocusEffect(useCallback(() => {
  loadBoolean('celestia_show_astrology_v1', false).then(setShowAstrology);
}, []));
```

The `useFocusEffect` is important — without it, a user who toggles astrology on Profile then navigates back to Today won't see the change until app restart.

Screens needing this plumbing (post-overhaul):
- HomeScreen (spec 01)
- JournalScreen (spec 03)
- JournalHistoryScreen (spec 03)
- CompatibilityScreen (spec 06)
- ProfileScreen (already has it)

If `loadBoolean` doesn't exist in `services/storage.js`, use `loadObject` and coerce, or add the helper:

```js
export async function loadBoolean(key, fallback = false) {
  const v = await AsyncStorage.getItem(key);
  if (v == null) return fallback;
  return v === 'true' || v === '1';
}
```

---

## Verification gates

### After each spec

- `node -c <modified file>` passes
- Expo Go reloads cleanly (no red box)
- Walk the affected tab; toggle astrology on/off; confirm both states render

### After all specs land — pre-TestFlight 30-second walkthrough

Pretend you're an Apple reviewer who never touches the astrology toggle:

1. **Onboarding** — does the framework-citation step (step 5) come through? Birth-detail collection feels like sign-up, not horoscope quiz?
2. **Today** — hero shows people, no period tabs, no moon chip in hero, no zodiac season banner, briefing is a small card not a hero?
3. **Connections** — empty state is a quiet 6-circle grid, no rotating orbits, no Celebrity Match section visible?
4. **Ask** — empty state suggests relationship prompts, AI responses lead with psychology not astrology, per-partner chips visible if any added?
5. **Profile** — no giant zodiac glyph in hero, no sign badges row, just name + birth info + settings list?
6. **Reports** (via Profile → Deep Readings) — grid uses `♡ ◆ ◐ ✦ ↗ ⚡ ◎` icons, featured card says "Pattern of the Month" not "Forecast"?
7. **Journal** (via Today's "Your Journal" card) — clean writing surface, no sky strip, no cosmic context panel?

If any answer is "yes I see horoscope stuff" — that spec didn't fully land. Go back.

### After all specs land — opt-in walkthrough

Toggle astrology ON via Profile. Walk every tab again. Verify:

- Moon chip appears in Today hero
- Zodiac season banner appears on Today
- "Right Now" sky card appears on Today
- TodaysSky reachable
- Sky strip + cosmic context appear in Journal
- Moon chip appears on JournalHistory entries
- Celebrity Match appears on Connections
- Sign badges + giant glyph appear on Profile hero
- Discovery banner stops showing (it should auto-dismiss after toggle)

If any of these are missing for opt-in users, the gate is too tight — the toggle should make them all reappear.

---

## Commit / branching strategy

Current branch: `ios-v1-resubmission`

Recommended: implement each spec as its own commit on this branch, with messages like:

- `Hide Profile hero zodiac glyph when astrology toggle off`
- `Gate Journal sky strip and cosmic context behind astrology toggle`
- `Rebrand Reports tab with relational icons and "Pattern of the Month"`
- `Replace Connections orbit empty-state with quiet people grid; gate Celebrity Match`
- `Restructure Today tab: people-first hero, kill period tabs, demote briefing`
- `Gate TodaysSky entry behind astrology toggle (verify only)`

After all 6 land, run the pre-TestFlight gate. If it passes, build with EAS and submit.

---

## What this overhaul does NOT do

For the avoidance of doubt:

- **Doesn't change the AI engine** — the V1_LANGUAGE_OVERRIDE in geminiService.js does the language work; this overhaul is structural.
- **Doesn't remove astrology** — every feature stays, just gated.
- **Doesn't change pricing/IAP** — still stubbed for v1.
- **Doesn't change auth** — still anonymous/local.
- **Doesn't add new features** — pure reshape.

If a reviewer asks "is this still an astrology app?" the honest answer is yes — but the *default surface* a user sees on first launch is a relationship pattern recognition tool. That's the 4.3(b) defense.

---

## After approval

Items to undo / revisit in v1.x once we're past Apple review:

- Restore Week/Month period tabs on Today (or rebuild as their own surfaces)
- Restore "Today's Sky" card as a default surface
- Restore Celebrity Match as a default surface
- Restore the orbit visual on Connections empty state (refined, less astro-coded)
- Re-enable IAP / paywall
- Restore email auth + cloud sync
- Re-enable astrology notification templates (selectively)
- Clean up any remaining `false &&` dead branches and unused animation refs

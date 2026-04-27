# 01 — Today Tab: People-First Restructure

**File:** `src/screens/HomeScreen.js`
**Effort:** 2–3 hours
**Impact:** Highest — this is the single biggest move toward 4.3(b) compliance.

---

## The problem

Today's structure today (top to bottom):
1. Hero (greeting + name + moon phase chip)
2. **Today / Week / Month period tabs** ← horoscope-app shape
3. Zodiac season banner
4. Eclipse banner
5. Daily Reflection card
6. Quick-add Connection card
7. Drift Alert card (when triggered)
8. **Navigator Briefing** (large dark card — the hero of the screen)
9. Ask Celestia / Share quick actions
10. Today's Sky "Right Now" card
11. Cosmic Journal card
12. Evening Reflection
13. Sunday week review
14. Story extras (badges/quests/whisper)
15. Time-adaptive prompts
16. Reports promo

A reviewer scrolls 1–2 screens, sees period tabs + a big "Today's Briefing" headline card, and reads it as a daily-content app. We rearrange and demote — no engine changes.

---

## Target structure

Top to bottom on the Today tab (showAstrology=false default):

1. **Hero** — greeting + name. Moon phase chip *removed* from hero (it's the strongest visual astro tell on first paint). Streak/avatar stay.
2. **Drift Alert** (when active) — moved to top. The single most relational surface in the app.
3. **"Your circle today"** — horizontal scroll of saved connections with attention badges. New section. Tap → opens that connection in Connections tab.
4. **Quick-add Connection** — kept, moved up.
5. **Daily Reflection** — kept where it is.
6. **Navigator Briefing** — *demoted*. Same content, smaller card. Renamed label "TODAY'S ENERGY" not "TODAY'S BRIEFING." No longer the hero.
7. **Today's Sky / Right Now card** — *removed from default flow*. Only renders when showAstrology=true. (See spec 05 for the entry-point treatment.)
8. **Cosmic Journal card** → **Journal card** (rename label "YOUR JOURNAL", drop "cosmic")
9. **Evening Reflection** (after 6 PM) — kept.
10. **Sunday week review** (Sundays only) — kept.
11. **Story extras** — kept (badges, quests). These read as engagement, not horoscope.
12. **Time-adaptive prompts** — kept.
13. **Reports promo** — kept (the rebrand happens in spec 02).

**Period tabs (Today/Week/Month) are removed entirely.** The Week and Month forecasts move into the demoted "Today's Energy" card as a small "View week →" / "View month →" link footer, OR get cut from v1 and reintroduced in v1.x. Recommendation: cut from v1. Apple sees one screen, not three.

---

## Specific changes

### Change 1: Remove period tabs

**Location:** Lines ~782–797 (`floatingTabWrap` + `floatingTabBar` block) and `PERIOD_TABS` constant near top of file.

- Delete the entire floatingTabWrap JSX block.
- Delete `PERIOD_TABS` constant.
- Delete `activeTab` state and `setActiveTab` calls.
- Replace every `activeTab === 'today'` conditional with `true` (and simplify).
- Replace every `activeTab !== 'today'` conditional with `false` and remove the dead branch (the Weekly/Monthly card at line ~1122).
- Remove `mainScrollRef.current?.scrollTo({ y: 0 })` calls on tab change (no tabs to switch).

### Change 2: Remove moon phase from hero

**Location:** Lines ~767–777 (Row 2 with moon phase + sign).

Wrap in `{showAstrology && (...)}` from `useUserProfile` settings, OR delete if showAstrology context isn't already imported here. The chip *is* a strong astro visual — gating is the right call.

If `showAstrology` is not yet plumbed into HomeScreen, plumb it: read from AsyncStorage `celestia_show_astrology_v1` on mount (matches Profile pattern), default false.

### Change 3: Move Drift Alert to top

**Location:** Currently around line ~929 (after Quick-add).

- Cut the entire Drift Alert TouchableOpacity block.
- Paste it immediately after the hero LinearGradient close, before any other content card.

### Change 4: Add "Your circle today" connections strip

**Location:** Insert after Drift Alert, before Daily Reflection.

New JSX block:

```jsx
{partnerProfiles && partnerProfiles.length > 0 && (
  <View style={{ marginBottom: 14 }}>
    <Text accessibilityRole="header" style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 8, paddingHorizontal: 4 }]}>
      YOUR CIRCLE
    </Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
      {partnerProfiles.slice(0, 8).map((p) => {
        const firstName = (p.name || '').split(' ')[0];
        const initial = firstName[0]?.toUpperCase() || '?';
        const driftWeeks = getDriftWeeks(p); // reuse existing drift calc
        return (
          <TouchableOpacity
            key={p.id}
            style={{ alignItems: 'center', width: 64 }}
            accessibilityRole="button"
            accessibilityLabel={`Open ${firstName}${driftWeeks >= 2 ? `. Not seen in ${driftWeeks} weeks.` : ''}`}
            onPress={() => navigation.navigate('Connections', { openPartner: p })}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: T.gold + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: driftWeeks >= 2 ? T.gold : 'transparent' }}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.heading }}>{initial}</Text>
              {driftWeeks >= 2 && (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 8, color: T.navy, fontFamily: FONTS.sansSemiBold }}>!</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>{firstName}</Text>
          </TouchableOpacity>
        );
      })}
      {/* Add CTA at end */}
      <TouchableOpacity
        style={{ alignItems: 'center', width: 64 }}
        accessibilityRole="button"
        accessibilityLabel="Add someone new"
        onPress={() => navigation.navigate('Connections', { openAddModal: true })}>
        <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 24, color: T.gold }}>+</Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Add</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
)}
```

`getDriftWeeks(p)` — reuse the existing drift calculation that produces `driftPartner`. If not exposed as a helper, factor it out.

`partnerProfiles` — already loaded on this screen for the chip strip in Ask. Confirm it's available; if not, load via the same pattern.

### Change 5: Demote Navigator Briefing

**Location:** Lines ~957–1075 (the briefing block).

- Change the gradient hero card → a normal card on `colors.card` background. Drop the `LinearGradient`.
- Rename label `formatDateHeader()` → "TODAY'S ENERGY" (use a styled Text label).
- Reduce `briefingHeadline` font size from current (likely 20–24) to 16. It's no longer the visual hero.
- Keep all the Navigate Toward / Around content — that's the actual value.
- Keep the deep-dive CTA "Your Full Briefing →" but rename to "More on today's energy →".
- Drop the Energy/Focus chip row (`tchips`) — it's leftover horoscope-card chrome.

### Change 6: Hide Today's Sky card by default

**Location:** Lines ~1292–1345.

Wrap the entire `<TouchableOpacity style={styles.skyCard}>` block in `{showAstrology && (...)}`. Save users who turned the toggle on still see it; default users don't.

### Change 7: Rename Cosmic Journal → Journal

**Location:** Lines ~1361–1378.

- Change label text from "YOUR JOURNAL" — already correct.
- Confirm no "cosmic" references in this card. Strip "Cosmic" from any alt text or share text in this block.

### Change 8: Hide Zodiac Season + Eclipse banners by default

**Location:** Lines ~800–860.

Wrap both `currentZodiacSeason` and `upcomingEclipse` banner blocks in `{showAstrology && (...)}`. These are pure astrology surfaces.

---

## Files to touch

- `src/screens/HomeScreen.js` (primary)
- `src/screens/HomeScreen.js` styles section (a few new styles, several deletions for `floatingTab*`, `briefingCard` reduction)

No new files. No service-layer changes.

---

## Risks

| Risk | Mitigation |
|---|---|
| Removing Week/Month tabs strands the existing forecast generation code | Forecast generation runs unchanged; the data is just no longer surfaced in two extra views. Restore in v1.x via Reports stack. |
| `partnerProfiles` not loaded on HomeScreen | Verify; if missing, mirror the load pattern from ChatScreen (`loadPartnerProfiles()` from `rep_partner_profiles`). |
| `showAstrology` not wired to HomeScreen | Plumb via `loadBoolean('celestia_show_astrology_v1', false)` in a useEffect, mirroring Profile. |
| Existing tests / snapshots break | None configured (per CLAUDE.md). Manual verification only. |

---

## Verification

After implementing:

1. `node -c src/screens/HomeScreen.js` passes
2. Launch app on simulator, complete onboarding
3. Land on Today — confirm hero shows greeting + drift/circle, no moon chip, no period tabs
4. Toggle showAstrology ON in Profile, return to Today — confirm moon chip + season banner + sky card all reappear
5. Toggle OFF — confirm they all disappear again
6. Scroll the Today tab — confirm Briefing is now a normal-looking card, not a hero

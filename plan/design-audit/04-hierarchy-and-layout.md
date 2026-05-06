# Visual Hierarchy & Layout Audit

Combined audit of visual hierarchy + spacing + layout patterns. Built using `visual-hierarchy` and `design-critique` skill methodologies.

## The 5-second test

Open Today tab. Look for 5 seconds. What does the eye see first?

**Expected order (per design intent):**
1. Hero gradient with name + greeting
2. Navigator briefing headline (the day's anchor)
3. Featured cards (Pro insight / surprise / indecision / at-risk) — only when active
4. Life-area cards (5 secondary surfaces)
5. Quests, journal prompt, sky now, share cards (tertiary)

**Actual order (per code audit):**
1. Hero gradient (✅ correct)
2. Floating tab pill (today/yesterday/tomorrow/weekly) — SHOULDN'T compete but does
3. ALL the cards at roughly equal weight — *no clear next-stop*

**Verdict:** the top-of-screen hierarchy is right. Below the fold is card-soup.

## Card-soup audit

### Card types active on Today tab

I counted 18 distinct card components that can render on Today:

```
1.  Hero gradient (always)
2.  Floating tab pill (always)
3.  At-risk banner (conditional, health < 40)
4.  Surprise insight (conditional, D4/D10/D17/D24 + 30% roll)
5.  Indecision callout (conditional, journal-mined)
6.  Ask Celestia + Share row (conditional)
7.  Navigator briefing card (always — the hero card)
8.  Pro insight card (Pro users only)
9.  Today's nudge box (conditional)
10. Navigate Toward / Around lists (always)
11. Life-area cards (5 across, always)
12. Energy scores (always)
13. Mercury Rx card (conditional, when Rx)
14. Lunar event card (conditional, near new/full moon)
15. Quest card (always)
16. Journal prompt (always, time-mode aware)
17. Daily share card (always — share-ready)
18. Daily story card (conditional)
```

Plus `Sunday Pro nudge` for free users on Mondays + `Cosmic whisper` + `Monthly recap` (1st-3rd of month).

**On a typical Tuesday at 8am for a Pro user, 11-13 of these render simultaneously.**

### Why this is a problem

Per the `visual-hierarchy` skill: hierarchy is established through size, weight, color, spacing, and positioning. When 11 cards have similar visual weight, the eye doesn't know where to land.

Specific symptoms of card-soup in the codebase:

- **Same border-radius on most cards** (14 or 16 — close enough to be indistinguishable)
- **Same background opacity** (rgba(200,168,75,0.06) appears in 8 places)
- **Same vertical margin** (`marginBottom: 12` or `14` everywhere)
- **No deliberate scale jumps** between hero and standard cards

### The hierarchy doc shipped (CA-B3) — what it says

```
TIER 1 HERO    — navigator briefing card
                 strongest background, large, top of scroll

TIER 2 FEATURED — surprise insight, indecision, at-risk, Pro insight
                 distinct gold-accent border (or terra for warning)
                 max 1-2 simultaneously visible

TIER 3 STANDARD — life areas, energy scores, sky, journal, quests
                 restrained, secondary type weight, subtle bg
```

The **doc** shipped. The **enforcement** did not. Each card style is still defined inline. This is the single biggest design-debt item in the codebase.

## Spacing system audit

Per the `spacing-system` skill: a system is built on a base unit (commonly 4 or 8px) and every value snaps to multiples.

### What I found

```bash
grep -rn "padding\|margin" src/screens/HomeScreen.js | grep -oP '\d+'
```

Sample of values used:
2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 46, 50, 60, 70

**That's 28 distinct spacing values.** A 4-base scale would be: 4, 8, 12, 16, 20, 24, 32, 40, 48 = 9 values.

### Specific violations

- `paddingHorizontal: 22` (HomeScreen scrollContent) — should be 24
- `paddingVertical: 7` — should be 8
- `marginBottom: 14` and `marginBottom: 12` used interchangeably — pick one
- `marginTop: 18` vs `marginTop: 20` — same role, different values
- `gap: 6` vs `gap: 8` between similar elements

### Recommended spacing scale

Per `spacing-system` methodology, base 4px:

```js
// src/constants/tokens.js — add this
export const SPACING = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  hero: 64,
};
```

**8 values, all multiples of 4.** Refactor target: every inline padding/margin in screens migrates to this scale.

### Why this matters even though "users don't see it"

Two reasons:

1. **Visual rhythm.** When everything snaps to 4/8px, the eye perceives the screen as "well-tuned" without knowing why. When values are 11/13/14, screens feel slightly off-tempo.
2. **Development velocity.** A new contributor adds `padding: 11` because they eyeballed it. Now the system has 29 values instead of 28. Without enforcement, the scale degrades over months.

## Layout patterns audit

### Hero pattern

All tab screens use a consistent hero pattern (per CLAUDE.md):
- LinearGradient with warm muted plum-charcoal tones
- `borderBottomLeftRadius: 24, borderBottomRightRadius: 24`
- Safe area: `paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16`

✅ Genuinely consistent across screens. This is a real system asset.

### Card padding pattern

Most cards use `padding: 14`. Some use `padding: 16`. Some use `padding: 18`.

⚠️ Should be **one** card-padding value. Recommendation: `SPACING.md = 16`.

### Modal pattern

Freeze modal, freeze offer, NPS, streak restore, D30 callback, Pro week-1 recap, surprise insight modal — all share the same overlay + card structure:

```
View {flex:1, bg: rgba(0,0,0,0.6), center}
  View {maxWidth: 340, borderRadius: 24, overflow: hidden}
    LinearGradient navy-plum
      [content]
```

✅ Excellent consistency. This is a real reusable pattern. **Should be extracted into a `<BrandModal>` component** to lock the consistency in.

### Button patterns

Primary CTA: gold gradient, 14px radius, sansSemiBold 15pt, navy text.
Secondary: bordered, sans 13pt, gold text.
Ghost: text only, sans 13pt, muted color.

✅ Consistent across the app.

### Touch target audit

iOS HIG requires 44pt minimum touch target.

Sampled spot-checks:
- Streak emoji touch areas: ✅ wrapped in TouchableOpacity with sufficient padding
- Tab pills: ✅ paddingVertical 11 + child text = ~37pt — borderline, should be 12+
- Reasons in cancel flow: ✅ paddingVertical 14 = 44pt+
- Small "↗" share buttons: ⚠️ 4px padding around 13pt text = ~21pt total — too small

**Recommendation:** audit all share/dismiss/close affordances; ensure ≥40pt touch target. Use `hitSlop` for the small visual ones.

## Information architecture — Today tab

Currently, Today tab is the catch-all. It has:
- Daily content (briefing, life areas, journal, quests)
- Engagement chrome (streak, XP, badges via JourneyScreen link)
- Discovery surfaces (Mercury Rx, lunar events, sky now)
- Pro chrome (Pro insight)
- At-risk / journal-mining surfaces (atypical but present)
- Share cards
- Cosmic whisper

This is a "kitchen sink" architecture. The audit suggests:

### Option A — keep, but tier visually (recommended)
Enforce the TIER 1/2/3 hierarchy from the shipped doc. Time-mode-aware content trimming already exists (different sections show by morning/evening). Lean harder into that.

### Option B — split (riskier)
Move secondary surfaces to a separate "Sky" or "Discover" tab. Tabs from CLAUDE.md memory show this used to exist — it was removed. Don't reintroduce.

### Option C — collapse (simplest)
Hide Tier 3 surfaces behind a "More" expander. Reduces cognitive load. Risks burying useful content.

**Recommendation: Option A.** The current information density isn't wrong for power users; the *visual* hierarchy is wrong.

## Animation review (brief)

Existing animations I see in code:
- WelcomeScreen: float (orb), scaleIn (chart), fadeIn (name), staggered reveals (stmt 1 + stmt 2), CTA fade, shimmer halo
- HomeScreen: streakAnim (spring on milestone), XP gain float
- Modal: fade + native slide-up
- Button: activeOpacity 0.7-0.85

✅ Restrained. ✅ Mostly purposeful. ✅ Springs over linear.
⚠️ No documented animation timing tokens. Durations vary (200/300/400/500/600/800/1200ms) — pick a 4-stop scale.

Recommendation: ship `MOTION = { fast: 200, base: 300, slow: 500, hero: 800 }` token. Use `react-native-reanimated` worklets where possible (already a dep).

## Audience-fit assessment for hierarchy + layout

The Inner-Work Practitioner reads. Reads slowly. Spends 30-90 seconds on Today tab in the morning.

For this user:
- ✅ Density is **acceptable** — they want depth
- ❌ Lack of visual rhythm is **costly** — they notice
- ❌ Card-soup wastes their attention budget — they have a low tolerance for that

**Net:** the layout is over-densified at the visual layer but under-densified at the content layer. Same total content, better hierarchy = a clearly better experience for this user.

## Hierarchy + layout score: 6/10

The bones are good. The system enforcement is weak. With ~1 day of focused refactor (tokens + spacing scale + ≤8 type sizes + extract `BrandModal`), score becomes 8.5/10.

See `07-recommendations.md` for sequencing.

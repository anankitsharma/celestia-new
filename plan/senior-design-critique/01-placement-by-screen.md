# Placement Audit — Screen by Screen

Walking through each screen as if seeing it for the first time. Calling out what works, what's misplaced, what's missing.

For each screen: visual rhythm, hierarchy, what's above/below the fold, what should be promoted, what should be buried, what's at the wrong corner.

---

## 1. Today tab — the daily anchor

### What I see when I open it

```
[hero gradient + greeting + name + avatar + streak pill]
[floating tab pill: Today / Yesterday / Tomorrow / Weekly]
[at-risk banner — sometimes]
[surprise insight card — sometimes]
[indecision callout — sometimes]
[Ask Celestia + Share row]
[NAVIGATOR BRIEFING CARD]
[Pro insight card — Pro only]
[Today's Nudge box]
[Navigate Toward list]
[Navigate Around list]
[5 life-area cards]
[Energy scores]
[Mercury Rx card — when active]
[Lunar event card — when active]
[Cosmic alert dot card]
[Quest card]
[Journal prompt]
[Daily share card]
[Daily story card]
[Share Cosmic ID button]
[Monthly recap — 1st-3rd of month]
[Cosmic whisper]
```

That's 16+ card types possible. Typical-day visible: 11.

### What works
- **Hero gradient anchors brand.** Good.
- **Briefing card has hero-tier visual weight after the recent bump.** Good.
- **Time-mode-aware content trimming** (different sections show by morning/evening). Modern.

### What's wrong
1. **Floating tab pill placement is wasteful.** Today / Yesterday / Tomorrow / Weekly is a pill row right under the hero. This is a major navigation surface using the prime real estate below the brand. **A pull-to-refresh + horizontal swipe between days** (instead of tabs) would free this entire row for the briefing.

2. **Cards don't differ in size or weight.** Pro insight is the same vertical extent as a quest card. Surprise insight is the same as life-area. Tier 1/2/3 hierarchy doc shipped, but VISUAL DIFFERENTIATION between tiers is subtle. A senior designer expects 2-3x size jumps between tiers.

3. **Streak/XP/badges chrome is hidden behind Journey nav.** For a daily-habit app, the streak should be **glanceable on Today**, not three taps away. Co-Star puts friends on the home screen for exactly this reason — it's the daily-return hook.

4. **No bento.** Every card is full-width. The screen would be more dynamic with a 1-column hero + 2-column secondary-grid layout for engagement chrome (today's streak / today's mood / today's quest).

5. **The 5 life-area cards are the densest moment of the screen.** They scroll horizontally? Vertically? They're mid-screen and mid-weight. Either elevate them as a hero-tier swipe-stack (Hinge-style) or compress into a 2-col grid.

6. **Sky now / Mercury Rx / Lunar event** are tucked at the bottom. These are time-sensitive context that should sit higher — possibly in a horizontal "today's sky" strip just below the briefing card.

7. **No widget bridge.** A user who opens the app in morning is likely already glanced at a widget. The home screen should *acknowledge* this — "Today's read picks up where your widget left off." Currently no relationship to home-screen widgets at all (because none exist).

### Senior-designer rebuild sketch

```
[hero gradient with name + greeting + STREAK CHIP]
[NAVIGATOR BRIEFING — hero card, full bleed bg, 1.5x current size]
[swipe area for tomorrow/yesterday — gesture only, no UI clutter]
[bento row]
   [Today's Sky] [Quest of the day] [Streak]
[5 life-area cards as horizontal swipe deck — Hinge pattern]
[Pro Insight — featured, gold-accent, when applicable]
[at-risk / surprise / indecision callouts as a SINGLE pinned slot, only 1 active at a time]
[Journal entry prompt as bottom-sheet teaser]
[secondary actions discoverable but not stacked]
```

Time mode rotates which bento cell is hero. Morning: Today's Sky. Evening: Quest. Late night: Journal.

---

## 2. Profile / Settings tab — the data home

### What I see

```
[hero gradient + chart preview + name + Big 3]
[avatar / cosmic ID share strip]
[journey strip: streak + level + chapters]
[YOU'VE BUILT (IKEA section) — recent, well-placed]
[Share Cosmic ID button]
[PREFERENCES section — voice, depth, theme]
[SUBSCRIPTION row — Celestia Pro tap → CancelFlow]
[ACCOUNT — sign in / out, delete, export]
[NOTIFICATIONS row]
[REFERRAL section]
[DEBUG PANEL — dev only]
```

### What works
- **YOU'VE BUILT IKEA section** is well-placed (right after journey strip).
- **Subscription row taps directly into CancelFlow** — proper modern pattern (manage from Profile).
- **Sign Out / Delete are end-of-list** — correct destructive-affordance placement.

### What's wrong
1. **Journey strip vs YOU'VE BUILT redundancy.** Journey strip shows: streak number, XP number, chapters number. YOU'VE BUILT shows: days, journals, chats, partners. Both are quantified-engagement displays. Consolidate into ONE bento panel.

2. **Avatar share strip + Share Cosmic ID + share elsewhere.** Three different "share me" surfaces. Pick one that's the primary share moment for the user identity.

3. **No "your year" timeline.** Users visit Profile to see "where am I in my journey." A vertical scroll of milestone moments (joined date → first chart → first chat → first 7-day streak → 30-day → ...) would make this a memorable space. Currently Profile is functional, not emotional.

4. **PREFERENCES is too dense.** Voice / depth / theme as separate rows is fine but reads as a settings page, not a profile.

5. **Pro management is one-line.** A Pro user opening Profile sees: "Celestia Pro (Yearly)" + "Manage subscription" + "Active". Nothing about *what they've earned by being Pro*. A modern pattern: a Pro-status card showing time-as-pro, % of pro features tried, next pro-only unlock.

### Rebuild sketch

```
[hero with chart + Big 3]
[YOUR JOURNEY — vertical timeline of 5-8 milestones]
[bento: Streak | XP | Badges] — single panel, larger numbers
[Pro membership card — meaningful for subscribers]
[Settings list — collapsed sections]
```

---

## 3. Chart tab — the iconic asset

### What I see

```
[hero gradient + name + Big 3]
[chart wheel — large, central]
[planet list — vertical scroll of placements]
[deep-dive expander]
```

### What works
- **Chart wheel is correctly the focal point.** No competitor places the actual chart this prominently.
- **Real astronomical visualization** — signals math literacy.

### What's wrong
1. **The wheel is static.** It's a beautiful asset that does nothing. Modern iOS would have it slowly rotate (visualizing time + ephemeris movement), or have current transits subtly pulse on top.

2. **No quick actions surface.** "Share my chart", "Generate cosmic identity report", "See my year ahead" are buried. There should be a 3-action strip directly under the wheel.

3. **Planet list is functional, not editorial.** A list of `Sun in Aries` / `Moon in Cancer` etc. is data display. The Pattern transforms this into psychology-card stacks. We don't.

4. **No "compare" affordance.** The chart belongs to a person, but Compatibility ("Circle") is a separate tab. If I'm looking at MY chart, the natural next thought is "how does this relate to [partner]'s chart?" There's no inline path.

5. **Chart wheel is the same in light and dark mode.** Modern iOS apps respect mode for SVG charts (different stroke, different inner glow). Ours doesn't change.

### Rebuild sketch

```
[hero + name]
[CHART WHEEL — animated, with subtle rotation indicating live transits]
[3-action strip: Share | Generate report | Compare with someone]
[planet placements as psychology cards (Pattern-style)]
[transits-on-natal section pinned in chart]
```

---

## 4. Circle tab — compatibility

### What I see

```
[hero + Big 3]
[empty state OR person list with relationship-type filtering]
[orbital visualization for empty state]
[add-person CTA]
```

### What works
- **Orbital visualization for empty state is genuinely lovely.** Best empty state in the app.
- **8 relationship types is broader than competitors.**
- **Zodiac-only mode** (no birth time required) is smart for low-friction adds.

### What's wrong
1. **The orbital empty-state disappears once a person is added.** That's the most distinctive design moment, and it's only seen once. It should adapt — orbital with people IN orbit, even after partners exist.

2. **People list is generic.** Avatar + name + sun sign + score number. Same as Co-Star, less rich than The Pattern's bonds page.

3. **No "your dynamic with this person right now" surface.** When I open Circle, I see all the people I've added, but not what's *happening* between us astrologically. Modern: each Circle entry should show a tiny live "right-now" badge — "Your Mars-Venus aspect is active for 3 more days."

4. **Add-person modal is a Modal not a bottom sheet.** Modern: bottom-sheet that lets the user keep the context behind it.

### Rebuild sketch

```
[hero + Big 3]
[ORBITAL — adaptive: people in orbit, with halo around active windows]
[for each person: live aspect badge, last interaction]
[bottom sheet for add-new]
[browse / search affordance]
```

---

## 5. Reports tab — the catalog

### What I see

```
[hero + intro copy]
[6-card grid of report types]
[free vs pro labels]
[generate CTA per card]
```

### What works
- **Grid layout is appropriate** for a catalog.
- **Free vs Pro** labels are clear.

### What's wrong
1. **Generic catalog feeling.** Each card has equal visual weight. The "Year Ahead" report (highest-value) should be hero-tier.

2. **No preview / sample.** Modern pattern: tap a report card → bottom sheet with first paragraph + 5 stars on past readings + price.

3. **No saved reports.** Once generated, where do they live? Currently regenerated each time. Modern pattern: a "your library" section above the grid.

4. **Loading state during generation is a spinner.** Generation takes 5-15 seconds — perfect skeleton-loader territory ("Reading your transits... ✦ Connecting placements... ✦ Drafting your year...").

### Rebuild sketch

```
[hero]
[YOUR LIBRARY — saved reports, if any]
[1 hero report (changes by season): "Your Year Ahead"]
[2-column grid for the rest]
[bottom sheet on tap with preview before generation]
[skeleton loader during generation with branded copy]
```

---

## 6. Ask AI / Chat tab — the chat surface

### What I see

```
[hero + greeting]
[suggestion chips (initial + follow-up)]
[chat history with messages]
[input bar bottom]
[history modal accessed from header]
```

### What works
- **Chat is the strongest AI feature in the category.** Good.
- **Suggestion chips** with time-of-day variation. Good.
- **Free-tier limit** with upgrade nudge at 5 messages remaining. Good.
- **Just shipped empty state for history.** Good.

### What's wrong
1. **The greeting changes but the screen doesn't.** Modern AI chat apps have a *visual* state for "fresh chat" vs "in-conversation." Celestia's screen looks identical.

2. **No streaming animation on AI response.** Modern: typewriter or word-by-word reveal. Celestia waits, then dumps the whole reply. ChatGPT, Claude, Perplexity all stream. **Pattern users expect this.**

3. **No "thinking" indicator with personality.** ChatGPT has the breathing dot. Sanctuary has reading-the-cards animation. Celestia has nothing or a stock spinner.

4. **No conversation pinning / favoriting.** All chats equal weight in history. Power users would want to pin a really resonant conversation.

5. **No voice input.** Modern: Siri/Whisper integration on the chat input. For a journal-adjacent app, voice memo + transcribe would be lovely.

### Rebuild sketch

```
[hero — minimal when in chat]
[FRESH-CHAT MODE: large suggestion chips, chart-context shown as kicker]
[IN-CHAT MODE: chat-only, sticky input bar]
[streaming response with breathing-dot indicator]
[voice input button next to text input]
[pinned chat strip at top of history]
```

---

## Summary of placement issues across screens

| Screen | Worst placement issue |
|---|---|
| Today | Floating tab pill wastes prime real estate; below-the-fold is undifferentiated stack |
| Profile | Journey strip + IKEA section + share buttons are 3 surfaces doing the same thing |
| Chart | Static wheel; quick actions buried; no inline path to compatibility |
| Circle | Beautiful orbital state disappears as soon as data exists |
| Reports | Equal-weight catalog; saved reports nowhere |
| Chat | Empty/in-chat states identical; no streaming animation |

## What "modern" placement looks like (for reference)

**Apple Calm app:** bento grid for daily content, hero illustration banner, asymmetric weight, pull-to-refresh, big single-color CTAs.

**Co-Star home:** minimalist text, friends row at top, single-column flow under it, no chrome decoration.

**The Pattern dashboard:** asymmetric card grid, audio play buttons inline, Bonds page = grid of profile cards.

**Hinge profile view:** full-bleed photo cards stacked vertically, sticky bottom CTA bar (like / comment / pass).

Celestia's placement is closer to a 2019 React Native dashboard than to any of these. The brand voice is best-in-category; the placement system is mid-tier.

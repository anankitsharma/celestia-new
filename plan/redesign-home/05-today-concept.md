# Today — The New Concept

**Status:** conceptual design. No code yet. Goal of this doc: align on the new shape of Today before we touch a single line of `HomeScreen.js`.

Reads on top of: `00-research-brief.md`, `02-transferable-principles.md`, `03-scroll-vs-swipe-decision.md`, `04-micro-patterns.md`.

---

## The diagnosis (what's wrong now)

Current Today is **additive-by-design**: every new feature added a card. The scroll body has ~24 conditional sections plus ~14 modal triggers wired up. Examples of what can render *simultaneously* on a single open:

> Hero · Floating tab pill · Zodiac Season Banner · Eclipse Banner · Trial Loss-Frame Warning · Trial Summary · Navigator Briefing card · Bento row (Sky+Streak+Quest) · Life Area row (5 cards) · Weekly Tease · Birthday card · Today's Sky card · Previously On · Journal CTA · Evening Reflection · Sunday Reflection · Cosmic Alert · Insight Unlock · Monthly Recap · Daily Quests · Badge Progress · Cosmic Whisper · Time-Adaptive Prompts · Promo

That's **24 possible visible blocks**, before counting modals. The codebase has no rule for "which of these does Mia see today" — they all render if their condition fires. The result is the cluttered feeling.

The fix isn't to delete features. It's to introduce a **selector rule** that picks 4–6 cards for today from a larger pool, displayed as a finite vertical-advance reel.

---

## The new shape — one sentence

**Today is a vertical-advance reel of 4–6 full-bleed cards, dynamically selected each morning, each one screenshot-grade, with tap-to-deepen on whichever card matters to Mia tonight.**

That's it. The whole concept is in that sentence. The rest of this doc works out the details.

---

## The card lineup

There are **3 fixed slots**, **1–2 conditional slots**, and **1 closing slot**. Total ceiling: 6 cards per day. Floor: 4.

### Slot 1 — ANCHOR (always)

**The Co-Star moment.** One typographic statement that captures today's emotional weather. Screenshot-grade.

- **Headline:** 5–9 words, Playfair display, large. Quotable. e.g. *"Today wants you slower."* / *"Some conversations are overdue."*
- **Subline:** 1 sentence supporting context. DM Sans, smaller. e.g. *"Mars in your 7th asks you to listen first."*
- **Background:** time-of-day-aware gradient (already implemented as `HERO_GRADIENTS`). Subtle, not decorative.
- **Brand mark:** small "✦ celestia" in a corner. Visible in screenshot.
- **One affordance:** "Ask about today →" — opens half-sheet AI chat pre-loaded with today's context.
- **Source data:** `forecast.navigatorHeadline` already exists in the schema. Use it.
- **Lock-screen continuity:** the morning push uses the same headline + subline. No bait-and-switch.

### Slot 2 — TODAY'S SPOTLIGHT (always)

**The one most-active life area or pattern, picked by AI.** Replaces the row of 5 life-area cards.

- **Headline:** life area + one-sentence read. e.g. *"Love · Today wants honesty over comfort."*
- **Body:** 2–3 sentences. Specific. Screenshottable.
- **Source:** `forecast.lifeAreas` already has 5; the selector picks the one with highest `intensity`.
- **Tap to deepen:** opens the existing per-area deep-dive modal (preserves all the rich content already built).
- **Save:** double-tap.

### Slot 3 — TODAY'S SKY (always)

**One transit, not five.** Replaces the multi-transit Sky section.

- **Headline:** the single most significant active transit. e.g. *"Mars enters your 7th house tonight."*
- **Body:** what this means in plain language, plus one prompt. e.g. *"Relationship-focused energy. What conversation have you been avoiding?"*
- **Source:** existing transit detection ranked by `calculateTransitSignificance()`. Pick top 1.
- **Tap to deepen:** opens the full Sky/Transits view (currently a separate tab → can stay as a tab, or this becomes the entry point).

### Slot 4 — REFLECT (always — but content varies by time of day)

**A prompt or invitation, not a static info card.** This is where the AI chat hooks in.

- **Morning:** *"What's one thing you want today to be about?"* — chat input visible inline.
- **Afternoon:** *"Anything on your mind?"* — chat input.
- **Evening (after 6pm):** *"How did today actually feel?"* — opens to journal prompt.
- **Late night (Mia's peak, after 10pm):** *"Sit with this one."* — pulls one quiet line from her chart, no input. Hands off to closing.
- **Source:** existing time-adaptive prompts engine.
- **Tap:** opens half-sheet AI chat OR journal entry, depending on time.

### Slot 5 — TRIGGER CARD (conditional, max 1 per day)

**The one timely moment.** This is where most of the current 24 conditional sections go — but only ONE fires per day, picked by a priority rule.

Priority order (highest first):
1. **Eclipse / Major astrological event today** (rare — high salience)
2. **Mercury Retrograde started/ended today** (medium-rare)
3. **Birthday week → Solar Return invitation**
4. **Sunday → Week reflection** (the Sunday-only card)
5. **1st–3rd of month → Monthly Recap**
6. **Monday → Weekly transit tease** (free-user upsell)
7. **Full moon / new moon today**
8. **Trial day 5 / day 6 / day 7** (each has different content; only fires if she's in trial)
9. **Lapsed > 3 days → Welcome Back gentle nudge** (was a modal, becomes an in-flow card)
10. **Cosmic alert** (the existing alert system — a transit just became significant)
11. *(Nothing — slot doesn't render)*

If multiple are eligible, the highest-priority one wins. Mia never sees more than one trigger card per day.

### Slot 6 — CLOSING (always)

**The "today is complete" floor.** Replaces the bottom-of-scroll dead zone.

- **Headline:** *"That's today."*
- **Body:** *"The sky shifts again at 6am."* (Or relevant contextual close — e.g. *"Sleep well. Saturn is on your side tonight."*)
- **Optional content:** a 1-screen recap of today's anchor + spotlight, formatted as a single shareable image. *"Want to keep today?"* → save/share.
- **Optional CTAs (subtle):** ask Celestia · open chart · journal — but only as small text links, not loud buttons.
- **Streak indicator:** small fire emoji + number bottom-right. Quiet. Not a CTA.

This card is the **soft floor**. After it, no more content. Mia knows she's done.

---

## What goes where — full migration table

Every section currently in `HomeScreen.js` gets a destination. Nothing is deleted unless explicitly marked.

### Stays on Today (in a slot)

| Current section | New home |
|---|---|
| Hero (greeting, name, avatar) | Compresses into Slot 1 Anchor card top + small avatar/streak in hero corner |
| Navigator Briefing card | **Slot 1 Anchor** — collapses to one quotable headline + 1 subline. The 4-do/3-avoid lists move into Slot 2 deep-dive modal, not visible on Today. |
| Life Area row (5 cards) | **Slot 2 Spotlight** — only the top-1 area surfaces. Other 4 accessible via deep-dive modal "see all areas." |
| Today's Sky card | **Slot 3 Sky** — top-1 transit only. Full multi-transit view = tap to deepen → Transits tab content. |
| Time-adaptive prompts | **Slot 4 Reflect** — same content, becomes the slot's home. |
| Cosmic Whisper | Folds into **Slot 6 Closing** as the optional contextual close line. |

### Becomes a trigger card (Slot 5, only when active)

| Current section | Trigger condition |
|---|---|
| Zodiac Season Banner | First 3 days of new zodiac season (was: whole season — too long) |
| Eclipse Season Banner | ±3 days of an eclipse (was: whole season) |
| Mercury Rx alert | Day Rx starts + day Rx ends only (push notification covers in-between) |
| Monday Weekly Tease | Mondays only |
| Sunday Week Reflection | Sundays only |
| Monthly Recap | 1st–3rd of month |
| Birthday / Solar Return | Birthday week (7 days before → 3 days after) |
| Cosmic Alert | When a transit just became significant within last 24h |

### Becomes a modal (still triggered, but not in the daily reel)

| Current section | Trigger |
|---|---|
| Welcome Back Modal | First open after 3+ day lapse |
| D2 / D5 / D7 Trial cards | Specific trial-day, fires once that day, dismissible |
| D1 Trial Summary | Last day of trial only |
| NPS prompt | Day 14, 30, 60 milestones |
| Wake-Time Backfill | Once for legacy users with no `wake_time` |
| Streak Restore Offer | After streak break, once |
| D30 Reveal Callback | Day 30 post-onboarding |
| Pro Week-1 Recap | Day 7 of being Pro |
| D7 First-Week Recap | Day 7 of using app (free path) |
| Notification Permission Modal | Pre-prompt before first push relevant moment |

These were already designed as one-shot moments — they should be modals, not always-on cards. The current code mostly already triggers them as modals; the fix is to ensure they don't ALSO render as cards in the scroll.

### Moves to a different tab

| Current section | New home |
|---|---|
| Bento row (Sky preview + Streak + Quest) | Streak/Quest → **Profile** (where they belong); Sky preview → covered by Slot 3 |
| Daily Quests card | **Profile / Journey** tab (Mia doesn't open Today for quests) |
| Next Badge Progress | **Profile / Journey** |
| Today's Cosmic Alert | Promoted to **Slot 5 trigger card** when active; otherwise **push notification only** |
| New Insight Unlocked | **Profile** (drip-feed unlocks live in Journey, not Today) |
| Cosmic Journal CTA | **Slot 4 Reflect** in evening mode; Journal tab itself remains |
| Evening Reflection | **Slot 4 Reflect** in evening mode |
| Previously On | **Slot 6 Closing** as optional content; or **Profile** |

### Moves to push-notification only

| Current behavior | New behavior |
|---|---|
| Cosmic Alert always-on card | Push notification when transit becomes significant; lands user on the transit deep-dive |
| Mercury Rx mid-period reminders | Push notifications only (1 mid-Rx) |
| Eclipse warnings | Push 24h before |

### Deleted (genuinely redundant)

| Current section | Why |
|---|---|
| "Floating tab pill" (Today / Week / Month) | Week/Month already removed in code; pill itself is now redundant |
| Promo card | Mia's persona explicitly hates pushy in-app promos; trial nudges are enough |
| Multiple CTAs at the bottom (chart / chat / journal / sky) | Replaced by Slot 6 Closing's quiet text links |

---

## The selector rule (pseudocode)

```
function pickTodayCards(forecast, profile, context) {
  const cards = [
    { slot: 'anchor',    content: forecast.navigatorHeadline },
    { slot: 'spotlight', content: pickTopLifeArea(forecast.lifeAreas) },
    { slot: 'sky',       content: pickTopTransit(context.transits) },
    { slot: 'reflect',   content: pickTimeAdaptivePrompt(context.timeMode) },
  ];

  const trigger = pickTriggerCard(profile, context);  // priority list above
  if (trigger) cards.push({ slot: 'trigger', content: trigger });

  cards.push({ slot: 'closing', content: buildClosing(forecast, context) });

  return cards;
}
```

That's the whole content rule. Five lines that decide what Mia sees today.

---

## Interactions

Mapped from `04-micro-patterns.md`:

| Gesture | Behavior |
|---|---|
| Swipe up | Next card (TikTok/Reels grammar) |
| Swipe down | Previous card |
| Tap on card | Deepen — opens half-sheet AI chat or full-screen reading view depending on slot |
| Double-tap on card | Save to her Journey/saved collection (heart pulse animation) |
| Long-press on card | Reaction sheet: 🪞 *this is me* · 💭 *making me think* · 💔 *too true* · ✦ *save for later* · 🚫 *show me less* |
| Top-right share button | iOS share sheet with pre-rendered share-card image |
| Pull-to-refresh from top | Refresh "now" sky data (transit positions, moon phase) |
| Tap progress dot | Jump to that card |
| Swipe-right edge | Back to previous card (iOS navigation gesture) |

Default state opens to Slot 1. Slot 6 has no swipe-up — it's the floor.

---

## Visual layout (low-fi wireframe)

```
┌─────────────────────────────────┐
│ ●──●──○──○──○──○                │  ← progress dots (6 segments)
│              Mia ✦  🔥 12       │  ← avatar + streak (small, top-right)
│                                  │
│                                  │
│        Today wants you           │  ← Slot 1 ANCHOR
│           slower.                │     Playfair, large
│                                  │
│   Mars in your 7th asks you      │  ← subline
│        to listen first.          │
│                                  │
│                                  │
│                                  │
│                                  │
│   [   Ask about today  →   ]     │  ← chat affordance
│                                  │
│   ✦ celestia                     │  ← brand mark
│                            ⤴ 📤   │  ← share button
└─────────────────────────────────┘
              ↓ swipe up
┌─────────────────────────────────┐
│ ●──●──●──○──○──○                │
│                                  │
│  LOVE                            │
│  Today wants honesty over        │  ← Slot 2 SPOTLIGHT
│  comfort.                        │
│                                  │
│  Venus is moving through your    │
│  5th house. There's one          │
│  conversation you've been        │
│  rehearsing in the shower —      │
│  it's the one to have.           │
│                                  │
│            [  read deeper →  ]   │
│                                  │
│   ✦ celestia                     │
│                            ⤴ 📤   │
└─────────────────────────────────┘
              ↓ swipe up
       ... slots 3, 4, (5), 6 ...

┌─────────────────────────────────┐
│ ●──●──●──●──●──●                │  ← all dots filled
│                                  │
│       That's today.              │  ← Slot 6 CLOSING
│                                  │
│  The sky shifts again at 6am.    │
│                                  │
│   ┌─────────────────────────┐   │
│   │                          │   │
│   │     [today's anchor      │   │
│   │      mini-recap as       │   │  ← shareable summary card
│   │      one image]          │   │
│   │                          │   │
│   └─────────────────────────┘   │
│      [  share today  ]           │
│                                  │
│   ask · chart · journal          │  ← quiet text links
│                          🔥 12   │  ← streak (still small)
└─────────────────────────────────┘
```

---

## What this preserves vs. replaces

**Preserves:**
- Every data structure already in the AI forecast schema (`navigatorHeadline`, `lifeAreas`, `notificationExcerpt`, etc.).
- Every deep-dive modal already built (life-area deep dive, planetary deep dive).
- The Chart/Reports/Profile/Journal/Compatibility tabs untouched.
- All the trigger logic (eclipse detection, Mercury Rx detection, birthday detection, etc.) — it just feeds the selector rule instead of rendering directly.
- All shareable card components (`*ShareCard.js`) — used in Slot 6 closing and per-card share affordances.

**Replaces:**
- The render-everything-eligible scroll model.
- Multiple competing CTAs visible at once.
- The 5-life-area horizontal strip (collapses to 1 spotlight + "see all" in modal).
- The multi-transit Sky inline card (collapses to 1 transit + tap-to-deepen).
- The bottom-of-Today extras stack (quests, badges, whispers, promos).

**Removes entirely:**
- Floating Today/Week/Month tab pill (deprecated already).
- The persistent in-flow Promo card.
- The redundant CTAs at the bottom of the current scroll.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Mia feels Today has "less" content** | She doesn't. Every piece is still reachable via deepen-tap or in another tab. Today's *visible surface* is leaner; total surface area is the same. |
| **Power users miss the dense overview** | Slot 6 closing offers "see today's full reading" → opens the existing deep-dive modal which already contains the dense content. |
| **The selector rule produces boring days** (no trigger card most days = always 5 slots) | Acceptable. 5 cards is the lower-bound floor and still a complete experience. The trigger card is bonus, not load-bearing. |
| **Vertical-swipe gesture conflicts with iOS scroll-to-refresh** | Pull-to-refresh only fires from the very top of Slot 1. Swipe-up between cards is a different gesture region. |
| **Screenshot loses brand at small sizes** | Brand mark + ✦ on every card is non-negotiable (already in card spec above). |
| **AI sometimes returns weak headlines** | Headline cache + fallback templates already exist (`cm_navigator_excerpt`, `cm_navigator_headline`). Reuse. |

---

## What we need to decide before building

These are the open questions from `02-transferable-principles.md`, now answered or answerable:

1. ~~Hero anchor sentence vs card?~~ → **Card with one quotable sentence inside**, brand mark, share affordance. Slot 1.
2. ~~How many horizontal rings?~~ → **Vertical, not horizontal**. 4–6 cards. Reading from `03-scroll-vs-swipe-decision.md`.
3. ~~What's the depth-tap destination per slot?~~ → **Half-sheet AI chat for Anchor + Reflect; existing deep-dive modal for Spotlight + Sky; no deepen for Closing.**
4. ~~Where does AI chat live?~~ → **Triggered from Anchor and Reflect cards via half-sheet.** Full chat tab still exists.
5. ~~What gets demoted vs cut?~~ → **Migration table above.** Quests/badges/journey to Profile. Most one-shot UIs become modals. Promo card cut.

Remaining real questions for the user:

- **Q1:** Is the lower bound 4 or 5 cards? (I propose 5 — anchor, spotlight, sky, reflect, closing — with trigger as +1 bonus.)
- **Q2:** Should the trigger card always render *before* the closing, or *after* the reflect? My instinct: **before reflect** so it doesn't break the natural arc of (anchor → focus → sky → action → close).
- **Q3:** Half-sheet AI chat — is there appetite to build that interaction this sprint, or do we ship the reel structure first and route the deepen-tap to the existing chat tab for now? (My recommendation: ship the reel first, route to existing chat. Half-sheet is a phase-2 polish.)
- **Q4:** Should saved cards (double-tap) appear in **Profile / Journey** as a "saved moments" view, or in **Journal** as content imports? My instinct: **Journey** — it's the "your patterns" tab, perfect for "the moments that hit you."
- **Q5:** Should the closing card's recap image be auto-generated server-side or client-side at render? Client-side via `react-native-view-shot` is already how share cards work; reuse. No server work needed.

---

## Next steps after this concept is approved

1. **Wireframe pass** — turn the ASCII into actual figma/sketch / iPad sketch frames.
2. **Card-component contract** — define a `<TodayCard>` component that takes `{ slot, content, deepenAction }` and handles all the gestures/share/save uniformly.
3. **Selector implementation** — pure function `pickTodayCards(forecast, profile, context)`. Trivial to test.
4. **Cut/rewire phase** — comment out (don't delete) the current sections in `HomeScreen.js`. Verify nothing else in the app depends on them visibly.
5. **Dogfood for 1 week** — internal use to surface "Mia would skip this" moments before broader rollout.

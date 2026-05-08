# 06 — Adam Lyttle Questionnaire-Skill Pass

The `app-onboarding-questionnaire` skill is a 14-screen blueprint modeled on Cal AI / Rise / Opal / Noom. Running Celestia through its framework to see what it suggests, where it agrees with [03-new-flow-spec.md](03-new-flow-spec.md), and what's worth stealing.

This doc is a **comparison + delta**, not a rewrite. The skill's questionnaire pattern is more aggressive than our current plan; some of its moves are right for us, some aren't.

---

## Phase 2 — User Transformation (the skill's framing)

### Before / After for Celestia's user

**BEFORE:**
- Reads generic sun-sign horoscopes that feel like they could apply to anyone.
- Has tried Co-Star and gotten brutal-but-unhelpful one-liners with no context.
- Wants self-understanding but doesn't trust apps that flatten her into one of 12 buckets.
- Feels different from people around her, half-believes in astrology, doesn't want to admit it.

**AFTER:**
- Wakes up to a reading that names her actual placements (e.g. "Your Cancer Moon in the 8th house…").
- Has language for *why* she reacts to people the way she does.
- Uses Celestia as a morning anchor for self-noticing, not an entertainment scroll.
- Notices her patterns through journal + chart over weeks — proof the app actually knows her.

### Core benefits (skill format)

1. **Daily readings from your actual chart, not your sun sign** — addresses *"horoscopes don't apply to me"*
2. **AI grounded in your real placements** — addresses *"no app actually gets me"*
3. **Real chart-to-chart synastry, not zodiac matching** — addresses *"compatibility apps are surface-level"*
4. **Patterns surface over time, not one-shot insights** — addresses *"I want depth, not a fortune-cookie line"*
5. **Transit-driven daily forecasts** — addresses *"is anything cosmic actually happening or am I imagining it?"*

This matches what our paywall benefits should say (already updated in [03-new-flow-spec.md](03-new-flow-spec.md) screen 13).

---

## Phase 3 — Blueprint applied to Celestia

The skill prescribes 11 screen archetypes (some required, some optional). Mapping each to our current/planned flow.

| # | Skill Archetype | Required? | Our Current State | Gap |
|---|---|---|---|---|
| 1 | WELCOME (transformation hook + device preview) | ✅ Required | We have it (Hook screen) | **Missing device preview** — skill wants a visible app screenshot/mockup. We have a glow + headline. |
| 2 | GOAL QUESTION (5-7 options, single-select) | ✅ Required | We have it (Motivation, 4 options) | **Skill wants 5-7 options.** We have 4. Could add: "I want help with a big decision" / "Spiritual exploration." |
| 3 | PAIN POINTS (5-7 options, **multi-select**) | ✅ Required | We have step 3 (Pain, single-select 4 opts) + step 4 (Depth, single-select 4 opts) | **Skill wants multi-select.** We single-select. Multi gives more personalization data. |
| 4 | SOCIAL PROOF (testimonial cards) | 🟡 Recommended | We have it but **at the paywall** (step 13) | **Skill wants it earlier** — after pain points, before chart. Reduces risk perception before we ask for birth data. |
| 5 | TINDER PAIN CARDS (3-5 swipeable statements) | 🟡 Recommended | **We don't have this** | **Pure addition.** High-engagement screen. Examples below. |
| 6 | PERSONALIZED SOLUTION (mirrors pain → solutions) | ✅ Required | **We don't have this as a dedicated screen** — happens implicitly at paywall | **Worth adding** between pain and birth-data. The "you told us X, we fix it like Y" bridge. |
| 7 | COMPARISON TABLE (us vs without) | ⚪ Optional | We don't have it | **Skip.** Heavy and not in our voice. |
| 8 | PREFERENCE CONFIG (multi-select grid) | 🟡 Recommended | **We don't have this** | **Worth adding.** Life-area grid drives both AI emphasis and the personalized first reading. |
| 9 | PERMISSION PRIMING | 🟢 Auto-detected | ✅ We have it (post-onboarding modal in WelcomeScreen, recently upgraded) | Aligned with skill ("prime AFTER demo when possible"). |
| 10 | PROCESSING MOMENT (loading animation) | ✅ Required | ✅ We have it (step 8 Calculating, 4-phase) | Aligned. |
| 11 | APP DEMO (user **does** something, gets tangible output) | ✅ Required | ⚠️ Our reveal is **passive** — we calculate the chart and show it | **Biggest gap.** Skill wants the user to *do* the core action, not watch. See below. |
| 12 | VALUE DELIVERY + VIRAL MOMENT | ✅ Required | ✅ WelcomeScreen with reveal statements + share buttons | Already strong. |
| 13 | ACCOUNT CREATION (soft gate) | ⚪ Optional | We push to Auth screen post-completion | Currently optional in our flow; works as-is. |
| 14 | PAYWALL | ✅ Required | ✅ Step 13 (consolidated per [03-new-flow-spec.md](03-new-flow-spec.md)) | Aligned. |

---

## What the skill suggests we add

Five concrete moves the skill recommends that aren't in our current plan. Ranked by impact.

### A. Tinder pain-amplification cards (NEW screen, between pain points and chart)

3-5 swipeable cards with first-person pain statements. Swipe right to agree, left to dismiss. Each card the user agrees with goes into their `painSignals` array, used downstream by AI tone + paywall callback.

Suggested card text (in our voice):

1. *"I read horoscopes but none of them feel like me."*
2. *"I keep dating the same person in different bodies."*
3. *"I don't fully believe in astrology, but I still check mine."*
4. *"I've felt different from people around me my whole life."*
5. *"I want to understand why something keeps happening to me."*

**Why this works for Celestia:** It's the first interactive moment in the flow, and each statement is something our target user (the questioner, not the believer) will silently nod at. Each swipe-right is a Cialdini-style commitment.

**Cost:** 1 new screen (~30s of user time), reusable swipe-card component (we don't have one yet).

**Effort:** Medium. New component + new step, but isolated.

### B. Multi-select pain-point screen (REPLACES current single-select)

Currently steps 3 (pain) + 4 (depth) are two separate single-select screens. Skill recommends one multi-select with 5-7 options. Combine.

```
What's hardest about your inner world right now?
  Tap as many as you want.

  ◻ Generic horoscopes that don't apply
  ◻ Confusion about who I really am
  ◻ Doubts about a specific relationship
  ◻ A career or purpose decision
  ◻ Feeling misunderstood
  ◻ A big transition I'm in the middle of
  ◻ All of the above

  [ Continue ]
```

**Why this works for Celestia:** More signal per screen (currently we ask 8 separate options across 2 screens; this asks ~6 multi-select). Lets the paywall callback reference 2-3 concrete pains, not just one motivation.

**Cost:** -1 screen (consolidates 3 + 4 → 1 multi-select), +data richness.

**Effort:** Small. Toggle pattern already exists in NotificationSettingsScreen.

### C. Personalized solution bridge (NEW screen, after pain + before birth-data)

The skill's "we heard you, here's how we fix it" moment. Mirror back what the user just said.

```
Here's what we'll do for you, ${firstName || 'you'}.

  ✗ Generic horoscopes that don't apply
  ✓ Daily readings from your actual placements

  ✗ Confusion about who you really are
  ✓ Chart-grounded statements that make you nod, not roll your eyes

  ✗ Doubts about a relationship
  ✓ Real chart-to-chart synastry — not zodiac matching

  [ Show Me My Chart ✦ ]
```

The pain rows are filtered to only show items the user actually selected. Solution rows reference the user's stated pains by name.

**Why this works for Celestia:** The strongest commitment-consistency frame in the skill's playbook. Increases pre-paywall investment without adding a question.

**Cost:** 1 new screen (~10s of user time, mostly read).

**Effort:** Small.

### D. Preference configuration (NEW screen, replaces current step 4 "Depth")

Multi-select grid of life areas. Drives:
- The personalized first-reading insight (currently picks based on motivation; this gives finer signal)
- AI tone in homepage navigator briefing
- Which paywall benefit gets emphasized

```
Where do you want the stars to focus?
  Pick what matters most right now.

  [💞 Love & connection]   [💼 Career & purpose]
  [🌱 Personal growth]     [🌊 Big transitions]
  [👯 Friendships]          [🏠 Family]
  [🎨 Creativity]           [💰 Money]

  [ Continue ]
```

Multi-select with 2-column grid.

**Why this works for Celestia:** Replaces the abstract "How often do you feel misunderstood?" depth question (which is great copy but doesn't drive personalization downstream) with something that makes the rest of the app actually different.

**Cost:** Same screen count (replaces step 4).

**Effort:** Small.

### E. Make the chart reveal an active demo, not passive

This is the skill's "hardest and most important screen" claim. Right now our flow is:

> Birth data → Calculating (passive) → Sun-sign hit (passive) → Big reveal (passive) → WelcomeScreen statements (passive)

Five consecutive screens where the user **watches** their chart unfold. The skill says the user must **do** something to earn the output.

**Three implementation options:**

**Option E1 — Tap-to-reveal (lowest effort)**
After calculating, instead of auto-showing the Sun + Moon + Rising, show three locked cards:

> ☉ Tap to reveal your Sun
> ☽ Tap to reveal your Moon
> ↑ Tap to reveal your Rising

Each tap unlocks one with haptic + reveal statement. User has *done* three things (tapped) and earned three rewards.

**Option E2 — Mini-chat (medium effort)**
After calculating, show a single pre-filled chat question:

> ⌨ Try asking: *"What's the surprising thing about my chart?"*
> [ Ask ]

Tap → live Gemini call → response references their actual placements. ~3s loading, then a 100-word personalized answer. User has now had a real chat — the same action they'd do on day 2.

**Option E3 — Pick-3 (highest effort, highest engagement)**
Before chart calculation, give the user 6 questions and ask them to pick the 3 they care about most:

- *"Why do I keep falling for the same kind of person?"*
- *"What's blocking my career right now?"*
- *"Why do I feel different from people around me?"*
- *"How do I love best?"*
- *"What's my actual purpose?"*
- *"Why am I drawn to ${person}?"*

Pick 3 → Calculating → Big Reveal → on the same screen, three personalized answers to *their* picked questions.

**Recommendation: ship E1 (tap-to-reveal) in v1, plan E2 for v2.** E3 is interesting but adds significant complexity and a screen.

**Cost:** E1 is +0 screens, just changes step 9 from auto-reveal to tap-reveal. E2 is +0 screens but adds a Gemini call to onboarding (latency risk).

**Effort:** E1 = small, E2 = medium, E3 = large.

---

## What the skill suggests that we should NOT take

### Comparison table (skill screen 7)

> *"83% of horoscope app users say their reading doesn't fit them"*
> Celestia ✓✓✓ vs Co-Star ✗✗✗

This is a Noom / Cal AI move. Wrong for Celestia. Our voice is literary and confident; a comparison table is defensive and feels like an infomercial. Skip.

### 5-7 options on every list

The skill prescribes 5-7 options for goal + pain questions. Our current 4 options for motivation are deliberately broad — every user finds a fit. Going to 5-7 risks decision fatigue without proportional signal lift. **Stay at 4 for motivation.** Pain (which we're making multi-select) can comfortably be 6-7.

### Pre-account-creation soft gate (skill screen 13)

The skill suggests blocking the demo output behind sign-in: "Create free account to unlock your reading." This is the Cal AI / Yuka pattern. **Wrong for Celestia.** Our reveal is the magic moment; gating it kills it. Auth happens after the reveal in our current flow — keep it.

---

## Reconciled flow (incorporating skill recommendations)

If we accept the four moves above (A, B, C, D + E1), the new flow becomes **12 screens** (vs the 11 in [03-new-flow-spec.md](03-new-flow-spec.md), vs 14 today):

```
ARC 1 — HOOK (1)
  01. Splash promise + small chart preview behind glow

ARC 2 — INVESTMENT (4)
  02. Goal question (motivation, 4 opts, single-select)
  03. Pain points (multi-select, 6-7 opts) ← merges current 3 + 4
  04. Tinder pain cards (3-5 swipeable statements) ← NEW from skill
  05. Life-area preference grid (multi-select) ← NEW from skill, replaces depth

ARC 3 — RECOGNITION (1)
  06. Personalized solution bridge ("you said X, we do Y") ← NEW from skill

ARC 4 — PAYOFF (4)
  07. Birth data — name + date
  08. Birth time
  09. Birth place
  10. Calculating (theatre)
  11. Tap-to-reveal Sun/Moon/Rising ← refactor from passive to active
       (was 2 screens — first hit + big reveal — now 1 active screen)

ARC 5 — COMMITMENT (3)
  12. Wake-time anchor
  13. Notification bundle choice
  14. Paywall (consolidated, personalized)

(Plus post-onboarding: WelcomeScreen + permission modal + Today first-action)
```

Wait — that's 14, not 12. Let me recount the deltas:

```
Today's flow:        14 screens
03-new-flow-spec.md: 11 screens
Skill-pass flow:     14 screens
```

The skill's framework adds screens: tinder cards (+1), preference config (+1, replaces depth), personalized solution (+1). It saves us nothing. **The skill's flow is longer than our current plan.**

This is the tension. The skill is optimized for high-LTV subscription apps (Cal AI, Noom) where longer onboarding = more commitment-consistency = higher conversion. For Celestia we already debated this in [02-onboarding-theory.md](02-onboarding-theory.md) — Pattern A vs Pattern B vs Pattern C.

---

## Recommendation

**Adopt 3 of the 5 skill moves, defer 2:**

✅ **Adopt:**
- **B — Multi-select pain points** (consolidates current steps 3+4 into one screen, more signal per screen). Net: -1 screen.
- **C — Personalized solution bridge** (new screen between pain and birth-data; high commitment-consistency value). Net: +1 screen.
- **E1 — Tap-to-reveal Sun/Moon/Rising** (refactor passive reveal into active demo). Net: -1 screen (combines current 9 + 10).

These 3 net to **-1 screen** vs [03-new-flow-spec.md](03-new-flow-spec.md), so we'd land at **10 screens** and still capture the skill's biggest psychological wins.

⏸ **Defer to v2:**
- **A — Tinder pain cards.** Engagement gold but requires a new swipe-card component. Worth shipping as a v2 enhancement once we have data showing where the funnel actually leaks.
- **D — Life-area preference grid.** Useful for AI personalization but ROI is medium and it adds a screen. Defer until we have evidence the depth question is failing.

❌ **Skip permanently:**
- Comparison table.
- Pre-reveal account-creation gate.
- 5-7 options on motivation question (stay at 4).

---

## What changes in the implementation roadmap

If we adopt the 3 recommended skill moves on top of [03-new-flow-spec.md](03-new-flow-spec.md):

| Phase | Add | Effort |
|---|---|---|
| Phase 1 | Multi-select pain-points screen (replaces current 3 + 4) | S |
| Phase 1 | Personalized solution bridge screen (new, between pain and birth-data) | S |
| Phase 2 | Tap-to-reveal refactor for Sun/Moon/Rising (combines current 9 + 10) | M |

These extend Phase 1/2 by ~1.5 days. They are **not blockers** for what's already shipped — they're additive over the work already done in this branch.

---

## Final flow (revised)

After incorporating the 3 adopted skill moves:

```
01. Hook — promise + chart preview
02. Goal question (motivation, single-select 4 opts)
03. Pain points (multi-select, 6 opts) ← merges current 3 + 4
04. Personalized solution bridge ← NEW
05. Birth data — name + date
06. Birth time
07. Birth place
08. Calculating
09. Tap-to-reveal Sun/Moon/Rising (active demo) ← REFACTORED from current 9 + 10
10. Wake-time anchor
11. Notification bundle
12. Paywall (consolidated)

Post-onboarding:
  WelcomeScreen — chart reveal + 2 personality statements + permission modal
  HomeScreen first-session — "save your first insight" affordance
```

12 screens — between today's 14 and the original v2 plan's 11.

The skill's framework is right that we're missing an active demo and a personalized solution moment. It's wrong that we need 14 screens to convert. We take what works for our voice and skip the rest.

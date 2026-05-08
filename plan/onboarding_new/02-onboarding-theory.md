# 02 — Onboarding Theory

What the research actually says about making people stay. Three frameworks (Fogg's B=MAP, Eyal's Hook, the Reforge / Crabtree first-mile model), then competitor teardowns, then the synthesis we apply to Celestia.

---

## Framework 1 — Fogg Behavior Model (B=MAP)

Behavior = Motivation × Ability × Prompt, all converging at the same moment.

### The action line

Every behavior has an Action Line. Above it, a prompt produces the behavior. Below it, no prompt works. Two reliable ways to push behavior above the line:

1. **Increase Ability** (move right) — make it easier. Reliable.
2. **Better Prompt** — fire at the right moment, not the convenient moment.

A third lever, **increase Motivation**, is unreliable. Motivation is a wave. Products that depend on high motivation fail at the trough.

### What this means for onboarding

**Onboarding is a high-motivation moment** — the user just downloaded the app. Their motivation is already at the top of the wave. We exploit it for one thing: getting the chart calculated and the first reveal landed. Beyond that, we should design as if motivation is *zero*, because two days from now it will be.

Specific implications:

- **Birth data entry has to be brutally simple.** Three taps, ideally. Pre-fill whatever we can from device locale.
- **The wake-time question must be anchored to an existing routine** (wake-up), not framed as a setting choice. Anchors compensate for low future motivation.
- **The first-day push has to fire at user-chosen time at the user's wake-up moment.** That's the strongest possible prompt — wake-up itself is an anchor moment, and the user's morning is a window when motivation briefly returns.
- **The first action post-onboarding should be a Starter Step** — the smallest meaningful version of the core behavior. For Celestia: tapping the pre-filled chat question. We already do this; protect it.

### Tiny Habits applied to Celestia

The Tiny Habits recipe: **After [ANCHOR], I will [TINY BEHAVIOR], then [CELEBRATION].**

For Celestia's intended habit:

> *After my morning alarm goes off, I will open Celestia and read the morning briefing, then I'll feel a moment of "oh, that's interesting."*

Every onboarding decision should serve that recipe. The wake-time question sets the anchor. The notification-bundle choice ensures the prompt isn't noise. The morning-push copy template (`cm_navigator_excerpt`) provides the variable reward that triggers the small "interesting" celebration. The whole onboarding is plumbing for this 30-day habit recipe.

---

## Framework 2 — Eyal's Hook Model

`Trigger → Action → Variable Reward → Investment → (back to Trigger)`

The goal: move the user from external triggers (our push) to internal triggers (their own morning curiosity) over ~30 days.

### How onboarding seeds each phase

**Trigger (onboarding):** the splash screen + chart-reveal sequence is the *first* external trigger. The pre-questions create stake-holding ("I'm here because I want clarity on a relationship") that becomes an internal anchor.

**Action (onboarding):** the action is "complete the birth-data form to see your chart." Friction here is competitive. Co-Star asks 4 fields and gets you to the chart in 30 seconds. We ask 6 fields and need ~90 seconds. Closing that gap is the highest-ROI ability change.

**Variable Reward (onboarding):** the two-stage reveal (sun-sign hit at step 9, full chart at step 10) is the Hook's variable reward. Reveal statements on WelcomeScreen ("Your emotions are written all over your face…") deepen it. This is already strong.

**Investment (onboarding):** the user invests:
- Birth data → improves all future readings
- 4 emotional answers → personalizes paywall + AI tone
- Wake time → schedules the next trigger
- Notification bundle choice → calibrates the relationship

Each of these loads the next trigger. The wake-time choice is literally the next-trigger schedule. This is the cleanest investment-to-trigger loop in the app.

### The 30-day transition

External triggers (push) bridge until internal triggers form. Eyal's research suggests internal triggers solidify around day 21–30 with daily exposure. Our notification system already implements this:

- Days 1–14: external pushes do all the work (`cm_d1_personal`, `cm_navigator_excerpt`, etc.)
- Weeks 2+: internal-trigger templates fire (`cm_internal_trigger_decision`, `cm_internal_trigger_quiet` — see `notificationContentEngine.js:181-216`). These are not "wake up and read horoscope" — they're "stuck on something? your chart has an opinion." That's a different psychology.

The onboarding's job is to make sure the user receives enough day-1 to day-21 pushes for the internal-trigger transition to even be possible. **Permission grant rate is the rate-limiting step.**

### Habit Zone test

A product enters the habit zone when frequency × perceived value crosses a threshold. For Celestia:

- Frequency target: daily morning open (one push, one open).
- Perceived value: must be high enough that the daily open feels like a reward, not a chore.

The morning push *is* the entry point to the habit zone. Onboarding's role is to (a) get permission, (b) set the right wake time, (c) calibrate frequency expectations through the bundle choice. Without all three, the habit zone is unreachable.

---

## Framework 3 — Reforge / Crabtree / Hulick first-mile

Casey Winters and Samuel Hulick's research on the "first mile":

1. **Time to first value (TTFV) is the metric to minimize.** For Celestia, this is "time from app open to chart-revealed-on-screen." Currently ~2:30 with reading; target: under 2:00.
2. **Show, don't tell.** Product tours fail. In-product activation works. Celestia mostly does this — the chart wheel + reveal is the product, not a screenshot.
3. **Motivate around the goal, not the feature.** Step 14's "goal back" callback (referencing the user's stated motivation) is a textbook example. We should do this earlier and more often.
4. **Activation events must be engineered.** A user is "activated" not when they complete onboarding but when they perform the core habit unprompted *for the first time after the first session*. For Celestia: opening the app from the D1 morning push. Onboarding's success metric is not D0 completion — it's D1 push-driven open.

### Activation event definition for Celestia

```
Activation = (user opens app from D1 morning push within 10 min of push fire)
            OR
            (user opens app on D1 organically, regardless of push)
```

The push-driven open is the gold-standard activation because it proves the external trigger works. The organic open is acceptable because it suggests internal trigger formation may be ahead of schedule.

We should track this as `D1_ACTIVATED` event with source attribution.

---

## Framework 4 — Subscription-app onboarding patterns

Cal AI, Yuka, Headspace, Noom, Calm, Duolingo — and astro-specific: Co-Star, The Pattern, Nebula, Sanctuary.

### Pattern A — "Quiz funnel"

Used by: Cal AI, Noom, Nebula, Yuka.

Structure: 8–20 personality / preference questions before any value. Each question is investment. The paywall references their answers ("Based on your goals, your custom plan is…").

**Why it works:** commitment-consistency at scale. Each answer is a tiny commitment. By the time the paywall lands, the user has made 12+ micro-commitments and walking away feels like wasted effort (sunk cost).

**Why it's risky:** if the value reveal isn't strong, users feel surveyed, not served. Nebula gets 60+% complete-but-don't-pay because the chart reveal at the end doesn't justify the 15-question buildup.

**Celestia's current flow uses a softened version of this:** 4 emotional questions, not 15. Right call.

### Pattern B — "Direct value"

Used by: Co-Star, The Pattern, Calm.

Structure: bare-minimum data collection (3–4 fields), immediate value reveal, then the upsell. Co-Star: 4 birth fields → chart → "want notifications?" → done.

**Why it works:** lowest TTFV. Highest D0 completion. Best-fit for products where the core value is single-shot.

**Why it's risky:** no investment before paywall = lower paywall conversion. Co-Star's free product is the whole product; they don't have a strong paywall play.

**Celestia is between A and B.** We have a paid tier (so we need investment for paywall conversion) but our core value is identity-revealing (so we need fast TTFV). Pattern A is correct in shape; just keep it tight.

### Pattern C — "Promise + payoff"

Used by: Headspace, Duolingo.

Structure: opening screen makes a specific promise ("learn Spanish in 15 min/day"), 3–5 questions of personalization, immediate first lesson (tiny version of the core action), reward, then upsell.

**Why it works:** the user does the actual thing in onboarding. Habit wiring starts on day 0. Duolingo specifically lets you complete a lesson before signing up — Investment-loaded trigger is now in your phone.

**Celestia analog:** the chart reveal *is* the first "lesson." But we don't ask the user to *do* anything in onboarding beyond entering data. The pre-filled chat question on WelcomeScreen is the closest we get to "do the thing on day 0," and only ~50% of users tap it.

**Opportunity:** add a single Starter Step inside onboarding — a 1-tap save / 1-tap reflection / 1-tap share moment that creates content the user owns. We have share affordances on WelcomeScreen reveal cards; that's a start.

---

## Competitor teardowns (rapid)

### Co-Star (the gold standard for astro identity)

**Onboarding length:** 5 screens, ~45 seconds.
- Birth date / time / place (3 separate screens, big inputs)
- Calculating (~2s, pure theatre)
- Chart reveal + "Welcome" with placement summary

**Notification handling:** Asks for permission immediately after chart reveal, no time-of-day question, no type choice. They send 1 push/day at variable morning time.

**Paywall:** Doesn't exist in onboarding. Co-Star Pro is upsold inside the app weeks later.

**What we steal:** the speed (TTFV ~45s), the unflinching commitment to "the chart *is* the product," the post-reveal permission ask.

**What we don't:** the absent paywall (we need ours), the random-time push (users hate this — review evidence), the lack of bundle choice (our funnel needs more notification optionality).

### The Pattern (the brutal personalization)

**Onboarding length:** 4 screens, ~40 seconds.
- Birth date / time / place
- "Your most pressing pattern right now is…" — single, brutal personality summary

**Notification handling:** Single daily push at a fixed time. Permission asked immediately post-reveal.

**Paywall:** Aggressive — locks the deepest patterns behind subscription within onboarding.

**What we steal:** the "most pressing pattern" reveal model (single, devastatingly specific statement). Our `revealStatements[0]` already does this — make sure it's *the* hero statement, not just the first card.

**What we don't:** the immediate paywall (kills trust). Our staged paywall is better.

### Nebula (the quiz funnel)

**Onboarding length:** 12–15 screens, ~3 minutes.
- Long personality quiz (relationship status, goals, interests)
- Birth data
- Chart reveal (smaller hit than Co-Star/Pattern)
- 3-screen paywall stack with annual/monthly/weekly tiers

**Notification handling:** Asks for time + frequency mid-onboarding. Defaults to 4–5 pushes/week.

**Paywall:** Heavy — discount timer, multiple plans, social proof, money-back guarantee.

**What we steal:** the time + frequency question pattern (we'll do a softened version with bundles).

**What we don't:** the sheer length, the discount timer pressure, the disappointing chart reveal that follows the long buildup.

### Sanctuary (the middle path)

**Onboarding length:** 8 screens, ~90 seconds.
- Quick goal selector (1 question)
- Birth data
- Chart reveal
- Notification time + binary "transit alerts on/off?"
- Paywall (single screen)

**What we steal:** the binary supplementary toggle for transit alerts. Clean, doesn't clutter.

### Calm / Headspace (non-astro but relevant for daily-habit subscriptions)

**Onboarding length:** 6–8 screens.

**Notification handling:** Asks "what time would you like to be reminded to meditate?" — anchored to a planned future routine, not "what time should we send notifications." Headspace specifically frames it as "*remind me to be mindful at __*."

**What we steal:** the anchor framing of the time question. *"When does your day usually start?"* is correct Celestia framing.

---

## Synthesis — what makes onboarding work for Celestia specifically

Combining the four frameworks:

### Principle 1 — The chart reveal is non-negotiable as the activation moment

Everything before it is investment. Everything after it is commitment. The reveal must land hard, with theatre, with two stages, with personalization. Currently this is solid; protect it.

### Principle 2 — Birth-data friction is our largest controllable leak

The form (steps 5–7) costs ~13–15% completion. Reducing this is the highest-ROI ability work. Specific moves:

- Pre-fill name from device user.
- Cache city search results.
- Allow date picker to skip year first (most people remember month/day; year selection is the slow part on iOS spinner).
- Default time picker to 12:00 (already done) and visually de-emphasize the time question relative to date/place — it's the most-skipped field.

### Principle 3 — Wake-time is the most important question we ask

It's the anchor for the entire D1+ push system. Give it its own screen with serious framing. Currently buried at step 11.

### Principle 4 — Three notification bundles, not seven toggles

`DEFAULT_SETTINGS` enables all 7 channels. Most users will silence everything within a week if we don't give them agency. Three bundles = one decision = invested = stays on.

### Principle 5 — The paywall must reference the user's actual chart

Generic feature lists convert at maybe half the rate of personalized paywall copy. After step 10's reveal, we know their Sun, Moon, Rising, dominant element, retrograde count, and which life areas matter to them. The paywall should reference at least two of these by name.

### Principle 6 — The first-day push is part of onboarding

If the user grants permission and then doesn't get a satisfying push the next morning, onboarding has failed even if they completed step 14. The `cm_d1_personal` template — which echoes the user's `FIRST_REVEAL_STATEMENT` — is currently the strongest D1 push in the system. It must fire reliably.

### Principle 7 — The post-WelcomeScreen first-action matters more than completion

Activation = D1 morning open. We don't actually care if the user tapped step 14 vs. step 12; we care if they're back tomorrow. Every onboarding decision should be evaluated against D1 retention, not against D0 completion.

### Principle 8 — Onboarding never really ends

The first 7 days are part of onboarding. The lapsed-cascade pushes (`sg_lapsed_2` through `sg_lapsed_21`) are the safety net. The badge-rescue, streak-anticipation, and trial-end pushes are the activation-week scaffold. Plan them as one system.

---

## What "perfect onboarding" means for Celestia

Not 0 friction. Not all features explained. Not every preference asked.

**Perfect onboarding is the shortest path from download to internal trigger formation, with enough investment along the way that the paywall feels earned and the morning push feels welcome.**

Concretely:
- 11 screens (down from 14)
- Under 2:00 to first chart reveal
- 65% completion rate
- 65% notification permission grant
- 45% D1 return
- 25% D7 return
- 10% trial-to-paid

The flow specification in [03-new-flow-spec.md](03-new-flow-spec.md) is the implementation of these principles.

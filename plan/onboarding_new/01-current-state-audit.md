# 01 — Current State Audit

A scored walkthrough of what we ship today, what's working, and where the funnel leaks. Reading this first makes the new flow proposals make sense.

## The 14 steps as they exist

Source: `src/screens/OnboardingFlowScreen.js` (1073 LOC, single component, 14-state switch).

| # | Screen | Purpose | Time | Friction |
|---|---|---|---|---|
| 1 | Hook | "The stars remember when you were born" | 5s | 1 tap |
| 2 | Motivation | Why are you here? (4 options) | 8s | 1 tap |
| 3 | Pain Point | What feels uncertain? (4 options) | 8s | 1 tap |
| 4 | Depth | How often do you feel misunderstood? (4 options) | 8s | 1 tap |
| 5 | Birth Date + Name | Two inputs, native date picker | 30s | 2 fields, picker dance |
| 6 | Birth Time | Time picker or "I'm not sure" | 15s | 1 picker |
| 7 | Birth Place | City search via Nominatim API | 30s | typing + waiting |
| 8 | Calculating | 4-phase theatrical pause + chart calc | 4.2s | 0 (forced wait) |
| 9 | First Hit | Sun sign reveal + tagline + core question | 15s | 1 tap |
| 10 | Big Reveal | Chart wheel + Big 3 + insight | 30s | 1 scroll + 1 tap |
| 11 | Daily Hook | Today's sky + wake-time chip-row + Continue | 25s | 1 chip + 1 tap |
| 12 | Soft Paywall | Benefit list + "Start trial" / "Maybe later" | 20s | 1 tap |
| 13 | Reassurance | 3 testimonials + free callout | 15s | 1 tap |
| 14 | Hard Close | Plan selection (annual/monthly) | 30s | 1 selection + 1 tap |

**Total time:** ~4 minutes if the user reads everything. About 2:30 if they speed-tap.
**Total taps:** 14 (one per screen, minimum).
**Total typed inputs:** 2 (name, city).

After this: `Auth` (mode='onboarding') → `WelcomeScreen` → permission modal → Main.

## What's genuinely good (keep)

### The four-arc structure is sound

The screenwriter's instinct in the current flow is correct: hook → invest → reveal → close. This maps cleanly onto Eyal's Hook Model and onto the Reforge "first mile" framework. We don't need to redesign the bones; we need to fix the joints.

### The pre-questions (steps 2–4) earn their place

A common review-style critique would be "drop the personality questions, get to the chart faster." That would be wrong here. Three reasons:

1. **Commitment-consistency** (Cialdini): each answer is a stake in the ground. The paywall later references their stated motivation (`MOTIVATION_GOAL_TEXT` at step 14) — without these answers that callback doesn't work.
2. **Investment loads the trigger** (Eyal): the user has now invested four taps before seeing the chart, so the chart reveal lands with more weight.
3. **Personalization tokens for the AI**: `motivation`, `painPoint`, `depth` flow into `geminiService.js` to shape AI tone and the homepage navigator briefing.

### The two-stage reveal (9 → 10) is exactly right

Staged dopamine. The Sun-sign hit at step 9 is a finite reward (you get one fact). Step 10 is a variable reward (chart wheel + 3 placement cards + 1 chart-derived insight that depends on motivation/pain). Two hits beat one big reveal — anticipation between them is the strongest dopamine driver.

### WelcomeScreen's reveal statements are the actual magic moment

`MOON_HOUSE_INSIGHTS`, `VENUS_SIGN_INSIGHTS`, `SUN_MOON_COMBOS` produce statements like *"Your emotions are written all over your face. People feel your mood before you speak."* This is what users screenshot. The WelcomeScreen also persists `FIRST_REVEAL_STATEMENT` to AsyncStorage so the D1 morning push can echo it back — that's a sophisticated investment-loads-trigger move and we should protect it.

### Wake-time question is anchor-based

The chip row at step 11 with options 6/7/8/9 AM / Later / Varies — and the copy "*We'll send your morning briefing right after — so it lands on your routine, not ours*" — is doing the right thing per Fogg. We just need to give it more space.

### Permission ask is at peak motivation

`WelcomeScreen.js:225-235` waits for the first CTA tap, *after* the chart reveal and the personality statements. This is exactly when permission grant rates are highest. Do not move this.

## What's broken

### Issue 1 — 14 linear steps is long for a free-tier hook

Industry data points (Cal AI, Yuka, Headspace, Calm published case studies):
- Median onboarding for high-LTV subscription apps: 8–12 steps.
- Funnel drop per step in unoptimized flows: 3–7%.
- Each step over 10 typically costs 2–4% completion.

If our current flow loses 4% per step linearly, completion is `0.96^14 ≈ 56.5%`. That's directionally consistent with what astro-app benchmarks suggest. **We can probably get to 11 steps without losing personalization.**

### Issue 2 — Three sequential paywall screens create exit-fatigue

Steps 12 / 13 / 14 are all paywall. Each has a "skip" option. A user who is going to convert has already converted at 12; a user who's hesitant gets two more chances to bail. This is conversion-rate theater, not optimization. **Combine into 2 screens** with testimonials inline on the plan-selection screen.

### Issue 3 — Wake-time is buried under "Today's sky"

Step 11 currently does three jobs: (a) show today's transits, (b) ask wake time, (c) hand off to paywall. The wake-time question — which is the highest-ROI question in the entire flow because it sets the morning-push schedule — is the third element on a long card. Many users won't see it; many will scroll past without selecting and the system falls back to 7:30 default. **Wake-time deserves its own screen.**

### Issue 4 — Notification "type" choice doesn't exist

`DEFAULT_SETTINGS` in `notificationService.js:84` enables all 7 channels by default. A user who wants minimal contact has to discover Settings → Notifications → toggle 6 of 7 off. They won't. They'll just turn off iOS-level permission instead, losing the morning push too. **This is the single biggest leak in the long-tail retention funnel.**

### Issue 5 — No first-action moment for "continue to dashboard" users

WelcomeScreen offers two CTAs: "Ask Celestia about this" (chat with prefill) or "Or continue to your dashboard." Users who pick the second option land on Today and have no obvious first action. The home screen is dense. They scroll, they skim, they leave. **D0 retention dies on this screen for the dashboard-CTA cohort.**

### Issue 6 — Gender is hardcoded `'unknown'`

`OnboardingFlowScreen.js:271`: `gender: 'unknown'`. We never ask. Some AI tone calibration depends on inferring this. Not strictly necessary but a missed personalization signal — could be a non-blocking optional question.

### Issue 7 — No celebration moments between steps 1–10

The only haptic celebration is on WelcomeScreen post-reveal. Steps 5/6/7 (the data-entry chore) and steps 9/10 (the reveals) should each have a small success state. Tiny celebrations wire habits per Fogg's Tiny Habits research. Currently every confirm is silent.

### Issue 8 — The 3 paywall screens use generic copy

Step 12's benefit list is `Daily AI readings / Relationship synastry / Transit alerts / AI astrologer / Deep reports`. This is feature-list copy, not benefit copy. Users at this point have just seen their actual chart — the paywall should reference *their* chart, not generic features. **"With your Moon in Cancer, the daily readings learn your emotional rhythm — not just your sun sign"** converts vastly better than a feature list.

## Scoring against frameworks

### Fogg B=MAP — score: 6/10

| Element | Score | Why |
|---|---|---|
| Motivation tap | 8 | Hook + emotional questions tap into "self-understanding" + "navigate change" — strong anchors. |
| Ability (friction) | 6 | 14 steps with 30s of typing across 3 separate fields. Could be tighter. |
| Prompt design | 4 | No first-action prompt for dashboard-CTA users. Wake-anchor exists but is buried. |
| Action Line management | 6 | Reveals keep motivation high through middle of flow but paywall stack overshoots. |
| Tiny Habits anchoring | 7 | Wake-time question is a real anchor. Just needs prominence. |
| Celebration | 3 | Almost none until WelcomeScreen. Each form completion deserves a small one. |

### Eyal Hook Model — score: 7/10

| Phase | Score | Why |
|---|---|---|
| Trigger (external → internal) | 7 | Strong external trigger (the chart reveal = curiosity payoff). Internal trigger (morning uncertainty) is set up by D1 push but onboarding doesn't directly seed it. |
| Action | 6 | First action post-onboarding is "tap pre-filled chat question" — good. But only ~50% of users pick that CTA; the other half land on dashboard with no action. |
| Variable Reward | 9 | Two-stage reveal + chart-derived statements = excellent variable reward in onboarding itself. |
| Investment | 7 | 4 emotional questions + name + birth data + wake-time = significant stored value. Missing: a content-creation moment (first journal entry, first saved insight) that loads tomorrow's trigger. |

### Reforge first-mile checklist — score: 6/10

| Check | Pass? | Note |
|---|---|---|
| User experiences core value within first session | ✅ | Chart reveal at step 10. |
| Time to value (TTV) under 3 minutes | ⚠️ | ~2:30 if speed-tapping; close to 4:00 if reading. Could shave. |
| First-day return is engineered, not hoped for | ⚠️ | D1 push exists (`cm_d1_personal`) but only fires if permission granted. Permission grant rate is the bottleneck. |
| User has invested before paywall | ✅ | Birth data + 4 questions + chart calc. |
| Paywall is personalized | ❌ | Generic feature list. Should reference user's actual chart. |
| First post-onboarding action is obvious | ⚠️ | For chat-CTA cohort: yes. For dashboard cohort: no. |

## The funnel hypotheses (to verify with PostHog)

Without exact numbers, the most likely shape based on app-industry benchmarks:

```
Splash (100)
  ↓ -5%
Step 1: Hook (95)
  ↓ -3%
Step 2: Motivation (92)
  ↓ -3%
Step 3: Pain (89)
  ↓ -3%
Step 4: Depth (86)
  ↓ -10%  ← biggest leak: birth-data form ask
Step 5: Birth Date + Name (77)
  ↓ -5%
Step 6: Birth Time (73)
  ↓ -8%   ← second leak: city search latency
Step 7: Birth Place (67)
  ↓ -1%
Step 8: Calculating (66)
  ↓ -1%
Step 9: First Hit (66)
  ↓ -1%
Step 10: Big Reveal (65)
  ↓ -2%
Step 11: Daily Hook + Wake (64)
  ↓ -8%   ← third leak: paywall start
Step 12: Soft Paywall (59)
  ↓ -2%
Step 13: Reassurance (58)
  ↓ -3%
Step 14: Hard Close → Auth (56)
```

These are estimates. The instrumentation already exists (`ONBOARDING_STEP_COMPLETED` event in `OnboardingFlowScreen.js:191`) so the real numbers are recoverable from PostHog.

**Three biggest leaks predicted:**
1. Birth data form (step 4 → 5): people don't want to type their birth info into yet another app.
2. City search (step 6 → 7): network latency on Nominatim, no caching.
3. First paywall touch (step 11 → 12): the bait-and-switch feeling.

## Summary — the ten things to change

1. Combine the 3-screen paywall stack into 2 screens.
2. Promote wake-time to its own screen.
3. Add a notification-bundle choice screen (3 options).
4. Rewrite paywall copy to reference the user's actual chart placements.
5. Add micro-celebrations after each form completion (haptic + small visual ack).
6. Add a first-action moment on Today screen for "continue to dashboard" users.
7. Cache city search results locally (recent searches list).
8. Pre-fill name from device user where possible.
9. Add an optional gender / pronouns question (skippable, used for AI tone).
10. Instrument the new flow with parity events for A/B comparison.

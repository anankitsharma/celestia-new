# 04 — Notifications & The First Week

Onboarding doesn't end at "Set My Morning." It ends on day 7, when either the user has formed a habit or hasn't. The notification system *is* the activation infrastructure. This document specifies what we ask in onboarding, when we ask for permission, and what fires on D0 / D1 / D2 / D3 / D7.

---

## What we ask in onboarding (vs. what we infer)

### Asked explicitly

| Question | Screen | Why we ask | Default if skipped |
|---|---|---|---|
| Wake time | 11 | Sets morning push schedule | 7:30 AM |
| Notification bundle | 12 | Sets which channels are on | "Balanced" (2 pushes/day) |

### Inferred from earlier answers

| Setting | Inferred from | How |
|---|---|---|
| AI tone for push copy | `motivation`, `depth` | Persona-conditional copy in template generators |
| Push priority weighting | `painPoint` | Life-area-matched pushes get +2 weight |
| First-week push intensity | `notificationBundle` | Used to trim or keep optional pushes |

### Not asked (deliberately)

| Setting | Why not asked | Where it's set |
|---|---|---|
| Quiet hours | Decision-fatigue; defaults are fine | Settings screen, post-onboarding |
| Per-channel toggles | Bundle choice covers this | Settings screen |
| Specific topic interests (love / career / etc.) | We already know from `painPoint` | Inferred |
| Push sound | iOS-level, not ours to set | n/a |

The principle: **two questions in onboarding, infer everything else.** Anything we can derive from another answer, we derive. Anything that has a sensible default, we default. We never make the user pick something they don't have an opinion about.

---

## Permission ask — when and how

### Timing

**WelcomeScreen, on first CTA tap, after the chart reveal and the personality statements.**

This is already correctly placed in `WelcomeScreen.js:209-235`. Do not move it.

The reasoning:
- **Motivation peak.** The user just saw their chart and read 2 personality statements that felt scarily accurate. This is the highest-motivation moment of their relationship with the app, possibly ever.
- **Investment already made.** They've completed onboarding. Walking away now means losing the chart they just built. Sunk-cost fallacy is on our side.
- **Specific anticipated reward.** Because we've already collected `wakeHour` and bundle preference, we can preview the actual push they'll receive — making the ask concrete.

### The new permission modal

Current copy in `NotificationPermissionModal.js` is generic. New spec:

```
┌─────────────────────────────────────────┐
│                                         │
│         ✦ Tomorrow at 7:00am ✦         │
│                                         │
│       Your first reading lands.         │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ Yesterday you read this about   │   │
│   │ yourself: "Your emotions are    │   │
│   │ written all over your face..."  │   │
│   │ Today, watch for the second     │   │
│   │ part.                           │   │
│   └─────────────────────────────────┘   │
│                                         │
│      [ Allow notifications ]            │
│                                         │
│           Maybe later                   │
│                                         │
│   *We never wake you up. Promise.*      │
│                                         │
└─────────────────────────────────────────┘
```

Three changes from current modal:
1. **Show the actual push body the user will receive.** Pulled from `cm_d1_personal` template generation with their `firstRevealStatement`.
2. **Reference their chosen wake time** in the header.
3. **Reassurance line below the secondary CTA**, addressing the "you'll spam me" fear directly.

### After grant

`scheduleAllNotifications` runs immediately (already does via `WelcomeScreen.js:243`). Schedule includes:
- D1 morning push (priority 1, fires at user's wake time + 0min on next morning)
- D1 evening reflection (if bundle ≥ balanced)
- D2 lapsed push at 9 AM (fires only if user doesn't return)
- All the existing event-based scaffolding (badge rescue, streak anticipation, trial-end, etc.)

### After deny

User goes to Today. **No further nag**, but in-app subtle re-prompts:
- Day 3, on Today tab, a soft banner: "Mornings are better with your chart. [Enable notifications]" — only shows once.
- If user ignores or dismisses: never ask again from in-app. They can re-enable in Settings.

The discipline here matters. Repeated permission prompts erode trust. **Once asked, twice mentioned, then silent forever.**

---

## The first-week push schedule (the activation arc)

Day-by-day, from a user who completes onboarding on Day 0:

### Day 0 (onboarding day) — 0 to 1 push

If user grants permission immediately and completes onboarding before evening: nothing fires today. The chart reveal *is* the day-0 reward.

If user grants permission post 8pm: schedule the evening reflection push to fire 30 min later if bundle ≥ balanced.

### Day 1 — 1 to 2 pushes

**Morning, at user's wake time** (highest priority):

Template: `cm_d1_personal` (already exists in `notificationContentEngine.js:15-31`).

> *Title:* Yesterday you read this about yourself:
> *Body:* "Your emotions are written all over your face. People feel your mood before you speak." Today watch for the second part.

This is *the* activation push. Two specific reasons it works:
- **References their actual reveal** — proves we remember.
- **Promises a "second part"** — variable reward in tomorrow's open.

**Evening 8:30pm (if bundle ≥ balanced):**

Template: `er_moon` or `er_phase` (existing). Generic enough to fire on D1.

### Day 2 — 1 push

**Morning, at user's wake time:**

Template: `cm_navigator_excerpt` (the homepage-mirroring push, weight 100, already exists).

This is the first "normal" morning push. The pattern starts here: every morning, a reading derived from today's actual sky + their chart.

### Day 3 — 1 to 2 pushes

**Morning:** `cm_navigator_excerpt`.

**Afternoon (if Pro discovery push is queued):** `proEngagementService` Day 3 push. Existing system.

**If user has been silent (no opens since D1):** the lapsed cascade starts. `sg_lapsed_2` at 9 AM (already implemented).

### Day 4–6 — 1 push/day

**Morning only.** Standard `cm_navigator_excerpt` rotation.

If user has stopped opening, lapsed cascade continues with day-3, day-5 templates.

### Day 7 — the activation checkpoint

**Two scenarios:**

**Scenario A: User is engaged (has 4+ opens since D1).**

They're activated. Internal triggers are forming. Standard morning push continues. Streak system kicks in (they're on a streak now if they opened consecutively).

**Scenario B: User has lapsed (≤2 opens since D1).**

Lapsed cascade fires `sg_lapsed_7`:
> *Title:* A full week. The Sun moved 7 degrees.
> *Body:* A small thing. But it's the kind of small thing that changes a month.

This is intentionally not a guilt-trip. The voice guide is "literary, specific, slightly unsettling, never 'we miss you.'" Existing templates already follow this voice; protect it.

---

## Frequency caps and bundle behavior

### How the bundle choice affects scheduling

```
MINIMAL  → cap at 1 push/day. Morning only.
           Lapsed cascade still runs (it's reactivation, not regular).
           Streak guardian disabled (no point if they don't journal).

BALANCED → cap at 2 pushes/day. Morning + (evening OR streak OR transit).
           Frequency cap in scheduleAllNotifications already enforces this.

EVERYTHING → cap at 2 pushes/day for week-1 installs (existing rule),
             3/day after habituation. All channels active.
```

### The week-1 cap

`notificationService.js:625` already implements:
```js
const dailyCap = (data.weeksSinceInstall || 0) < 1 ? 1 : 2;
```

This is a 1/day cap for fresh installs across all bundles. **Adjustment for the new bundle system:**

```js
const baseCap = (data.weeksSinceInstall || 0) < 1 ? 1 : 2;
const bundleMultiplier = {
  minimal: 1,
  balanced: 1,
  everything: 1.5,
}[data.notificationBundle || 'balanced'];
const dailyCap = Math.ceil(baseCap * bundleMultiplier);
```

Effect:
- Week-1 minimal: 1/day. Week-1 balanced: 1/day. Week-1 everything: 2/day.
- Post-week-1 minimal: 2/day. Post-week-1 balanced: 2/day. Post-week-1 everything: 3/day.

The asymmetry matters: minimal-pickers signaled "I want less," and we honor that even after habituation. Everything-pickers signaled tolerance, and we use it.

---

## What happens if the user changes their mind

### Re-opening Settings → Notifications

The existing `NotificationSettingsScreen` shows all 7 channel toggles. **Add at the top a bundle selector** that mirrors onboarding screen 12, plus a "custom" option that's auto-selected if the user has touched individual toggles.

```
NOTIFICATION RHYTHM
○ Just the morning      (1/day)
● Morning + evening     (2/day)
○ Everything cosmic     (5/wk)
○ Custom

──────────────────────────
[ existing per-channel toggles below ]
```

Picking a bundle auto-applies the preset and disables individual toggles (or enables them all visually but auto-syncs). Picking "Custom" or touching any toggle moves the user to custom mode.

**Why this matters:** the bundle is the user's mental model. Settings should reflect that mental model, not force them back to channel-toggle thinking.

### iOS-level disable

If the user disables notifications at iOS level, we can detect this on next foreground via `hasNotificationPermission()`. **In-app banner** on Today, once:

> Notifications are off. You'll miss your morning reading. [ Enable ]

Tapping deep-links to iOS Settings via `Linking.openSettings()`.

---

## Push copy voice (the rules)

Already documented in `plan/competitive-audit/voice-guide-pushes.md`. Recap for context:

- **Specific, not generic.** "Your Mars in Cancer" beats "your cosmic energy."
- **Literary, slightly unsettling.** *"A small thing. But it's the kind of small thing that changes a month."*
- **No "your cosmic anything"** as a phrase.
- **No "we miss you"**, no "things kept moving."
- **Typographic glyphs (★ ⌁ ✶) sparingly** — match editorial typography.
- **Lower-case starts allowed** for emphasis: "*one more morning. then it counts.*"

The existing template catalog (`notificationContentEngine.js`) follows this voice. Onboarding-derived push customization should preserve it.

---

## Push templates that need updating for the new flow

| Template | Change | Reason |
|---|---|---|
| `cm_d1_personal` | No change | Already references `firstRevealStatement` correctly |
| `cm_navigator_excerpt` | No change | Already weight 100, mirrors homepage |
| `cm_internal_trigger_*` | No change | Already gate on weeksSinceInstall ≥ 2 |
| Permission modal copy | Rewrite | Show the actual D1 push preview |
| Settings screen header | Add | Bundle selector at top |

No changes to lapsed cascade, badge rescue, streak anticipation, trial-end, solar return, journal pattern. Those are working.

---

## Activation funnel (the metric)

```
ONBOARDING_COMPLETED (100%)
  ↓
NOTIFICATION_PERMISSION_GRANTED (target: 65%)
  ↓
D1_PUSH_FIRED (existing event: pushes scheduled)
  ↓
D1_PUSH_OPENED (the activation event — target: 70% of grants)
  ↓
D1_SESSION_LASTED_30S (real engagement, not just open)
  ↓
D7_RETAINED (≥ 4 opens in week 1 — target: 25% of completes)
```

The activation rate of `D1_PUSH_OPENED / NOTIFICATION_PERMISSION_GRANTED` is the single most important number for evaluating the notification redesign. If it's above 70%, the morning push is genuinely valuable. If it's below 50%, the push copy is generic or the wake-time is mis-calibrated.

---

## A/B tests to run

### Test 1: Bundle vs. no bundle

- **A (control):** current default — all 7 channels on, no onboarding question.
- **B (variant):** new bundle question with "Balanced" default.

**Hypothesis:** B has higher D7 retention because permission is preserved at iOS level (users who chose minimal don't disable iOS-level permission to escape).

**Primary metric:** D7 push-driven open rate.
**Secondary:** D14 iOS-level permission retention.

### Test 2: Wake-time anchor copy

- **A:** "When should we send your morning briefing?" (setting-framed)
- **B:** "When does your day usually start?" (anchor-framed)

**Hypothesis:** B has higher D1 push-open rate because the user identifies the time with their actual wake-up, not a notification preference.

**Primary metric:** D1 push opened within 10 min of fire.

### Test 3: Permission modal preview

- **A:** Generic permission modal copy.
- **B:** Modal showing the actual D1 push body preview.

**Hypothesis:** B has higher grant rate because the ask is concrete.

**Primary metric:** Permission grant rate at modal.

### Test 4: First-action affordance on Today

- **A (control):** Today screen as-is.
- **B (variant):** Adds "☆ Save this" affordance on navigator briefing card.

**Hypothesis:** B has higher D1 retention because the user has invested content (a saved insight) into the app.

**Primary metric:** D1 organic open rate.

Run these as 50/50 splits. Each needs ~2,000 users per arm to detect a 5-point lift at 95% significance.

---

## Edge cases

### User completes onboarding at 6 AM

If the user finishes at 6 AM and their wake time is 7 AM, the D1 push would fire 25 hours later. This is correct — we don't fire on the same day as onboarding completion. The chart reveal is the D0 reward.

### User completes onboarding at 11 PM

D1 push fires 8 hours later (assuming 7 AM wake). Fine.

### User picks "Varies" wake time

Internal default: 7:30 AM. The push body should soften:
> *"This morning…"* (no "your usual time" reference)

instead of:
> *"At 7:00am, your reading…"*

Add a flag in `notificationData`: `isVariesWake: true`, branched in the template generators.

### User picks "Later" (10 AM+)

Set wake time to 10:00 AM. Soften the "wake" framing in the morning-anchor copy — it's not really morning at 10 AM for users who are at work.

### User changes wake time later in Settings

Re-run `scheduleAllNotifications` immediately. Existing `NotificationSettingsScreen.js` already handles this.

### User grants permission, then revokes at iOS level

Detected on next foreground via `hasNotificationPermission()`. In-app banner once. Then silent.

### User downloads app, completes onboarding, never grants permission

D1 push doesn't fire. We rely on:
- Email-based re-engagement (if signed in).
- Day-3 in-app banner suggesting permission.
- The standard week-2+ internal-trigger pushes don't matter — they require permission too.

This cohort's D7 retention is roughly half the permission-granted cohort's. That's why permission-grant rate is the rate-limiting metric.

---

## What success looks like at day 7

**For an ideal user:**

- Day 0: completes onboarding. Picks 7 AM wake. Picks "Balanced" bundle. Grants permission. Taps "Ask Celestia about this →" and asks one question in chat.
- Day 1, 7:00 AM: receives `cm_d1_personal`. Opens at 7:03. Reads the navigator briefing. Saves one insight. Total session: 2 min.
- Day 1, 8:30 PM: receives evening reflection prompt. Writes one line in journal. Total session: 90s.
- Day 2, 7:00 AM: receives `cm_navigator_excerpt`. Opens at 7:01. Reads briefing. Total session: 90s.
- Days 3–6: opens morning push 3 of 4 days. Streak = 6.
- Day 7, 7:00 AM: receives `cm_streak_anticipation_7`. Opens at 7:02. Hits 7-day streak. Receives badge. Shares badge.

This user is activated. Internal triggers are forming. They're a Pro-trial candidate now.

**For an at-risk user:**

- Day 0: completes onboarding. Doesn't grant permission. Lands on Today. Bounces.
- Day 1: nothing fires.
- Day 2: nothing fires. They've forgotten the app exists.
- Day 7: app is on screen 4 of homepage, never opened.

We can't help this user with notifications. The intervention has to be email or app-icon badge. **Email-based D1 re-engagement** is a real opportunity if we ever capture email at signup — but that's a separate plan.

---

## Summary

The notification system is the activation infrastructure. Onboarding asks two questions to calibrate it (wake time + bundle). Permission is asked at peak motivation post-reveal with a concrete preview. The first week is engineered as a 7-day arc with `cm_d1_personal` as the single most important push and the lapsed cascade as the safety net. The bundle choice is the new piece — small in screen real estate, large in long-tail retention impact.

Implementation details: [05-implementation-roadmap.md](05-implementation-roadmap.md).

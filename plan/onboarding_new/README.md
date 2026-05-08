# Onboarding v2 — Plan Index

This folder is the full redesign of Celestia's onboarding, from the moment the app icon is tapped to the end of week 1. It treats onboarding as a *system*, not a flow — the screens, the notification setup, the post-onboarding nudge, and the D0/D1/D7 pushes are one coordinated machine for moving a stranger to a habit.

## Read in this order

1. **[01-current-state-audit.md](01-current-state-audit.md)** — what we have today, scored with B=MAP and Hook Model, the gaps.
2. **[02-onboarding-theory.md](02-onboarding-theory.md)** — research synthesis: Fogg's Behavior Model, Eyal's Hook, the Reforge / Crabtree / Hulick first-mile principles, and how successful astro/subscription apps actually do it.
3. **[03-new-flow-spec.md](03-new-flow-spec.md)** — the proposed flow, screen by screen, with copy, design intent, and the psychology behind each step.
4. **[04-notifications-and-first-week.md](04-notifications-and-first-week.md)** — the notification piece: when we ask permission, what we ask in onboarding, how the D0 / D1 / D3 / D7 pushes are sequenced.
5. **[05-implementation-roadmap.md](05-implementation-roadmap.md)** — what to refactor, in what order, what we keep, and the metrics we watch.

---

## TL;DR — what changes

**Today's onboarding is 14 linear steps that culminate in a 3-screen paywall stack.** It's well-written but mis-sequenced: the wake-time anchor is buried at step 11, the notification "what kind" choice doesn't exist, and the paywall starts before the user has felt the product alive.

**The new flow is 11 steps + 2 post-onboarding moments**, structured as four arcs:

```
Arc 1 — HOOK (1 screen)
  Get them past the splash with one promise: "your real chart, not your sun sign."

Arc 2 — INVESTMENT (3 screens)
  3 emotional questions. Each one is a commitment — the user is staking
  ground on what they want from us. Sets up the personalized paywall later.

Arc 3 — PAYOFF (4 screens)
  Birth data → calculation theatre → the Sun-sign first hit →
  the full chart reveal. This is the magic moment. No paywall pressure here.

Arc 4 — COMMITMENT (3 screens)
  Wake-anchor → notification-style choice → permission ask →
  paywall (now framed as continuation, not interruption).

Arc 5 — FIRST USE (post-onboarding, in-app)
  Pre-filled chat question seeded from the user's strongest reveal.
  This is the Hook Model's first full cycle: trigger → action → reward → investment.
```

## Core principles

1. **Show value before asking for money.** The big chart reveal must land before any paywall screen. (Current order already does this — keep it.)
2. **Anchor the morning push to an existing routine, not a setting.** "When does your day usually start?" beats "Pick a notification time."
3. **Three notification bundles, not seven toggles.** Most users will pick the default; the choice itself is investment, which is what matters.
4. **Permission ask is post-reveal, peak-motivation.** Don't move it. Pre-load the system prompt with specific framing ("Your morning reading at 7:05am — allow notifications?").
5. **Onboarding ends with a real action, not a "Done" screen.** WelcomeScreen → pre-filled chat question is the right pattern. Strengthen it.
6. **The first 7 days are part of onboarding.** Push timing, content, and frequency in week 1 are not "marketing" — they're activation infrastructure.

## What we keep from current onboarding

- The 4 emotional pre-screens (hook + motivation + pain + depth) — these are investment moments and they make the paywall feel personalized.
- The two-stage reveal (sun-sign first hit → full chart) — staged dopamine.
- Wake-time question with anchor framing.
- WelcomeScreen with deeply-specific reveal statements + share affordances.
- Permission modal at peak-motivation moment.
- Trial-end push, badge-rescue, anticipation pushes (already excellent).

## What we cut or rework

- **Three back-to-back paywall screens** (current 12 / 13 / 14) → consolidate to 2 screens (benefits + plan, with testimonials inline).
- **"Continue" buried under wake-time** at step 11 → break into its own focused micro-flow.
- **All 7 notification channels default-ON** → 3 bundle choice (Just morning / Morning + evening [default] / Everything cosmic).
- **No first-action moment after WelcomeScreen** for users who choose "continue to dashboard" → add a 1-tap "save your first insight" affordance on Today.

## Success metrics

We measure five things. (See [05-implementation-roadmap.md](05-implementation-roadmap.md) for full event spec.)

| Metric | Today (estimated) | Target |
|---|---|---|
| Onboarding completion rate (Step 1 → finish) | ~55% | 65% |
| Notification permission grant rate | ~45% | 65% |
| D1 retention (returns next day) | ~30% | 45% |
| D7 retention | ~15% | 25% |
| Trial → paid conversion | ~6% | 10% |

The retention lifts come mainly from (a) the bundle choice making users feel agency over notifications (so they keep permission ON), (b) the wake-anchor push being the first thing they see on D1, and (c) the pre-filled chat question producing a real first-action.

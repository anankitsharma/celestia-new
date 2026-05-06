# Manual Work — Index

Everything that needs to be done outside of code. The codebase is ready to ship once these manual steps complete.

This directory is the operational checklist for the human (or non-coding work). Pick any doc and execute — each is self-contained.

---

## Reading order

| # | Doc | What it covers | Time | Priority |
|---|---|---|:-:|:-:|
| 01 | [App Store Connect](01-app-store-connect.md) | ASC categories fix, screenshots, description copy | 2-4h | **P0 — blocks resubmit** |
| 02 | [QA + ship](02-qa-and-ship.md) | Smoke test matrix, TestFlight, production rollout | 4-6h | **P0 — blocks ship** |
| 03 | [PostHog setup](03-posthog-setup.md) | 5 funnel dashboards, baseline annotation, 6 feature flags | 1-2h | **P1 — required for measurement** |
| 04 | [Dependency install](04-dependency-install.md) | `npx expo install expo-store-review` + auto-wire | 5min | P1 |
| 05 | [Backend + external](05-backend-and-external.md) | Tribe layer, email provider, RevenueCat trial extension, press kit | weeks | **P2 — Sprint 4** |
| 06 | [Data-dependent (defer)](06-data-dependent.md) | Onboarding step compression, content refresh | post-measurement | **P3 — defer** |

---

## P0 — Must do before next ship

1. **#89** Fix ASC categories — remove Entertainment (blocker for 4.3(b) resubmit)
2. **#107** Run QA matrix on iOS + Android
3. **#108** Ship to TestFlight + production

**Estimated total: ~half a day.**

---

## P1 — Should do same week as ship

1. **#110-#114** Wire 5 PostHog funnel dashboards
2. **#115** Add Sprint 1 baseline annotation in PostHog
3. **#116** Final App Store screenshot set
4. **#117** App Store description / subtitle copy refresh
5. **#109** `npx expo install expo-store-review` then notify me to auto-wire the 5-line review prompt

**Estimated total: 2-4 hours.**

---

## P2 — Sprint 4 (4-6 weeks of backend/external work)

Substantial work that unlocks the long-tail retention gains:

1. **#133-#134** Tribe layer (anonymous community insights backend + frontend integration)
2. **#135** Friend / Circle social proof
3. **#103** RevenueCat trial-extension flow (for "+3 days free" save offer)
4. **#136-#138** Email provider procurement + dunning + win-back sequences
5. **#141** Press kit / website teaser landing

---

## P3 — Defer until measured

1. **#130** Onboarding step compression — needs F1 funnel data first
2. **#142** Quarterly content refresh — needs briefing-mode engagement data

---

## What's already done (for reference)

**32 code tasks shipped across Sprint 1 + Sprint 3 scaffolds:**

- All adaptive trial mechanics (timing, copy, asymmetry visibility)
- Loss-frame trial-end push (highest single-ROI edit)
- Goal-echo + streak elevation + D-1 trial summary + D5 loss-frame surface
- Unity copy on Welcome to Pro + Paywall
- Methodology footer + NASA JPL tagline + astrologer byline
- `app_opened` source attribution + permission re-asks at D14/D30
- 6 feature-flag-gated A/B + social proof scaffolds
- Cosmic-identity share + reveal-statement share + core-question teaser
- WelcomeBack screen (deep-link ready) + YearInReview screen (renewal trigger)

See `13-implementation-plan.md` and `14-full-lifecycle-implementation-plan.md` for the strategic context.

---

## How this directory is structured

Each doc follows the same shape:

```
# Section name

## Why this matters
(business / strategic context — when in doubt, read this)

## What to do
(step-by-step instructions)

## Acceptance criteria
(how you know you're done)

## Notes / gotchas
(edge cases, pitfalls)
```

If a step needs me to do something coding-side (e.g., wiring after a dep is installed), the doc explicitly says so.

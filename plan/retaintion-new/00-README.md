# Celestia Retention Plan

A unified D7 / D30 retention strategy for Celestia, built by running three skills in sync against the current codebase:

- **`improve-retention`** (BJ Fogg / B=MAP — Behavior = Motivation × Ability × Prompt)
- **`hooked-ux`** (Nir Eyal — Trigger → Action → Variable Reward → Investment)
- **`marketing-skills:churn-prevention`** (cancel flows, save offers, dunning)

## Headline diagnosis

Celestia has **excellent engagement scaffolding** (streaks, XP, 20 badges, AI-personalized daily briefings, 7-stage lapse-notification cascade, journals + partners + chats as sticky data). The retention loop is *designed*. What's broken is that the **measurement layer and monetization layer are both stubbed**, so we can neither see retention curves nor prevent churn at the paywall.

The single highest-leverage move before any new feature ships: **re-enable PostHog and define D1 / D7 / D30 cohorts**. Without that, every other change here is shipped blind.

## Scoring against each framework (0–10)

| Framework | Current | Target | Biggest gap |
|---|---|---|---|
| **B=MAP** | 5/10 | 9/10 | Prompts are time-based and generic; no event-based or anchor-based prompts. Ability chain has hidden bottlenecks at D1 (re-open with no save-point). |
| **Hook Model** | 6/10 | 9/10 | Strong external triggers (push), strong investment (charts/journals/partners), but **internal trigger is undefined** — what emotion does Celestia uniquely resolve? Variable reward is finite (forecasts feel similar by week 3). |
| **Churn prevention** | 1/10 | 8/10 | No cancel flow, no exit survey, no save offer, no dunning, no health score. Paywall itself is stubbed (`isPro: true` hardcoded). |

## What's in this folder

| File | Purpose |
|---|---|
| `00-README.md` | This index + executive summary |
| `01-audit-current-state.md` | What exists today, with file refs and gap flags |
| `02-bmap-diagnostic.md` | B=MAP scored per retention checkpoint (D0 → D30); weakest-link analysis |
| `03-hook-model-loops.md` | Current loop mapped to the 4 phases; internal trigger thesis; redesigned loop |
| `04-churn-prevention.md` | Voluntary (cancel flow, save offers) + involuntary (dunning) playbook for when monetization re-enables |
| `05-7day-playbook.md` | Day-by-day interventions for D0–D7 (the activation window) |
| `06-30day-playbook.md` | Week 2–4 plan for habit consolidation |
| `07-implementation-roadmap.md` | Prioritized sprint plan with file:line refs |

## How the three skills relate

```
                  ┌────────── B=MAP ──────────┐
                  │ Diagnoses why behavior     │
                  │ fails at each checkpoint.  │
                  │ "Is the user above the     │
                  │  Action Line right now?"   │
                  └────────────┬──────────────┘
                               │
                               ▼
              ┌─── Hook Model ──────────────────┐
              │ Designs the loop that fires     │
              │ behavior repeatedly until it    │
              │ becomes habitual. Maps internal │
              │ triggers to product surfaces.   │
              └────────────┬───────────────────┘
                           │
                           ▼
        ┌─── Churn Prevention ──────────────────┐
        │ Catches users who slip out of the     │
        │ loop. Save offers, cancel flow,       │
        │ dunning, win-back.                    │
        └────────────────────────────────────────┘
```

Use B=MAP to **diagnose** drop-off, Hook to **design** the loop, and Churn Prevention to **defend** the paid base once monetization is live.

## North-star metrics this plan optimizes for

| Metric | Why it matters | Definition |
|---|---|---|
| **D1 return** | Validates onboarding aha + first-day prompt | % of installers who open app on calendar day 1 |
| **D7 return** | Habit-formation leading indicator | % of installers who open ≥1 day in days 2–7 |
| **D30 retention** | True habit + monetization base | % of installers active in days 23–30 |
| **Activation rate** | Hook completion ratio | % who: (a) finish onboarding, (b) read 1 forecast, (c) send 1 chat in their first session |
| **Streak ≥7 rate** | Habit-zone proxy | % of D7-returners who hit a 7-day streak |
| **Save rate** | Churn defense (post-paywall) | % of cancel-clickers who keep subscription |
| **Involuntary churn rate** | Dunning effectiveness | Failed payments / total billing attempts after retries |

## Reading order for first-time readers

1. `01-audit-current-state.md` — orient on what's already built
2. `02-bmap-diagnostic.md` — see where the funnel actually breaks
3. `03-hook-model-loops.md` — understand the loop we're trying to wire
4. `05-7day-playbook.md` and `06-30day-playbook.md` — what to actually ship
5. `07-implementation-roadmap.md` — sprint sequencing
6. `04-churn-prevention.md` — read once monetization is back online

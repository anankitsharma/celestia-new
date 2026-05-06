# Improve Subscriber Retention — Plan

**Diagnosis:** People convert to Pro but don't retain. The previous retention sprint (`plan/retaintion-new/`) shipped 45 features for *all users* — but the **paid user experience is identical to the free user experience** (modulo gates unlocking). Subscribers pay for "Your Soul's Fullest Expression" and get the same daily horoscope they got yesterday, no trial-end reminder, no feature tour, no Pro-specific content.

This plan fixes that.

## The single sentence

**Subscription is treated as a gate-unlocking event, not a behavioral commitment.** No code branch reacts to the moment of purchase beyond a native Alert that says "Welcome!".

## Estimated impact (rough)

If monthly subscriber churn is ~15%:

| Source | % of subscriber churn | Addressable by this plan |
|---|---|---|
| Trial-end auto-charge surprise | 35–45% | ✅ Tier 1A |
| "Didn't use the new things I paid for" | 20–25% | ✅ Tier 1B + 1C |
| "Forgot what I subscribed to / no value moment" | 15–20% | ✅ Tier 1B + Tier 2D |
| Genuine wrong-fit | 10–15% | ✅ Existing cancel flow (P3.1) |
| Card / app issues | 5–10% | ✅ Existing dunning (P3.2 templates ready) |

**Tier 1 alone targets ~70–85% of subscriber churn.** Tier 2 deepens the fix; Tier 3 is defensive measurement.

## Plan documents

| File | Purpose |
|---|---|
| `00-README.md` | This index + diagnosis |
| `01-tier-1-trial-end-reminder.md` | **Fix A** — push 2 days before trial charge |
| `02-tier-1-welcome-to-pro.md` | **Fix B** — Welcome to Pro screen replacing native Alert |
| `03-tier-1-feature-discovery.md` | **Fix C** — Day 3 + Day 7 Pro-feature-discovery pushes |
| `04-tier-2-fixes.md` | **Fixes D / E / F** — Pro daily layer, trial-cancel variants, Pro week-1 recap |
| `05-tier-3-defensive.md` | **Fixes G / H** — PostHog dashboards + refund analysis |
| `06-implementation-roadmap.md` | Sequencing, file references, acceptance criteria |

## Scoring against the three frameworks

The previous sprint scored 9/10 across B=MAP / Hook / Churn for **engagement retention.** For **paid retention** specifically:

| Framework | Current | Target |
|---|---|---|
| **B=MAP** for paid users | 4/10 — no Pro-specific prompts; ability is fine but motivation isn't reinforced | 9/10 |
| **Hook Model** for paid users | 5/10 — Triggers are generic; Variable Reward doesn't escalate for paid; Investment is invisible | 9/10 |
| **Churn Prevention** for paid users | 6/10 — cancel flow good, but no first-week paid-engagement campaign, no trial-end alert | 9/10 |

## What this plan does NOT cover

- **Pricing tier optimization** — needs `pricing-strategy` skill once you have D7-paid retention data
- **Refund analysis** — manual App Store Connect work, scoped in Tier 3H
- **Email-side win-back** — already templated in `plan/retaintion-new/email-templates/`; needs email provider
- **App Store Review responses** — separate from in-app retention; use `app-store` skill

## Reading order

1. `00-README.md` (this file)
2. `01-tier-1-trial-end-reminder.md` — start here for the highest-leverage fix
3. `02-tier-1-welcome-to-pro.md`
4. `03-tier-1-feature-discovery.md`
5. `06-implementation-roadmap.md`
6. `04-tier-2-fixes.md` (after Tier 1 ships and is measured)
7. `05-tier-3-defensive.md`

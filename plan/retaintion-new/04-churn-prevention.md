# 04 — Churn Prevention

Applies once monetization re-enables (`RevenueCatContext.js` is currently stubbed at `isPro: true`). This doc is the playbook for the day Pro launches and onward.

> Voluntary churn is typically 50–70% of total churn. Involuntary (failed payments) is 30–50% but often the **easiest to fix.**

Current Celestia state: **0/10** on churn prevention — no cancel flow, no exit survey, no save offer, no dunning, no health score, no win-back.

---

## Pre-condition: monetization architecture

Before any of this is relevant, restore:

1. **`RevenueCatContext.js`** — un-stub `useRevenueCat()` so `isPro` reflects real entitlement.
2. **Paywall screens** — at minimum: free-trial start, plan picker, post-purchase confirmation.
3. **Entitlement gates** — apply to: chat (limit 10/day → unlimited), advanced reports, Circle deep reports, voice, level unlocks already defined in `levels.js` (yesterday/tomorrow tabs at L3 etc.).
4. **`analytics.js`** — un-stub. Without events, none of this is measurable.

---

## Voluntary churn: cancel flow

### Structure

```
Trigger: tap "Cancel subscription"
   ↓
Step 1: Exit survey  (single-select reason)
   ↓
Step 2: Dynamic save offer  (matched to reason)
   ↓
Step 3: Confirmation  (clear end-of-billing-period messaging)
   ↓
Step 4: Post-cancel  (easy reactivation + win-back trigger)
```

### Step 1 — Exit survey

One question, single-select, free-text optional. Order by frequency (review quarterly).

```
What's the main reason you're cancelling?

  ○ Too expensive
  ○ Not using it enough
  ○ Missing a feature I need
  ○ The insights felt too generic
  ○ Privacy concerns
  ○ Just don't need it right now
  ○ Switching to another app
  ○ Other: [____________]
```

**Celestia-specific reason "The insights felt too generic"** — added because the V1 language override removed astrology vocabulary, and some users will read that as shallow. Track this reason carefully; if it dominates, the framing strategy needs revisiting.

Do NOT use guilt-trip framing ("are you sure you want to abandon us?"). Tone: empathetic, brief.

### Step 2 — Save offer matrix

| Cancel reason | Primary offer | Fallback |
|---|---|---|
| Too expensive | 30% off for 3 months (specific dollar amount shown) | Downgrade to "Lite" plan if/when offered |
| Not using it enough | Pause for 1, 2, or 3 months — chart, journals, partners preserved | Free 1-on-1 onboarding session (founder/CS for top 20% MRR only) |
| Missing a feature | Roadmap preview with timeline + email me when shipped | 30% off for 2 months while it ships |
| Insights felt too generic | Re-trigger personalized chart deep-dive ("we'll create a custom 12-page report just for your chart") | 50% off 1 month to give it another try |
| Privacy concerns | Show data export + delete-everything path; explain encryption | (no save offer — respect the concern) |
| Don't need it right now | Pause 3 months | (no further) |
| Switching to another app | "What would Celestia need to do to bring you back?" → free-text + 25% off | (none) |
| Other | Generic 25% off 2 months | (none) |

**Discount discipline:**
- 20–30% is the sweet spot. **Never go above 50%** — trains cancel-and-return for deals.
- Show dollar amount, not just %.
- Time-limit: "This offer expires when you leave this page."

### Step 3 — Confirmation

After they decline the offer:

```
Your subscription will end on [date].
Until then you keep full access.

You'll keep your data forever — chart, journals,
partners, badges. Sign back in any time and pick
up where you left off.

[Confirm cancellation]   [Keep my subscription]
```

Critical: do NOT delete data on cancel. Sticky data is the win-back asset.

### Step 4 — Post-cancel

- Confirmation email + in-app banner.
- Tag user as `churned_<reason>` in analytics.
- Trigger win-back email sequence (see below).
- Set reactivation deep link: opens the app to "Welcome back" screen with one-tap reactivation.

### Reactivation incentive

Day-30 post-cancel email: "Your chart is still here. Reactivate for 50% off your first month."
Day-60: "We just shipped [thing the user wanted]." (Only if their reason matched.)
Day-90+: stop emailing.

### UX principles

- The "continue cancelling" option must always be visible (no dark patterns; FTC click-to-cancel rule).
- One primary offer + one fallback per step. Not a wall of options.
- Mobile-first — most cancellations happen on phone.
- Personalize: use first name, show their actual data ("you've made 47 journal entries — those stay yours").

---

## Involuntary churn: dunning

The cheapest retention work in software. Failed-payment recovery has known industry benchmarks; getting this right captures 30–50% of would-be churners with no UX cost.

### Pre-dunning (prevent failures before they happen)

| Mechanism | When | Channel |
|---|---|---|
| Card-expiry warning | 30 / 15 / 7 days before card expires | Email + in-app banner |
| Pre-billing notice | 5 days before annual renewal | Email |
| Card updater (Visa/MC Account Updater) | Always-on | Backend |
| Backup payment method prompt | At signup + on first failure | In-app |

RevenueCat's underlying providers (Apple / Google) handle some of this natively for IAP — confirm what's auto vs. manual when re-enabling.

### Smart retry logic

For non-IAP fallback (web purchases, family sharing, etc.):

| Decline type | Examples | Strategy |
|---|---|---|
| Soft (temporary) | Insufficient funds, processor timeout | Retry: 24h, 3d, 5d, 7d |
| Hard (permanent) | Card stolen, account closed | Don't retry — request new card |
| Authentication needed | 3DS / SCA | Send to update payment |

Retry on the same day-of-month the original charge succeeded (Stripe Smart Retries does this automatically; mirror the logic if rolling your own).

### Dunning email sequence

| # | Day | Tone | Content |
|---|---|---|---|
| 1 | 0 | Friendly alert | "Your payment didn't go through. Update your card here." |
| 2 | +3 | Helpful reminder | "Quick reminder — update payment to keep access." |
| 3 | +7 | Urgency | "Your account will be paused in 3 days." |
| 4 | +10 | Final | "Last chance to keep your subscription. After today you'll lose access (your data stays)." |

Design rules:
- Direct deep-link to payment update (no login if possible).
- Plain text outperforms HTML for dunning.
- Don't blame: "your payment didn't go through" not "you failed to pay."
- Show what they keep ("your data is safe") and what they lose access to ("daily briefing, chats, reports").

### Recovery benchmarks

| Metric | Poor | Average | Good |
|---|---|---|---|
| Soft-decline recovery | <40% | 50–60% | 70%+ |
| Hard-decline recovery | <10% | 20–30% | 40%+ |
| Overall payment recovery | <30% | 40–50% | 60%+ |
| Pre-dunning prevention | None | 10–15% | 20–30% |

---

## Proactive retention (before they ever click cancel)

The best save happens *before* the cancel button. Build a simple health score and intervene early.

### Health score (0–100)

```
Health = (login_freq × 0.30) +
        (feature_usage × 0.25) +
        (support_sentiment × 0.15) +
        (billing_health × 0.15) +
        (engagement_score × 0.15)
```

For Celestia:
- **login_freq** = days active in last 14 / 14
- **feature_usage** = chats sent + reports read + journals + Circle entries (last 14d), normalized
- **support_sentiment** = inverse of support-ticket count, positive feedback weight
- **billing_health** = card valid, no recent failures
- **engagement_score** = streak length / 30, capped

| Score | Status | Action |
|---|---|---|
| 80–100 | Healthy | Upsell opportunities (annual, plan upgrade) |
| 60–79 | Needs attention | Proactive check-in: "Anything we can help with?" |
| 40–59 | At risk | Intervention campaign: feature reintro, content unlock |
| 0–39 | Critical | Personal outreach (top 20% MRR), or save-offer push |

### Risk-signal triggers

| Signal | Risk | Window | Intervention |
|---|---|---|---|
| App opens drop ≥50% over 14d | High | 2–4w pre-cancel | "We noticed you haven't been around — here's what's new for you" |
| Streak broken after 14+ days | High | Days | Streak-restore offer ("use your freeze + 24h grace") |
| Approaching free-tier limit (chat) | High | Days | Upgrade nudge (handle in `paywall-upgrade-cro` separately) |
| No journal in 21 days | Medium | Weeks | Re-introduce journal with simplified one-tap entry |
| Billing page visit | Critical | Hours/days | Suppress further upsell; show value recap proactively |
| Data export initiated | Critical | Days | Personal email from founder |

---

## Cohort analysis (segmentation)

Slice churn by:
- **Acquisition channel** — organic vs paid vs referral retain differently
- **Plan type** — monthly vs annual, basic vs pro
- **Tenure** — when do most cancellations happen? (Industry: 30/60/90-day cliffs)
- **Cancel reason** — which reasons grow over time?
- **Cohort by signup month** — track D30/D60/D90 retention

This is impossible without analytics — see `07-implementation-roadmap.md` P0.

---

## Cancel-flow A/B tests (post-launch)

Test one variable at a time. Use PostHog feature flags (already wired in `App.js` as `PostHogProvider`).

| Test | Hypothesis | Metric |
|---|---|---|
| Discount 20% vs 30% for 3 months | Higher discount saves more, but LTV after offer matters | Save rate + 6-month LTV of saved cohort |
| Pause 1 vs 3 months | Longer pause = higher reactivation? | Reactivation rate at pause-end |
| Survey-first vs offer-first | Survey-first lets us personalize | Save rate |
| Modal vs full-page cancel flow | Full-page gets more attention | Save rate |
| Empathetic vs direct copy | Empathetic reduces friction | Save rate |
| Show data-volume reminder ("47 journals you'd keep") vs not | IKEA-effect surfacing increases save rate | Save rate |

---

## Tooling recommendation

For a single-founder/small-team build like Celestia, the highest-ROI options:

| Layer | Recommended | Why |
|---|---|---|
| Cancel flow | **Build in-app** (vs Churnkey/ProsperStack) | iOS IAP requires native cancel anyway; web cancel can use Churnkey if web purchase ships |
| Dunning (IAP) | RevenueCat + Apple/Google native | Built-in for subscriptions |
| Win-back email | Customer.io or Resend + simple sequence | Lightweight, code-driven |
| Analytics | **PostHog** (already wired) | Feature flags + funnels + cohorts in one |
| Health score | PostHog SQL or Metabase on top of PostHog data | Simple weighted sum |

---

## Targets (12 months post-paywall launch)

| Metric | Target |
|---|---|
| Monthly voluntary churn | < 5% (B2C SaaS benchmark) |
| Cancel-flow save rate | 25–35% |
| Save-offer acceptance | 15–25% |
| Pause reactivation | 60–80% |
| Dunning recovery (overall) | 50%+ |
| % of churn that is involuntary | < 30% (the rest is voluntary, attacked by save flow) |
| Win-back at 30 days | 5–10% |

---

## What to ship first (in priority order)

1. **Re-enable analytics** — without events, churn cannot be measured (P0; see `07`).
2. **Re-enable RevenueCat** — entitlement gating must actually work.
3. **Cancel flow with exit survey** — even with one offer, captures 10–15%.
4. **Dunning email sequence (4 emails)** — compounds with smart retries.
5. **Health score job + at-risk dashboard** — proactive interventions.
6. **Win-back email at D30 / D60 post-cancel** — reactivates a slice.

A/B testing comes after all of the above are in place.

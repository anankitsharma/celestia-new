# Tier 3 — Defensive measurement

These don't move retention themselves. They make the impact of Tier 1 + Tier 2 *measurable*. Ship in parallel with Tier 1; mostly admin work.

## Fix G — Trial-conversion funnel in PostHog

### Why
You have all the events firing (`PURCHASE_COMPLETED`, `PUSH_OPENED`, `CANCEL_FLOW_STARTED`, etc.) but no funnel built in PostHog admin to actually see conversion through the trial.

### What
Build this funnel in posthog.com:

```
Step 1: trial_started      (proxy: PURCHASE_COMPLETED with no prior PURCHASE_COMPLETED ever)
Step 2: trial_day_3_active (any app_opened on day 3 post-purchase)
Step 3: trial_day_5_active (any app_opened on day 5 post-purchase)
Step 4: trial_converted    (PURCHASE_COMPLETED day 7+ — i.e. didn't cancel)
Step 5: still_paid_d30     (still has Pro entitlement on day 30)
Step 6: still_paid_d60     (day 60)
Step 7: still_paid_d90     (day 90)
```

Sliced by:
- Acquisition source (organic vs. paid)
- Trial length variant (if you A/B test)
- Welcome-to-Pro card tapped (which one)

### Effort
~1-2 hours of clicking around posthog.com. No code.

### Where to do it
posthog.com → Project → Insights → New Funnel.

---

## Fix H — App Store refund analysis (manual monthly review)

### Why
Refunds are the worst kind of churn — negative LTV (you lose the App Store fee on top of the refund). They're also a strong signal for "user felt scammed" which suggests trust gaps.

App Store Connect provides refund reason codes from Apple. PostHog has no visibility into these.

### What
Once a month:
1. Log into App Store Connect → Sales and Trends → Refunds
2. Export refund report; sort by reason code
3. Cross-reference user_id (via the original transaction ID → RevenueCat → your PostHog user_id) to see what the refunded users did before refunding
4. Categorize: trial-end-surprise vs. genuine wrong-fit vs. technical issues vs. abuse

If "trial-end-surprise" dominates, Tier 1A (trial-end push) is the fix. If "genuine wrong-fit," PaywallScreen messaging needs honesty work.

### Effort
~1-2 hours per month. No code; pure analysis.

### Decision points it informs
- Should the trial be longer? (If "didn't have time" dominates)
- Should PaywallScreen tone down the mystical promises? (If "felt misled" dominates)
- Should we add a "are you sure?" step in the App Store cancel flow? (If "accidentally subscribed" appears)

---

## Tier 3 acceptance criteria

- [ ] Trial funnel exists in PostHog with all 7 steps
- [ ] Funnel can be filtered by Welcome-to-Pro card tap and by Tier 1 push opens
- [ ] Refund analysis happens at least monthly; insights logged to a doc

## Tier 3 cadence

- **G** is one-time setup
- **H** is recurring monthly

Neither requires further code in the app.

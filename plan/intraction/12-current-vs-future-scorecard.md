# Current vs Future Scorecard

The single source-of-truth scoring doc. Pulls from `07` (Cialdini principles), `09` (implementation status), `10` (tiered trial strategy), and `11` (retention + trial-conversion analysis).

Three states scored:
- **NOW** — today, as-shipped
- **AFTER TIER 1** — after the ~1.5 day dev work in `11-retention-and-trial-conversion-analysis.md` Top 5 + `10-tiered-trial-strategy.md` C1-C8
- **AFTER ALL FIXES** — including PostHog-data-dependent Tier 2 + backend-blocked items (tribe, email dunning)

---

## Section 1 — Daily retention loop (Hook Model + SDT)

| Element | NOW | After Tier 1 | After All | Notes |
|---|:-:|:-:|:-:|---|
| Same-time-daily trigger (push) | 9 | 9 | 9 | Already strong. Permission-rate is the gating factor. |
| ≤60-second core action | 8 | 9 | 9 | Tier 1 elevates streak to header → faster perceived action. |
| Variable reward (briefing rotation + surprise + hidden badges) | 8 | 8 | 9 | Strong already. Tribe layer adds tribe-rewards (later). |
| Streak / commitment device | 7 | 9 | 9 | Tier 1 elevates streak surface depth (Duolingo-pattern). |
| Investment compound (journal + Circle + chart + XP + badges) | 9 | 9 | 9 | Best-in-category. Already maxed. |
| Tribe / relatedness | 0 | 0 | 7 | Backend-blocked. Sprint C anonymous community insights. |
| Internal-trigger graduation (organic open vs push-launched) | 4 | 7 | 8 | Tier 1 adds `app_opened` source attribution → measurable. |
| Permission-grant rate (gates everything) | 6 | 8 | 8 | Tier 1 adds D14 + D30 re-asks (FINAL-5 cap=2 → 4). |
| **Subtotal (out of 80)** | **51** | **59** | **68** | |
| **% of max** | **64%** | **74%** | **85%** | |

**Interpretation:** retention loop is the strongest area today. Tier 1 brings it from "good" to "very good." Reaching "world-class" requires the tribe layer (backend-blocked).

---

## Section 2 — Trial-end conversion (Cialdini 7 principles)

| Principle | NOW | After Tier 1 | After All | What changes |
|---|:-:|:-:|:-:|---|
| Reciprocity | 8 | 8 | 9 | Welcome to Pro + Pro daily insight already strong. |
| Commitment | 7 | 9 | 9 | Tier 1 adds goal-echo on Today + elevates streak as commitment-anchor. |
| Social Proof | 0 | 2 | 8 | Real PostHog cohort data needed for full activation; Tier 1 adds non-numeric framing only. |
| Authority | 5 | 7 | 8 | Tier 1 adds methodology footer on reports. Tier 3 adds explicit cues. |
| Liking | 9 | 9 | 10 | Already best-in-category. Tier 3 minor improvements. |
| Scarcity | 7 | 9 | 9 | Tier 1 fixes 3-day adaptive timing + adds D-1 trial summary surface. |
| Unity | 3 | 6 | 8 | Tier 1 adds tribe-naming line on Welcome to Pro + PaywallScreen. Sprint C completes. |
| **Subtotal (out of 70)** | **39** | **50** | **61** | |
| **% of max** | **56%** | **71%** | **87%** | |

**Interpretation:** trial-conversion is where Tier 1 produces the biggest move. Social Proof is the dominant ceiling — and it's only fully unlockable after PostHog cohort data accumulates (need ~30-60 days post-events shipping).

---

## Section 3 — Trial-end execution mechanics

| Element | NOW | After Tier 1 | After All | What changes |
|---|:-:|:-:|:-:|---|
| 7-day trial reminder timing | 9 | 9 | 9 | Already correct. |
| 3-day trial reminder timing | 3 | 9 | 9 | Tier 1 fixes adaptive Sub-2 timing (C6). |
| Pro discovery push timing (7-day) | 9 | 9 | 9 | Already correct. |
| Pro discovery push timing (3-day) | 1 | 9 | 9 | Tier 1 fixes (C7). Currently fires AT charge moment. |
| Reminder copy specificity (numbers) | 9 | 9 | 9 | Already strong (FINAL-3 voice). |
| Loss-frame copy ("what you'd lose") | 4 | 9 | 9 | **Highest single-ROI fix.** Tier 1 #1 action. |
| Permissive / non-coercive tone | 9 | 9 | 9 | Voice guide enforced. |
| Cancel flow + save offers | 8 | 9 | 9 | Already sophisticated. Tier 1 adds "+3 days free" extension save offer (when RevenueCat supports). |
| Welcome to Pro post-charge | 9 | 10 | 10 | Tier 1 adds plan-aware sub-line (3-day vs 7-day). |
| PaywallScreen asymmetry visibility | 2 | 9 | 9 | Tier 1 makes 7-day-trial visible as annual reward (C1-C3). |
| Peak-end (D-1 trial summary surface) | 0 | 8 | 9 | Tier 1 adds last-day in-app celebration. |
| Default = charge unless cancel | 10 | 10 | 10 | Industry-standard. |
| **Subtotal (out of 120)** | **73** | **109** | **110** | |
| **% of max** | **61%** | **91%** | **92%** | |

**Interpretation:** this is where Tier 1 delivers the biggest jump. Most mechanical issues are 1-edit fixes once timing helpers are written.

---

## Section 4 — Lapse + recovery

| Element | NOW | After Tier 1 | After All | What changes |
|---|:-:|:-:|:-:|---|
| Lapse cascade (D2/3/5/7/10/14/21) | 9 | 9 | 9 | Industry-leading. Personalization tiers active. |
| At-risk banner (health-score driven) | 9 | 9 | 9 | Already shipped. |
| Streak restore offer | 9 | 9 | 9 | Already shipped. |
| Permission re-ask | 7 | 9 | 9 | Tier 1 extends cap from 2 to allow D7 + D14 + D30. |
| Email dunning (D0/D3/D7/D10) | 0 | 0 | 8 | Templates exist; needs email provider. |
| Email win-back (D30/D60/D90) | 0 | 0 | 7 | Templates exist; needs email provider. |
| **Subtotal (out of 60)** | **34** | **36** | **51** | |
| **% of max** | **57%** | **60%** | **85%** | |

**Interpretation:** lapse-cascade is industry-leading; biggest gap is email-side, blocked on provider integration. In-app recovery is mostly maxed.

---

## Section 5 — Analytics + measurement

| Element | NOW | After Tier 1 | After All | What changes |
|---|:-:|:-:|:-:|---|
| Activation funnel events | 9 | 9 | 9 | 47 events shipped. |
| Subscription funnel events | 10 | 10 | 10 | Complete. |
| Cancel-flow events + A/B variants | 10 | 10 | 10 | Complete. |
| Health score + bands | 9 | 9 | 9 | Active super-properties. |
| `app_opened` source attribution | 0 | 8 | 8 | Tier 1 adds. |
| `briefing_mode_assigned` event | 0 | 0 | 7 | Tier 3. |
| `surprise_insight_shown` event | 0 | 0 | 7 | Tier 3. |
| PostHog dashboards wired | 0 | 0 | 9 | External work. |
| **Subtotal (out of 80)** | **38** | **46** | **69** | |
| **% of max** | **48%** | **58%** | **86%** | |

**Interpretation:** events are mostly shipped; dashboards aren't. Without dashboards, the events are useful for ad-hoc analysis but don't drive ongoing decisions.

---

## Section 6 — Brand / voice / craft

| Element | NOW | After Tier 1 | After All | What changes |
|---|:-:|:-:|:-:|---|
| Voice consistency across pushes | 10 | 10 | 10 | CA-B1b enforced. |
| Personalization depth | 10 | 10 | 10 | Best-in-category. |
| Editorial typography (Playfair + DM Sans) | 9 | 9 | 9 | Already excellent. |
| Reveal-statement quality | 10 | 10 | 10 | Best content asset in the app. |
| Hero header consistency | 9 | 9 | 9 | Token system enforces. |
| Loading + empty + error states | 8 | 8 | 9 | Skeleton, EmptyState shipped. Long-tail copy still rotates. |
| **Subtotal (out of 60)** | **56** | **56** | **57** | |
| **% of max** | **93%** | **93%** | **95%** | |

**Interpretation:** brand is already at world-class. Almost no upside left; this isn't where to invest.

---

## Composite scorecard

| Domain | NOW | After Tier 1 | After All | Max |
|---|:-:|:-:|:-:|:-:|
| Daily retention loop | 51 | 59 | 68 | 80 |
| Trial-end principles | 39 | 50 | 61 | 70 |
| Trial-end execution | 73 | 109 | 110 | 120 |
| Lapse + recovery | 34 | 36 | 51 | 60 |
| Analytics | 38 | 46 | 69 | 80 |
| Brand / voice | 56 | 56 | 57 | 60 |
| **Total** | **291** | **356** | **416** | **470** |
| **% of max** | **62%** | **76%** | **89%** | |
| **Letter grade** | **C+** | **B+** | **A-** | |

---

## Estimated business impact

These are directional estimates based on industry benchmarks for the Inner-Work Practitioner audience. Actual lift requires PostHog measurement.

### Trial → paid conversion

| Plan | NOW (estimated) | After Tier 1 | After All |
|---|:-:|:-:|:-:|
| Annual (7-day trial) | 50-58% | 58-65% | 62-70% |
| Monthly (3-day trial) | 25-35% | 35-42% | 38-45% |

**Drivers of Tier 1 lift on annual conversion:**
- Loss-frame trial-end copy: +3-5%
- Peak-end D-1 trial summary: +2-3%
- Streak surface elevation: +1-2%
- PaywallScreen asymmetry visibility: +1-2% (conversion within trial-starts)

**Drivers of Tier 1 lift on monthly conversion:**
- Adaptive trial-end push timing: +5-8% (currently many users miss the reminder window entirely)
- Adaptive Pro discovery push at D1: +2-3%
- Loss-frame copy: +2-3%

### Plan-mix shift

| Metric | NOW (estimated) | After Tier 1 |
|---|:-:|:-:|
| Annual share of trial starts | 30-40% | 50-60% |
| Blended ARPU lift | baseline | +15-25% |

The plan-mix shift comes mostly from PaywallScreen asymmetry visibility (C1-C3) — making the 7-day trial visible as an annual benefit.

### D7 / D30 / D60 retention (paid users)

| Cohort metric | NOW | After Tier 1 | After All |
|---|:-:|:-:|:-:|
| Paid D7 → D30 retention | 60-70% | 65-75% | 70-80% |
| Paid D30 → D60 retention | 50-60% | 55-65% | 65-75% |
| Paid D60 → D180 retention | 30-40% | 35-45% | 50-60% (with tribe) |

**Drivers:**
- Tier 1 streak surface elevation increases daily-loop adherence
- D-1 trial summary builds positive peak-end memory → lower D30 cancel
- Tribe layer (After All only) is the lever for D60+ retention — this is where Self-Determination Theory's relatedness pays off

### Cancel-flow save rate

| Metric | NOW | After Tier 1 | After All |
|---|:-:|:-:|:-:|
| Save rate (% of cancel-flow starters who don't cancel) | 15-25% | 25-30% | 30-38% |

**Drivers:**
- Tier 1 adds "+3 days free" extension save offer
- After All adds social proof copy in save offers

---

## What stays unchanged

These items are already maxed and won't move with any of the planned work:

- **Brand voice** (10/10)
- **Personalization depth** (10/10)
- **Reveal-statement quality** (10/10)
- **Lapse cascade copy + tiers** (9/10)
- **Subscription event instrumentation** (10/10)

---

## What's blocked

These don't move with Tier 1 dev work alone:

| Item | Blocker | Estimated unlock impact |
|---|---|---|
| Tribe / community layer | Backend (Sprint C) | +7 points on retention loop; +20-30% D60 retention long-term |
| Email dunning (D0/D3/D7/D10) | Email provider | +8 points on lapse; ~4-6% recovery on failed payments |
| Email win-back (D30/60/90) | Email provider | +7 points; ~3-5% reactivation of churned users |
| Real-number social proof | PostHog cohort data accumulation (~30-60 days) | +6 points on Cialdini Social Proof; ~2-4% trial conversion |
| PostHog dashboards | External setup | +9 points on analytics; ongoing decision quality |

---

## The headline numbers

- **Composite score: C+ (62%) → B+ (76%) → A- (89%)** as Tier 1 → All-Fixes ship
- **Annual trial conversion: ~54% → ~62% → ~66%** (estimated)
- **Monthly trial conversion: ~30% → ~38% → ~42%** (estimated)
- **Blended ARPU lift: +15-25% from Tier 1 alone** (mostly via plan-mix shift, not conversion increases)
- **D60 paid retention: ~55% → ~60% → ~70%** (the long-tail upside is gated on the tribe layer)

**Tier 1 (~1.5 days dev) takes the app from C+ to B+. That's the highest-leverage 1.5 days of dev work currently available in the codebase.**

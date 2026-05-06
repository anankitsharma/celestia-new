# PostHog Setup — Manual Tasks

3 categories of work in PostHog: dashboards (5 funnels), feature flags (6), annotations.

Estimated total: 1-2 hours.

PostHog API key already wired in App.js: `phc_bPp0sgaFIhPbZaqU6613cEiy0sJbJd5C20Vk8TgN3Zd` (US instance).

---

## Part A — Funnel dashboards (5 funnels)

These are the measurement infrastructure that converts shipped code into measurable lift. Without these, every subsequent decision is shipped blind.

### Why this matters

47 events fire across the user journey (per `06-event-instrumentation.md`). Without funnel dashboards, those events are just noise. Funnels turn the noise into actionable cohort data — which step has the worst drop-off, which save offer wins, which trial cohort retains.

### Setup template (apply to each funnel)

For each funnel below:

1. PostHog → Insights → New Insight → Funnel
2. Add events in order
3. Set filters / breakdowns as specified
4. Set conversion window
5. Save with the F-number name (e.g., "F1 — Activation funnel")
6. Add to a new dashboard called "Celestia Retention"

---

### F1 — Activation funnel

**Task ID:** #110
**Conversion target:** ≥50% of installers reach `first_chat_message_sent` within 24h

```
Step 1: install (autocaptured)
Step 2: onboarding_started
Step 3: onboarding_completed
Step 4: chart_revealed
Step 5: post_chart_cta_tapped (filter: target='chat')
Step 6: first_chat_message_sent
```

**Conversion window:** 24 hours
**Breakdown:** sun_sign (optional, useful for cohort analysis)

**What to watch:** the worst single-step drop-off. If `onboarding_completed` → `chart_revealed` drops >15%, that signals a chart-calculation latency or display bug.

---

### F2 — Trial conversion funnel (the critical one)

**Task ID:** #111
**Conversion target:** annual ≥62% by D7. Monthly ≥38% by D3.

```
Step 1: purchase_completed (filter: trial_length_days IS SET)
Step 2: app_opened (within 24h of step 1)
Step 3: daily_briefing_viewed (within 24h of step 1)
Step 4: welcome_to_pro_card_tapped (within 24h of step 1)
Step 5: trial_ending_push_opened
Step 6: still_pro_at_D7 (custom — see notes)
```

**Breakdown:** `trial_length_days` (3 vs 7) — this is the entire point of the funnel
**Conversion window:** 14 days

**Custom event setup for `still_pro_at_D7`:**
- Property filter on user: `is_pro = true` AND `days_since_install >= 7`
- OR query backend webhook from RevenueCat (Sprint 4)

**A/B variant cohorts to set up later (Sprint 3 measurement):**
- Cohort: `frame_variant = 'loss'` vs `frame_variant = 'investment'`
- Cohort: users who saw `trial_summary_shown` vs not
- Cohort: users with `streak_in_header_during_trial` flag = true vs false

---

### F3 — Daily retention funnel (habit formation lead indicator)

**Task ID:** #112
**Conversion target:** 35%+ of D1 returners reach 7-day streak. 50%+ of streak-7 users still active at D30.

```
Step 1: app_opened (D0)
Step 2: app_opened (D1)
Step 3: daily_briefing_viewed (D1)
Step 4: app_opened (D7)
Step 5: streak_milestone_hit (filter: streak=7)
Step 6: app_opened (D30)
```

**Breakdown:** `launch_source` (push vs organic) — this is the internal-trigger graduation metric

**Internal-trigger ratio formula** (build as a custom insight):
- `(count(app_opened where launch_source='organic') / count(app_opened where launch_source IN ('organic', 'push'))) by week_cohort`
- Target: 40%+ organic by D14, 60%+ by D30 = healthy habit formation

---

### F4 — Cancel-flow save funnel

**Task ID:** #113
**Conversion target:** 25-30% save rate post-Sprint 1

```
Step 1: cancel_flow_started
Step 2: cancel_reason_selected
Step 3: cancel_save_offer_shown
Step 4: cancel_save_offer_accepted (vs cancel_confirmed)
```

**Breakdowns:**
- `reason` (which cancel reasons save best?)
- `variant` (control / data-loss / value-deepening)
- `is_trial` (trial-period cancellers vs paid cancellers)

**Cohort views:**
- Save rate by reason × variant heatmap
- Trial vs. paid save rate (expect trial save rate to be 2-3x lower)

---

### F5 — Pro feature discovery funnel

**Task ID:** #114
**Conversion target:** 60%+ of new Pros tap a Welcome-to-Pro hero card

```
Step 1: purchase_completed
Step 2: welcome_to_pro_shown
Step 3: welcome_to_pro_card_tapped
Step 4: pro_discovery_push_opened
Step 5: corresponding feature event (report_viewed / chart_deep_dive / partner_added_to_circle)
```

**Breakdowns:**
- `card` ('weekly_report' / 'circle' / 'chat') — which card converts best
- `trial_length_days` (3 vs 7 — adaptive Pro discovery push timing should normalize the cohorts)

**What to watch:** if `welcome_to_pro_card_tapped` < 60%, redesign the screen. If only the weekly_report card gets taps, rotate the order.

---

## Part B — Sprint 1 baseline annotation

**Task ID:** #115
**Estimated time:** 5 minutes

### Why this matters

Without a baseline annotation, distinguishing pre-Sprint-1 traffic from post-Sprint-1 traffic in PostHog requires guesswork. Annotations are PostHog's free-text marker on the timeline.

### What to do

1. Wait until the production ship is live (Task 02.2 step 6 complete)
2. PostHog → any dashboard or insight
3. Click the date range area → "Add annotation"
4. Date: ship timestamp (UTC)
5. Title: "Sprint 1+3 — Tier 1 fixes shipped"
6. Body:

```
Loss-frame trial-end push, adaptive 3-day trial timing, PaywallScreen
asymmetry visibility, D-1 trial summary surface, streak header
elevation, goal-echo on Today, D5 loss-frame surface, methodology
footer on reports, NASA JPL ephemeris tagline, app_opened source
attribution, permission re-asks at D14/D30, cosmic-identity share,
WelcomeBack screen (deep-link ready), YearInReview screen.

Expected lift: annual trial conversion ~54% → ~62%; monthly ~30%
→ ~38%; plan-mix shift toward annual; +15-25% blended ARPU.

A/B flags wired (default behavior preserved):
- trial_end_frame_variant ('loss' default vs 'investment')
- trial_summary_surface_enabled (true default)
- streak_in_header_during_trial (true default)
```

### Acceptance criteria

- [ ] Annotation added to PostHog timeline
- [ ] Annotation date matches ship timestamp
- [ ] All key changes listed in body

---

## Part C — Feature flags (6 flags)

These were wired in code during Sprint 3. Each is currently silent (default-off or default-Sprint-1-shipped behavior). Flip them on in PostHog with the documented payload format to activate.

### Why this matters

The code is already aware of these flags. As soon as you create + enable them in PostHog, the corresponding behavior activates without a code change. This is the "ship code now, decide later" pattern that lets measurement drive activation.

### Setup template (apply to each flag)

1. PostHog → Feature Flags → New Feature Flag
2. Key: as specified below (must match exactly)
3. Type: boolean OR multi-variate OR JSON payload (per flag)
4. Default: as specified
5. Roll-out: as specified
6. Save

---

### Flag 1 — `trial_end_social_proof`

**Activates:** Real-number social proof line on the trial-end push (#119)
**Default:** off (code reads null → no proof shown)
**Payload format:** JSON object `{ stat: '82' }` where stat is the integer percentage
**Example active value:** `{ stat: '82' }`

**When to activate:**
- After ≥1000 users in F3 D30 retention cohort
- Compute real number: % of users who reached 7-day streak who are still subscribed at month 3
- Only activate if rate ≥70% (otherwise the social proof would HURT conversion)
- **NEVER fabricate.** If cohort is too small, leave the flag off.

**Activated copy in trial-end push body:**
> "...After it ends: no daily Pro insight... 82% of members who built a 7-day streak still use Celestia at month 3. Cancel anytime — we won't surprise you."

---

### Flag 2 — `welcome_to_pro_social_proof`

**Activates:** Subtext below each Welcome to Pro hero card (#120)
**Default:** off (code reads null → no subtext shown)
**Payload format:** JSON object keyed by card_id
**Example active value:**
```json
{
  "weekly_report": "Most Pros generate their first weekly read in 24 hours.",
  "circle": "Most Pros add their first partner within week 1.",
  "chat": "Most Pros ask their first question within an hour."
}
```

**When to activate:**
- After ≥500 paid members with ≥30 days of usage
- Compute real numbers from F5 cohort:
  - For each card, % of new Pros who engage with that feature within 24h / 7 days
- Only activate if real values support the claim — phrase honestly

---

### Flag 3 — `cancel_save_social_proof`

**Activates:** Retention-rate stat card in cancel-flow save offer (#121)
**Default:** off (no card shown)
**Payload format:** JSON object `{ stat: '67', tenure: '14_day' }`
**Example active value:** `{ stat: '67' }`

**When to activate:**
- After ≥1000 paid members with ≥6 months of tenure
- Compute: % of members who used Pro for 14+ days who are still subscribed at month 6
- Only activate if rate ≥70%

**Activated card copy:**
> "Members who used Pro for 14+ days have a 67% retention rate at month 6."

---

### Flag 4 — `trial_end_frame_variant` (A/B test)

**Activates:** A/B test between loss-frame (Sprint 1 default) and investment-frame (control) trial-end push copy (#127)
**Default:** `'loss'` (Sprint 1 ship state)
**Type:** Multi-variate string
**Variants:**
- `loss` (50%) — current Sprint 1 copy with "no daily Pro insight, no weekly reports..."
- `investment` (50%) — control copy without loss frame ("Your chart stays yours either way.")

**When to activate:**
- Run for minimum 2 weeks
- Statistical significance threshold: 95%
- Cohort: users who receive a trial-end push in the test window
- Outcome metric: trial → paid conversion at D7 (annual) or D3 (monthly)

**What to do with results:**
- If `loss` wins: remove flag, hardcode loss-frame, archive variant
- If `investment` wins: revert code to investment-frame, archive variant
- If neutral: keep loss-frame (it's safer in case of voice-guide drift)

---

### Flag 5 — `trial_summary_surface_enabled` (A/B test)

**Activates:** D-1 trial summary surface on Today tab on last trial day (#128)
**Default:** `true` (Sprint 1 default — shows surface)
**Type:** Boolean
**Variants:** 50% true / 50% false

**When to activate:**
- Run for minimum 2 weeks
- Outcome metrics:
  - Trial → paid conversion (primary)
  - Post-purchase D7 cancellation rate (secondary — does the surface increase post-purchase satisfaction?)

**Hypothesis:** Surface increases positive memory of trial → both conversion AND lower D7 post-purchase cancel.

---

### Flag 6 — `streak_in_header_during_trial` (A/B test)

**Activates:** Elevated streak counter treatment in Today header during trial (#129)
**Default:** `true` (Sprint 1 default — elevated)
**Type:** Boolean
**Variants:** 50% true / 50% false (only applies to trial users)

**When to activate:**
- Run for minimum 2 weeks
- Cohort: users in active trial period
- Outcome metrics:
  - D1, D3, D7 return rate
  - Streak break rate within trial
  - Trial → paid conversion

**Hypothesis:** Header placement strengthens loss aversion → higher daily return → higher trial conversion.

**Stretch:** if winner, expand to all paid users D1-D30 (currently only trial).

---

## Final acceptance criteria

- [ ] All 5 funnels saved + added to "Celestia Retention" dashboard
- [ ] Sprint 1 baseline annotation added at ship timestamp
- [ ] All 6 feature flags created in PostHog (even if default-off)
- [ ] A/B variant flags configured at 50/50 split
- [ ] `welcome_to_pro_social_proof`, `trial_end_social_proof`, `cancel_save_social_proof` left off until cohort data is sufficient

### Notes / gotchas

- PostHog Free tier limits: 1M events/month — Celestia at scale should fit comfortably; if you exceed, upgrade to Scale tier
- Feature flag changes apply within ~30 seconds globally
- A/B variant assignment is sticky per user — once a user is in variant A, they stay in A for the duration of the test
- Don't run multiple A/B tests on the same surface simultaneously — one at a time per surface to avoid interaction effects
- Document each flag's start + end date in PostHog notes — easy to forget when a test ended

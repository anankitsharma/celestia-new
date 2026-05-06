# The Implementation Plan — Retention Magnet + Subscription Machine

This is THE plan. Synthesizes everything in `plan/intraction/` (docs 00-12) into a sequenced, day-by-day operational plan to take Celestia from a C+ retention experience (62% composite) to A- (89%).

**Core thesis:** the retention foundation is already built. What's missing is ~1.5-2 days of dev work that activates dormant levers + a measurement + iteration loop that converts measurement into compounding gains. The make-or-break isn't a moonshot rebuild — it's executing 16 small fixes in the right order and measuring the lift.

---

## Section 1 — The strategy on one page

### Three levers, ranked by leverage

1. **Trial-end conversion** (largest lever) — every trial that doesn't convert is a permanent revenue loss. Score today: 61%. Reachable with Tier 1: 91%. The single highest-ROI work.
2. **Daily retention loop** (compounding lever) — keeps users alive long enough for trial conversion + post-charge LTV. Score today: 64%. Tier 1 gets to 74%. World-class (85%+) needs the tribe layer (Sprint 4).
3. **Lapse recovery** (defensive lever) — catches users who drift before they churn. Score today: 57%. In-app side already strong; email side blocked.

### The sequence

```
Sprint 1 (Week 1): Ship Tier 1 — 16 fixes, ~1.5-2 days dev
Sprint 2 (Week 2-3): Measure baseline + Tier 1 lift in PostHog
Sprint 3 (Week 4-5): A/B test where data supports; ship Tier 2 (data-dependent)
Sprint 4 (Week 6+): Tier 3 polish + start backend tribe + email integration
```

**Gate logic:** don't ship Tier 2 until Tier 1 has measurable lift. Don't ship Tier 3 polish until Tier 2 settles. Resist the temptation to batch all changes.

### What success looks like

| Metric | NOW (estimated) | After Sprint 1 | After Sprint 4 |
|---|:-:|:-:|:-:|
| Annual trial conversion | ~54% | ~62% | ~66% |
| Monthly trial conversion | ~30% | ~38% | ~42% |
| Plan mix (annual share of trial starts) | 30-40% | 50-60% | 55-65% |
| Blended ARPU lift | baseline | +15-25% | +25-40% |
| D30 paid retention | 50-60% | 55-65% | 65-75% |
| Cancel save-rate | 15-25% | 25-30% | 30-38% |

These are directional. Real numbers come from PostHog measurement post-Sprint 1.

---

## Section 2 — The four sprints

### Sprint 1 — Activate dormant levers (Week 1)

**Goal:** ship the 16 Tier 1 fixes from docs 09 + 10 + 11.

**Day 1 (~6 hours):** trial mechanics + asymmetry visibility
**Day 2 (~6 hours):** loss-frame + commitment + unity + peak-end
**Day 3 (buffer):** QA + smoke test on iOS + Android + iteration

**Output:** 16 small PRs (or one bundled PR), all reverting cleanly, all tracked in PostHog.

### Sprint 2 — Measure (Weeks 2-3)

**Goal:** establish baseline + observe Tier 1 lift in PostHog.

- Wire PostHog dashboards F1-F5 (per `06-event-instrumentation.md`)
- Allow 14 days for cohort data to accumulate
- No code changes during measurement window unless critical bug
- A/B test push-copy variants where infrastructure supports

**Output:** dashboards live; first reliable trial-conversion + retention numbers.

### Sprint 3 — Iterate (Weeks 4-5)

**Goal:** ship Tier 2 + Tier 3 polish based on what Sprint 2 measurement showed.

- Tier 2 fixes (T2.1-T2.5) — data-dependent items now have data
- Tier 3 polish (T3.1-T3.3) — authority cues + share unity
- A/B test biggest Tier 1 hypotheses with proper variants

**Output:** second wave of fixes; data-validated changes only.

### Sprint 4 — Backend + email (Weeks 6+)

**Goal:** unlock the blocked items.

- **Tribe layer** (Sprint C from competitive audit) — anonymous community insights backend. Single biggest D60+ retention lever.
- **Email provider integration** — wires up dunning (D0/D3/D7/D10) + win-back (D30/D60/D90) using existing templates.
- **Onboarding optimization** — per F1 funnel data, fix highest-drop-off step.

**Output:** A- composite (89%). World-class retention + subscription experience.

---

## Section 3 — Sprint 1 day-by-day

### Day 1 — Trial mechanics + paywall asymmetry

#### Block 1A — Adaptive timing infrastructure (~2 hours)

**Task 1.** Add `getTrialLengthDays(customerInfo)` helper to `RevenueCatService.js`.
- Reads RevenueCat customerInfo + product duration
- Returns 3 or 7 (or null for paid/no trial)
- Unit-test with mock customerInfo objects

**Task 2.** Modify Sub-2 trial-end push scheduler in `notificationService.js`.
- Branch on trial length:
  - 7-day trial: fire at D5 morning (current behavior)
  - 3-day trial: fire at D1.5 morning (~36h before charge)
- Add `trial_length_days` to `trial_ending_push_scheduled` event

**Task 3.** Modify `proEngagementService.js` Pro discovery push scheduler.
- 7-day trial: keep D3 + D7 (current)
- 3-day trial: single push at D1 morning
- Add `trial_length_days` to `pro_discovery_push_scheduled` event

#### Block 1B — PaywallScreen asymmetry visibility (~2 hours)

**Task 4.** Add trial-length pill to each plan card in `PaywallScreen.js`.
- Annual card: "7-day free trial" pill above price
- Monthly card: "3-day free trial" pill (smaller, neutral)

**Task 5.** Plan-aware CTA copy.
- Replace generic "Start free trial" with "Start 7-day free trial — then $X/year" / "Start 3-day free trial — then $Y/month"
- Updates dynamically when user toggles plan

**Task 6.** Annual savings badge enhancement.
- Append "+ 4 bonus trial days" to the existing "Save X%" badge
- Shows the trial-length delta as part of annual value prop

**Task 7.** Fix `OnboardingFlowScreen.js:809` trial-length copy to match PaywallScreen reality (currently says 7 days for both).

#### Block 1C — WelcomeToProScreen + first-day push (~1 hour)

**Task 8.** WelcomeToProScreen plan-aware sub-line.
- 7-day trial users: "You've got 7 days. Most members find their first read in the first 24 hours."
- 3-day trial users: "You've got 3 days. Pick the one read that matters most."

**Task 9.** Verify `cm_d1_personal` push fires correctly for both trial lengths (it should — no change expected, just QA).

#### Day 1 acceptance criteria
- 3-day trial fires both Sub-2 and Pro discovery push at correct adaptive timings
- PaywallScreen visually distinguishes the two trial lengths as annual rewards
- WelcomeToProScreen renders correct sub-line for the user's purchased plan
- All 9 tasks unit-tested or smoke-tested
- Events firing with `trial_length_days` property

---

### Day 2 — Loss-frame + commitment + unity + peak-end

#### Block 2A — Loss-frame trial-end copy (~30 min) — **HIGHEST ROI SINGLE EDIT**

**Task 10.** Modify the trial-end push body template in `notificationContentEngine.js`.

Current copy:
> "Two days. We don't want to charge you if you don't want this. [N] briefings, [M] chats, [P] journal entries — what you've built so far. You keep it all either way."

Tier 1 version:
> "Two days. [N] briefings, [M] chats, [P] journal entries — what you've built. After [date]: no daily Pro insight, no weekly reports, no full-depth chat. Cancel anytime — we won't surprise you."

The change: explicitly lists what they'd LOSE access to (daily Pro insight, weekly reports, full-depth chat). Loss aversion + reciprocity + permissive tone in one push.

For 3-day trial, tighter version:
> "Tomorrow your trial ends. [N] briefings + [M] chats so far. After tomorrow: no daily Pro insight, no weekly reports, no full chat. Cancel anytime."

#### Block 2B — Commitment surfaces (~2 hours)

**Task 11.** Goal-echo block on Today during trial.
- Pull `motivation` field from onboarding (super-property exists)
- Render below briefing card: "You said you came here to [motivation]. Today's read takes you closer."
- Show only during trial period; hide post-charge

**Task 12.** Elevate streak counter to Today tab header during trial.
- Move streak number to top-right of the hero header
- Larger font, gold accent
- Only during trial; revert to current placement post-trial

**Task 13.** D-1 trial summary surface (peak-end rule).
- New surface visible only on the last day of trial
- Shows: chart, total briefings read, journal count, first reveal statement
- Heading: "What 7 days built." / "What 3 days built."
- This becomes the "end" memory of the trial → increases trial-good-faith perception

#### Block 2C — Unity copy + cancel-flow extension (~1.5 hours)

**Task 14.** Unity copy on WelcomeToProScreen + PaywallScreen.
- Welcome to Pro: "For people who do their inner work." — single line below the 3 hero cards
- PaywallScreen: "Made for the questioners, not the believers." — above the plan cards

**Task 15.** "+3 days free" save offer in CancelFlowScreen.
- Add as Step 2 save-offer variant for trial-period cancellers only
- Routes through RevenueCat trial-extension API (verify support; may require backend)
- A/B vs current variants

**Task 16.** Methodology footer on each report.
- 1-line footer: "Calculated using astronomy-engine + IAU ephemeris."
- Appears on all PDF reports + report-detail screens
- Authority signal — not aggressive, just present

#### Block 2D — Analytics infrastructure (~30 min)

**Task 17.** `app_opened` source attribution.
- Distinguish push-launched (cold-start with notification payload) vs. organic
- Adds `launch_source: 'push' | 'organic' | 'cold'` property
- Lets you measure internal-trigger graduation over time

**Task 18.** Permission re-ask cap extension.
- FINAL-5 currently caps at 2 lifetime re-asks
- Extend to D7 + D14 + D30 milestones (cap = 3 lifetime)
- Re-asks only fire if user previously declined

#### Day 2 acceptance criteria
- Trial-end push includes loss-frame "no daily Pro insight, no weekly reports, no full-depth chat" line
- Goal-echo block visible on Today during trial
- Streak counter prominent in header during trial
- D-1 trial summary surface renders for users on their final trial day
- Unity copy live on Welcome to Pro + PaywallScreen
- Cancel flow includes "+3 days free" save offer for trial cancellers
- Methodology footer on reports
- `app_opened` events fire with `launch_source` property

---

### Day 3 — QA + iterate

#### Smoke test matrix
- iOS — fresh install → onboarding → 3-day trial purchase → return D1 → verify push timing → verify WelcomeToPro copy
- iOS — fresh install → 7-day trial purchase → return D1, D3, D5, D6, D7 → verify all pushes + recap modal
- Android — same matrices
- iPad / large screen — visual QA on PaywallScreen card layout
- Cancel flow — trigger cancel mid-trial → verify "+3 days free" save offer surfaces

#### Pre-launch checklist
- [ ] All 18 tasks merged
- [ ] All new events firing in PostHog (verify via Live Events)
- [ ] iOS + Android builds stable in dev
- [ ] No regressions on existing flows
- [ ] Voice of all new copy passes voice-guide-pushes.md review
- [ ] PaywallScreen reviewed against design tokens

#### Ship + announce
- TestFlight / internal track release
- Document Tier 1 baseline metrics in PostHog as "pre-Sprint-1" annotation
- Schedule production rollout for Day 4

---

## Section 4 — Sprint 2 measurement plan

### F1 — Activation funnel (already events-instrumented per doc 06)

```
install
→ onboarding_started
→ onboarding_completed (track which step drops most)
→ chart_revealed
→ post_chart_cta_tapped (target=chat)
→ first_chat_message_sent
```

**Target:** 50%+ of installers reach `first_chat_message_sent` within 24h.

### F2 — Trial conversion funnel (the critical funnel)

```
purchase_completed (with plan + trial_length_days)
→ app open D1
→ daily_briefing_viewed D1
→ welcome_to_pro_card_tapped (check Tier 1 #8 lift)
→ trial_ending_push_opened
→ still_pro_at_D7 (annual) / still_pro_at_D3 (monthly)
```

**Target:** annual ≥62% by D7. Monthly ≥38% by D3.

**A/B variants ready to test in Sprint 3:**
- Trial-end push: loss-frame (Sprint 1 Tier 1) vs. investment-frame (control)
- D-1 surface: present (Sprint 1) vs. absent (control)
- Streak prominence: header (Sprint 1) vs. embedded (control)

### F3 — Daily retention funnel

```
app_opened D1
→ daily_briefing_viewed D1
→ app_opened D7 (same user)
→ streak_milestone_hit (streak=7)
→ app_opened D30 (same user)
```

**Target:** 35%+ of D1 returners reach 7-day streak. 50%+ of streak-7 users still active at D30.

### F4 — Cancel-flow save funnel

```
cancel_flow_started
→ cancel_reason_selected (split by reason)
→ cancel_save_offer_shown (split by variant including new "+3 days free")
→ cancel_save_offer_accepted (vs. cancel_confirmed)
```

**Target:** 25-30% save rate post-Sprint 1.

### F5 — Pro feature discovery funnel

```
purchase_completed
→ welcome_to_pro_card_tapped
→ pro_discovery_push_opened (D1 for monthly, D3 for annual)
→ corresponding feature engagement event
```

**Target:** 60%+ of new Pros tap a Welcome-to-Pro hero card.

---

## Section 5 — Sprint 3 — Tier 2 + iterate (Weeks 4-5)

After 14-30 days of measurement, ship the Tier 2 fixes that depend on real data:

### Tier 2 — data-dependent fixes

| # | Fix | Source data | Expected lift |
|---|---|---|---|
| **T2.1** | Real-number social proof on trial-end push: *"X% of users who reach a 7-day streak still use Celestia at month 3"* | F3 D30 retention cohort | +2-4% trial conversion |
| **T2.2** | Welcome to Pro hero-card subtext with social proof | F5 pro discovery cohort | +3-5% post-purchase activation |
| **T2.3** | Cancel save offer with retention-rate stat | F4 retention cohort by tenure | +3-5% save rate |
| **T2.4** | Onboarding step 3 → display goal back at completion | F1 funnel | +2-4% chart-reveal-to-CTA-tap |
| **T2.5** | D5 of 7-day trial: explicit "what you'd lose" surface | n/a (no data needed) | +2-3% conversion |

### Tier 3 — polish

| # | Fix | Why now |
|---|---|---|
| **T3.1** | Astrologer-author byline on each report type | Authority signal for premium feature |
| **T3.2** | NASA JPL ephemeris tagline | Authority signal across app |
| **T3.3** | Cosmic-identity card share with unity framing | Viral coefficient + unity signal |

### Sprint 3 A/B testing priority

1. Tier 1 loss-frame push vs investment-frame push (50/50 split)
2. D-1 trial summary surface present vs absent (50/50 split)
3. Streak prominence in header vs embedded (50/50 split)
4. Tier 2 social-proof copy on/off (once data available)

**Run each test for ≥2 weeks with statistical significance threshold ≥95%.**

---

## Section 6 — Sprint 4 — Backend + email (Weeks 6+)

### Tribe layer (Sprint C from competitive audit)

The single biggest D60+ retention lever. Self-Determination Theory's 3rd pillar (relatedness).

**Scope:**
- Anonymous community insights backend (Supabase or simple SQL backend)
- "1,247 Geminis felt off today, here's why" surface on Today tab
- Friends / Circle social proof if supported by user data
- Optional: shared journal prompts ("47 people wrote about X today")

**Estimated effort:** 2-4 week backend sprint. Frontend integration ~1 week.

**Expected impact:** +20-30% D60 paid retention. Brings composite to A- (89%).

### Email provider integration

Wires up the dunning + win-back templates that already exist in `plan/retaintion-new/email-templates/`.

**Scope:**
- Pick provider (Resend, Postmark, SendGrid, Customer.io for advanced)
- Wire up the 7 templates (`dunning-d0/d3/d7/d10` + `winback-d30/d60/d90`)
- Add unsubscribe + preference-center surfaces in app

**Estimated effort:** 1-2 weeks if SaaS provider; longer if custom.

**Expected impact:** +4-6% recovery on failed payments + +3-5% reactivation of churned users.

### Onboarding optimization

Per F1 funnel data, fix the highest-drop-off onboarding step (currently unknown without data).

**Likely candidates** based on `02-day-1-to-7-activation.md`:
- Step 7 (birth time toggle) — drop-off if user feels overwhelmed
- Step 11 (chat depth selection) — drop-off if user picks "Light" + later regrets
- Step 14 (final paywall) — already optimized

---

## Section 7 — Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|:-:|---|
| Tier 1 changes break existing flows | medium | Day 3 buffer for QA + smoke tests; revert-safe individual tasks |
| Loss-frame push triggers reactance / increases cancellations | low | Voice-guide-bound; copy is permissive even with loss-frame; A/B test in Sprint 3 |
| RevenueCat doesn't support trial extension via API | medium | Investigate before Sprint 1 Day 2; if not supported, defer Task 15 to Sprint 4 |
| 3-day trial conversion stays flat after adaptive timing | low | Adaptive timing fixes a clear bug; conversion below ~30% is still acceptable for filter-of-non-believers |
| PostHog cohort data takes longer than 14 days to accumulate | medium | Monitor cohort sizes; defer Tier 2 social proof until N≥1000 in cohort |
| Tribe layer backend scope creeps to 8+ weeks | high | Keep MVP minimal — anonymous insights only, no friend graph |
| Email provider integration blocked on legal/compliance review | medium | Start procurement + DPA review Week 1 of Sprint 1 to parallelize |

---

## Section 8 — What we explicitly DON'T do (yet)

Resist these tempting-but-distracting investments:

| Don't | Why not |
|---|---|
| Major brand redesign | Brand voice is already 93%. No upside. |
| New screens / features beyond the plan | Each new surface dilutes attention from the conversion levers |
| Add a 5th or 6th tab | Increases cognitive load; current 5 is correct |
| Native widgets / Glance | High effort, low conversion impact compared to Tier 1 |
| Material You dynamic color | Cosmetic, no retention impact |
| Apple Watch app | High effort, niche audience |
| iPad-optimized layout | Adapt-to-portrait already works; not worth optimizing yet |
| Localization beyond English | Audience persona is English-language Inner-Work Practitioner |

If any of these come up as "shouldn't we also do X" — say no. Conviction in sequencing is the make-or-break.

---

## Section 9 — The make-or-break thesis

**The thesis in one paragraph:**

> Celestia has shipped roughly 80% of the retention + subscription infrastructure that a world-class consumer subscription app needs. The voice is best-in-category. Personalization is best-in-category. The cancel flow is sophisticated. The lapse cascade is industry-leading. **What's missing isn't more building — it's activating dormant levers and measuring what works.** Sprint 1's 1.5-2 days of dev work activates the loss-frame copy, fixes the broken 3-day trial timing, makes the trial asymmetry visible on the paywall, adds a peak-end summary surface, and wires the goal-echo + commitment + unity copy that's been documented but not shipped. Sprint 2 measures. Sprint 3 iterates with data. Sprint 4 unlocks the two large blocked items: tribe layer (D60+ retention multiplier) and email side (lapse + dunning recovery). The cumulative move: **C+ → A-** with one week of dev + one quarter of measurement-driven iteration. This is the most leveraged set of work currently available in the codebase.

**Decision required from owner:**

1. ✅ / ❌ — Approve the tiered trial strategy (3-day monthly / 7-day annual) as the standing decision
2. ✅ / ❌ — Approve Sprint 1 dev allocation (~3 days dev including QA buffer)
3. ✅ / ❌ — Approve Sprint 4 backend scope (tribe layer) for Q+1 planning

If all three are approved, work begins Day 1 of next sprint.

---

## Section 10 — One-page summary card

| Sprint | Duration | Output | Composite score after |
|---|:-:|---|:-:|
| **NOW** | — | — | 62% (C+) |
| **Sprint 1** | 3 days dev (incl. QA) | 18 tasks across 4 blocks | 76% (B+) |
| **Sprint 2** | 14-21 days | PostHog dashboards live; baseline + Tier 1 lift measured | 76% (B+) |
| **Sprint 3** | 10-14 days dev | Tier 2 (data-dependent) + Tier 3 polish + A/B tests | 82% (B+/A-) |
| **Sprint 4** | 4-6 weeks | Tribe layer + email integration | 89% (A-) |

**The headline:** if Sprint 1 ships clean and Sprint 4 unlocks the blocked items, Celestia goes from C+ to A- composite retention + subscription score in one quarter.

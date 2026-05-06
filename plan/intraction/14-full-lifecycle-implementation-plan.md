# The Full-Lifecycle Implementation Plan

End-to-end plan covering every stage of the user journey — from App Store browsing all the way through long-term retention or churn. This doc is the master plan that supersedes doc 13's narrower trial-and-retention scope and pulls work from docs 00-12.

10 stages, one operational plan, one sprint sequence.

---

## The 10 lifecycle stages

```
0  Pre-install (App Store discovery)
1  First open + Splash
2  Onboarding (14 steps)
3  Chart reveal + first activation
4  Day 1-3 (trial begins for monthly)
5  Day 4-7 (trial converts for annual)
6  Day 8-30 (post-charge, habit formation)
7  Month 2-6 (habit maintenance, long-term retention)
8  Lapse + recovery
9  Renewal / cancel / win-back
```

Each stage is scored, has a target user-feeling, has explicit work mapped to one of four sprints (S1-S4 from doc 13), and has success metrics.

---

# STAGE 0 — Pre-install (App Store discovery)

### User's mental state
Browsing App Store / Play Store. Comparing astrology apps. 5-second decision.

### Theory
- Visual hierarchy + first-screenshot dominance (87% of conversion happens from first screenshot per ASO benchmarks)
- Social proof at peak power (numerical reviews + star rating)
- Authority cues (App of the Day, editorial features)

### Today
Per `plan/aso/` — bundle ID `com.ask.celestia`, ASC App ID 6757995238. ASC categories include Entertainment which **must** be changed before 4.3(b) resubmit (per memory). Screenshot strategy not yet operationalized.

### Best apps reference
- Co-Star: minimal screenshots, distinctive brand mark
- Headspace: lifestyle photography + product UI overlays
- Calm: emotional outcome screenshots ("Sleep better tonight")
- Duolingo: mascot-first, gamified preview

### What ships in which sprint

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Change ASC categories (remove Entertainment) | **S0** | XS | Required pre-resubmit. Already flagged in memory. |
| Final screenshot set (5-6 screens) showing chart, briefing, Circle, chat, reports | **S2** | M | Design work. Reuse hero compositions from app. |
| App description / subtitle copy with unity language | **S2** | S | "For people who do their inner work." |
| In-app review prompt at D7 streak milestone | **S1** | XS | Tap into existing `streak_milestone_hit` event |
| Press kit / website teaser landing | **S4** | M | External work |

### Success metric
- App Store conversion rate (impression → install): target 25-35%
- Star rating: maintain ≥4.6
- Review volume: 50+ new reviews/month after S1 prompt ships

---

# STAGE 1 — First open + Splash

### User's mental state
Just installed. Curious. Anxious to see if it'll be different from the other astrology apps they've tried. **5-second window to make first-second-impression.**

### Theory
- Peak-end rule applies even to splash: first second of app sets memory baseline
- Halo effect: polished splash → assumption of polished product
- Cognitive load: simpler splash = faster perceived load

### Today
- `SplashScreen.js` — animated splash with orbs (per memory)
- Loads fonts + initializes SQLite schema in `App.js`
- Auth + UserProfile contexts wrap the tree

### Best apps reference
- Headspace: 1.5s breathing-rhythm splash
- Calm: subtle nature shot
- Duolingo: mascot wave
- Co-Star: black void with logo (intentionally stark)

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Animated splash polish (existing) | already shipped | — | |
| Splash → Onboarding transition timing tightened | **S1** | XS | Verify <1.5s to first interactive frame |
| Pre-warm Gemini chart calculation during splash | **S2** | S | Reduces D0 chart-reveal latency |

### Success metric
- Splash → first onboarding step: median <1.5s
- Splash → onboarding-step-1-rendered: <2.0s

---

# STAGE 2 — Onboarding (14 steps)

### User's mental state
Investing time before knowing if value will pay off. Patience window: 60-90 seconds before first signal of value.

### Theory
- Foot-in-the-door (commitment): each step is a tiny commitment that compounds
- Progressive profiling: start with easy yes ("What sign are you?") → harder asks ("Birth time?")
- IKEA effect: building something increases attachment
- Endowment: by step 14, user has invested → endowment-feeling kicks in

### Today
14-step flow per `OnboardingFlowScreen.js`. Captures: motivation, pain point, depth selection, name, DOB, time, city, partner data optionally. Final step → paywall trial pitch.

### Critical funnel (F1 from doc 06)
```
install → onboarding_started → step_1 → ... → step_14 → onboarding_completed → chart_revealed
```

Per-step drop-off currently NOT instrumented. **Without per-step events, every onboarding optimization is shipping blind.**

### Best apps reference
- Duolingo: ~7 steps, each step <10s, motion-rich
- Headspace: 5 steps, asks for goals + experience level
- Co-Star: 3 steps (sign + birth data), then chart
- Sanctuary: ~6 steps, leads to live reading

**Industry benchmark: 7-10 steps.** Celestia's 14 is on the long side. Each unnecessary step = drop-off tax.

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Per-step events (`onboarding_step_completed` already shipped) | already shipped | — | Per `06-event-instrumentation.md` |
| Step-level drop-off measurement in PostHog | **S2** | S | Build F1 funnel dashboard |
| Display goal-back at step 14 ("You're here to [motivation]. Let's start with...") | **S1** | M | Tier 1 commitment-echo (covered in doc 13) |
| Step 14 trial-length copy fix (match PaywallScreen) | **S1** | XS | C4 in doc 10 |
| Onboarding step compression (drop 1-2 steps if data shows >15% drop on a single step) | **S3** | M | Data-dependent |
| Reveal-statement preview ("Most Geminis discover their core question is...") | **S3** | M | Mid-onboarding teaser to maintain motivation |
| Skippable steps marked clearly (birth time, city if unknown) | **S1** | S | Reduce abandonment |

### Success metric
- Onboarding-start → onboarding-completed: target ≥75%
- Worst single-step drop-off: target <8%
- Median time-to-complete: target <90s

---

# STAGE 3 — Chart reveal + first activation

### User's mental state
**Peak emotional moment of the entire user journey.** Chart appears, reveal statement lands, first "this app sees me" feeling. If this moment fails, retention is lost forever.

### Theory
- Peak experience (Maslow, Csikszentmihalyi flow research) — emotional peaks anchor memory
- Reciprocity — the chart is a personalized gift; obligation begins
- Liking — peak personalization moment
- The activation event (Sean Ellis): "the moment a user becomes a user"

### Today
- `WelcomeScreen.js` displays chart + first reveal statement
- `chart_revealed` event fires (key activation event)
- Two CTAs: "Talk to Celestia" (chat) and "See dashboard" (Today)
- `post_chart_cta_shown` + `post_chart_cta_tapped` events
- First chat pre-fill (P1.1 already shipped)

### Best apps reference
- Co-Star: chart shown immediately, conversational tone, no monetization yet
- The Pattern: chart + 3 deep insights, monetization deferred
- Apple Fitness+: workout preview before subscription pitch

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Pre-warm chart calculation (Stage 1) | **S2** | S | |
| Reveal statement quality already 10/10 | already shipped | — | |
| First-chat pre-fill | already shipped (P1.1) | — | |
| Notification permission ask post-chart | already shipped | — | |
| Add `first_chat_message_sent` activation event | already shipped | — | |
| Reveal-statement share button (post-chart, not now) | **S3** | M | T3.3 — viral coefficient |

### Success metric (the activation funnel)
- `chart_revealed` → `post_chart_cta_tapped` (target=chat): ≥60%
- `chart_revealed` → `first_chat_message_sent` within 24h: ≥50%
- This is **the** make-or-break activation metric

---

# STAGE 4 — Day 1-3 (trial begins for monthly cohort)

### User's mental state
Returning to verify the app remembers them. Building or breaking trust.

### Theory
- Hook Model first cycle completes
- Habit formation: cue (push) → routine (briefing read) → reward (variable content) → craving begins
- Loss aversion building (small streak forming)
- B=MAP: motivation still high; ability must stay tiny

### Today
- Cosmic morning push fires at user-local wake time
- D1 personalized push (`cm_d1_personal`) references onboarding statement
- Streak counter ticks to 1, 2, 3
- D2 freeze offer modal (P1.6) — *"You've got 1 free streak freeze..."*
- D3 streak milestone modal: *"Three days. The first sign you mean it."*
- Pro daily insight card on Today (Pro users only)
- Cancel-flow A/B variants ready

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| **For 3-day trial cohort:** trial-end push at D1.5 (adaptive) | **S1** | M | C6 in doc 10 — fixes broken timing |
| **For 3-day trial cohort:** Pro discovery push at D1 morning | **S1** | S | C7 in doc 10 |
| Goal-echo block on Today (Tier 1 #11) | **S1** | M | Commitment-echo |
| Streak counter elevated to header (Tier 1 #12) | **S1** | S | Loss-aversion strengthening |
| Loss-frame trial-end copy (Tier 1 #10) | **S1** | XS | **HIGHEST ROI single edit** |

### Success metric
- D1 return rate: ≥65%
- D3 return rate: ≥45%
- 3-day trial conversion: ≥38% (was ~30% before adaptive timing)
- D1 first-chat-after-purchase rate: ≥40%

---

# STAGE 5 — Day 4-7 (trial converts for annual cohort)

### User's mental state
Habit forming. By D5-7, the streak is meaningful enough that breaking it stings. The trial-end decision approaches.

### Theory
- Sunk cost: investment compounds
- Endowment: by D5, the app feels owned
- Peak-end: D-1 is the END moment that anchors memory
- Cialdini commitment: 3-5 micro-commitments now banked

### Today
- D4 surprise insight (30% roll, P2.5)
- D5 trial-end push fires
- D6 anticipation push: *"One more morning. Then it counts."*
- D7 streak milestone → `stargazer` badge + 30% hidden-badge roll + first-week recap modal (CA-A4)
- Permission re-ask on D7 if previously declined (FINAL-5)

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Loss-frame trial-end copy (D5 push) | **S1** | XS | Tier 1 #10 |
| D-1 trial summary surface (peak-end rule) | **S1** | M | Tier 1 #13 — last-impression celebration |
| First-week recap modal at D7 | already shipped (CA-A4) | — | |
| Stargazer badge + hidden-badge roll | already shipped | — | |
| Permission re-ask at D14 + D30 milestones (cap=3) | **S1** | S | Tier 1 #18 |

### Success metric
- 7-day trial → paid conversion: ≥62%
- D7 streak hit rate: ≥35% (of D1 returners)
- D-1 trial summary surface viewed: ≥80% of trialists who reach D6

---

# STAGE 6 — Day 8-30 (post-charge, habit formation)

### User's mental state
First weeks of being paid. The "do I really want this?" doubts surface. The 21-66 day automaticity window opens.

### Theory
- Lally et al. — habit becomes automatic between day 18 and 254 (median ~66)
- D7-D30 is the most fragile retention window for paid users
- Self-Determination Theory: autonomy + competence working; relatedness still missing

### Today
- Pro daily insight card refreshes daily (TIER2-D)
- Pro week-1 recap at Day 7 of being Pro (TIER2-F)
- Pro feature discovery pushes D3 + D7 (already shipped, working for 7-day trial cohort)
- Reports unlocked
- Continued briefing-mode rotation (Standard / Pattern / Partner / Archetype)
- Surprise insight rolls at D10, D17, D24

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Briefing-mode rotation | already shipped (P2.1) | — | |
| Pro week-1 recap | already shipped (TIER2-F) | — | |
| Surprise insights | already shipped (P2.5) | — | |
| At-risk banner (health-score driven) | already shipped | — | |
| `app_opened` source attribution (push vs organic) | **S1** | S | Tier 1 #17 — measure internal-trigger graduation |
| D14 + D30 permission re-asks | **S1** | S | Tier 1 #18 |
| D30 reveal-statement callback push (FINAL-4) | already shipped | — | |
| Indecision-keyword journal mining | already shipped (P2.6) | — | |

### Success metric
- D7 → D30 paid retention: ≥65% (target 70-75% post-Sprint 1)
- D14 streak hit rate: ≥25% of D1 returners
- Pro feature discovery (≥1 Pro feature engaged in week 1): ≥80%
- Internal-trigger ratio (organic opens / total) at D14: ≥40% (lead indicator of habit formation)

---

# STAGE 7 — Month 2-6 (long-term retention)

### User's mental state
Habit largely formed if user reached D60. Now the question is: will the app stay relevant beyond the initial novelty?

### Theory
- Long-term retention requires variety + occasional surprise + meaningful relationships (SDT relatedness)
- Loss aversion fades as routines stabilize — needs *new* loss frames (streak-at-100, badge collection nearly complete)
- Tribe / community is the strongest D60+ retention driver

### Today
- Surprise insights continue
- Hidden surprise badges (5 reserved for unexpected discovery)
- 100-day, 365-day streak milestones
- Solar return notification once per year
- Birthday push
- Lapse cascade catches drift before churn

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Solar return notifications | already shipped | — | |
| Birthday push | already shipped | — | |
| 100-day streak milestone (`stargazer-pro` badge) | already shipped | — | |
| 365-day streak milestone | already shipped | — | |
| **Tribe layer — anonymous community insights** | **S4** | XL | Sprint C from competitive audit. Single biggest D60+ retention lever. |
| **Friend / Circle social proof** | **S4** | L | Backend required |
| Quarterly content refresh (new briefing-mode if data supports) | **S4** | M | After Sprint 2 measurement |
| Annual recap surface (Spotify Wrapped-style) | **S4** | L | Year-in-review for paid users approaching renewal |

### Success metric
- D30 → D60 paid retention: ≥75%
- D60 → D180 paid retention: ≥50% (target 70%+ with tribe layer)
- 100-day streak achievement rate: ≥10% of paid users

---

# STAGE 8 — Lapse + recovery

### User's mental state
Drifting. Could be transient (busy week) or pre-churn (decided to leave). The 21-day window decides which.

### Theory
- Win-back probability decays: D2 lapse return ~25%, D7 ~15%, D30 ~5%, D90 <1%
- The lapse cascade must hit emotional notes that the active loops don't (curiosity, missed milestone, partner-relationship)
- Email side adds redundancy when push permission is gone

### Today
- Lapse cascade D2/D3/D5/D7/D10/D14/D21 on `reactivation` channel
- Tier 1 personalization (partner-aware), Tier 2 (chat-aware), Tier 3 (chart-fallback)
- At-risk banner (health-score < 40, capped 7-day re-show)
- Streak restore offer when user returns post-lapse
- Permission re-ask on return after lapse

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Lapse cascade (D2-D21) with tiered personalization | already shipped (P1.4) | — | |
| At-risk banner with health-score | already shipped | — | |
| Streak restore offer | already shipped | — | |
| **Email dunning (D0/D3/D7/D10)** | **S4** | L | Templates exist; needs email provider |
| **Email win-back (D30/D60/D90)** | **S4** | M | Templates exist; needs email provider |
| Win-back deep-link to "Welcome back" surface | **S4** | M | New surface; reactivates context |

### Success metric
- D2 lapse → return same day: ≥25%
- 7-day reactivation rate: ≥35%
- Failed-payment recovery rate (post-email-integration): ≥50%
- D30 win-back rate (post-email-integration): ≥3-5%

---

# STAGE 9 — Renewal / cancel / win-back

### User's mental state
Either auto-renewing (annual cohort hits 12-month mark) or actively cancelling.

### Theory
- Renewal-time emotional spike: 12 months invested triggers reflection. **Critical moment for unity messaging.**
- Cancel-flow save offers can recover 25-35% of would-be cancellers if done right
- Reactance avoidance: aggressive saves backfire

### Today
- Pre-billing renewal reminder for annual (EXTRA-6)
- Subscription-ending alert when `willRenew === false` (FINAL-3)
- CancelFlowScreen with REASON × VARIANT save offers (Sub-1 / Sub-7)
- PostHog A/B variants: control / data-loss / value-deepening
- Cancel-flow events fully instrumented

### What ships

| Task | Sprint | Effort | Notes |
|---|:-:|---|---|
| Pre-billing renewal reminder | already shipped | — | |
| Sophisticated cancel flow with A/B variants | already shipped | — | |
| **"+3 days free" save offer for trial cancellers** | **S1** | M | Tier 1 #15 — verify RevenueCat trial-extension API |
| Annual-renewal year-in-review surface | **S4** | L | Spotify Wrapped pattern |
| Cancel save-offer with social proof copy | **S3** | M | T2.3 — needs PostHog cohort data |
| Pause subscription option | already shipped | — | |
| Downgrade to monthly option | already shipped | — | |

### Success metric
- Cancel-flow save rate: ≥25% (target 30-35% after Sprint 1)
- Annual auto-renewal rate: ≥75%
- Voluntary monthly continuation: ≥80%

---

# Sprint mapping (which sprint touches which stage)

| Stage | S0 | S1 | S2 | S3 | S4 |
|---|:-:|:-:|:-:|:-:|:-:|
| 0 — Pre-install | ASC fix | review prompt | screenshots, ASO copy | — | press kit |
| 1 — First open / Splash | — | transition timing | pre-warm chart | — | — |
| 2 — Onboarding | — | goal-echo, trial-copy fix, skippable marks | per-step measurement | step compression, reveal preview | — |
| 3 — Chart reveal | — | — | — | share button | — |
| 4 — Day 1-3 | — | adaptive timing, loss-frame, goal-echo, streak elevation | measurement | A/B tests | — |
| 5 — Day 4-7 | — | loss-frame, D-1 surface, perm re-ask | measurement | A/B tests | — |
| 6 — Day 8-30 | — | source attribution, D14/D30 perm re-asks | measurement | — | — |
| 7 — Month 2-6 | — | — | — | — | tribe, friends, year-recap |
| 8 — Lapse + recovery | — | — | — | — | email dunning + win-back |
| 9 — Renewal / cancel | — | "+3 days free" save offer | — | social-proof save offer | year-in-review |

---

# Master timeline

```
Week 0 (now)        — Decision approval; ASC category fix (S0)
Week 1              — Sprint 1: 18 tasks across 4 blocks (3 dev days)
Week 2-3            — Sprint 2: PostHog dashboards + measure baseline + Tier 1 lift
Week 4-5            — Sprint 3: Tier 2 (data-dependent) + Tier 3 polish + A/B tests
Week 6              — Sprint 4 kickoff: backend tribe layer scoping + email-provider procurement
Week 6-9            — Tribe backend MVP build + email-provider integration + onboarding compression
Week 10-12          — Tribe layer goes live + email sequences live + year-in-review for renewal cohort
```

**Total: ~12 weeks from approval to A- composite (89%).**

---

# The unified scorecard with stage-level breakdown

| Stage | Today | After S1 | After S4 |
|---|:-:|:-:|:-:|
| 0 — Pre-install | 5/10 | 6/10 | 9/10 |
| 1 — First open / Splash | 8/10 | 9/10 | 9/10 |
| 2 — Onboarding | 7/10 | 8/10 | 9/10 |
| 3 — Chart reveal | 9/10 | 9/10 | 10/10 |
| 4 — Day 1-3 | 6/10 | 9/10 | 9/10 |
| 5 — Day 4-7 | 7/10 | 9/10 | 9/10 |
| 6 — Day 8-30 | 7/10 | 8/10 | 9/10 |
| 7 — Month 2-6 | 4/10 | 5/10 | 9/10 |
| 8 — Lapse + recovery | 6/10 | 6/10 | 9/10 |
| 9 — Renewal / cancel | 7/10 | 8/10 | 9/10 |
| **Average** | **6.6/10** | **7.7/10** | **9.1/10** |

The biggest movers: Stage 4 (3-day trial fixes), Stage 5 (loss-frame + peak-end), Stage 7 (tribe layer), Stage 8 (email side).

---

# Critical decision gates

| Gate | When | Decision needed |
|---|---|---|
| **G1** | Now | Approve tiered trial strategy + Sprint 1 dev allocation + Sprint 4 backend scope |
| **G2** | End of Sprint 1 | Are all 18 tasks shipped + smoke-tested? |
| **G3** | End of Sprint 2 | Do PostHog dashboards show measurable lift? Where? |
| **G4** | Start of Sprint 3 | Which Tier 2 fixes have enough cohort data to ship? |
| **G5** | Start of Sprint 4 | Tribe-layer backend approach: build vs buy vs phased? |
| **G6** | Mid Sprint 4 | Email-provider selected + DPA signed? |
| **G7** | End of Sprint 4 | Hit A- composite (89%)? If not, where's the gap? |

Each gate is a real go/no-go. Don't slip past a gate without addressing the decision.

---

# What this is NOT

- ❌ Not a brand redesign — brand is at 93%, no upside
- ❌ Not a feature factory — every new feature dilutes from the conversion levers
- ❌ Not a moonshot — every task is small, revertable, measurable
- ❌ Not a monolith ship — staged across 4 sprints with measurement gates
- ❌ Not without measurement — every change is observable in PostHog by design

---

# The make-or-break thesis (one paragraph)

> The full user journey from App Store impression to long-term paid retention spans 10 stages. Celestia today scores 6.6/10 average across stages — strong in chart-reveal (9/10), brand voice (10/10), and lapse cascade (already industry-leading), but weak in pre-install ASO (5/10), 3-day trial mechanics (6/10 — partly broken), long-term retention (4/10 without tribe), and email-side recovery (6/10 — blocked). Sprint 1 (3 dev days) lifts the average to 7.7/10 by activating dormant levers across stages 0-6. Sprints 2-3 (3 weeks) add measurement + data-driven iteration. Sprint 4 (4-6 weeks) unlocks Stage 7 (tribe) and Stage 8 (email) — the two large blocked levers — taking the composite to 9.1/10. **The whole journey, end-to-end, world-class, in one quarter of focused work.** This is the operational plan.

---

# Approval needed to start

1. ✅ / ❌ — Stage-by-stage scope as documented (10 stages, 4 sprints)
2. ✅ / ❌ — Sprint 1 dev allocation (3 days incl. QA)
3. ✅ / ❌ — Sprint 2 measurement window (14-21 days, no code changes except critical bug)
4. ✅ / ❌ — Sprint 4 backend scope (tribe layer + email provider) for Q+1 planning
5. ✅ / ❌ — ASC category fix scheduled for pre-resubmit (S0 — must happen anyway)

If approved, work starts Day 1 of next sprint cycle.

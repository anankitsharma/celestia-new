# 07 — Implementation Roadmap

Sprint-sequenced plan to ship the retention work. Priorities are ranked by **leverage / effort**. P0 is non-negotiable — every other change is shipped blind without it.

---

## P0 — Foundations (Sprint 0, 1 week)

Without these, no retention experiment is measurable and no monetization defense exists.

### P0.1 — Restore analytics (`src/services/analytics.js`)

**Status:** stubbed. All `capture()` / `identify()` / `reset()` are no-ops.

**Tasks:**
- Un-stub the wrapper. Wire to PostHog (already imported in `App.js`).
- Define and instrument these events at minimum:
  ```
  app_opened (already firing in App.js:35)
  onboarding_started, onboarding_step_completed, onboarding_completed
  chart_revealed
  notification_permission_requested / granted / denied
  first_chat_message_sent  ← activation
  daily_briefing_viewed
  streak_started, streak_milestone_hit, streak_broken
  badge_unlocked, level_up
  partner_added_to_circle
  journal_entry_created
  report_generated, report_viewed
  app_backgrounded (with session_duration)
  push_delivered, push_opened (per template_id)
  ```
- Set up PostHog cohorts:
  - `installed_today`, `installed_in_last_7_days`, `installed_in_last_30_days`
  - `active_d1`, `active_d7`, `active_d30`
  - `streak_3+`, `streak_7+`, `streak_30+`
  - `at_risk_lapsed_2+_days`
- Set up funnels: install → onboarding-done → chart-revealed → first-chat. Measure drop-off.

**Effort:** 2 days.

### P0.2 — Restore RevenueCat (`src/contexts/RevenueCatContext.js`)

**Status:** returns hardcoded `{ isPro: true }`.

**Tasks:**
- Restore real provider logic from git history (memory says it was stripped for App Store).
- Wire entitlement gates per `levels.js` (yesterday/tomorrow tabs, voice, deep reports etc.) — these unlock by *level*, not by Pro, so confirm whether levels stay free or become Pro-tier.
- Decision needed: free-vs-Pro line. Recommendation: chats limit at 10/day, weekly + monthly reports = Pro, Circle entries unlimited free, deep partner reports = Pro.

**Effort:** 3 days (assuming RevenueCat config is already set up in App Store Connect).

### P0.3 — Define D1 / D7 / D30 dashboards

**Status:** doesn't exist.

**Tasks:**
- PostHog dashboard: install cohort by week → D1, D7, D30 retention curves.
- Activation funnel: install → onboarding → chart → first-chat → first-streak.
- Health-score query (from `04`): rank active users by score.

**Effort:** 1 day after P0.1 lands.

---

## P1 — Highest-leverage retention fixes (Sprint 1, 1–2 weeks)

Top fixes from the B=MAP diagnostic, ordered by leverage.

### P1.1 — Post-chart celebratory CTA (D0 fix)

**Diagnosis:** Checkpoint 2 (`02-bmap-diagnostic.md`) — single highest-cost prompt miss in the app.

**Tasks:**
- `src/screens/WelcomeScreen.js`: after chart-reveal animation, show a one-tap CTA "Want to ask Celestia why your moon is in the [Nth] house?" → opens chat with question pre-filled.
- Pull the actual placement string from the user's chart. If moon-in-house is too generic, pick the placement with the strongest interpretation (e.g., a tight aspect, a stellium, an angular planet).
- Celebration animation (subtle confetti / orbs) before the CTA.

**Effort:** 2 days.

### P1.2 — Notification permission prompt timed to peak motivation

**Tasks:**
- Move the `NotificationPermissionModal` invocation to **immediately after the post-chart CTA tap** (or its skip). Currently it likely fires earlier or later — peak motivation is right after chart reveal.
- Copy: "Mornings are when this app is most useful — turn on a daily 30-second briefing tailored to your chart?"

**Effort:** 1 day.

### P1.3 — Wake-time anchor for morning push

**Diagnosis:** Cross-cutting Ability Chain audit — non-routine is the weakest link.

**Tasks:**
- New onboarding question: "When do you usually check your phone first thing in the morning?" with options 6am / 7am / 8am / 9am / later / variable.
- `src/services/notificationService.js`: schedule Cosmic Morning at user's stated time + 5 minutes (instead of 7:30am default).
- Backfill existing users on next session: prompt once with a quick picker.

**Effort:** 2 days.

### P1.4 — Personalized lapse-push copy

**Diagnosis:** Lapse cascade is generic; references nothing the user invested in.

**Tasks:**
- `src/services/notificationContentEngine.js`: rewrite `sg_lapsed_*` templates to interpolate user data:
  - Chart placement (always available)
  - Most recent partner name from Circle (if any)
  - Most recent chat topic title (if any)
- New rendering layer that picks the highest-personalization variant the user qualifies for.
- Fallback to chart-personalized if no partner/chat data.

**Effort:** 3 days.

### P1.5 — Lapse-cascade independence from streak channel

**Diagnosis:** Lapse pushes are gated on `streak_guardian` channel. Users who disable streaks get zero re-engagement.

**Tasks:**
- Move lapse cascade to its own channel (`reactivation` or similar) that's enabled by default and clearly distinct from streaks.
- Update `notificationService.js:233-256` channel reference.

**Effort:** 0.5 days.

### P1.6 — Proactive freeze offer at D2

**Tasks:**
- D2 in-app banner / modal first time: "You've got 1 free streak freeze. Save it for a busy day."
- Track `freeze_offer_shown`, `freeze_offer_acknowledged`.

**Effort:** 1 day.

### P1.7 — D7 surprise reward stack

**Tasks:**
- Add 5–6 hidden badges to `src/constants/badges.js` (off-catalog).
- `achievementService.js`: at D7 milestone, roll 30% chance of hidden badge unlock.
- New "Your first week" personalized recap card on D7, share-ready.

**Effort:** 3 days.

**Sprint 1 total:** ~12 days, can be split across two devs.

---

## P2 — Habit-formation & internal trigger (Sprint 2–3, 2–3 weeks)

### P2.1 — Weekly briefing-mode rotation

**Diagnosis:** Variable reward is finite by week 3.

**Tasks:**
- `HomeScreen.js` + `geminiService.js`: introduce a `briefing_mode` derived from `weeks_since_install % 4`.
- Modes: Standard → Pattern → Partner → Archetype.
- New Gemini prompts per mode in `geminiService.js`. Cache forecast per (user, mode, day-of-year).

**Effort:** 5 days.

### P2.2 — Internal-trigger push copy shift

**Tasks:**
- After D14, switch morning push pool from "here's your day" framing to "what's on your mind today?" framing.
- New template family in `notificationContentEngine.js`: `cm_internal_trigger_*` weighted higher for users with `weeks_since_install >= 2`.

**Effort:** 1 day.

### P2.3 — Investment-loaded event-based pushes

**Tasks:**
- Three new triggered notification jobs:
  - "Partner added 2 days ago" → "I noticed [partner]'s Mars is in your 7th house. Want to read?"
  - "Chat sent yesterday but no return" → "About what you asked yesterday — here's another angle."
  - "Journal pattern detected" (weekly) → "You wrote about [theme] N times this week."
- Detection logic in a new `src/services/engagementSignals.js`.

**Effort:** 6 days.

### P2.4 — Sticky-data surfacing on Profile (IKEA effect)

**Tasks:**
- `ProfileScreen.js`: add a "Your N days with Celestia" section showing counts of briefings, chats, journals, partners, badges, streak.
- Pull counts from existing repos.

**Effort:** 1.5 days.

### P2.5 — D14 surprise insight system

**Tasks:**
- New service `src/services/surpriseInsightService.js` — generates a one-off Gemini insight grounded in user's chart, never repeating.
- Track shown insights per user.
- 30% chance to swap into the daily briefing slot on D4, D10, D17, etc.

**Effort:** 4 days.

### P2.6 — Chat suggestion pool with indecision-keyword mining

**Tasks:**
- Light NLP over journal entries to detect "should I", "I don't know if", "what should", "torn between" patterns.
- Inject a tailored suggestion chip on home: "About [decision phrase] — want a read?"

**Effort:** 3 days.

**Sprint 2–3 total:** ~20 days.

---

## P3 — Monetization defense (post-paywall launch)

Triggered by paywall going live; not before.

### P3.1 — Cancel flow with exit survey

Per `04-churn-prevention.md`. Build in-app, single-screen flow with survey + dynamic save offer + confirmation + post-cancel.

**Effort:** 5 days.

### P3.2 — Dunning email sequence (4 emails)

Email-only path for non-IAP if/when web purchases ship; for IAP, RevenueCat handles most of this. Still need win-back email path.

**Effort:** 3 days (Customer.io or Resend integration + 4 templates).

### P3.3 — Health-score job + at-risk dashboard

PostHog SQL or Metabase view computing the weighted health score nightly.

**Effort:** 2 days.

### P3.4 — Win-back email at D30 / D60 post-cancel

Triggered email sequence. "Your chart is still here. 50% off your first month back."

**Effort:** 2 days.

### P3.5 — A/B test framework on cancel-flow variants

PostHog feature flags. Test discount %, pause duration, copy tone.

**Effort:** 2 days infra + ongoing experiments.

---

## P4 — Beyond-D30 sustainers (Sprint 4+)

Quarterly cadence, not sprint-bound.

- Solar-return / birthday trigger (`notificationService.js` date-anchored).
- Anonymous community insights ("1,247 Geminis felt off today").
- Synastry one-way notification (opt-in).
- New feature-surface drops every quarter (cosmic letter, archetype quiz, partner-only briefing).

---

## Sprint plan summary

| Sprint | Focus | Outcome |
|---|---|---|
| 0 (1 wk) | P0: analytics + RevenueCat + dashboards | Can measure retention |
| 1 (2 wks) | P1: 7 highest-leverage fixes | D1 / D7 retention move first |
| 2 (2 wks) | P2.1, P2.4, P2.5 | Variable reward + IKEA surfacing |
| 3 (2 wks) | P2.2, P2.3, P2.6 | Internal trigger formation |
| 4 (when paywall ships) | P3 | Monetization defense |
| Quarterly | P4 | Long-tail sustainers |

**Total time to complete P0–P3:** ~10 weeks of focused dev, single track. Compressible to ~6 weeks with two parallel developers.

---

## File-modification heatmap

Files most affected by this plan:

| File | Changes | Priority |
|---|---|---|
| `src/services/analytics.js` | Restore from stub | P0.1 |
| `src/contexts/RevenueCatContext.js` | Restore from stub | P0.2 |
| `src/services/notificationContentEngine.js` | Personalized lapse copy + internal-trigger templates + investment-loaded triggers | P1.4, P2.2, P2.3 |
| `src/services/notificationService.js` | Wake-time anchor, channel migration, new event-jobs | P1.3, P1.5, P2.3 |
| `src/screens/WelcomeScreen.js` | Post-chart CTA + celebration | P1.1 |
| `src/screens/OnboardingFlowScreen.js` | "Don't know birth time" path + wake-time question | P1.3 |
| `src/screens/HomeScreen.js` | Briefing mode rotation + chat suggestion mining | P2.1, P2.6 |
| `src/services/geminiService.js` | New prompts per briefing mode + surprise insight prompts | P2.1, P2.5 |
| `src/services/streakService.js` | Freeze pre-offer, fresh-start path | P1.6 |
| `src/services/achievementService.js` | Hidden badges, D7 reward stack, D28 lunar | P1.7, P2 |
| `src/screens/ProfileScreen.js` | Sticky-data surface | P2.4 |
| `src/constants/badges.js` | Hidden badges added | P1.7 |
| New: `src/services/engagementSignals.js` | Detection logic for event-based triggers | P2.3 |
| New: `src/services/surpriseInsightService.js` | Insight generation + dedup | P2.5 |
| New: `src/screens/CancelFlowScreen.js` | Exit survey + save offer | P3.1 |

---

## What success looks like at 90 days post-launch

| Metric | Target |
|---|---|
| D1 return | 50% (up from estimated 30%) |
| D7 return | 35% (up from estimated 20%) |
| D30 retention | 22% (up from estimated 10%) |
| % of D30 cohort with ≥7-day streak | 30% |
| Organic-open rate (no recent push) | 30%+ at D30 |
| Cancel-flow save rate (post-paywall) | 25% |
| Involuntary churn | <30% of total churn |
| Monthly voluntary churn | <5% |

These targets become measurable on day 1 of Sprint 0 once analytics ships.

---

## Decision points the founder needs to make

Before execution can finalize:

1. **Free vs Pro line** — what stays free forever, what gates? (Recommendation in P0.2.)
2. **Pricing** — monthly vs annual, trial duration. (Out of scope for this plan; uses `pricing-strategy` skill if needed.)
3. **Internal-trigger thesis** — confirm "uncertainty about a person/decision" is the right emotion. (Validate after first 100 power-user interviews.)
4. **Notification volume ceiling** — how many pushes per day are acceptable? Recommendation: max 2/day for habituated users, 1/day for new.
5. **Web purchase path** — if no web purchase, P3.2 dunning emails are smaller scope.
6. **Privacy/data export** — GDPR + transparency feature. Not strictly retention but unblocks "data export initiated" as a churn signal.

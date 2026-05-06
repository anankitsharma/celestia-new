# Trial Playbooks — 3-Day vs 7-Day Day-by-Day

Side-by-side tactical playbook for both trial lengths. Each day mapped to: what fires, what the user feels, which Cialdini principle is active, and what's already shipped vs missing.

---

## Why the playbooks differ

A 7-day trial allows the full Hook Model loop to run 3-4 times — enough cycles for habit formation. A 3-day trial allows at most 1-2 cycles. **Same product, different psychology because of the time available.**

Per the framework in `07-trial-retention-psychology.md`:
- 7-day trial: focuses on **commitment building + reciprocity layered + scarcity at D5**
- 3-day trial: focuses on **AHA in first session + reciprocity front-loaded + scarcity from D1**

---

## 7-DAY TRIAL (Annual plan)

### Day 0 — Purchase day (T+0)

**Fires:**
- `purchase_completed` event
- `WelcomeToProScreen` renders (Sub-3) replacing native Alert
- 3 hero cards: weekly report / Circle / chat
- Subtle gold shimmer + `haptic.success()`
- (If existing user) chat-followup push scheduled +24h
- Pro Insight card available on Today tab (TIER2-D)

**User feels:** +5 (peak). "I just got everything."

**Active principles:**
- ✅ **Reciprocity** — entire screen is reciprocity in action
- ✅ **Liking** — personalization references their chart
- ⚠️ **Authority** — implicit; could be explicit ("Your chart, mathematically computed from NASA JPL ephemeris")

**Conversion lever:** the user must tap at least one hero card. Target: 60%+ tap rate.

### Day 1 — First return

**Fires:**
- `cm_d1_personal` push at user's wake time (FINAL-4)
- Body references their D0 reveal statement
- Pro Insight card refreshes with new content

**User feels:** +3 to +4. "They remembered me."

**Active principles:**
- ✅ **Liking** — personalized callback
- ⚠️ **Commitment** — streak ticked to 1; not visibly highlighted yet

**Conversion lever:** D1 return is the lead indicator of trial-→-paid conversion.

### Day 2 — Habit start

**Fires:**
- Cosmic morning push
- D2 freeze offer modal (P1.6) — *"You've got 1 free streak freeze..."*
- Pro Insight refreshes

**User feels:** +2 to +3. The plateau.

**Active principles:**
- ✅ **Commitment** — freeze offer asks them to acknowledge they're building something worth protecting
- ⚠️ **Social proof** — currently nothing; could be added: *"Most Pros are reading 6 daily briefings by now."*

### Day 3 — First Pro feature push

**Fires:**
- `proEngagementService` schedules first feature-discovery push
- Streak hits 3 → ✦ → milestone modal: *"Three days. The first sign you mean it."* (DA-1.3 voice)
- Hidden-badge surprise roll (no roll at D3 yet — first roll is at D7 hidden-pool)
- Pro Insight refreshes

**User feels:** +4. Streak milestone hit.

**Active principles:**
- ✅ **Reciprocity** — Pro discovery push points at value they haven't claimed
- ✅ **Commitment** — milestone confirms "I am consistent"

### Day 4 — Variable reward

**Fires:**
- Surprise insight 30% roll (P2.5) — if it hits, a unique chart-grounded observation card appears

**User feels:** +4 if roll lands; +2 if not.

**Active principles:**
- ✅ **Reciprocity** — unexpected, personal, free
- ✅ **Liking** — depth of personalization

### Day 5 — Trial-end reminder

**Fires:**
- Trial-end push at user's morning time (Sub-2 + voice rewrite)
- *"Two days. We don't want to charge you if you don't want this. [N] briefings, [M] chats, [P] journal entries — what you've built so far. You keep it all either way."*

**User feels:** +1 to +2. The decision-point lands non-anxiously.

**Active principles:**
- ✅ **Scarcity** — time-bounded, ethical
- ✅ **Reciprocity** — the stats remind them what they've received
- ✅ **Commitment** — quantifies the body of work they've created
- ❌ **Social proof** — gap. *"82% of trial users who built [N] journals stay subscribed at month 3"* would land hard here.

### Day 6 — Anticipation

**Fires:**
- D6 anticipation push (FINAL-1) if streak === 6: *"One more morning. Then it counts."*

**User feels:** +3. Anticipation peak.

**Active principles:**
- ✅ **Commitment** — milestone within reach
- ✅ **Liking** — the voice continues to feel earned

### Day 7 — Conversion / churn

**Fires:**
- Charge processed (or trial-cancellation if pre-cancelled)
- If still subscribed: streak hits 7 → `stargazer` badge + 30% hidden-badge roll + first-week recap modal (CA-A4) referencing onboarding statement
- Permission re-ask if previously declined (FINAL-5)

**User feels:** +5 (PEAK) if paid + recap fires. -3 if surprise charged + felt rushed.

**Active principles:**
- ✅ **Commitment** — week milestone is the strongest commitment-anchor in the entire user journey
- ✅ **Reciprocity** — recap card is a felt gift
- ⚠️ **Unity** — could be made explicit: *"You're in the 12% who stay this consistent."*

---

## 3-DAY TRIAL (Monthly plan)

### Day 0 — Purchase day (T+0)

**Same as 7-day:** Welcome to Pro screen + 3 hero cards.

**User feels:** +5

**Differs:** the user MUST take an action today. There's no "I'll explore tomorrow" runway.

**Recommended addition:** a sub-headline on Welcome to Pro for monthly-trial users:
> *"You've got 3 days. Most users find their best read in the first."*

(Sets expectation honestly; uses social proof; primes urgency without panic.)

### Day 1 — First return + first decision push

**Fires:**
- Cosmic morning push (`cm_d1_personal`)
- Pro Insight on Today

**Recommended (gap):** also fire the FIRST Pro feature-discovery push on D1, not D3. The current `proEngagementService` schedule fires at D3 + D7 — both AFTER a 3-day trial has charged or ended. **The Pro-discovery push schedule is mistuned for 3-day trials.**

### Day 2 — Trial-end reminder

**Fires:**
- Trial-end push (Sub-2) — currently fires when `daysUntilExp ∈ [2, 3]`. For a 3-day trial, that's D0/D1, possibly missed.

**Recommended fix:** for 3-day trials, fire the trial-end push at D1 (1 day before charge), not D2. Adapt push schedule to trial length.

**User feels:** +2 to +3 if push lands; -2 if charged surprise on D3.

**Active principles:**
- ✅ **Scarcity** — strong
- ⚠️ **Reciprocity** — only 1-2 days of stats available
- ❌ **Commitment** — no streak milestone reached yet (needs 3 days), no journal habit yet

**This is the structural weakness of 3-day trials**: the scarcity pressure is high but the commitment pressure (which produces the *desire to stay consistent*) hasn't built yet.

### Day 3 — Charge / cancel

**Fires:**
- Charge processed OR cancellation
- If charged: same as 7-day Day 0 + Day 7 mashed together

**User feels:** +3 if smooth; -4 if surprise charge.

---

## Side-by-side scorecard

| Lever | 7-day trial coverage | 3-day trial coverage |
|---|---|---|
| Welcome to Pro reciprocity | ✅ D0 | ✅ D0 |
| Personalized D1 push | ✅ D1 | ✅ D1 |
| Pro feature discovery | ✅ D3 + D7 | ❌ D3 = AT charge; D7 = post-charge. Gap |
| Trial-end reminder | ✅ D5 | ⚠️ Borderline (window catches D0-D1, possibly missed) |
| Streak milestone modal | ✅ D7 (stargazer) | ❌ Doesn't trigger (3 days < 7) |
| First-week recap | ✅ D7 | ❌ Doesn't trigger |
| D6 anticipation push | ✅ D6 | ❌ Doesn't trigger |
| Surprise insight roll | ✅ D4 | ❌ Doesn't fire (D4 = post-trial) |
| Hidden-badge surprise | ✅ D7 (30% roll) | ❌ Doesn't fire |
| Commitment-stack moments | 5+ across the week | 1-2 maximum |
| Social proof | ❌ None (gap on both) | ❌ None (gap on both) |
| Unity language | ❌ Implicit only | ❌ Implicit only |

**The 7-day trial gets ~10 retention touchpoints. The 3-day trial gets ~4.** Same product, dramatically different conversion potential.

---

## Conversion model — back-of-envelope

Industry benchmarks (consumer subscription apps):
- **3-day trial → paid conversion:** 30-45%
- **7-day trial → paid conversion:** 55-70%

**Why the gap is structural:**
- Hook Model needs 3-4 cycles for habit formation. 3 days = 1-2 cycles.
- Cialdini commitment-stack needs ≥3 micro-commitments. 3 days = 1-2 commitments.
- Trial-end scarcity peaks at 2 days before charge. 3-day trial = scarcity from D1.
- First-week recap (the strongest commitment-anchor) fires at D7. 3-day trial misses it entirely.

**Implication for Celestia's monthly plan:** the 3-day trial is conversion-suboptimal for the Inner-Work Practitioner audience.

**Three options:**
1. **Standardize on 7 days.** Best conversion. Industry norm for $5-10/month subscription apps.
2. **Tier trials: 3-day for monthly, 7-day for annual.** Acceptable but introduces UX inconsistency + needs adaptive trial-end push timing.
3. **Eliminate monthly plan; offer only annual with 7-day trial.** Cleanest. Forces commitment, raises ARPU. Industry trend (Calm, Headspace).

---

## What changes if you keep 3-day trial

If the business decision is to keep the 3-day monthly trial despite the structural disadvantage, these code changes are non-negotiable:

| Fix | Effort | Why |
|---|---|---|
| Adaptive trial-end push timing (1 day before charge for 3-day trials) | S | Currently borderline-broken |
| First Pro feature-discovery push on D1 instead of D3 | S | Currently fires at charge moment, useless |
| Compress the Welcome to Pro CTA priming: *"You've got 3 days. Pick the most important read."* | S | Sets expectation honestly |
| D2 abridged "what you've built" surface (since no streak, no journal cluster yet) | M | The retention scaffolding's normal commitment-anchors don't fire in time |
| Stronger D0 onboarding-completion → first-action funnel for monthly trialists | M | Less time to recover from D0 drop-off |

---

## What changes if you standardize on 7 days

Code-side delta: minimal. PaywallScreen.js:222 changes from:
```js
const chargeDay = selectedPlan === 'annual' ? 7 : 3;
```
to:
```js
const chargeDay = 7;
```

Plus update `OnboardingFlowScreen.js:809` to say "7-day trial" for monthly (currently already does — there's an inconsistency in the code today).

Plus sync RevenueCat trial config in App Store Connect / Google Play Console to match (admin work).

This is the recommended path. The 7-day trial conversion playbook is fully shipped.

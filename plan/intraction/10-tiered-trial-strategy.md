# Tiered Trial Strategy — Reward Annual, Not Penalize Monthly

The 3-day monthly / 7-day annual asymmetry is the **standard pattern** for premium consumer subscription apps. It's a marketing lever to nudge users toward annual, not a retention design problem. This doc replaces the "standardize on 7 days" recommendation in `08-trial-playbooks.md` with a tiered-by-design strategy.

This is how Headspace, Calm, and others structure it. Done right, it improves overall LTV by shifting plan mix toward annual without hurting monthly conversion below acceptable floors.

---

## The strategic intent

Two trial lengths, three jobs:

| Trial | Plan | Job |
|---|---|---|
| **3-day** | Monthly | Convert price-sensitive / commitment-cautious users at acceptable rate. Filter out non-believers fast. |
| **7-day** | Annual | Reward higher-LTV commitment with extra evaluation time. Build full habit during trial. |
| **Asymmetry visibility** | PaywallScreen | Make the 7-day trial *visible as a feature of annual*, not invisible UX inconsistency. |

The third job is the one most apps fail at. If a user picks monthly without realizing they could've gotten 7 days by picking annual, the asymmetry gives you nothing. **The reward only works if it's seen.**

---

## How premium apps execute this

| App | Monthly trial | Annual trial | Asymmetry callout on paywall |
|---|---|---|---|
| Headspace | 0-7 days | 14 days | "14-day free trial" badge on annual only |
| Calm | 7 days | 7 days | Discount on annual instead |
| Apple Fitness+ | 1 month | 3 months | "3-month free trial with annual" |
| Duolingo Super | 3 days | 14 days | "Save up to 60%" + longer trial |
| Strava | 30 days | 60 days | Both annual perks displayed |

**Pattern:** the longer trial is *named and shown* as part of the annual plan's value proposition. Never hidden as a side-effect of plan choice.

---

## What needs to change in Celestia

### 1. PaywallScreen — make asymmetry visible

Currently `chargeDay = selectedPlan === 'annual' ? 7 : 3` runs silently. The user sees a single "Free trial" framing without realizing the trials differ.

**Required PaywallScreen changes:**

- **Annual card:** add a "7-day free trial" pill above price line, distinct from monthly card.
- **Monthly card:** show "3-day free trial" — small, neutral, not punitive.
- **Above CTA:** swap generic "Start free trial" for plan-aware copy:
  - Annual selected: *"Start 7-day free trial — then $X/year"*
  - Monthly selected: *"Start 3-day free trial — then $Y/month"*
- **Annual savings badge:** existing "Save X%" should now also include "+ 4 extra trial days." (Phrase as benefit, not deduction from monthly.)

Why: the user must perceive the asymmetry as a *bonus on annual*, not a *penalty on monthly*. Same delta, opposite frame.

### 2. OnboardingFlowScreen.js:809 — fix the inconsistency

Currently says "7-day trial" for both plans. This must match PaywallScreen reality:
- Show plan-matched trial copy at the onboarding paywall surface
- Or remove specific number from onboarding-stage copy and let PaywallScreen own it

### 3. notificationService — adaptive trial-end push timing

Current Sub-2 fires when `daysUntilExp ∈ [2, 3]`. For a 3-day trial, that window is D0/D1 and may miss the user.

**Fix:** read the trial length from RevenueCat customerInfo (or infer from `originalPurchaseDate` + product duration), and:
- **7-day trial:** fire trial-end push at D5 (2 days before charge) — current behavior, fine.
- **3-day trial:** fire trial-end push at D1.5 (~36h before charge), morning of D2 user-local. Single push, not a window.

This is one helper function in `notificationService.js`. Call it from the same place Sub-2 is called today. Don't reuse the [2,3] window for 3-day trials.

### 4. proEngagementService — adaptive Pro feature discovery push timing

Current schedule: D3 + D7. For a 3-day trial, D3 is at-charge (useless) and D7 is post-trial-end-or-charged.

**Fix:** branch on trial length.
- **7-day trial:** keep D3 + D7 (these align with full-week milestones).
- **3-day trial:** schedule single push at D1 morning. *"You unlocked Pro. The fastest read for [user.motivation] is the [matched feature]."*

### 5. WelcomeToProScreen — trial-aware sub-headline

A single sub-line below the existing 3 hero cards header:
- 7-day trial users: *"You've got 7 days. Most members find their first read in the first 24 hours."*
- 3-day trial users: *"You've got 3 days. Pick the one read that matters most."*

Sets honest expectation. Subtly nudges into action. Acknowledges the time they have without anxiety.

---

## 3-Day Trial Playbook (Monthly) — compressed

**Operating principle:** AHA in D0, decision-clarity by D1.5, no fluff.

### Day 0 (purchase)

- WelcomeToProScreen renders with 3-day-aware sub-line
- User MUST tap a hero card before exiting (track via PostHog `welcome_to_pro_card_tapped`)
- `cm_d1_personal` push scheduled for next morning (already shipped)
- Pro daily insight available immediately on Today

**Conversion lever:** Hero-card tap rate target ≥70% (higher than 7-day target because 3-day users have less recovery time if they skip).

### Day 1 (~24h post-purchase)

- Morning: `cm_d1_personal` personalized push fires
- Open: Pro daily insight + Pro feature discovery push (NEW timing — D1 not D3)
- Indecision-keyword journal mining works if user journals
- AI chat available with first-message pre-fill

**Conversion lever:** Active session count. If user has 0 sessions on D1, push the trial-end reminder earlier (D1.5).

### Day 2 (~48h post-purchase, ~24h pre-charge)

- Morning: trial-end push fires (NEW adaptive timing)
- Copy: *"Tomorrow your trial ends. Two days, [N] briefings, [M] chat[s], [P] journal entr[ies]. You keep the chart, the Circle, all of it — even if you cancel."*
- Indecision flow ready if they hesitate

### Day 3 (charge or cancel)

- Charge processed OR cancel-flow surfaced
- If charged: 3-day milestone is the FIRST commitment-anchor. Surface a small modal: *"Three days. The first sign you mean it."* (can reuse DA-1.3 milestone copy)
- If pre-cancelled: cancel-flow save offer lands

**Realistic conversion target:** 30-40%. This is a known structural ceiling — don't chase 60%.

---

## 7-Day Trial Playbook (Annual) — full habit-formation arc

Already documented in `08-trial-playbooks.md`. Summary of what fires:

| Day | What fires | Principle hit |
|---|---|---|
| D0 | WelcomeToProScreen, "7 days" framing | Reciprocity + Liking |
| D1 | `cm_d1_personal` | Liking + Commitment (streak=1) |
| D2 | Streak freeze offer modal | Commitment |
| D3 | Streak milestone + first Pro discovery push | Commitment + Reciprocity |
| D4 | Surprise insight (30% roll) | Reciprocity |
| D5 | Trial-end push (full window copy) | Scarcity |
| D6 | Anticipation push (FINAL-1) | Commitment |
| D7 | Stargazer badge + first-week recap modal + charge | Commitment (peak) + Reciprocity |

**Realistic conversion target:** 55-70%. Aspirational target for Inner-Work Practitioner audience: 60%+.

---

## Why this works as a *reward* not a *penalty*

Loss aversion (Cialdini scarcity / Kahneman): users reframe choices based on framing. If the same 4-day delta is presented as:

- ❌ *Penalty:* "Monthly gets less time" → users feel cheated, monthly conversion drops *below* its structural ceiling.
- ✅ *Reward:* "Annual gets bonus time + savings" → users feel pulled toward annual, and monthly users don't feel resentful — they got what was clearly advertised.

The technical implementation is the same. The framing on PaywallScreen is the entire game.

---

## Plan-mix expectations

If executed well:

| Metric | Today (likely) | Target |
|---|---|---|
| Annual share of trial starts | ~30-40% | 50-60% |
| Annual trial → paid | 55-65% | 60-70% |
| Monthly trial → paid | 30-40% | 35-45% |
| Blended ARPU | baseline | +15-25% |

The blended ARPU lift comes mostly from plan-mix shift, not conversion-rate increases. **That's the entire point of tiered trials.**

---

## Code-level fix list

| # | Fix | File | Effort |
|---|---|---|---|
| **C1** | "7-day free trial" pill on annual card; "3-day free trial" pill on monthly card | `PaywallScreen.js` | S |
| **C2** | Plan-aware CTA copy ("Start 7-day…" / "Start 3-day…") | `PaywallScreen.js` | XS |
| **C3** | Annual savings badge: append "+ 4 bonus trial days" | `PaywallScreen.js` | XS |
| **C4** | Fix onboarding step 14 trial-length copy to match PaywallScreen | `OnboardingFlowScreen.js:809` | XS |
| **C5** | `getTrialLengthDays()` helper that reads RevenueCat customerInfo | `RevenueCatService.js` (new export) | S |
| **C6** | Adaptive trial-end push timing — fire at D1.5 morning for 3-day, D5 for 7-day | `notificationService.js` Sub-2 caller | M |
| **C7** | Adaptive Pro discovery push timing — D1 single push for 3-day, D3+D7 for 7-day | `proEngagementService.js` | S |
| **C8** | WelcomeToProScreen plan-aware sub-line | `WelcomeToProScreen.js` | XS |
| **C9** | (Optional) D1 mini-milestone modal for 3-day trialists who completed Day 1 | `HomeScreen.js` | M |

**Total: ~1 day of dev work.** All non-controversial. All revert-safe.

---

## What does NOT change

These were called out as gaps in `09-trial-implementation-status.md` and remain valid regardless of trial-length strategy:

- **Social proof (0/10)** — still the biggest unrealized lever for both plans
- **Unity copy** — still missing on Welcome to Pro + Paywall
- **Goal-echo from onboarding** — still missing on Today
- **Explicit authority cues** — still missing on reports

These are independent of trial length. Ship them after C1-C8.

---

## Updated recommendation

Replace the "Three options" section of `08-trial-playbooks.md` with this:

> **Keep tiered trials (3-day monthly / 7-day annual) as the standard premium-app pattern.** The trial-length asymmetry is a marketing lever to bias plan choice toward annual, not a UX bug. Make the asymmetry visible on PaywallScreen (the reward is only useful if seen). Adapt push timing to trial length so 3-day trials don't break. Accept that 3-day conversion ceilings (30-45%) are structurally lower than 7-day (55-70%) — this is the price of price-flexibility, not a problem to solve.

---

## One-sentence answer to "how do we reward annual"

> **Make the 7-day trial visible as part of annual's value proposition on PaywallScreen, fix the four adaptive-timing bugs that break the 3-day trial today (~1 day of work), and stop trying to compensate for the 3-day trial's lower conversion ceiling — that ceiling is the design.**

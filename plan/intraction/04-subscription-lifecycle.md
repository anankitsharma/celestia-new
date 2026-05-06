# Stage 4 — Subscription lifecycle

Trial → Paid → renewal → cancellation (or churn). Every subscriber-retention surface shipped this session. Most-instrumented part of the journey.

## Sub-stage 4.1 — Trial start

**Triggers:**
- User taps Pro CTA on Profile / Reports / locked features
- User taps "Go Pro" from soft paywall during onboarding (step 12)
- User taps any of the upgrade nudges scattered around the app

**Code path:**
1. PaywallScreen presents (fullscreen modal via `presentation: 'fullScreenModal'`)
2. User picks plan: Annual `$49.99/yr` or Monthly `$6.99/mo`
3. RevenueCat purchase flow opens (Apple/Google IAP sheet)
4. User authenticates + purchases — 7-day free trial begins

**Analytics:**
- `paywall_viewed` (with source, variant)
- `paywall_plan_switched` (when user toggles plans)
- `purchase_tapped` (with plan, source, variant)
- `purchase_completed` (with plan, source, variant)
- `purchase_failed` / `purchase_cancelled` if relevant

**Post-purchase:**
- Native Alert REPLACED in Sub-3 with: `navigation.replace('WelcomeToPro', { firstTime: !user })`
- `WelcomeToProScreen` renders

---

## Sub-stage 4.2 — Welcome to Pro

**Screen:** `WelcomeToProScreen.js` — fullscreen modal slide-up.

**What renders:**
1. Subtle gold shimmer animation on central ✦ glyph
2. `haptic.success()` on mount
3. Kicker: "WELCOME TO PRO"
4. Headline: *"You've unlocked everything."*
5. Sub: *"Three places to start:"*
6. **3 hero cards** (now using PressableCard with scale 0.98 + Material ripple):
   - ✦ Generate your weekly chart reading → Reports tab
   - ♡ Add the people who matter to your Circle → Circle tab
   - 💬 Ask Celestia anything — no daily limit → AskAI tab
7. Ghost button: *"I'll explore on my own →"*

**Branching for first-time vs existing-account users:**
- `firstTime: true` (no account) → tap routes through `Auth` screen first to protect subscription
- `firstTime: false` (account exists) → tap navigates directly to feature

**Analytics:**
- `welcome_to_pro_shown`
- `welcome_to_pro_card_tapped` (with card id: 'weekly_report' / 'circle' / 'chat')
- `welcome_to_pro_dismissed` if "explore on my own" tapped

**Emotional state:** +5 (PEAK). Bridges the expectation/delivery gap that drives subscriber churn.

---

## Sub-stage 4.3 — Day 0-3 of being Pro

**Pro-only daily insight on Today (TIER2-D):**
- Cached per `(profileId, dateLabel)`
- "PRO INSIGHT" gold-bordered card sits between navigator briefing and Navigate Toward
- Each day: a NEW Gemini-generated 2-3 sentence chart × transit psychological observation
- Has a share button (↗) → fires `share_initiated` with source='pro_insight'

**Day 3 — first Pro feature discovery push (Sub-4):**
- `proEngagementService.maybeScheduleProDiscoveryPush()` selects highest-rank untried feature
- Push fires next morning at user's wake-time
- Voice (per voice-guide): *"You haven't opened a weekly read yet. The next 7 days will be different than this week. The read is already written."*

**Analytics:**
- `pro_discovery_push_scheduled` (with feature, discovery_day=3)
- `push_opened` (with template_id=event_pro_discovery_weekly_report) if tapped

---

## Sub-stage 4.4 — Day 5 of trial — the danger window

**Trigger:** `entitlement.periodType === 'TRIAL'` AND `daysUntilExpiration` ∈ [2, 3].

**Trial-end reminder push fires (Sub-2 / FINAL-3 voice rewrite):**
- Schedule: 2 days before trial expiration, at user's morning time
- Body interpolates real stats (briefings read / chats sent / journals written)
- Title: *"Two days. We don't want to charge you if you don't want this."*
- Body: *"[N] briefings, [M] chats, [P] journal entries — what you've built so far. You keep it all either way."*

**Why it matters:** Single biggest churn driver — refund-anxiety surprise. This push prevents auto-charge resentment.

**Analytics:**
- `trial_ending_push_scheduled` when scheduled (visible in dev)
- `push_opened` (template_id=event_trial_ending) if tapped

---

## Sub-stage 4.5 — Day 7 — first Pro week recap (TIER2-F)

**Triggers in cascade when streak hits 7:**
1. Streak milestone modal (with rewritten DA-1.3 voice)
2. **First-week recap modal** (Gemini-generated, references onboarding reveal — CA-A4)
3. **For Pro users:** also a separate Pro week-1 recap modal — TIER2-F:
   - **Engaged variant:** if user used 2+ Pro features → recap of what they did
   - **Light-user variant:** if user used 0-1 Pro features → "Most Pros use [feature] in their first week. Try it?" with CTA to suggested feature
4. Day 7 also fires the second Pro discovery push for the next-rank untried feature

**Code:** HomeScreen detects:
- `entitlement.originalPurchaseDate` exists
- Days since Pro purchase ∈ [7, 9]
- `PRO_WEEK1_RECAP_SHOWN_AT` not set

→ generates via `generateProWeek1Recap()`, caches in `PRO_WEEK1_RECAP`, persists shown-flag.

---

## Sub-stage 4.6 — Cancel flow (the save-rate moment)

**Trigger:** Pro user taps "Manage subscription" row in Profile → routes to `CancelFlowScreen` (registered as fullscreen modal in AppNavigator).

**Step 1 — Exit survey:**

For trial users (detected via `entitlement.periodType === 'TRIAL'`), the reason set differs (TIER2-E):

**Trial reasons:**
- Didn't have time to try it properly
- Tried it, not what I was hoping for
- Forgot I had a trial — don't want to be charged
- Helpful, but not ready to commit
- Privacy concerns
- Switching to another app
- Other

**Established subscriber reasons:**
- Too expensive
- Not using it enough
- Missing a feature I need
- The insights felt too generic
- Privacy concerns
- Just don't need it right now
- Switching to another app
- Other

**Step 2 — Save offer (REASON × VARIANT):**

For each reason, save offer copy varies by PostHog feature flag `cancel_flow_variant`:
- `control` (default)
- `data-loss` (emphasizes what they lose access to)
- `value-deepening` (emphasizes that staying makes Celestia smarter)

Plus a sticky-counts panel showing the user's accumulated investment (days / journals / chats / partners) — IKEA effect surfaced.

**Step 3 — Confirmation:**
- Trial-aware copy: *"You'll keep full access until your trial ends — no charge if you cancel before then."*
- Or paid-aware: *"You'll keep full access until the end of your billing period."*
- Big "Continue to subscription settings" button → deep-links to App Store or Google Play

**Analytics fired through the flow:**
- `cancel_flow_started`
- `cancel_flow_variant_detected` (with is_trial)
- `cancel_variant_assigned` (PostHog flag value)
- `cancel_reason_selected` (with reason, variant, is_trial)
- `cancel_save_offer_shown`
- `cancel_save_offer_accepted` OR `_declined`
- `cancel_confirmed` if user actually deep-links to settings
- `cancel_flow_abandoned` (with last_step + reason if user closes mid-flow)

**Emotional state:** +1 (if save offer resonates) to -3 (if user feels coerced or confused)

---

## Sub-stage 4.7 — Pre-billing renewal alert (annual users)

**Trigger:** RevenueCat `entitlement.willRenew === true` AND annual plan AND `daysUntilExp` ∈ [5, 9].

**Push fires 7 days before renewal:**
- Voice (DA-3.5 cosmic cleanup): *"Seven days. Your annual renews."*
- Body: *"On [date]. Manage in Profile any time. Just letting you know."*

**Why it matters:** Reduces involuntary-by-surprise churn. Users who forget they're paying annually feel scammed when the charge hits.

---

## Sub-stage 4.8 — Subscription-ending alert (FINAL-3)

**Trigger:** `entitlement.willRenew === false` AND `daysUntilExp` ∈ [4, 6].

**Push fires 5 days before access ends:**
- *"Five days."*
- *"Your data stays no matter what. Just letting you know where things are."*

**Why this is distinct from cancel-flow:** This catches users who cancelled silently (didn't go through CancelFlow) OR whose payment is failing. Win-back opportunity.

---

## Sub-stage 4.9 — Win-back (post-cancel)

**Email side:** Templates exist in `plan/retaintion-new/email-templates/` (D30 / D60 / D90 post-cancel) — ready for any email provider integration.

**In-app side:** Currently nothing. Once user cancels + access ends, the app is silent unless they reopen voluntarily. Future opportunity: lapsed-Pro nudges in the app on reopen.

---

## Subscription lifecycle metrics (per `plan/retaintion-new/04-churn-prevention.md`)

| Metric | Target |
|---|---|
| Monthly voluntary churn | < 5% |
| Cancel-flow save rate | 25–35% |
| Save-offer acceptance | 15–25% |
| Pause reactivation (when shipped) | 60–80% |
| Dunning recovery (overall, when email lands) | 50%+ |
| Involuntary churn (% of total) | < 30% |

These become measurable once PostHog cohorts are configured.

---

## Risk points + mitigations

| Risk | Mitigation in code |
|---|---|
| User auto-charged at trial end without remembering they're in trial | `cm_trial_ending` push 2 days before charge (Sub-2) |
| User pays, never opens Pro features, cancels at month 2 ("not using it") | Welcome to Pro 3 hero cards (Sub-3) + Day 3/7 feature-discovery pushes (Sub-4) |
| User forgets they're on annual plan | Pre-billing renewal alert 7 days before (EXTRA-6) |
| User cancels silently (skips CancelFlow) | Subscription-ending alert (FINAL-3) catches the willRenew-false case |
| Trial user has different mental model than paid | Trial-cancel-flow variants (TIER2-E) |
| Generic save offers that don't match cancel reason | REASON × VARIANT save-offer matrix in CancelFlowScreen |

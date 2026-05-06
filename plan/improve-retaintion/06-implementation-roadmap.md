# Implementation Roadmap

Sequence + acceptance + file references for shipping the subscriber-retention fix.

## Sprint plan

| Sprint | Items | Outcome |
|---|---|---|
| **Sprint A** (this PR) | Tier 1: A + B + C | Trial-end push + Welcome to Pro + Pro discovery pushes |
| **Sprint B** (after 14d data) | Tier 2: D, F, E in that order | Pro daily layer + Pro week-1 recap + trial-cancel variants |
| **Ongoing** | Tier 3: G + H | PostHog funnel setup, monthly refund review |

## Sprint A — implementation order

Order matters because of file dependencies:

### Step 1 — Add new analytics events (5 min)

`src/services/analytics.js` — add to `EVENTS`:

```js
// Tier 1 — subscriber retention
TRIAL_ENDING_PUSH_SCHEDULED:        'trial_ending_push_scheduled',
WELCOME_TO_PRO_SHOWN:               'welcome_to_pro_shown',
WELCOME_TO_PRO_CARD_TAPPED:         'welcome_to_pro_card_tapped',
WELCOME_TO_PRO_DISMISSED:           'welcome_to_pro_dismissed',
PRO_DISCOVERY_PUSH_SCHEDULED:       'pro_discovery_push_scheduled',
```

### Step 2 — Trial-end reminder push (Fix A, ~1 hour)

`src/services/notificationService.js` — add a new block in `scheduleAllNotifications` mirroring the existing pre-billing block. Detect `entitlement.periodType === 'TRIAL'` and schedule 2 days before expiration with personalized stats.

Files modified: `notificationService.js`

### Step 3 — WelcomeToProScreen (Fix B, ~2-3 hours)

3a. NEW `src/screens/WelcomeToProScreen.js` — the screen with 3 hero cards.

3b. `src/navigation/AppNavigator.js` — register as fullscreen modal:

```js
<Stack.Screen
  name="WelcomeToPro"
  component={WelcomeToProScreen}
  options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
/>
```

3c. `src/screens/PaywallScreen.js` — replace the post-purchase Alert with `navigation.replace('WelcomeToPro', { firstTime: !user })`. Keep the `firstTime` branch routing through Auth as before, but route from inside WelcomeToProScreen card-taps.

Files modified: `WelcomeToProScreen.js` (new), `AppNavigator.js`, `PaywallScreen.js`.

### Step 4 — Pro feature discovery (Fix C, ~2-3 hours)

4a. NEW `src/services/proEngagementService.js` — `detectUntriedProFeature()` + `maybeScheduleProDiscoveryPush()`.

4b. `src/services/storage.js` — add `PRO_FEATURE_NUDGED_AT` storage key.

4c. `src/services/notificationService.js` — call `maybeScheduleProDiscoveryPush()` from `scheduleAllNotifications`.

Files modified: `proEngagementService.js` (new), `storage.js`, `notificationService.js`.

### Step 5 — Verify

For each fix, syntax-check via `node -c <file>` and confirm by reading event names + reviewing logic.

## File modification summary

| File | Touched in | Change |
|---|---|---|
| `src/services/analytics.js` | Step 1 | Add 5 new EVENTS |
| `src/services/notificationService.js` | Steps 2 + 4c | Trial-end push block + Pro discovery push block |
| NEW `src/screens/WelcomeToProScreen.js` | Step 3a | New screen |
| `src/navigation/AppNavigator.js` | Step 3b | Register WelcomeToPro route |
| `src/screens/PaywallScreen.js` | Step 3c | Replace Alert with navigation |
| NEW `src/services/proEngagementService.js` | Step 4a | New service |
| `src/services/storage.js` | Step 4b | Add storage key |

7 files touched, 2 new. Syntax-clean each step before moving on.

## Acceptance criteria — combined

After Sprint A ships:

### Trial-end (Fix A)
- [ ] Pro user in trial sees push at day 5 (2 days before charge)
- [ ] Push body includes real stats (journal/chat/briefing counts)
- [ ] No double-scheduling

### Welcome to Pro (Fix B)
- [ ] PaywallScreen no longer shows native Alert post-purchase
- [ ] WelcomeToProScreen renders with 3 cards + secondary CTA
- [ ] Each card routes to the relevant Pro feature (or auth flow if first-time)
- [ ] Analytics events fire on shown / tapped / dismissed

### Pro discovery (Fix C)
- [ ] On day 3 + day 7 of being Pro, push fires for highest-rank untried feature
- [ ] Per-feature dedup via `PRO_FEATURE_NUDGED_AT` (max one push per feature per 14 days)
- [ ] Push tap deep-links to the relevant tab

## Validation plan

Once shipped, validate over 14 days in PostHog:

1. **Welcome-to-Pro funnel** — % of `PURCHASE_COMPLETED` that produces `WELCOME_TO_PRO_CARD_TAPPED`. Target: 60%+.
2. **Trial-end push effectiveness** — among trial users who got the push, what % converted vs. those who didn't. (You'll naturally have a hold-out: users whose trial ended on a day before this code shipped.)
3. **Pro discovery push opens** — `push_opened` with `template_id LIKE 'event_pro_discovery_%'`. Target: 25%+ open rate.
4. **D7 paid retention** — % of trial-converted users still active on day 7 of being paid. Tier 1 should move this from baseline.
5. **D30 paid retention** — same at day 30. The headline metric.

## Rollback plan

Each fix is independently reversible:
- Fix A: comment out the new block in `scheduleAllNotifications`
- Fix B: revert PaywallScreen to use Alert; navigate-only stub keeps WelcomeToProScreen safe
- Fix C: comment out the call to `maybeScheduleProDiscoveryPush`

No DB migrations; no external dependencies. Safe to ship → measure → iterate.

## What's NOT in Sprint A

Explicitly deferred to keep Sprint A focused:
- Pro daily-briefing section (Fix D — Tier 2)
- Trial-cancel-flow variants (Fix E — Tier 2)
- Pro week-1 recap card (Fix F — Tier 2)
- PostHog funnel setup (Fix G — Tier 3, admin)
- Refund analysis (Fix H — Tier 3, manual)

These ship after Tier 1 has 14 days of data to inform whether they're still the right next bets.

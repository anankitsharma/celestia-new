# Fix C — Day 3 + Day 7 Pro feature-discovery pushes

**Status: Tier 1 — must ship**

## The cancellation pattern this fixes

Subscriber cancels in week 2 or month 2. Cancel reason: "not using it enough."

The actual cause: the user paid for 5 specific premium features. They've been using 1 of them (whatever drove the conversion). The other 4 are invisible.

Without push, they will never discover what they're paying for. They cancel because subjectively they're "only using one thing." The product never told them.

## Trigger conditions

For each user with active Pro subscription:
- **Day 3 post-purchase** — first feature-discovery push
- **Day 7 post-purchase** — second feature-discovery push (only if Day 3 didn't land or different feature)

We compute "days since Pro purchase" from `entitlement.originalPurchaseDate`.

The push is **only sent if the user hasn't tried the feature**, measured via the existing PostHog events:
- `REPORT_GENERATED` for weekly/monthly/compatibility/etc.
- `CHART_DEEP_DIVE` for placement deep-dives
- `COMPATIBILITY_CHECKED` for synastry
- `PARTNER_ADDED_TO_CIRCLE` (count > 1) for Circle expansion

## Selection logic

We rank Pro features by perceived value. Pick the highest-ranked one the user hasn't tried.

| Rank | Feature | Untried-detection |
|---|---|---|
| 1 | Weekly chart report | No `REPORT_GENERATED` event with `report_type: 'weekly'` |
| 2 | Placement deep-dive | No `CHART_DEEP_DIVE` event with `type: 'planet'` |
| 3 | Compatibility / synastry deep | No `COMPATIBILITY_CHECKED` events at all |
| 4 | Unlimited Circle (more than 3 partners) | `partnerProfiles.length <= 3` |
| 5 | Unlimited chat | already free for first 10/day, Pro is the next bracket; harder to detect untried |

Day 3 picks rank 1 if untried, else rank 2, etc.
Day 7 picks the next-highest untried (skipping whatever Day 3 nudged).

## Push copy

Each feature has a tailored push:

### Weekly chart report
```
Title: "Your custom weekly read is ready"
Body:  "You're paying for it — give it 30 seconds. Pulled from your real transits, not your sun sign."
```

### Placement deep-dive
```
Title: "There's more in your chart than you've seen"
Body:  "Tap any planet in your chart to read what most apps don't show. {firstName}, your Pluto in {sign} is one of the spicier reads."
```

### Compatibility deep-dive
```
Title: "Synastry: how your chart reads with someone else's"
Body:  "Add anyone to your Circle and Pro shows you the chart-to-chart dynamic. Try it with one person you've been thinking about."
```

### Unlimited Circle
```
Title: "Add the people you're actually thinking about"
Body:  "Pro lets you save unlimited charts in your Circle. Most users add 5-7 — partners, friends, family, the ex you keep thinking about."
```

Tone: direct, no mysticism (these are *help* messages), uses second-person, references actual user data where possible.

## Implementation

### Files to touch
- NEW `src/services/proEngagementService.js` — the feature-untried detector + push scheduler
- `src/services/notificationService.js` — call into the new service in `scheduleAllNotifications`
- `src/services/storage.js` — `PRO_FEATURE_NUDGED_AT` to dedupe per feature
- `src/services/analytics.js` — new events

### proEngagementService.js (sketch)

```js
import { ChatRepository } from './database/rep_chats';
import { ReportRepository } from './database/rep_reports';
// Need to track user's used features. We can query SQLite repos OR (preferred)
// keep a small flags object in storage updated when each feature is first used.

const PRO_FEATURE_RANK = ['weekly_report', 'deep_dive', 'compatibility', 'circle_expansion'];

export async function detectUntriedProFeature(profileId, partnerProfiles) {
  // Returns the highest-ranked feature the user hasn't tried, or null
  // Implementation:
  //   - For weekly_report: check ReportRepository for any 'weekly' report
  //   - For deep_dive: track via achievementService counters (deep_dives > 0)
  //   - For compatibility: check matches_checked counter
  //   - For circle_expansion: check partnerProfiles.length > 3
}

export async function maybeScheduleProDiscoveryPush({ userProfile, partnerProfiles, customerInfo }) {
  // Returns a queue item to push, or null
  // Logic:
  //   1. Confirm Pro entitlement active
  //   2. Compute daysSincePurchase from originalPurchaseDate
  //   3. If daysSincePurchase ∈ [3, 4] → Day 3 nudge
  //   4. If daysSincePurchase ∈ [7, 8] → Day 7 nudge
  //   5. Pick the highest-ranked untried feature
  //   6. Check we haven't already nudged this feature in last 14 days (PRO_FEATURE_NUDGED_AT)
  //   7. Build the queue item with copy from the feature copy table
}
```

### notificationService integration

In `scheduleAllNotifications`, after the existing event-based push blocks:

```js
// 5pro. PRO FEATURE DISCOVERY — Day 3 + Day 7 post-purchase nudges for
// untried Pro features. The single biggest defense against "not using it enough"
// cancellation reason.
try {
  const customerInfo = await RevenueCatService.getCustomerInfo();
  const proPush = await maybeScheduleProDiscoveryPush({
    userProfile, partnerProfiles, customerInfo,
  });
  if (proPush) queue.push(proPush);
} catch {}
```

### partnerProfiles availability

`scheduleAllNotifications` doesn't currently take `partnerProfiles`. Two options:
1. Add it as a new parameter and update HomeScreen's call site
2. Fetch from `ProfileRepository.getAllProfiles()` inside (we already do this in the lapse block)

Option 2 is cleaner — no signature change.

### New analytics events

- `PRO_DISCOVERY_PUSH_SCHEDULED` — with `feature` and `day` (3 or 7)
- (already-existing `PUSH_OPENED` will track opens via `template_id: 'event_pro_discovery_<feature>'`)

## Acceptance criteria

- [ ] On day 3 of being Pro, a push is scheduled for the next morning at user's wake time, naming the highest-rank Pro feature the user hasn't tried
- [ ] On day 7, a second push is scheduled for the next-highest-rank untried feature (different from Day 3's)
- [ ] If the user has already used all rank 1-4 features, no push is scheduled (don't spam)
- [ ] Each (user × feature) is nudged at most once every 14 days (`PRO_FEATURE_NUDGED_AT`)
- [ ] Tap on the push deep-links to the right tab (Reports for weekly, Chart for deep-dive, Circle for compat/circle)
- [ ] PostHog: `push_opened` events with `template_id: 'event_pro_discovery_<feature>'` flow

## Edge cases

- **Free user reads this code path** — `customerInfo.entitlements.active['Celestia Pro']` is undefined → skip
- **Pro user cancels mid-trial** — `originalPurchaseDate` still exists; push still scheduled. That's intentional — they paid; show them the value during their remaining access
- **User churned and resubscribed** — `originalPurchaseDate` may reset; handle by checking we haven't nudged this feature recently (PRO_FEATURE_NUDGED_AT)
- **User has tried everything** — no push; don't manufacture content for the sake of it

## What this fix doesn't do

- Doesn't gate paid features differently
- Doesn't add new features
- Doesn't pop up an in-app modal — push only, respects user's notification opt-in
- Doesn't replace the existing Sunday weekly digest (which all users get)

## Effort estimate

**Medium.** ~2-3 hours including the new service + integration + testing logic for "has user tried X feature."

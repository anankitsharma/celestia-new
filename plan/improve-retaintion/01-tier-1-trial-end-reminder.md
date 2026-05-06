# Fix A — Trial-end reminder push

**Status: Tier 1 — must ship**

## Why this is #1

The single biggest churn driver for any subscription app with a free trial. Users sign up, forget they're in a trial, get auto-charged on day 7, feel scammed, refund + cancel + leave a 1-star review.

Industry benchmark: trial-end reminders **2 days before charge** recover roughly **15–25% of would-be cancellers** by giving them either (a) a chance to cancel intentionally without the surprise, or (b) a moment to acknowledge the value they've gotten and decide to keep paying.

In Celestia's code today: there is **zero** trial-end logic. `grep -rn "trial.*remind\|trialEnd\|isInTrial"` returns nothing.

## Trigger conditions

Schedule the push when:
1. User has an active `Celestia Pro` entitlement
2. `entitlement.periodType === 'TRIAL'` (RevenueCat exposes this)
3. `daysUntilExpiration` is between 2 and 3
4. We haven't already scheduled this push for this trial period

Schedule for: **2 days before `expirationDate`**, at the user's morning time.

## Push content

```
Title: "Your trial ends in 2 days"
Body:  "{N} briefings, {M} chats, {P} journal entries — what you've built so far. Cancel any time in Settings if you want to."
```

Variables come from existing repos (`JournalRepository.getEntryCount`, `ChatRepository.getSessions`, RevenueCat customerInfo).

Tone: **non-anxious, transparent.** This is a save tactic only if the user genuinely values what they've built. Manufacturing urgency here would damage trust and increase refund rate.

## Implementation

### Files to touch
- `src/services/notificationService.js` — new scheduling block
- `src/services/revenueCatService.js` — small helper exposing `periodType` cleanly

### Logic

In `scheduleAllNotifications`, alongside the existing `5pre. PRE-BILLING` block:

```js
// 5pre-trial. TRIAL-END REMINDER — fires 2 days before trial charge.
// Single biggest churn driver for trial-based subscriptions.
try {
  const customerInfo = await RevenueCatService.getCustomerInfo();
  const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
  if (entitlement && entitlement.periodType === 'TRIAL' && entitlement.expirationDate) {
    const exp = new Date(entitlement.expirationDate);
    const daysUntilExp = Math.floor((exp - now) / 86400000);
    if (daysUntilExp >= 2 && daysUntilExp <= 3) {
      const fireDate = new Date(exp);
      fireDate.setDate(fireDate.getDate() - 2);
      fireDate.setHours(settings.morningTime ?? 7, settings.morningMinute ?? 5, 0, 0);
      if (fireDate > now) {
        // Pull stats for personalization
        const journalCount = await JournalRepository.getEntryCount(userProfile?.id || 'default').catch(() => 0);
        const chatSessions = await ChatRepository.getSessions(100).catch(() => []);
        const briefingsRead = ... // best-effort from analytics or session count
        queue.push({
          category: 'TRIAL_ENDING',
          channel: 'cosmic_milestones',
          trigger: 'exactDate',
          date: fireDate,
          content: {
            title: 'Your trial ends in 2 days',
            body: `${briefingsRead} briefings, ${chatSessions.length} chats, ${journalCount} journal entries — what you've built so far. Cancel any time in Settings if you want to.`,
            templateId: 'event_trial_ending',
          },
          params: { tab: 'profile' },
          priority: 1,
        });
      }
    }
  }
} catch {}
```

Priority `1` = highest; trial-end alert outranks everything else that day.

### New analytics events

Add to `analytics.js`:
- `TRIAL_ENDING_PUSH_SCHEDULED` — when scheduled (in dev, allows verification)
- `TRIAL_ENDING_PUSH_OPENED` — already covered by existing `PUSH_OPENED` with `template_id: 'event_trial_ending'`

## Acceptance criteria

- [ ] When a Pro user is in their 7-day trial, a notification is scheduled for 2 days before the trial expires
- [ ] The push fires at the user's `morningTime` setting, not 9am hardcoded
- [ ] Body interpolates real journal/chat/briefing counts (no zeros for active users)
- [ ] Tap on the push opens Profile (where they can manage subscription)
- [ ] Doesn't double-schedule across `scheduleAllNotifications` re-runs
- [ ] Tests via PostHog: `push_delivered` with `template_id: 'event_trial_ending'` fires

## Edge cases

- **User is on monthly plan, not trial** → `periodType !== 'TRIAL'` → skip entirely
- **User cancelled trial already** (`willRenew === false`) → still send; gives them a chance to re-engage
- **User opens app during trial day 6** → `scheduleAllNotifications` is called; the day-2-before-charge schedule is in the past → skipped (no harm)
- **Trial extended/refunded by Apple** → `expirationDate` shifts → next `scheduleAllNotifications` re-schedules accordingly

## What this fix doesn't do

- Doesn't *prevent* trial cancellation — that's by design; the goal is informed cancellation, not coerced retention
- Doesn't apply discount or extension — iOS IAP can't do that mid-trial without App Store Connect promo offers
- Doesn't email the user — that's a Tier 2/3 backstop once email provider is integrated

## Effort estimate

**Small.** ~1-1.5 hours including verification. Most of the code is mirroring the existing pre-billing block.

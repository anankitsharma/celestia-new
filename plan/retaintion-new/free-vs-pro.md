# Free vs Pro — Current Gates

Single source of truth for what's gated behind Celestia Pro vs free, as of the current code state. Update this doc when gates change.

The `isPro` boolean comes from `RevenueCatContext.js` → `RevenueCatService.isPro(customerInfo)` which checks for the active `Celestia Pro` entitlement. In `__DEV__` mode it defaults to `true` for testing.

## Currently free (forever)

| Feature | Notes |
|---|---|
| **Onboarding + chart generation** | The full 14-step flow + chart reveal + Big 3 + 2 deeply-specific reveal statements |
| **Daily briefing (Today tab)** | Full navigator briefing, life areas, journal prompt, quests, energy scores, streak, badges |
| **Daily AI chat** | First **10 messages per day** are free (`FREE_DAILY_LIMIT` in `ChatScreen.js:582`); 11th+ requires Pro |
| **Journal entries** | Unlimited writes, unlimited history |
| **Streak system** | Full tracking, freezes, milestones, badges |
| **XP + levels + 20 badges + hidden surprise badges** | Full engagement stack |
| **Circle (compatibility)** | First **3 partner entries** are free (`partnerProfiles.length >= 3` in `CompatibilityScreen.js:803`); 4th+ requires Pro |
| **Zodiac-only compatibility** | No birth time / location needed |
| **Monthly forecast report** | Explicitly free (`isReportAccessible('monthly', isPro) === true` in `ReportsScreen.js:271`) |
| **Splash, settings, notification preferences, profile, data export** | Always free |

## Pro-gated

| Feature | Where | Code reference |
|---|---|---|
| **Unlimited daily AI chat** | After message #10 each day | `ChatScreen.js:582` |
| **All non-monthly reports** | Daily, weekly, compatibility, transits, cosmic identity, deep reports | `ReportsScreen.js:271` (`isReportAccessible`) |
| **4th+ Circle partners** | Adding beyond 3 partners | `CompatibilityScreen.js:803` |
| **Planet deep-dive reads** | Tappable individual placement explainers | `ChartScreen.js:102` (`unlockedPlanets` checked unless isPro) |
| **Transit AI insight** | Per-transit AI commentary on Sky tab | `TransitsScreen.js:147` |
| **Yesterday + Tomorrow tabs** | Currently free in code; was originally L3-locked per `levels.js` design |

## What `Pro` deliberately does NOT gate

These were considered for paywalling and chosen to stay free:

- **Onboarding** — the aha moment must be free. Charging at install kills D1.
- **Chart wheel + Big 3** — the personalized identity reveal is the brand promise.
- **First 10 chats/day** — most active users hit ~5-7/day. The cap is loose enough to feel generous, tight enough that power users hit it.
- **First 3 Circle partners** — covers self + 1-2 close people. Power users (multiple partners, family chart, friend group analysis) hit the wall.
- **Journals** — writing is the highest-investment action. Gating it would suppress the IKEA effect that makes Celestia sticky.
- **Engagement system** — streaks, badges, levels are the retention loop. Gating them defeats their purpose.
- **Data export** — GDPR + transparency. Always free.

## Recommendations from `04-churn-prevention.md`

The original recommendation in the churn-prevention doc:
> chats limit at 10/day, weekly + monthly reports = Pro, Circle entries unlimited free, deep partner reports = Pro

Current code differs from this in two places:
1. **Monthly reports are FREE** (per `isReportAccessible`), not Pro. Code is more generous than the doc recommended.
2. **Circle entries are capped at 3 free**, not unlimited. Code is more restrictive than the doc recommended.

Pick which to align — either change the code to match the doc, or update this doc + the doc that recommended it.

## Pricing — open question (founder decision #2)

Not yet decided in code. RevenueCat offerings configuration in App Store Connect determines the actual prices shown in PaywallScreen. The code doesn't hardcode prices; it reads from `RevenueCatService.getOfferings()`.

Recommended starting point (validate via `pricing-strategy` skill):
- **Monthly**: $9.99/mo
- **Annual**: $59.99/yr (50% discount vs monthly × 12, keeps annual attractive)
- **Trial**: 7 days free on annual only

## Triggers that nudge toward Pro

These are the "soft paywall" moments where free users see Pro positioning. None are dark patterns; all should be designed as helpful prompts, not blockers.

| Trigger | Surface | File |
|---|---|---|
| Approaching daily chat limit (≤5 left) | In-line warning in chat | `ChatScreen.js:837` |
| Hitting daily chat limit | Modal upgrade nudge | `ChatScreen.js:589` |
| Tapping a Pro report | Alert with "Cancel / Go Pro" | `ReportsScreen.js:1185-1192` |
| Adding 4th Circle partner | Alert with paywall CTA | `CompatibilityScreen.js:803` |
| Tapping a locked planet deep-dive | Locked-feature overlay | `ChartScreen.js:460` |
| Tapping a locked transit insight | Locked-feature overlay | `TransitsScreen.js:394` |
| Monday morning (free users) | Weekly Pro nudge banner on Today | `HomeScreen.js:1122` |
| Profile (free users) | "Free Plan — Go deeper with Pro" row links to PaywallScreen | `ProfileScreen.js:428` |

## Cancel flow (P3.1 — already shipped)

Pro users tap "Celestia Pro · Manage subscription" on Profile → opens `CancelFlowScreen` (3-step exit survey + reason-matched save offer + confirmation) → deep-links to iOS Settings or Google Play for actual cancellation. See `CancelFlowScreen.js`.

## Open decisions

- [ ] Should monthly reports stay free or move to Pro? (Code says free; doc said Pro.)
- [ ] Should Circle stay capped at 3 or go unlimited? (Code caps at 3; doc said unlimited.)
- [ ] Pricing tier amounts (monthly + annual)
- [ ] Trial duration (7-day or 14-day)
- [ ] Should the daily chat limit be different on weekends? (Currently uniform 10/day.)
- [ ] Lifetime tier? (RevenueCat can support; not currently configured.)

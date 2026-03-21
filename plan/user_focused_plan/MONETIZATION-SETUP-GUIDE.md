# Celestia — Monetization & Subscription Setup Guide

> Everything you need to configure manually in RevenueCat, App Store Connect, and Google Play Console.
> This document matches the app code as of March 2026.

---

## 1. Pricing Strategy (Final)

| Plan | Price | Trial | Revenue Share |
|------|-------|-------|---------------|
| **Monthly Subscription** | **$6.99/month** | 7-day free trial | ~60% of revenue |
| **Annual Subscription** | **$49.99/year** ($4.17/mo) | 7-day free trial | ~10% of revenue (growing) |
| **Single Report (one-time)** | **$9.99 each** | None | ~30% of revenue |

### Why These Prices
- **$6.99 not $9.99**: Co-Star charges $9/mo and gets "insane" reviews. Mia makes $44K. $6.99 = impulse pricing (less than two coffees). Start low, build love, raise later.
- **$49.99 not $59.99**: 40% savings vs monthly. Offered after 2+ months of Premium use. Locks in LTV.
- **$9.99 one-time**: Catches the user who won't subscribe but WILL pay once for the thing she needs right now (e.g., compatibility report after a date).
- **7-day trial for ALL plans**: Nebula does 3-day. Too short — she hasn't gotten her first Monday transit report yet. 7 days = 1 weekly report + several chats + compatibility check. By day 7, the habit is built.

---

## 2. RevenueCat Configuration

### API Keys (Already Configured in App)
```
Apple:  appl_ZEOlXhfOKCJRUndMbyOjRzMZmnf
Google: goog_jybZecaksxjEnNeWJXYdmlzmsFB
```

### Entitlement
| Field | Value |
|-------|-------|
| **Entitlement Identifier** | `Celestia Pro` |
| **Description** | Full access to all Celestia premium features |

This single entitlement gates everything: unlimited chat, all reports, full compatibility, life area deep dives, weekly transit reports, moon rituals.

### Products to Create in RevenueCat

#### Subscription Products

| Product ID (suggested) | Type | Price | Trial | Platform |
|------------------------|------|-------|-------|----------|
| `celestia_pro_monthly` | Auto-Renewable Subscription | $6.99/month | 7-day free trial | iOS + Android |
| `celestia_pro_annual` | Auto-Renewable Subscription | $49.99/year | 7-day free trial | iOS + Android |

#### One-Time (Consumable/Non-Consumable) Products

| Product ID (suggested) | Type | Price | Description |
|------------------------|------|-------|-------------|
| `celestia_report_love` | Non-Consumable | $9.99 | Love Report — Venus, 7th house, attachment style |
| `celestia_report_career` | Non-Consumable | $9.99 | Career Map — Midheaven, Saturn, 10th house |
| `celestia_report_lunar` | Non-Consumable | $9.99 | Lunar Guide — Moon phase rituals |
| `celestia_report_purpose` | Non-Consumable | $9.99 | Life Purpose — North Node, soul path |
| `celestia_report_yearly` | Non-Consumable | $9.99 | Year-Ahead Forecast — profections, transits |
| `celestia_report_transit` | Non-Consumable | $9.99 | Transit Report — current planetary weather |
| `celestia_report_solar_return` | Non-Consumable | $9.99 | Solar Return — complete year analysis |
| `celestia_report_venus` | Non-Consumable | $9.99 | Venus Report — why you love like this |
| `celestia_report_saturn_return` | Non-Consumable | $9.99 | Saturn Return Guide — ages 27-30 survival |
| `celestia_report_compatibility` | Non-Consumable | $9.99 | Full Compatibility Deep-Dive |

### Offerings Setup in RevenueCat

Create ONE offering called `default` with these packages:

| Package | Product | Identifier |
|---------|---------|-----------|
| Annual | `celestia_pro_annual` | `$rc_annual` |
| Monthly | `celestia_pro_monthly` | `$rc_monthly` |

The app code uses:
```javascript
PACKAGE_TYPE.ANNUAL  → Annual package
PACKAGE_TYPE.MONTHLY → Monthly package
```

### Entitlement Mapping
- `celestia_pro_monthly` → grants `Celestia Pro` entitlement
- `celestia_pro_annual` → grants `Celestia Pro` entitlement
- Individual report products → **do NOT grant** `Celestia Pro` (they unlock specific content only)

---

## 3. App Store Connect Setup (iOS)

### Subscription Group
| Field | Value |
|-------|-------|
| **Group Name** | Celestia Pro |
| **Group Reference Name** | celestia_pro_group |

### Subscription Products

#### Monthly
| Field | Value |
|-------|-------|
| **Reference Name** | Celestia Pro Monthly |
| **Product ID** | `celestia_pro_monthly` |
| **Price** | $6.99 (Tier 5 — check Apple's tier pricing) |
| **Subscription Duration** | 1 Month |
| **Free Trial** | 7 Days |
| **Grace Period** | 16 Days (recommended) |

#### Annual
| Field | Value |
|-------|-------|
| **Reference Name** | Celestia Pro Annual |
| **Product ID** | `celestia_pro_annual` |
| **Price** | $49.99 (Tier 34 — check Apple's tier pricing) |
| **Subscription Duration** | 1 Year |
| **Free Trial** | 7 Days |
| **Grace Period** | 16 Days (recommended) |

### In-App Purchase Products (One-Time Reports)

For EACH report below, create a **Non-Consumable** IAP:

| Reference Name | Product ID | Price |
|----------------|-----------|-------|
| Love Report | `celestia_report_love` | $9.99 |
| Career Map | `celestia_report_career` | $9.99 |
| Lunar Guide | `celestia_report_lunar` | $9.99 |
| Life Purpose | `celestia_report_purpose` | $9.99 |
| Yearly Forecast | `celestia_report_yearly` | $9.99 |
| Transit Report | `celestia_report_transit` | $9.99 |
| Solar Return | `celestia_report_solar_return` | $9.99 |
| Venus Report | `celestia_report_venus` | $9.99 |
| Saturn Return Guide | `celestia_report_saturn_return` | $9.99 |
| Compatibility Report | `celestia_report_compatibility` | $9.99 |

### App Store Metadata for Subscription
**Subscription Description (for App Store listing):**
> Celestia Pro gives you unlimited AI chat with a cosmic companion who knows your entire birth chart, weekly transit reports every Monday, full compatibility deep-dives, downloadable PDF reports, and personalized life area guidance. 7-day free trial. $6.99/month or $49.99/year. Cancel anytime.

---

## 4. Google Play Console Setup (Android)

### Subscription Products

Navigate to: **Monetize > Products > Subscriptions**

#### Monthly Plan
| Field | Value |
|-------|-------|
| **Product ID** | `celestia_pro_monthly` |
| **Name** | Celestia Pro (Monthly) |
| **Description** | Unlimited AI chat, weekly reports, full compatibility, all PDF reports |
| **Default price** | $6.99 USD |

Create a **Base Plan**:
| Field | Value |
|-------|-------|
| **Base Plan ID** | `monthly-plan` |
| **Renewal type** | Auto-renewing |
| **Billing period** | 1 Month |
| **Price** | $6.99 |

Add a **Free Trial Offer**:
| Field | Value |
|-------|-------|
| **Offer ID** | `monthly-7day-trial` |
| **Phases** | 1 phase: Free for 7 days |
| **Eligibility** | New customers only |

#### Annual Plan
| Field | Value |
|-------|-------|
| **Product ID** | `celestia_pro_annual` |
| **Name** | Celestia Pro (Annual) |
| **Description** | Save 40% — all premium features for one year |
| **Default price** | $49.99 USD |

Create a **Base Plan**:
| Field | Value |
|-------|-------|
| **Base Plan ID** | `annual-plan` |
| **Renewal type** | Auto-renewing |
| **Billing period** | 1 Year |
| **Price** | $49.99 |

Add a **Free Trial Offer**:
| Field | Value |
|-------|-------|
| **Offer ID** | `annual-7day-trial` |
| **Phases** | 1 phase: Free for 7 days |
| **Eligibility** | New customers only |

### One-Time Products (Reports)

Navigate to: **Monetize > Products > In-app products**

For EACH report, create a **one-time product**:

| Product ID | Name | Price |
|-----------|------|-------|
| `celestia_report_love` | Love Report | $9.99 |
| `celestia_report_career` | Career Map | $9.99 |
| `celestia_report_lunar` | Lunar Guide | $9.99 |
| `celestia_report_purpose` | Life Purpose | $9.99 |
| `celestia_report_yearly` | Yearly Forecast | $9.99 |
| `celestia_report_transit` | Transit Report | $9.99 |
| `celestia_report_solar_return` | Solar Return | $9.99 |
| `celestia_report_venus` | Venus Report | $9.99 |
| `celestia_report_saturn_return` | Saturn Return Guide | $9.99 |
| `celestia_report_compatibility` | Compatibility Report | $9.99 |

**Status:** Set all to **Active** once created.

---

## 5. RevenueCat Product Mapping

After creating products in both stores, map them in RevenueCat:

### Products Tab
| RevenueCat Product | App Store ID | Play Store ID |
|-------------------|-------------|---------------|
| celestia_pro_monthly | `celestia_pro_monthly` | `celestia_pro_monthly` |
| celestia_pro_annual | `celestia_pro_annual` | `celestia_pro_annual` |
| celestia_report_love | `celestia_report_love` | `celestia_report_love` |
| celestia_report_career | `celestia_report_career` | `celestia_report_career` |
| celestia_report_lunar | `celestia_report_lunar` | `celestia_report_lunar` |
| celestia_report_purpose | `celestia_report_purpose` | `celestia_report_purpose` |
| celestia_report_yearly | `celestia_report_yearly` | `celestia_report_yearly` |
| celestia_report_transit | `celestia_report_transit` | `celestia_report_transit` |
| celestia_report_solar_return | `celestia_report_solar_return` | `celestia_report_solar_return` |
| celestia_report_venus | `celestia_report_venus` | `celestia_report_venus` |
| celestia_report_saturn_return | `celestia_report_saturn_return` | `celestia_report_saturn_return` |
| celestia_report_compatibility | `celestia_report_compatibility` | `celestia_report_compatibility` |

### Entitlement Mapping
| Entitlement | Products That Grant It |
|-------------|----------------------|
| `Celestia Pro` | `celestia_pro_monthly`, `celestia_pro_annual` |

**Important:** Individual report products do NOT grant the `Celestia Pro` entitlement. They unlock specific content only. The app code will need to check for individual report purchases separately (see Code Changes section below).

---

## 6. What Each Tier Gets (Feature Matrix)

### Free Tier ($0 forever)
- Daily personalized navigator briefing (headline + summary + nudge)
- Navigate Toward / Navigate Around guidance
- 5 AI chat messages per day (soft inline limit)
- Birth chart wheel + Big 3 (Sun, Moon, Rising)
- Planet placements unlock over 11 days (drip-feed)
- 1 compatibility check (zodiac-only level)
- Monthly forecast report (1 free report type)
- Streaks, XP, badges, quests
- Push notifications (daily morning + evening)
- Share cards for IG Stories
- Educational tooltips (CosmicTooltip + AstroText)

### Premium Tier ($6.99/mo or $49.99/yr)
Everything in Free, plus:
- **Unlimited AI chat** (no daily limit, deeper responses, proactive connections)
- **Weekly transit report** (Monday 8am delivery)
- **All 5 Life Area deep dives** (Love, Career, Vitality, Growth, Social)
- **All planet placements unlocked instantly** (skip 11-day drip)
- **Unlimited compatibility checks** (full synastry, unlimited partners)
- **All PDF reports included** (Love, Career, Lunar, Purpose, Year-Ahead, Transit, Solar Return, Venus, Saturn Return)
- **Moon rituals** (Full Moon / New Moon guided practices)
- **Chat context memory** (references past sessions, deeper personalization)
- **Navigator deep dive** (full detailed daily briefing)

### Single Report ($9.99 one-time)
- Unlocks ONE specific report permanently
- Same quality as Premium reports
- No subscription required
- Cannot be re-generated (saved version only, with refresh option)

---

## 7. Paywall Trigger Points in the App

These are the 20+ places where free users see upgrade prompts. Each has a `source` parameter for analytics tracking.

### High-Converting Triggers (Peak Curiosity)
| Source | Screen | Moment | Expected Conversion |
|--------|--------|--------|-------------------|
| `chat_limit` | Chat | 5 messages used, 11:30pm after date | Highest — emotional urgency |
| `report_single_compatibility` | Compatibility | After seeing 78% match, wants "Where You'll Fight" | Very high — curiosity unbearable |
| `monday_weekly_tease` | Home | Monday morning, free users see blurred weekly report | High — habit formed from dailies |
| `report_single_love` | Reports | Taps Love Report after reading Venus placement | High — emotional activation |

### Medium-Converting Triggers
| Source | Screen | Moment |
|--------|--------|--------|
| `match` | Compatibility | Wants to add 2nd partner |
| `natal` | Home | Wants navigator deep dive |
| `life_area_love` | Home | Taps love area card |
| `reports` | Reports | Wants any report (subscribe path) |
| `strategy` | Home | Wants weekly/monthly tabs |

### Soft Nudges (Awareness, Not Conversion)
| Source | Screen | Moment |
|--------|--------|--------|
| `chat_soft` | Chat | 2-3 messages remaining banner |
| `sunday_next_week` | Home | Sunday "see next week" teaser |
| Profile default | Profile | "Free Plan" badge |

### Time-Gated (Comfort Mode)
These paywalls are **disabled** between 11pm-7am (latenight mode) to avoid selling when the user is vulnerable:
- `natal` (deep dive)
- `strategy` (moon ritual, weekly tabs)
- `life_area_*` (all 5 areas)

---

## 8. Code Changes Needed for One-Time Purchases

The UI flow for one-time report purchases is built (dual-path Alert: "This Report — $9.99" vs "Subscribe — All Reports"), but the actual purchase processing needs to be wired up.

### What's Done (in the app code)
- Dual-path Alert on report tiles and compatibility deep analysis
- Distinct `source` parameters: `report_single_love`, `report_single_career`, etc.
- Price displayed as "$9.99" on report tiles

### What Still Needs Code Work
1. **PaywallScreen.js**: Add logic to detect `report_single_*` sources and show a one-time purchase button (using RevenueCat's `purchasePackage` or `purchaseProduct` for non-subscription products)
2. **RevenueCatContext.js**: Add function to check if user has purchased a specific report (check for non-subscription entitlements or purchased product IDs)
3. **ReportsScreen.js**: Check both `isPro` AND individual report purchase status before gating

### Suggested Implementation Pattern
```javascript
// In RevenueCatContext.js — add report purchase check
const hasReportPurchase = (reportType) => {
  const productId = `celestia_report_${reportType}`;
  return customerInfo?.nonSubscriptionTransactions?.[productId] != null;
};

// In ReportsScreen.js — update gate check
if (!isPro && !hasReportPurchase(r.type) && r.type !== 'monthly') {
  // Show dual-path alert
}
```

---

## 9. Analytics Events to Track

Track these in your analytics (PostHog) to measure paywall effectiveness:

| Event | Properties | Purpose |
|-------|-----------|---------|
| `paywall_viewed` | `source`, `variant` | Which triggers drive views |
| `paywall_dismissed` | `source`, `variant` | Which triggers get closed |
| `subscription_started` | `plan` (monthly/annual), `source` | Which triggers convert |
| `trial_started` | `plan`, `source` | Trial conversion tracking |
| `report_purchased` | `report_type`, `source` | One-time purchase tracking |
| `chat_limit_hit` | `message_count`, `time_of_day` | When limits are hit |
| `upgrade_cta_tapped` | `source`, `location` | Which CTAs drive action |

---

## 10. Pricing Localization

For international users, set equivalent prices in App Store Connect / Google Play:

| Region | Monthly | Annual | Single Report |
|--------|---------|--------|---------------|
| US | $6.99 | $49.99 | $9.99 |
| UK | £5.99 | £39.99 | £8.99 |
| EU | €6.99 | €49.99 | €9.99 |
| CA | $8.99 CAD | $64.99 CAD | $12.99 CAD |
| AU | $10.99 AUD | $79.99 AUD | $14.99 AUD |
| IN | ₹549 | ₹3,999 | ₹799 |

*Use Apple's "auto-generate prices" feature and adjust manually for key markets.*

---

## 11. Pre-Launch Checklist

### RevenueCat Dashboard
- [ ] Create `celestia_pro_monthly` product → map to both stores
- [ ] Create `celestia_pro_annual` product → map to both stores
- [ ] Create 10 report products (`celestia_report_*`) → map to both stores
- [ ] Create `Celestia Pro` entitlement → attach subscription products
- [ ] Create `default` offering → add Annual + Monthly packages
- [ ] Test sandbox purchases on iOS
- [ ] Test sandbox purchases on Android
- [ ] Verify entitlement grants correctly on purchase
- [ ] Verify entitlement revokes correctly on expiry/cancel

### App Store Connect
- [ ] Create subscription group "Celestia Pro"
- [ ] Create Monthly subscription ($6.99, 7-day trial)
- [ ] Create Annual subscription ($49.99, 7-day trial)
- [ ] Create 10 non-consumable IAPs ($9.99 each)
- [ ] Submit for review (subscriptions need review)
- [ ] Set up subscription status URL for server notifications
- [ ] Configure grace period (16 days recommended)
- [ ] Add subscription description + localized pricing

### Google Play Console
- [ ] Create Monthly subscription with base plan + 7-day trial offer
- [ ] Create Annual subscription with base plan + 7-day trial offer
- [ ] Create 10 one-time products ($9.99 each)
- [ ] Activate all products
- [ ] Set up Real-time Developer Notifications (RTDN)
- [ ] Test with license testers

### App Code (after store setup)
- [ ] Wire one-time report purchase flow in PaywallScreen.js
- [ ] Add `hasReportPurchase()` check in RevenueCatContext.js
- [ ] Update ReportsScreen gate to check individual purchases
- [ ] Test complete purchase flow: subscription + one-time
- [ ] Test restore purchases
- [ ] Test trial → paid conversion flow
- [ ] Test cancellation + re-subscription
- [ ] Verify latenight comfort mode still works (no paywalls 11pm-7am)

---

## 12. Unit Economics Target

| Metric | Target |
|--------|--------|
| Cost to acquire Mia (organic) | $0 – $5 |
| Free → Premium conversion | 12–18% |
| Trial → Paid conversion | 45–55% |
| Monthly churn rate | 8–12% (target <5% with memory layer) |
| Avg subscription lifespan | 6–8 months |
| LTV per Premium Mia | $42 – $56 |
| + Single report purchases | +$15 avg |
| Friends she brings (free) | 3–5 people |
| **Total value per acquired Mia** | **$57 – $71 + 3–5 free users** |

---

*Last updated: March 2026. Matches app code commit history.*

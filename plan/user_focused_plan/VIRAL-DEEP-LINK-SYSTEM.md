# Celestia — Viral Deep-Link System (Future Sprint)

> The #1 growth engine described in the Compatibility Plan. Every compatibility check should = 2 users acquired. Currently, share cards exist but the full loop is incomplete.

---

## What We Have Now

- Share button on compatibility results (native Share sheet)
- Share cards (MatchStoryCard, CompatibilityShareCard) with branded design
- Celebrity compatibility share (instant, free)
- "Send Compatibility Link" text CTA in free preview
- Text-based sharing: "I just checked my compatibility with Jake on Celestia — we're 78% matched!"

## What's Missing — The Full Viral Loop

### Step 1: Dynamic Link Generation
When Mia taps "Share with Jake," generate a unique deep link:
```
https://celestia.app/compat/abc123
```

**Tech needed:**
- Firebase Dynamic Links OR Expo Linking with a custom domain
- Link encodes: Mia's user ID + partner slot ID + basic match preview data
- Link works on both iOS and Android
- Falls back to web preview page if app not installed

### Step 2: Web Preview Page (App Not Installed)
When Jake taps the link without the app:
```
celestia.app/compat/abc123
```

Shows a beautiful web page:
- "Mia checked your compatibility on Celestia"
- Match score ring (78%) visible
- "The Spark" section teaser (2-3 lines)
- Blurred remaining sections
- Big CTA: "Enter your birthday to see the full reading"
- App Store / Play Store download buttons

**Tech needed:**
- Simple web page (could be a Next.js/Vercel deployment)
- OR a React Native Web build of the compatibility preview
- Deep link redirect to app if installed

### Step 3: App Handles Incoming Link
When Jake opens the link with the app installed:
- App detects the deep link on launch
- Navigates to a special "Shared Compatibility" screen
- Shows: "Mia wants to check your compatibility!"
- Pre-filled with Mia's name + her sign
- Jake enters: his name + birthday (+ optional time/city)
- One-tap: "See Our Compatibility →"

**Tech needed:**
- Deep link handler in AppNavigator.js (Expo Linking or React Navigation deep links)
- New screen: SharedCompatibilityScreen.js
- API endpoint to fetch shared compatibility data by link ID

### Step 4: Jake's Data Deepens the Report
When Jake submits his data:
- His chart is calculated locally
- Synastry is recalculated with both FULL charts (if he provides full data)
- Result stored in Supabase (linked to Mia's partner slot)
- Jake becomes a Celestia user (profile created from his data)

**Tech needed:**
- Supabase table: `shared_compatibility` (link_id, creator_id, partner_id, status, created_at)
- Supabase function: on partner data submission, update match + notify creator
- Local chart calculation for Jake
- Partner profile auto-creation for Jake's account

### Step 5: Both Get Notified
When Jake enters his data:
- **Mia gets push notification:** "Jake entered his birth details! Your compatibility report just got deeper — tap to see the updated version."
- **Jake sees:** Full compatibility result immediately
- **Mia's saved partner** updates from zodiac-only/birthday-only → full data
- Report sections that were previously approximate become precise

**Tech needed:**
- Supabase Edge Function or Cloud Function: triggered on partner data submission
- Push notification to Mia via Expo Notifications (requires Mia's push token stored in Supabase)
- Partner profile update mechanism (merge Jake's full data into Mia's saved partner)

### Step 6: Viral Compound
- Jake is now a user. He sees HIS chart for the first time.
- He checks compatibility with his own crush → sends a link → new user acquired
- Mia screenshots the updated result → sends to group chat → 3 friends download
- **Viral coefficient target: >1.0** (each check generates >1 new user on average)

---

## Architecture Summary

```
Mia taps "Share"
  → Generate unique link (Firebase Dynamic Links / Supabase)
  → Share via native Share sheet

Jake taps link
  → App installed? → Deep link handler → SharedCompatibilityScreen
  → App NOT installed? → Web preview → App Store → After install, resume link

Jake enters birthday
  → Chart calculated locally
  → Stored in Supabase (shared_compatibility table)
  → Push notification sent to Mia
  → Both see updated, deeper report

Jake is now a user
  → Onboarding flow (chart already calculated)
  → Checks his own compatibility → cycle repeats
```

---

## Database Schema Needed

### Supabase: `shared_compatibility_links`
```sql
CREATE TABLE shared_compatibility_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_code TEXT UNIQUE NOT NULL,        -- short code for URL (e.g., "abc123")
  creator_id UUID NOT NULL,              -- Mia's user ID
  creator_name TEXT,                     -- "Mia"
  creator_sun_sign TEXT,                 -- "Virgo"
  partner_name TEXT,                     -- "Jake" (from Mia's entry)
  partner_slot_id TEXT,                  -- reference to Mia's saved partner
  preview_score INTEGER,                 -- 78 (preview score to show on web)
  preview_spark TEXT,                    -- first section teaser text
  status TEXT DEFAULT 'pending',         -- 'pending' | 'claimed' | 'expired'
  claimed_by UUID,                       -- Jake's user ID (after he enters data)
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
```

### Supabase: Push token storage
```sql
-- Add to existing user profiles or create new table
ALTER TABLE profiles ADD COLUMN push_token TEXT;
```

---

## New Files Needed

| File | Purpose |
|------|---------|
| `src/screens/SharedCompatibilityScreen.js` | Screen for Jake when he opens a shared link |
| `src/services/deepLinkService.js` | Generate + parse compatibility share links |
| `src/services/sharedCompatService.js` | Supabase CRUD for shared_compatibility_links |
| `web/compat-preview/` | Web preview page for non-app users (optional, could be Vercel) |

---

## Effort Estimate

| Component | Effort |
|-----------|--------|
| Deep link generation + parsing | 1-2 days |
| SharedCompatibilityScreen | 1 day |
| Supabase schema + functions | 1 day |
| Push notification on partner claim | 0.5 day |
| Web preview page | 1-2 days |
| Partner merge (update Mia's saved partner) | 0.5 day |
| Testing + edge cases | 1 day |
| **Total** | **5-7 days** |

---

## Priority

This is the **#1 growth feature** in the entire product plan. The math:
- 1 Mia → checks compatibility → sends link → Jake enters data = 1 free user
- Jake checks his own compatibility → sends to his crush = 1 more free user
- Mia screenshots → group chat → 3 friends download = 3 more free users
- **1 compatibility check → potential 5 new users at $0 CAC**

Build this BEFORE spending any money on paid acquisition.

---

*Created: March 2026. To be implemented in a dedicated sprint after core app polish is complete.*

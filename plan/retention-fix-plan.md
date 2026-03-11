# Celestia — 30-Day Retention Fix Plan

> Goal: Move Day 30 retention from projected ~8% to ~18-22% (industry competitive)
> Approach: 4 phases, each buildable independently, ordered by impact-to-effort ratio
> Prerequisite reading: `app-retention-analysis.md` (the 19 identified risks)

---

## Architecture Advantages (Already Built)

Before planning, these existing capabilities reduce implementation cost significantly:

| Already Exists | Implication |
|---|---|
| **Supabase backend** (auth, sync, profiles, streaks, XP) | Social features are feasible without new backend setup |
| **`calculateCosmicEnergy(natal, date, timeframe)`** returns Love/Career/Health scores (0-100) | Can expand to 8+ daily micro-ratings with minimal new logic |
| **Daily insight already returns** `loveVibe`, `careerVibe`, `loveArchetype`, `careerArchetype`, `planetInfluences`, `viralInsight`, `dailyRitual` | These fields exist but are **barely shown on Home**. Free content waiting to be surfaced |
| **`getActiveCosmicWindows(chart, date)`** detects slow-planet transits to natal chart | "What changed" alerts are just UI — the data already computes |
| **`isMercuryRetrograde(date)`**, **`getMoonDataForDate(date)`**, **`getUpcomingEvents(natal, days)`** all work for any date | Event countdowns and timeline features need zero new calculation logic |
| **Streak freeze system** exists (1 free, refills every 7 days) | Can be expanded as streak reward without new infra |
| **AsyncStorage `celestia_notification_history`** tracks recent templates | Can track "seen insights" for drip-feed gating |
| **Cloud sync** already pushes profiles, streaks, XP, achievements to Supabase | Social features can read other users' public data from existing tables |

---

## Phase 1: Quick Wins (Effort: ~1 week)

These are changes to existing screens/services. No new infrastructure, no new Supabase tables. Maximum retention lift for minimum effort.

### 1.1 Daily Micro-Ratings Grid (Fixes: Issue #2, #6)

**Problem:** Home shows one long horoscope paragraph. Users skim it in 30 seconds and have no reason to return until tomorrow.

**Solution:** Replace or augment the energy grid with an 8-category daily ratings strip — the "check my day in 3 seconds" mechanic that drives Co-Star's DAU.

**Implementation:**

Expand `calculateCosmicEnergy()` in `astrologyService.js`:
- Currently returns 3 areas: Love, Career, Health
- Add 5 more: **Mood, Social, Creativity, Focus, Luck**
- Each uses different planet combinations from existing transit data:

```
Mood     → Moon sign + Moon aspects + Sun aspects
Social   → Venus sign + Mercury aspects + 11th house transits
Creativity → Neptune aspects + Venus aspects + 5th house transits
Focus    → Mercury sign + Saturn aspects + 6th house transits
Luck     → Jupiter aspects + North Node transits
```

**HomeScreen UI Change:**
Replace the current 3-bar energy grid with a horizontal scrollable strip of 8 circular gauges:

```
[ ♡ 78% ] [ ◆ 45% ] [ ✦ 82% ] [ ☽ 61% ] [ ✧ 90% ] [ ◎ 55% ] [ △ 73% ] [ ★ 88% ]
  Love     Career    Vitality   Mood      Social    Focus    Create    Luck
```

- Each circle fills proportionally (like Apple Watch rings)
- Color-coded: green (70-100), gold (40-69), dim (0-39)
- Tapping any one opens the existing energy modal with detail
- **Key behavior:** These numbers CHANGE DAILY based on real transits — gives users a reason to check every morning in under 5 seconds

**Files to modify:**
- `src/services/astrologyService.js` → Expand `calculateCosmicEnergy()` with 5 new life areas
- `src/screens/HomeScreen.js` → Replace energy grid section with horizontal ring strip
- `src/constants/theme.js` → Add colors for new categories if needed

**Expected impact:** +4-6% Day 7 retention (creates the "daily check" habit)

---

### 1.2 "What's New Today" Banner (Fixes: Issue #6)

**Problem:** Home screen looks the same every day. No visual signal that something changed.

**Solution:** A dynamic banner at the top of Home that highlights the most significant cosmic change since yesterday.

**Logic (no new API calls needed):**
```
Priority 1: Major event today → "Full Moon in Scorpio tonight — this activates your 8th House"
Priority 2: Planet sign change → "Venus enters Aries today — your love energy shifts"
Priority 3: New cosmic window → "Jupiter is now transiting your Sun sign"
Priority 4: Mercury Rx start/end → "Mercury Retrograde begins today in Pisces"
Priority 5: Moon sign change → "Moon moves into Cancer this afternoon"
Fallback: "Moon in [sign] · [phase] · [illumination]%"
```

All of these are computable from existing functions:
- `getUpcomingEvents(natal, 1)` → today's events
- `getActiveCosmicWindows(chart, today)` vs `getActiveCosmicWindows(chart, yesterday)` → diff
- `isMercuryRetrograde(today)` vs `isMercuryRetrograde(yesterday)` → change detection
- `getMoonDataForDate(today)` → current moon

**UI:** Gradient pill at the very top of the scroll, below the hero. Tappable → navigates to Sky tab for details.

```
┌─────────────────────────────────────────┐
│  ⚡ Venus enters Aries today            │
│  Your love language is about to shift →  │
└─────────────────────────────────────────┘
```

**Files to modify:**
- `src/screens/HomeScreen.js` → Add banner component + detection logic in useEffect
- `src/services/astrologyService.js` → Add `getCosmicChangeToday(natal)` helper that returns the top-priority change

**Expected impact:** +2-3% daily return rate (urgency + curiosity)

---

### 1.3 Drip-Feed Chart Insights (Fixes: Issue #1)

**Problem:** Users explore all 10 planet deep dives in 3-4 sessions, then Chart tab is dead.

**Solution:** Lock deep dives behind a daily unlock schedule. User gets 1 new placement insight per day for 10 days, creating anticipation.

**Mechanics:**
- Day 1 (onboarding): Sun + Moon + Rising deep dives unlocked (the Big Three — essential for "wow" moment)
- Day 2: Mercury unlocked ("Discover how you think & communicate")
- Day 3: Venus unlocked ("Discover your love language")
- Day 4: Mars unlocked ("Discover your drive & desire")
- Day 5: Jupiter unlocked ("Discover your luck & expansion")
- Day 6: Saturn unlocked ("Discover your lessons & limits")
- Day 7: Uranus unlocked ("Discover your rebel side")
- Day 8: Neptune unlocked ("Discover your dreams & intuition")
- Day 9: Pluto unlocked ("Discover your power & transformation")
- Day 10: North Node unlocked ("Discover your soul's purpose")

**Storage:** `AsyncStorage` key `celestia_unlock_schedule` → `{ startDate: 'YYYY-MM-DD', unlockedPlanets: ['Sun', 'Moon', 'Ascendant', 'Mercury', ...] }`

**On each app open:** Check `daysSinceStart` → add next planet to `unlockedPlanets` if not already there.

**ChartScreen UI:**
- Unlocked planets: normal tap → deep dive (existing behavior)
- Locked planets: show planet name + sign but with a lock icon + "Unlocks in 2 days" badge
- When a new planet unlocks: gold shimmer animation + "NEW" badge for 24 hours
- Push notification: "Your Venus placement just unlocked. Discover your love language." (new template in notificationContentEngine)

**Files to modify:**
- `src/screens/ChartScreen.js` → Add lock/unlock logic to planet list
- `src/services/storage.js` → Add `UNLOCK_SCHEDULE` key
- `src/services/notificationContentEngine.js` → Add `PLACEMENT_UNLOCK` template category
- `src/screens/HomeScreen.js` → Add "New insight unlocked" card in quick actions if applicable

**Expected impact:** +5-7% Day 14 retention (creates 10-day return cadence from Day 1)

---

### 1.4 Functional Streak Rewards (Fixes: Issue #5)

**Problem:** Streaks, XP, and badges unlock nothing. The loop is empty.

**Solution:** Attach real value to milestones.

**Streak Rewards:**
| Streak | Reward |
|---|---|
| 3 days | +1 streak freeze (total: 2) |
| 7 days | Unlock "Weekly Cosmic Summary" — a short AI-generated review of your week's transits |
| 14 days | Unlock "Cosmic Compatibility Quick Check" — simplified compatibility that doesn't require birth time (Sun sign only, for friends who don't know their time) |
| 30 days | +1 streak freeze (total: 3) + Unlock "Monthly Lunar Report" — personalized Moon cycle analysis |
| 50 days | Unlock exclusive "Midnight" theme for share cards (currently free, would need to add 1-2 new premium themes) |
| 100 days | Unlock "Soul Purpose Deep Reading" — extended version of Purpose report with past-life karmic analysis |

**XP Level Rewards:**
| Level | Unlock |
|---|---|
| 2 (Constellation, 100 XP) | Unlock "Ask Celestia" follow-up questions (3 suggested after each chat response instead of generic suggestions) |
| 3 (Nebula, 500 XP) | Unlock daily ritual suggestions on Home (use existing `dailyRitual` field from forecast that's currently hidden) |
| 4 (Galaxy, 2000 XP) | Unlock "Advanced" depth in readings (even if user set "Beginner" — system allows deeper content) |
| 5 (Cosmos, 10000 XP) | Unlock "Cosmic Mentor" mode — AI chat personality shifts to more intimate, direct voice. Badge visible on share cards. |

**Implementation:**
- Add `getUnlockedFeatures(streakData, xpData)` utility that returns a set of feature flags
- Check these flags at relevant feature entry points
- Show locked features with a "Reach Level 3 to unlock" message (creates aspiration)

**Files to modify:**
- `src/services/rewardsService.js` (NEW, ~60 lines) → Maps streak/XP milestones to feature flags
- `src/screens/HomeScreen.js` → Show ritual card if Level 3+
- `src/screens/ChatScreen.js` → Enhanced suggestions if Level 2+
- `src/screens/ChartScreen.js` → Show locked features with unlock conditions
- `src/screens/ProfileScreen.js` → Show rewards roadmap (what's next to unlock)

**Expected impact:** +3-5% Day 30 retention (sunk cost + aspiration)

---

### 1.5 Birth Time Rectification (Fixes: Issue #9)

**Problem:** 40-60% of users don't know birth time. They get a degraded experience.

**Solution:** A 5-question quiz that estimates Rising sign based on personality/appearance/life-pattern correlations. Not astronomically precise, but gives these users a complete experience.

**Quiz Questions (shown after "I don't know my birth time" is checked):**
```
1. "When you walk into a room of strangers, you tend to..."
   → Map answers to Rising element (Fire/Earth/Air/Water)

2. "People who just met you would describe you as..."
   → Map to specific Rising signs within the element

3. "Your body type and natural appearance lean toward..."
   → Refine Rising sign estimation

4. "In your early life (before age 7), your environment was..."
   → Cross-reference with 1st house themes

5. "Your instinctive first reaction to unexpected change is..."
   → Final refinement
```

**Result:** "Based on your responses, your Rising sign is likely **Scorpio**. This is an estimate — you can update it anytime if you discover your exact birth time."

**Storage:** Save estimated Rising to profile with `isEstimated: true` flag. All readings work normally but show a subtle "(estimated)" label next to Rising.

**Files to create:**
- `src/components/RisingEstimator.js` (NEW) → Quiz UI + estimation logic
- Modify `src/screens/OnboardingScreen.js` → Show quiz after "I don't know" toggle

**Expected impact:** +3-4% activation rate (these users now get full Big Three experience instead of degraded one)

---

## Phase 2: Content Depth (Effort: ~2 weeks)

New content types that extend the ceiling beyond "I've seen everything."

### 2.1 Living Compatibility (Fixes: Issue #14)

**Problem:** Compatibility is a one-time lookup. User checks score, reads analysis, never returns.

**Solution:** Daily couple energy — a dynamic reading that changes daily based on transits affecting BOTH charts.

**Already exists:** `generateRelationshipForecast()` in geminiService.js returns `{ headline, vibe, do, dont, cosmicFocus }` with 24-hour expiration. This function is **already built but not surfaced anywhere visible**.

**Implementation:**

Add to CompatibilityScreen (below the hero score, above detailed breakdown):

```
┌─────────────────────────────────────────┐
│  TODAY'S ENERGY WITH ALEX               │
│                                         │
│  "Tension that leads somewhere good"    │
│                                         │
│  ✓ Do: Have the conversation you've     │
│    been avoiding                        │
│  ✗ Don't: Make assumptions about        │
│    their silence                        │
│                                         │
│  ☽ Moon trines both your Venus signs    │
│  ───────────────────────────────────    │
│  Updated daily · Last: 2 hours ago      │
└─────────────────────────────────────────┘
```

**Also add:** "Relationship Transit Alert" notification — when a major transit hits BOTH charts simultaneously, send a push: "Venus is activating both your charts this week. Pay attention to what surfaces between you."

**Files to modify:**
- `src/screens/CompatibilityScreen.js` → Add daily energy card (calls `generateRelationshipForecast`)
- `src/services/notificationContentEngine.js` → Add `RELATIONSHIP_TRANSIT` template
- `src/services/notificationService.js` → Schedule relationship alerts if partner exists

**Expected impact:** +2-3% Day 14 retention for users with partners (turns one-time tool into daily check)

---

### 2.2 Event Experiences (Fixes: Issue #12)

**Problem:** Mercury Retrograde, eclipses, full moons are cultural moments that drive astrology engagement. Celestia treats them as data points, not experiences.

**Solution:** Themed "event modes" that transform the Home screen during major astrological events.

**Event Types:**

**A) Mercury Retrograde Mode (3x per year, ~3 weeks each)**
- Home screen gets a subtle visual shift (amber tint, caution icon in header)
- "Mercury Rx Survival Guide" card appears at top of Home:
  - Daily Rx-specific tips (based on which house Mercury Rx falls in user's chart)
  - "Rx Progress" bar showing how far through the retrograde we are
  - "Shadow Period" indicator before/after
- Special notification: "Day 5 of Mercury Retrograde. Your Gemini Mercury is feeling it most in communication. Double-check that text before sending."
- Badge: `retrograde_survivor` (new) — unlocks if user opens app every day during a full Rx period

**B) Eclipse Portal (2x per year, ~2 weeks)**
- "Eclipse Portal" banner on Home with countdown to exact eclipse time
- Special eclipse reading generated (how eclipse degree aspects user's natal chart)
- "Eclipse Journal Prompt" — guided reflection specific to the eclipse axis
- Post-eclipse: "Integration Reading" — what shifted during the eclipse window

**C) Full/New Moon Ritual (2x per month)**
- Full Moon: "Release Ritual" card on Home — what to let go of based on the Full Moon's house in user's chart
- New Moon: "Intention Setting" card — what to manifest based on the New Moon's house
- Both include: moon sign, exact time, house placement, suggested ritual, journaling prompt
- These are brief (not full reports) — generated from existing moon data + one short Gemini call

**Detection logic (all local, no API):**
```javascript
// Mercury Rx: isMercuryRetrograde(date) already exists
// Eclipses: getUpcomingEvents() already detects lunations, add eclipse flag
// Full/New Moon: getMoonDataForDate(date).phaseName === 'Full Moon' | 'New Moon'
```

**Files to create:**
- `src/components/EventBanner.js` (NEW) → Renders the appropriate event mode UI
- `src/services/eventService.js` (NEW) → Detects active events, generates event context

**Files to modify:**
- `src/screens/HomeScreen.js` → Insert EventBanner conditionally
- `src/services/geminiService.js` → Add `generateEventReading(eventType, chart, eventData)` function
- `src/services/notificationContentEngine.js` → Add event-specific notification templates

**Expected impact:** Viral spikes 3-4x per year (Mercury Rx trends on social media) + 2-3% ongoing retention lift from monthly moon rituals

---

### 2.3 Smart Journal with Cosmic Correlations (Fixes: Issue #13)

**Problem:** Journal is a plain text box with no feedback loop.

**Solution:** Structured journal with mood tracking and AI-detected cosmic correlations.

**Journal Entry Format:**
```
┌─────────────────────────────────────────┐
│  EVENING REFLECTION · March 10          │
│                                         │
│  How are you feeling?                   │
│  😔  😐  🙂  😊  🤩                    │
│  (tap to select mood)                   │
│                                         │
│  Energy level: ●●●●○ (drag to set)     │
│                                         │
│  AI Prompt: "The Moon in Scorpio asks:  │
│  What truth did you avoid today?"       │
│                                         │
│  [Write your reflection...]             │
│                                         │
│  ☽ Moon: Scorpio (87% Full)             │
│  ♀ Venus: Aries · ♂ Mars: Cancer       │
│  (auto-tagged, not editable)            │
└─────────────────────────────────────────┘
```

**Cosmic Correlation Engine (after 14+ entries):**
When user opens journal on Day 15+, show a "Patterns" section:

```
"You tend to feel most energized when Moon is in Fire signs (Leo, Aries, Sagittarius).
Your lowest moods correlate with Mars transits to your natal Moon.
You journal most consistently during Mercury Retrograde periods."
```

This is a simple query: group journal entries by moon sign/transit → calculate average mood per group → surface the strongest correlations.

**Files to create:**
- `src/components/JournalEntry.js` (NEW or refactor existing) → Structured entry with mood/energy
- `src/services/journalAnalysisService.js` (NEW) → Cosmic correlation engine

**Files to modify:**
- `src/services/database/rep_journal.js` → Add `mood` and `energy` columns
- `src/screens/HomeScreen.js` → Update journal modal to use structured format
- `src/services/geminiService.js` → Add `generateJournalPrompt(moonData, transits)` for dynamic prompts

**Expected impact:** +2-3% Day 30 retention (journal becomes personally valuable over time — users want to see their patterns)

---

### 2.4 Progressive Onboarding Education (Fixes: Issue #10)

**Problem:** Beginners don't understand astrology terminology. 3 of 6 tabs feel inaccessible.

**Solution:** Contextual education tooltips that appear ONCE per concept, exactly when the user first encounters it.

**Examples:**
- First time on Chart tab: "Your birth chart is a snapshot of the sky at the exact moment you were born. Each planet was in a specific zodiac sign — that's what we're looking at here." (dismissible tooltip)
- First time seeing "Transit": "A transit is when a planet in today's sky forms a geometric angle with a planet in YOUR birth chart. It's like the universe poking one of your buttons."
- First time seeing "Aspect": "An aspect is the angle between two planets. Some angles create harmony (trine, sextile), others create tension (square, opposition). Both are valuable."
- First time on Compatibility: "Synastry is the art of comparing two birth charts. We look at how your planets interact with theirs."

**Storage:** `AsyncStorage` key `celestia_tooltips_seen` → `Set<string>` of tooltip IDs that have been dismissed.

**Implementation:** ~15 contextual tooltips across Chart, Transits, Compatibility screens. Each shows once, with a "Got it" button. Styled as a semi-transparent overlay with the concept highlighted.

**Files to create:**
- `src/components/CosmicTooltip.js` (NEW) → Reusable tooltip component

**Files to modify:**
- `src/screens/ChartScreen.js` → 5 tooltips (chart wheel, planets, aspects, houses, deep dive)
- `src/screens/TransitsScreen.js` → 3 tooltips (transits, intensity, cosmic windows)
- `src/screens/CompatibilityScreen.js` → 2 tooltips (synastry, harmony score)

**Expected impact:** +2-3% activation for beginners (60% of downloads feel included instead of excluded)

---

## Phase 3: Social Layer (Effort: ~2-3 weeks)

The highest-impact change for long-term retention. Requires Supabase schema additions.

### 3.1 Social Profile & Friend System

**Problem:** Celestia is single-player. No social graph = no network effects = no organic growth.

**Solution:** Username-based profiles with friend connections.

**Supabase Schema Additions:**

```sql
-- Public profiles (readable by friends)
CREATE TABLE public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,  -- @lowercase, 3-20 chars
  display_name TEXT,
  sun_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Starling',
  avatar_color TEXT,  -- gradient seed
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend connections (bidirectional)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public_profiles(id),
  friend_id UUID REFERENCES public_profiles(id),
  status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Daily compatibility cache (computed server-side or client-side)
CREATE TABLE daily_friend_energy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  friend_id UUID,
  date DATE DEFAULT CURRENT_DATE,
  score INTEGER,  -- 0-100
  vibe TEXT,  -- "electric", "gentle", "tense", "flowing"
  one_liner TEXT,  -- "You two are unusually aligned today"
  UNIQUE(user_id, friend_id, date)
);
```

**Friend Flow:**
1. User creates username during onboarding or later in Profile
2. "Add Friend" → Search by username → Send request
3. Friend accepts → Both see each other in friend list
4. Daily: Each friend pair gets a compatibility vibe score (computed client-side from existing `calculateCosmicEnergy` for both charts)

**Friends Tab (replace or augment existing Match tab):**
```
┌─────────────────────────────────────────┐
│  YOUR CIRCLE · 4 friends               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ @alexmoon · Alex                │   │
│  │ ♏ Scorpio · Today: 82% 🔥      │   │
│  │ "You two are cosmically loud"   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ @starlily · Lily                │   │
│  │ ♊ Gemini · Today: 45% 🌙       │   │
│  │ "Give each other space today"   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  + Add Friend                           │
└─────────────────────────────────────────┘
```

**Key social notifications (the viral mechanics):**
- "Alex just checked your compatibility" → curiosity + flattery
- "Your daily energy with Lily is 94% today — unusually high" → urgency
- "3 of your friends are Scorpio Moons — you have a type" → social insight
- "Alex just hit a 30-day streak. Are you keeping up?" → competition

**Files to create:**
- `src/services/supabase/socialService.js` (NEW) → Friend CRUD, daily energy computation
- `src/screens/FriendsScreen.js` (NEW) → Friends list with daily vibes
- `src/components/AddFriendModal.js` (NEW) → Username search + request flow

**Files to modify:**
- `src/screens/OnboardingScreen.js` → Optional username creation step (Step 4)
- `src/screens/ProfileScreen.js` → Show username, add friend button
- `src/navigation/AppNavigator.js` → Add Friends screen (could be sub-tab of Match, or replace it)
- `src/services/notificationService.js` → Add social notification channel
- `src/services/notificationContentEngine.js` → Add social templates

**Expected impact:** +8-12% Day 30 retention (social pressure is the #1 retention driver in consumer apps)

---

### 3.2 Deep Linking & Viral Loop Closure (Fixes: Issue #17)

**Problem:** Share cards have no call-to-action for the viewer. The viral loop doesn't close.

**Solution:** Deep links + QR code on share cards + app store smart banner.

**Implementation:**

1. **Add Celestia branding with CTA to share cards:**
   - MatchStoryCard: Add small text below brand: "celestia.app/match" (or App Store link)
   - DailyShareCard: Add "Download Celestia" small text
   - CosmicIDCard: Add QR code (small, bottom corner) that opens App Store

2. **Expo deep linking setup:**
   ```javascript
   // app.json
   {
     "scheme": "celestia",
     "associatedDomains": ["applinks:celestia.app"]
   }
   ```

   - `celestia://match?user=username` → Opens compatibility with that user
   - `celestia://profile/username` → Opens their public profile
   - `celestia://invite/username` → Opens app with friend request pre-filled

3. **When someone clicks a deep link but doesn't have the app:**
   - Redirect to App Store / Play Store via universal link
   - After install, deep link state preserved → opens the intended screen

**Files to modify:**
- `src/components/MatchStoryCard.js` → Add subtle CTA text
- `src/components/DailyShareCard.js` → Add CTA
- `src/components/CosmicIDCard.js` → Add QR code
- `src/navigation/AppNavigator.js` → Handle incoming deep links via `Linking`

**Expected impact:** +30-50% conversion rate on shares (currently: share → nothing. After: share → download → friend connection)

---

## Phase 4: Monetization & Sustainability (Effort: ~1 week)

### 4.1 Freemium Model (Fixes: Issue #11)

**Problem:** Everything is free. API costs scale linearly with users. Unsustainable.

**Solution:** "Celestia Premium" with a clear free/paid boundary that feels fair.

**Free Tier (generous — builds trust):**
- Daily horoscope (micro-ratings grid)
- Birth chart view (with drip-feed unlocks)
- 3 deep dives per week (was unlimited)
- 5 AI chat messages per day (was unlimited)
- 1 compatibility check per week (was unlimited)
- Moon phase + basic transit info
- Streak & XP system
- 1 free report (user's choice)

**Premium Tier ($6.99/month or $49.99/year):**
- Unlimited deep dives
- Unlimited AI chat
- Unlimited compatibility checks
- All 6 report types + regeneration
- Daily couple energy (living compatibility)
- Event mode readings (Mercury Rx guide, eclipse portal, moon rituals)
- Journal cosmic correlation insights
- Priority AI model (gemini-2.5-flash instead of flash-lite)
- Premium share card themes (2-3 exclusive themes)
- Extended notification insights (AI-generated lines vs templates)
- "Cosmic Mentor" chat personality (Level 5 reward becomes premium perk)

**Paywall Placement Strategy:**
- **Never block the first experience.** User always gets their first report, first deep dive, first compatibility check for free.
- **Soft paywall:** After free limit, show a beautiful modal: "You've used your 3 deep dives this week. Unlock unlimited with Celestia Premium." Show what they'd get. No hard walls — just gentle friction.
- **Trial:** 7-day free trial for Premium (no credit card required for first 3 days, card required to continue).

**Implementation:**
- `src/services/premiumService.js` (NEW) → Check subscription status, enforce limits, RevenueCat or in-app purchase integration
- `src/components/PremiumGate.js` (NEW) → Beautiful paywall modal component
- Modify screens to check `isPremium` before AI-heavy operations

**Why this works:** The free tier is still better than most competitors' free tiers. Users who love the app will pay because they've already formed the habit (Phase 1-3 handle this). The paywall protects API costs while the social features drive organic growth.

**Expected impact:** Sustainable business + reduced churn from "app died" scenario

---

## Phase 5: Content Freshness Engine (Effort: ~1 week)

### 5.1 Seasonal & Transit-Triggered Reports (Fixes: Issue #4)

**Problem:** 4 report types generated once = 12 minutes of content ever.

**Solution:** Time-sensitive reports that regenerate based on real astronomical events.

**New Report Types (auto-refresh):**
| Report | Trigger | Refresh |
|---|---|---|
| Monthly Lunar Report | New Moon each month | Monthly |
| Seasonal Forecast | Equinox/Solstice (4x/year) | Quarterly |
| Mercury Rx Survival Guide | Mercury Retrograde start | 3x/year |
| Birthday/Solar Return | User's birthday ± 7 days | Annually |
| Eclipse Impact Reading | Eclipse season | 2x/year |
| Year Ahead | January 1 or user's birthday | Annually |
| Venus Return | Venus returns to natal position (~1 year cycle) | Annually |

**Implementation:**
- `src/services/reportScheduler.js` (NEW) → Detects when a new time-sensitive report is available
- Reports tab shows "NEW" badge when a seasonal report is ready
- Old seasonal reports archived (still viewable) but new one is freshly generated
- Push notification: "Your Spring Equinox Forecast is ready. The next 3 months look interesting for your career."

**Files to modify:**
- `src/screens/ReportsScreen.js` → Add seasonal reports section with "NEW" indicators
- `src/services/geminiService.js` → Add `generateSeasonalReport(type, chart, eventData)` function
- `src/services/notificationContentEngine.js` → Add `NEW_REPORT` template

**Expected impact:** +2-3% retention from Reports tab users (tab stays alive year-round instead of dying after Week 1)

---

### 5.2 Proactive Chat Insights (Fixes: Issue #7)

**Problem:** Chat requires users to know what to ask. Beginners stare at a blank canvas.

**Solution:** Daily proactive insight that appears in chat without user asking.

**When user opens Chat tab, if they haven't chatted today:**
```
┌─────────────────────────────────────────┐
│  ☽ Celestia noticed something           │
│                                         │
│  "Your Venus in Scorpio is being        │
│   activated by today's Mars transit.    │
│   You might feel an unusual pull        │
│   toward someone — or away from         │
│   something safe."                      │
│                                         │
│  [Tell me more]  [What should I do?]    │
└─────────────────────────────────────────┘
```

This is generated from existing transit data + one short Gemini call. It's not a full reading — just a provocative opener that makes the user WANT to ask follow-up questions.

**Files to modify:**
- `src/screens/ChatScreen.js` → Add proactive insight card above greeting when transits are significant
- `src/services/geminiService.js` → Add `generateProactiveInsight(chart, transits)` (short, ~20 words)

**Expected impact:** +15-20% chat feature adoption (removes the blank canvas problem)

---

## Implementation Priority Order

| Order | Feature | Phase | Effort | Day 30 Impact |
|---|---|---|---|---|
| 1 | Daily Micro-Ratings Grid | Phase 1.1 | 2-3 days | +4-6% |
| 2 | Drip-Feed Chart Insights | Phase 1.3 | 1-2 days | +5-7% |
| 3 | "What's New Today" Banner | Phase 1.2 | 1 day | +2-3% |
| 4 | Functional Streak Rewards | Phase 1.4 | 1-2 days | +3-5% |
| 5 | Birth Time Rectification Quiz | Phase 1.5 | 2 days | +3-4% activation |
| 6 | Living Compatibility | Phase 2.1 | 2-3 days | +2-3% |
| 7 | Event Experiences | Phase 2.2 | 3-4 days | +2-3% + viral spikes |
| 8 | Smart Journal | Phase 2.3 | 2-3 days | +2-3% |
| 9 | Onboarding Education | Phase 2.4 | 2 days | +2-3% activation |
| 10 | Social Profile & Friends | Phase 3.1 | 5-7 days | +8-12% |
| 11 | Deep Linking | Phase 3.2 | 2-3 days | +viral loop closure |
| 12 | Freemium Model | Phase 4.1 | 3-4 days | sustainability |
| 13 | Seasonal Reports | Phase 5.1 | 2-3 days | +2-3% |
| 14 | Proactive Chat Insights | Phase 5.2 | 1-2 days | +chat adoption |

**Total estimated effort:** ~5-6 weeks for all phases
**Projected Day 30 retention after all phases:** 18-25% (vs current projected 7-9%)

---

## Retention Curve After All Fixes (Projected)

| Day | Before | After | Delta |
|---|---|---|---|
| Day 1 | 100% | 100% | — |
| Day 2 | 55% | 65% | +10% (micro-ratings + "what's new" create check-in habit) |
| Day 3 | 40% | 55% | +15% (drip-feed unlock + daily energy numbers) |
| Day 7 | 25% | 42% | +17% (still unlocking placements + social nudges + event content) |
| Day 14 | 15% | 30% | +15% (social hooks + living compatibility + journal patterns) |
| Day 21 | 10% | 24% | +14% (streak sunk cost + functional rewards + seasonal content) |
| Day 30 | 7-9% | 18-22% | +10-13% (social network effects compound) |

---

## Success Metrics to Track

| Metric | Current (Est.) | Target | How to Measure |
|---|---|---|---|
| DAU/MAU ratio | ~15% | 35%+ | Daily opens / Monthly opens |
| Day 7 retention | ~25% | 42% | Cohort analysis |
| Day 30 retention | ~8% | 20% | Cohort analysis |
| Sessions per day | ~1.1 | 2.0+ | Average opens per active user |
| Time per session | ~3 min | 5 min | Screen time tracking |
| Share rate | ~2% of DAU | 8% | Share events / DAU |
| Chat adoption | ~15% of users | 40% | Users who sent 1+ chat message |
| Social connections | 0 | 3+ avg friends per user | Supabase friendships table |
| Notification opt-in | ~60% | 75% | Permission grant rate |
| Premium conversion | 0% | 5-8% of MAU | RevenueCat |

---

## What NOT to Build

To keep scope manageable, explicitly avoid:

- **Group charts / family charts** — complexity explosion for niche audience
- **Astrology education courses** — content creation overhead, not core product
- **User-generated content / forums** — moderation burden, off-brand
- **Horoscope for all 12 signs** — personalized > generic, that's the competitive edge
- **Birth chart comparison grid** — too technical, the AI narrative is better
- **Astrological dating / matching** — different product category, legal/safety concerns
- **Web app** — focus on mobile-first, web can come later
- **Android parity immediately** — ship iOS first, validate, then port

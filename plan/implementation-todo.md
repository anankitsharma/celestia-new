# Celestia — Retention Feature Implementation Checklist

> Priority order based on ROI (impact ÷ effort). Each feature has specific files to modify.

## Week 1: Daily Habit Engine

- [x] **1. Expand Energy Grid → 8-Category Cosmic Weather Strip**
  - `src/services/astrologyService.js` — Added 5 new LIFE_AREAS (Mood, Social, Creativity, Focus, Luck)
  - `src/services/astrologyService.js` — Updated getAreaColor for new areas
  - `src/screens/HomeScreen.js` — Expanded ENERGY_CONFIG to 8 items
  - `src/screens/HomeScreen.js` — Redesigned grid → horizontal scrollable ring strip
  - `src/screens/HomeScreen.js` — Added ★/↓ markers for high/low scores
  - `src/screens/HomeScreen.js` — Added cosmic weather word summary + Cosmic Download banner

- [x] **2. Rewrite Notification Voice (AI-Generated Co-Star Quality)**
  - `src/services/geminiService.js` — Added generateCosmicNotificationBatch with curiosity-gap prompt
  - `src/services/cosmicLineService.js` — NEW: Buffer management (get, refill, prune, merge)
  - `src/services/notificationService.js` — AI-first DATE-based scheduling with template fallback
  - `src/screens/HomeScreen.js` — Fire-and-forget refill on app open + re-schedule
  - `src/services/storage.js` — Added AI_NOTIFICATION_LINES key

- [x] **3. Add "What's New Today" Banner**
  - `src/services/astrologyService.js` — Added getCosmicChangeToday(natal) function
  - `src/screens/HomeScreen.js` — Added cosmic change banner below hero

- [x] **4. Add "Tomorrow's Preview" Forward Hook**
  - `src/screens/HomeScreen.js` — Added tomorrow preview section with moon/windows data

## Week 2: Content Depth & Anti-Ceiling

- [x] **5. Drip-Feed Chart Insights (1 planet/day for 14 days)**
  - `src/services/unlockService.js` — NEW: Unlock schedule management (Big 3 free, then daily drip)
  - `src/services/storage.js` — Added UNLOCK_SCHEDULE + FIRST_USE_DATE keys
  - `src/screens/ChartScreen.js` — Added lock/unlock logic, progress bar, locked deep-dive view
  - `src/screens/HomeScreen.js` — Added "New Insight Unlocked" card with navigation to Chart
  - `src/services/notificationContentEngine.js` — Added PLACEMENT_UNLOCK template

- [x] **6. Moon Rituals (New Moon Intentions → Full Moon Reflections)**
  - `src/services/storage.js` — Added MOON_RITUALS key (AsyncStorage, not DB)
  - `src/services/geminiService.js` — Added generateMoonRitual with schema
  - `src/screens/HomeScreen.js` — Added Moon Ritual card + full ritual modal with intention writing

- [x] **7. Cosmic Seasons (Named Transit Periods with End Dates)**
  - `src/services/astrologyService.js` — Added getCosmicSeason(chart, date) function
  - `src/screens/HomeScreen.js` — Added Cosmic Season card with progress bar + end date + retrograde indicator

- [x] **8. Variable Depth "Cosmic Download" Days**
  - `src/services/astrologyService.js` — Added calculateTransitSignificance(chart, date)
  - `src/services/geminiService.js` — Extended fetchExtendedForecast prompt for significance ≥ 70 (6 paragraphs vs 4)
  - `src/screens/HomeScreen.js` — Cosmic Download banner + passes significance to forecast

## Week 3: Streaks & Identity

- [x] **9. Enhanced Streaks with Content Unlocks**
  - `src/services/notificationContentEngine.js` — Added 3 escalation templates (loss aversion, freeze, milestone-close)
  - `src/screens/ProfileScreen.js` — Added Streak Rewards Roadmap with 6 milestones
  - Grace period already existed in rep_streaks.js (freeze system)

- [x] **10. Tribal Identity ("Your Cosmic DNA")**
  - `src/services/cosmicIdentityService.js` — NEW: Archetype system, element greeting, combo rarity
  - `src/screens/HomeScreen.js` — Added element-based greeting + archetype chip in hero

- [x] **11. Monthly Cosmic Recap Card**
  - `src/services/geminiService.js` — Added generateMonthlyRecap with schema
  - `src/components/MonthlyRecapCard.js` — NEW: Shareable recap card component
  - `src/screens/HomeScreen.js` — Shows recap card on 1st-3rd of each month

## Week 4: Engagement Systems

- [x] **12. Proactive Chat Insights**
  - `src/screens/ChatScreen.js` — Added proactive insight card from today's transits/moon
  - Card auto-sends as question when tapped, disappears after messages start

- [x] **13. Smart Journal with Mood Tracking**
  - `src/screens/HomeScreen.js` — Added mood selector (5 moods) + energy slider (1-10) to journal modal
  - Journal saves mood/energy as metadata alongside entry text

- [x] **14. Contextual Education Tooltips**
  - `src/components/CosmicTooltip.js` — NEW: Reusable tooltip component with 11 topics
  - `src/screens/ChartScreen.js` — Added tooltips for Sun, Moon, Rising
  - `src/screens/TransitsScreen.js` — Added tooltip for transits

## New Files Created
- `src/services/unlockService.js` — Drip-feed planet unlock management
- `src/services/cosmicIdentityService.js` — Cosmic archetype + element greeting
- `src/components/CosmicTooltip.js` — Reusable education tooltip
- `src/components/MonthlyRecapCard.js` — Shareable monthly recap card
- `src/services/cosmicLineService.js` — AI notification line buffer (created in earlier session)

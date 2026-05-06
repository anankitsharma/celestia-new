# 01 — Current-State Audit

Inventory of every retention-relevant surface in the Celestia codebase, with file references and gap flags. Source: code audit + project memory.

## 1. Onboarding & first-run

**Files:** `src/screens/OnboardingFlowScreen.js` (12-step), `src/screens/WelcomeScreen.js`, `src/screens/SplashScreen.js`

**What works:**
- 12-step psychological-profiling → birth-data → chart-generation flow.
- Step 5 introduces attachment theory before astro data is requested (motivation builder).
- WelcomeScreen reveals natal chart wheel + "Big 3" (Sun/Moon/Rising) + 2 deeply specific statements derived from moon-house and sun-moon-element combos. **This is the aha moment.**
- Hand-coded statements like "You only fully feel yourself when reflected in someone else's eyes" (7H moon) — extremely high resonance.

**Gaps:**
- No D1 save-point or "first-action-after-onboarding" nudge.
- Users who skip onboarding land on an empty-feeling Home.
- No celebration after onboarding completion (Hook: Reward phase missing at the moment of highest motivation).
- No invite-to-allow-notifications timed to peak motivation (right after the chart reveal).

## 2. Push notification system

**Files:** `src/services/notificationService.js`, `src/services/notificationContentEngine.js`

**What works:**
- 6 Android channels: morning, evening, transits, streaks, milestones, weekly.
- **Time-based triggers:** Cosmic Morning 7:30am (configurable), Evening Reflection 8:30pm, Transit Alert 11am on cosmic windows, Streak Guardian 9pm if streak ≥3, Weekly Digest Sunday 9am.
- **Lapse cascade at D2, D3, D5, D7, D10, D14, D21** (`notificationService.js:233-256`). Templates `sg_lapsed_2` … `sg_lapsed_21` with copy like "Your patterns kept moving."
- AI-generated morning lines via `cosmicLineService` with template-pool fallback.
- 30+ astrologically explicit templates disabled in V1 for App Store compliance — fallback to neutral psychological framing.

**Gaps:**
- **Lapse cascade depends on `streak_guardian` channel being enabled.** If a user disables that channel, no re-activation push fires at all.
- All lapse pushes scheduled at 9am hardcoded — no personalization to user's actual usage hours.
- Lapse copy is generic ("things shifted while you were away"). Doesn't reference user's chart, partners, or saved chats — wastes the strongest reason to come back.
- No event-based prompts (e.g., "your unfinished chat from Tuesday is still saved").
- No email or SMS fallback channel.
- No A/B test framework on copy.
- No "you're 1 action away" rescue notification (e.g., "5 more chats to unlock Question Seeker").

## 3. Engagement loops — streaks / XP / badges

**Files:** `src/services/streakService.js`, `src/services/xpService.js`, `src/services/achievementService.js`, `src/constants/levels.js`, `src/constants/badges.js`

**Streaks:**
- SQLite `user_streaks` table; current/longest/last_check_in/`streak_freezes_remaining=1`.
- Daily check-in awards 10 XP.
- Emoji escalation: ✦ → ⭐ (3d) → 🔥 (7d) → ⚡ (14d) → ✨ (30d) → 💎 (100d).
- Milestone badges at D1, D7, D30, D100.
- One free freeze per profile.

**XP & levels (5 tiers):**
- Day One (0) → Curious (75) → Engaged (300) → Active (1000) → Anchored (3000).
- Action XP: journal=20, chat=5, report_read=15, share=25, deep_dive=10, compatibility=15, quest=15.
- Streak multiplier: 1× / 1.5× (7d) / 2× (14d) / 2.5× (30d).
- First-action-of-day bonus: 2× on journal/chat/deep_dive (`xpService.js:8-24`).
- Level unlocks: voice options (L2), yesterday/tomorrow tabs (L3), deep match reports (L4), cosmic ID card (L5).

**Badges (20):** streak (4), exploration (4), knowledge (3), social (3), pattern-event (2), journey (4).

**Gaps:**
- No proactive freeze offer ("you have 1 freeze available — use it tonight?").
- `longest_streak` never resets — no fresh-start cohort possible.
- No "rescue" nudge for badges 1 action away from unlocking.
- No seasonal / limited-time badges (Mercury Rx warrior was disabled and never re-introduced).
- No XP boosts for re-activation moments (e.g., "Welcome back: 2× XP for next 24h").

## 4. Daily core loop — Today tab

**File:** `src/screens/HomeScreen.js`

**What works:**
- Time-of-day-aware hero gradient (morning / afternoon / evening / late-night).
- AI-generated relational day read (1 sentence + 3 life-area recs) via `geminiService.generateRelationalDayRead()`, with hand-written `RELATIONAL_THEMES` fallback (27 themes).
- Adaptive content by time mode: morning=action-first, afternoon=lighter, evening=reflective, late-night=comfort.
- Daily-fresh: moon phase + mood, journal prompt, 1–3 micro-quests, streak pill, energy scores (Love/Career/Self), Mercury retrograde card, lunar event card, share cards.
- Day-of-year-indexed seed → same content within a day (deterministic refresh).

**Gaps:**
- No A/B testing of headline copy (single navigator pool, no control arms).
- No countdown/anticipation for upcoming events ("3 days until Full Moon" — anticipation is a known dopamine driver, completely unused).
- No "you missed yesterday" recap on return after a lapse.
- Period tabs (week/month) cut from V1 → daily-only focus may feel limiting after 1 week.
- Variable reward is **finite** — by week 3 the briefing structure feels predictable. Hook Model warns: finite variability eventually fails.

## 5. AI chat & reports

**Files:** `src/screens/ChatScreen.js`, `src/services/geminiService.js`

**What works:**
- Unlimited sessions/messages stored in `chat_sessions` + `chat_messages` (no purge).
- Gemini fallback chain: `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-3-flash-preview`.
- V1 Language Override: psychological frame-first output; astrology used internally only.
- Suggestion pool: 16 initial questions + 6 follow-ups per topic (love/career/self/transit/generic + time-of-day bonus).
- Reports: PDF via `expo-print` (A4) — daily/weekly/monthly/compatibility/transits/cosmic-identity.

**Gaps:**
- Memory says "free chat limit 5 → 10 with nudge at 5" but **not currently implemented** — paywall context is stubbed.
- No save/favorite/pin for high-value chats (all chats equal in recall — investment doesn't compound).
- Chat is stateless — no "ask about [partner name]" auto-context-injection.
- No notification "your unfinished chat is waiting" — a major event-based prompt opportunity wasted.

## 6. Paywall & monetization

**Files:** `src/contexts/RevenueCatContext.js`, `src/services/revenueCatService.js`

**Current state — STUBBED:**
- `useRevenueCat()` returns frozen `{ isPro: true, isLoading: false }`.
- All premium gates silently unlock.
- Backend config exists (`API_KEYS.apple/google`, `ENTITLEMENT_ID = 'Celestia Pro'`) but disconnected.
- No paywall screens in navigation.
- **No free-trial flow, no cancel flow, no save offer, no dunning, no grandfather logic.**

**Gaps (all of them):**
- No upsell triggers anywhere.
- No price/plan comparison.
- No win-back path.
- No exit survey (so when monetization re-enables, we'll learn nothing from churners).

## 7. Analytics / instrumentation

**File:** `src/services/analytics.js`

**Current state — STUBBED:**
- `capture()`, `identify()`, `reset()` are all silent no-ops.
- Event names defined but unused: `ONBOARDING_STARTED`, `ONBOARDING_COMPLETED`, `AI_CHAT_MESSAGE_SENT`, `REPORT_GENERATED`, `CHART_DEEP_DIVE`, `COMPATIBILITY_CHECKED`, `DAILY_BRIEFING_VIEWED`, `APP_OPENED`, paywall events.
- PostHog is *imported in `App.js`* (`PostHogProvider` wraps the tree, captures `app_opened`) but the service-layer wrapper is dead.

**Gaps:**
- No D1 / D7 / D30 retention cohorts.
- No activation funnel (install → onboarding-done → first chart → first chat → first report).
- No churn-signal detection.
- No attribution.
- **This is the #1 P0 — every other retention experiment is shipped blind without it.**

## 8. Lapse / re-activation paths

**Files:** `src/services/notificationService.js`, `src/services/notificationContentEngine.js`

**What exists:** the D2 / D3 / D5 / D7 / D10 / D14 / D21 lapse-push cascade (see §2).

**Gaps:**
- Generic copy — no chart, partner, or chat-history personalization.
- No deep-link to specific surface (unfinished chat, unsaved partner, lapsed quest).
- No incentive (bonus XP, free freeze grant, "your spot is held").
- No "streaks reset, fresh start" framing for D8+.
- No referral hook in lapse sequence.
- Channel diversity: notifications only, no email/SMS.

## 9. Investment / sticky data

User-created data living in SQLite that creates switching cost:

| Table | Content | Switching cost |
|---|---|---|
| `profiles` + `charts` | Self chart + partner / friend / parent charts | High — unique birth-data combinations, not portable |
| `chat_sessions` + `chat_messages` | All conversations, auto-titled sessions | High — accumulates over months |
| `journal_entries` | Daily entries + AI reflections + cosmic snapshot | Very high — emotional content |
| `user_streaks` | Current/longest streak, freezes | Moderate — gamification capital |
| `user_xp` | Total XP, level | Moderate |
| `achievements` | Unlocked badges + timestamps | Moderate |
| `reports` | Generated reports | Low — regenerable |
| `forecasts` | Daily forecast cache | None — recomputes |

**Gaps:**
- No "download your data" export (GDPR + transparency miss).
- No data-volume feedback to user ("152 journal entries, 47 chats, 12 partner charts saved") — IKEA effect unsurfaced.
- No archive/favorite/pin on chats or journals — all equal weight, investment doesn't visibly compound.
- No "chart card" share mechanism beyond native Share.

---

## Summary table

| Surface | Status | Top gap |
|---|---|---|
| Onboarding | Strong aha | No D1 save-point or first-action nudge |
| Push (active) | 6 channels, AI lines | Time-based only; no event-based |
| Push (lapse) | D2–D21 cascade exists | Generic copy; gated on streak channel |
| Streaks | Full system | No proactive freeze offer; longest never resets |
| XP / levels | 5 tiers, multipliers | No re-activation XP boost |
| Badges | 20 across 6 categories | No "1 away" rescue; no seasonal rotation |
| Daily loop | Time-aware, AI-personalized | Variable reward is finite; no anticipation/countdown |
| Chat | Unlimited, multi-model | No save/favorite; no event-based notifications |
| Paywall | **STUB** (isPro=true) | Entire monetization layer absent |
| Analytics | **STUB** (no-op) | Cannot measure any retention metric |
| Lapse paths | 7-stage push cascade | No personalization, no incentive, no email/SMS |
| Sticky data | Rich — 7 tables | Switching cost invisible to user |

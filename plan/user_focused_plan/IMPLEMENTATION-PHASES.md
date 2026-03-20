# Celestia — Phased Implementation Plan

> Built for Mia. Every phase makes the app more indispensable to her daily life.

**Current state:** 7.2/10 — strong foundations, broken core loop, missing bridges.
**Target state:** 9.0/10 — notification-first, bridge-connected, viral-ready.

---

## Phase 1: Fix the Core Loop
**Goal:** Notification promise = App delivery. Mia opens the app and instantly sees what the notification told her.
**Impact:** HIGH — this is the #1 retention driver.
**Screens:** HomeScreen, notificationService, notificationContentEngine

### 1.1 Navigator Headline Hero
- [ ] Render `forecast.navigatorHeadline` as the main hero statement on HomeScreen (large Playfair text, gradient card)
- [ ] Render `forecast.navigatorSummary` as the sub-text beneath the headline
- [ ] When tapping notification, scroll to the hero section (deep link: `scrollToSection: 'hero'`)
- [ ] Match notification excerpt content to hero content (same source data)

### 1.2 Navigate Toward / Navigate Around Cards
- [ ] Render `forecast.navigateToward` array (4-5 items) as "do" cards with action + planetary reason
- [ ] Render `forecast.navigateAround` array (3-4 items) as "avoid" cards with action + reason + alternative
- [ ] Visual design: green accent for Toward, amber accent for Around
- [ ] Each item shows the planetary reason in smaller text (e.g., "Mars trines your Sun")

### 1.3 Five Life Area Navigator Cards
- [ ] Render all 5 `forecast.lifeAreas` as horizontal scroll cards: Love, Career, Vitality, Growth, Social
- [ ] Each card shows: energy level (bar/ring), navigatorNote, doItems, avoidItems
- [ ] Replace the old 2-card Love/Career domain layout with this 5-card system
- [ ] Tap card -> expand modal with full do/avoid guidance + "Ask Celestia about this" bridge

### 1.4 Notification -> Hero Link
- [ ] `notificationExcerpt` (title + body + lifeArea) becomes the primary morning notification template
- [ ] When user taps morning notification, deep link to HomeScreen hero section
- [ ] If `notificationExcerpt.lifeArea` is set, highlight that life area card on open
- [ ] Remove generic curiosity-gap templates from highest priority; real value first

### 1.5 Evening Reflection (Time-Gated)
- [ ] After 6 PM: show evening section with "How did today land?" prompt
- [ ] Simple mood rating (1-5 or emoji scale) tied to today's forecast
- [ ] Optional journal prompt seeded from today's navigatorHeadline
- [ ] Feed tomorrow's forecast context with today's mood/reflection

---

## Phase 2: Onboarding Wow Moment
**Goal:** The first 60 seconds after chart calculation make Mia feel *personally seen*. She screenshots. She tells friends.
**Impact:** CRITICAL — determines if she becomes a daily user or deletes the app.
**Screens:** WelcomeScreen, OnboardingFlowScreen, ProfileScreen, storage

### 2.1 Personality Reveal on WelcomeScreen
- [ ] After chart calculation, generate 2-3 highly specific placement statements via Gemini
- [ ] Examples: "You have Moon in Pisces, 12th house — your emotional world is vast and private. You feel things others don't notice."
- [ ] Display as animated reveal cards (staggered fade-in) before showing Big 3 pills
- [ ] Make each card screenshottable with Celestia branding
- [ ] "This is scary accurate" reaction = mission accomplished

### 2.2 Persona & Depth Persistence
- [ ] Save selected persona (Poetic/Psychological/Direct/Spiritual) to AsyncStorage + user profile
- [ ] Save selected depth (Beginner/Intermediate/Advanced) to AsyncStorage + user profile
- [ ] Pass persona + depth into ALL AI prompts: geminiService system instructions, chat, reports, daily insights
- [ ] ProfileScreen: add settings row to change persona/depth post-onboarding

### 2.3 Notification Time Picker
- [ ] Add time picker in onboarding notification step: "When should your daily briefing arrive?"
- [ ] Default: 7:30 AM, allow 5:00 AM - 11:00 AM range
- [ ] Save to AsyncStorage, use in `scheduleAllNotifications`
- [ ] Also add to NotificationSettingsScreen for later changes

### 2.4 Onboarding Auth Flow
- [ ] After personality reveal + Big 3, offer sign-in: "Save your chart to the cloud"
- [ ] Google-only (already built), skip option prominent
- [ ] No friction — signing in is optional, not blocking

---

## Phase 3: Chart — At-a-Glance & Patterns
**Goal:** Mia opens her chart and instantly understands the 3 things that define her, without scrolling through 10 planets.
**Impact:** MEDIUM-HIGH — improves "aha" density, drives report purchases.
**Screens:** ChartScreen

### 3.1 At-a-Glance Default View
- [ ] New default state: show Top 3 defining placements in plain language cards
- [ ] Selection logic: angular planets (1st/4th/7th/10th house), stelliums, tight major aspects, chart ruler
- [ ] Each card: planet + sign + house + one-sentence meaning + "The pattern" insight
- [ ] "See Full Chart" toggle to expand to current detailed view

### 3.2 Top 3 Patterns Section
- [ ] Below at-a-glance cards, add "Why You Do That Thing" section
- [ ] AI-generated or rule-based: identify 3 most significant patterns
- [ ] Examples: "Sun square Saturn — you never feel like enough, even when you are", "Venus conjunct Mars — you love intensely and can't do halfway"
- [ ] Each pattern links to "Ask Celestia about this" chat bridge

### 3.3 Chart Guide Header
- [ ] Add educational intro line: "Your birth chart reveals patterns, not fate."
- [ ] CosmicTooltip on "birth chart" term for first-time viewers
- [ ] Subtle, non-intrusive — one line above the chart wheel

### 3.4 Element & Modality Balance
- [ ] Display element distribution (Fire/Earth/Air/Water) as visual bars
- [ ] Display modality balance (Cardinal/Fixed/Mutable)
- [ ] One-line interpretation: "You're heavy in Water and Fixed — deep emotions you hold onto"
- [ ] Data already calculated, just needs rendering

---

## Phase 4: Circle — Viral Compatibility Engine
**Goal:** Every compatibility check = 2 users acquired. Zodiac-only mode removes all friction for casual checks.
**Impact:** HIGH — this is the viral growth engine.
**Screens:** CompatibilityScreen, SynastryService, geminiService

### 4.1 Zodiac-Only Quick Flow
- [ ] New simplified "Add" flow: just name + zodiac sign selector (12 sign pills)
- [ ] Toggle at top of Add modal: "I know their birthday" / "Just their sign"
- [ ] Zodiac-only shows: basic element compatibility, communication style, instant score (30% depth)
- [ ] CTA: "Add their birthday for a deeper reading" — progressive disclosure
- [ ] `calculateZodiacOnlyScore()` already exists in SynastryService, connect it to UI

### 4.2 Relationship Type Selector
- [ ] Add relationship type pills in Add Partner modal: Partner, Friend, Parent, Sibling, Boss, Colleague, Child, Other
- [ ] Default: Partner (65% of checks)
- [ ] Save relationship type to partner profile
- [ ] Display relationship type badge on partner chip in Circle view

### 4.3 Relationship-Type-Specific AI Prompts
- [ ] Modify `generateMatchCore`, `generateMatchDetails`, `generateMatchInsights` to accept relationship type
- [ ] Partner/Crush: romantic language, chemistry, long-term potential
- [ ] Ex: why it ended, patterns to recognize, closure insights
- [ ] Friend: bond strength, communication, lifetime compatibility
- [ ] Family: emotional support, generational patterns, understanding
- [ ] Boss/Colleague: work dynamics, communication friction, collaboration style
- [ ] Conditional prompt blocks in Gemini system instructions per type

### 4.4 Blurred Premium Sections
- [ ] Compatibility result shows first section free ("The Spark — Why You're Drawn to Each Other")
- [ ] Remaining sections show titles + blurred content: "Emotional Dynamic", "Where You'll Fight", "The Long Game"
- [ ] "Unlock Full Compatibility Report" CTA at blur boundary
- [ ] Peak curiosity moment: she just saw 85% chemistry, NEEDS to know "Where You'll Fight"

### 4.5 Viral Share Link
- [ ] Generate shareable link: "Check our compatibility on Celestia!"
- [ ] Link opens app/web with pre-filled partner name + Mia's data reference
- [ ] When recipient enters their data, both get push notification: "Your compatibility report just got deeper!"
- [ ] Both see updated, richer report
- [ ] Every share = 1 new user acquired at $0 CAC

---

## Phase 5: Chat — Personal Astrologer
**Goal:** Mia's chat feels like texting her most insightful friend who happens to know her entire chart.
**Impact:** MEDIUM-HIGH — drives daily engagement + premium conversion.
**Screens:** ChatScreen, geminiService

### 5.1 Session Theme Selector
- [ ] Add theme pill bar at top of new chat: Love, Career, Growth, Today's Energy, Open
- [ ] Selected theme shapes Gemini system prompt + suggested questions
- [ ] Theme persists across session messages
- [ ] "Today's Energy" theme auto-references current forecast/transits

### 5.2 Persona-Aware Tone
- [ ] Read saved persona from profile/AsyncStorage
- [ ] Inject into chat system prompt:
  - Poetic: metaphorical, flowing, uses imagery
  - Psychological: analytical, pattern-focused, "here's what's really happening"
  - Direct: short, clear, no fluff, "here's what to do"
  - Spiritual: connected, purposeful, "the universe is showing you"
- [ ] Read saved depth level and adjust jargon/explanation level accordingly

### 5.3 Reflective Mode
- [ ] After 3+ messages in a session, AI starts asking reflective questions back
- [ ] "You mentioned Jake twice this week — what's your gut telling you about that?"
- [ ] "When you read that about your Venus, what came up for you?"
- [ ] Builds therapeutic feel without being therapy
- [ ] Toggle: user can turn off if they just want answers

### 5.4 "Ask AI About This" Bridges
- [ ] HomeScreen life area cards: "Ask Celestia about your love energy today" -> opens chat with pre-filled context
- [ ] ChartScreen planet cards: "Ask about your Venus in Scorpio" -> opens chat with placement context
- [ ] Compatibility results: "Ask why you and Jake keep fighting" -> opens chat with synastry context
- [ ] Transit alerts: "Ask what this Mercury retrograde means for you" -> chat with transit context

### 5.5 Chat Memory (Premium)
- [ ] Premium users: AI references previous session topics
- [ ] Store key entities mentioned (names, situations, recurring themes) in chat metadata
- [ ] Gemini system prompt includes recent session summaries for Premium users
- [ ] "Last time you mentioned the guy from the coffee shop — how did that go?"
- [ ] Free users: last 7 days of history visible. Premium: full history

---

## Phase 6: Reports — Premium Content Engine
**Goal:** Reports are so beautiful and specific that Mia screenshots every page and sends them to friends.
**Impact:** MEDIUM — direct revenue driver.
**Screens:** ReportsScreen, geminiService

### 6.1 Report Design Polish
- [ ] Every report section: heading (Playfair) + warm prose (DM Sans) + 1 highlight box
- [ ] Highlight box = the screenshottable insight (key takeaway per section)
- [ ] 30%+ white space per page
- [ ] Celestia watermark on every page
- [ ] Desert Dawn palette for reports (warm sand/terracotta for light mode reports)

### 6.2 Venus Report (New)
- [ ] "Why You Love Like This" — 12-16 pages, $9.99
- [ ] Sections: Venus Sign, 7th House, Attachment Style, The Pattern (repeating cycle), What You Actually Need, Breaking the Pattern
- [ ] Highest emotional impact report — Mia's #1 pain is relationship patterns
- [ ] Bridge from Chart Venus deep-dive: "Want to understand why you love like this?"

### 6.3 Saturn Return Guide (New)
- [ ] "Your Saturn Return Survival Guide" — 18-22 pages, $12.99
- [ ] Sections: What Is Saturn Return (plain language), YOUR Saturn Return (specific dates), Relationships During, Career During, Identity During, Month-by-Month Survival, What's on the Other Side
- [ ] Target audience: 27-30 year olds in crisis (high conversion)
- [ ] Time-gated: only surface when user's Saturn return is approaching or active

### 6.4 Report Archive
- [ ] Save generated reports to SQLite for revisiting
- [ ] "My Reports" section showing previously purchased/generated reports
- [ ] Don't regenerate — show saved version with option to "Refresh"

---

## Phase 7: Bridges & Emotion Engine
**Goal:** Mia never "navigates" — she follows curiosity. The app feels like one continuous flow, not 5 separate tabs.
**Impact:** HIGH — transforms UX from tool collection to living experience.
**Screens:** All screens, HomeScreen

### 7.1 Bridge System
- [ ] Every feature endpoint offers 2-3 contextual "go deeper" links to other features
- [ ] Daily Insight -> "Ask Celestia about this" (Chat), "See which planet is driving this" (Chart)
- [ ] Chat response -> "Check compatibility with him" (Circle), "See your Venus placement" (Chart)
- [ ] Chart planet -> "Ask about this placement" (Chat), "How this affects compatibility" (Circle)
- [ ] Compatibility result -> "Ask why you fight" (Chat), "Get the full report" (Reports)
- [ ] Report section -> "Ask about this insight" (Chat)

### 7.2 Time-of-Day Home Adaptation
- [ ] **Morning (7-10 AM):** Bright hero, action-focused, "Today's theme" prominent, Navigate Toward first
- [ ] **Afternoon (12-5 PM):** Lighter check-in, quick prompts, chat shortcuts
- [ ] **Evening (8 PM+):** Reflective tone, Moon transit prominent, journal prompt, Navigate Around emphasis, comfort mode
- [ ] **Late night (11 PM+):** Soft tone, no upsells, comfort chat prompts, "How are you feeling?" entry point

### 7.3 Emotion-Aware Prompts
- [ ] If user re-reads old compatibility reports: show comfort prompt, not upsell
- [ ] If user checks compatibility right after opening (excited): show action prompts
- [ ] If long chat session with sad keywords: soften tone, remove upsells
- [ ] If weekend + social time: show fun features ("Roast my chart", shareable cards)
- [ ] Implementation: lightweight state machine based on time + recent actions + session length

### 7.4 Per-Tab Guide Headers
- [ ] Each tab's first visit: one-line contextual guide
- [ ] Today: "Your daily cosmic navigator. Updated every morning."
- [ ] Ask AI: "Chat with an astrologer who knows your entire chart."
- [ ] Chart: "Your birth chart reveals patterns, not fate."
- [ ] Circle: "Check your compatibility with anyone."
- [ ] Reports: "Deep analysis of your chart, love life, and year ahead."
- [ ] Show once per tab, dismissible, stored in AsyncStorage

---

## Phase 8: Viral Mechanics & Share Polish
**Goal:** Everything Mia sees is beautiful enough to screenshot and share. Every share = free marketing.
**Impact:** HIGH — drives organic growth at $0 CAC.
**Screens:** All share cards, deep link service

### 8.1 Screenshot Design System
- [ ] Every result screen has "Share to Stories" button generating a pre-designed card
- [ ] Cards use Desert Dawn palette (warm, unique on IG feed)
- [ ] Celestia watermark visible but subtle on all share cards
- [ ] Include celestia.com URL on share cards

### 8.2 Chart Link Sharing
- [ ] Generate shareable chart summary link/card
- [ ] Shows Big 3 + one defining pattern
- [ ] "Get your free chart" CTA at bottom
- [ ] Shareable to dating profiles, bios, group chats

### 8.3 Compatibility Viral Loop
- [ ] One-tap share: "Check our compatibility on Celestia!"
- [ ] Deep link opens app with pre-filled data
- [ ] Push notification when partner enters their data
- [ ] Both users see richer result -> both screenshot -> both share -> exponential

### 8.4 Group Chat Optimization
- [ ] AI responses specific enough to be share-worthy (not generic)
- [ ] Share button on every AI chat response
- [ ] Compatibility scores designed for group chat reactions ("78% match but chemistry 90%...")
- [ ] Planet deep-dives shareable: "My Venus in Scorpio means..."

---

## Phase 9: Monetization Refinement
**Goal:** Upgrade appears at peak curiosity, never at rest. Mia never feels "sold to."
**Impact:** MEDIUM — revenue optimization.
**Screens:** PaywallScreen, all screens with premium gates

### 9.1 Invisible Funnel Moments
- [ ] **Chat limit hit** (5 messages): soft counter "2 left today", at 0: gentle upgrade CTA
- [ ] **Monday weekly report**: first paragraph free, rest blurred with "Included with Premium"
- [ ] **Compatibility blur**: "Where You'll Fight" section locked at peak curiosity
- [ ] **Birthday/Solar Return**: special home screen, "Your year-ahead forecast is ready, Mia" — 8-12% conversion
- [ ] **Mercury Retrograde**: proactive alert + "See full impact on YOUR chart" upgrade CTA

### 9.2 Premium Value Props
- [ ] Unlimited AI chat + full history + context memory
- [ ] Weekly Monday transit reports
- [ ] All reports included (no per-report purchases)
- [ ] Full chart depth (aspects, houses, transits)
- [ ] Memory layer (app remembers her conversations, growth, relationships)

### 9.3 Trial Optimization
- [ ] 7-day free trial (not 3) — she gets one full Monday report + several chats + compatibility check
- [ ] After trial: "Your trial included 1 weekly report, 42 chats, and 3 compatibility checks. Keep going?"
- [ ] Show what she'd lose, not what she'd gain

---

## Priority Order (What to Build First)

| Order | Phase | Why First |
|-------|-------|-----------|
| 1 | **Phase 1** (Core Loop) | Fixes the #1 problem: notification promise != app delivery. Highest retention impact. |
| 2 | **Phase 2** (Onboarding Wow) | Determines if new users stay or delete. Critical for growth. |
| 3 | **Phase 4** (Circle Viral) | Zodiac-only flow + share links = viral growth engine. Each check = 2 users. |
| 4 | **Phase 5** (Chat Polish) | Themes + persona + bridges make chat the daily engagement anchor. |
| 5 | **Phase 3** (Chart At-a-Glance) | Improves aha density, drives report purchases. |
| 6 | **Phase 7** (Bridges & Emotion) | Transforms 5 separate tools into one continuous experience. |
| 7 | **Phase 8** (Viral Mechanics) | Polishes share cards, adds chart links, group chat optimization. |
| 8 | **Phase 6** (New Reports) | Venus + Saturn Return reports expand revenue. |
| 9 | **Phase 9** (Monetization) | Fine-tunes conversion timing and premium value. |

---

## What Already Exists (Don't Rebuild)

| Feature | Status | Notes |
|---------|--------|-------|
| Engagement system (streaks, XP, badges, quests) | Complete | 20 badges, 5 tiers, haptics |
| Notification engine (40+ templates, 8 categories) | Complete | Needs reframing, not rebuilding |
| AI schema (navigatorHeadline, navigateToward/Around, lifeAreas) | Complete | Data generated but not rendered |
| Educational layer (CosmicTooltip, AstroText) | Complete | 50+ tooltips, 25+ terms |
| Chart SVG wheel + planet deep-dives | Complete | Needs at-a-glance wrapper |
| Synastry scoring + zodiac-only calculation | Complete | Needs UI flow |
| Share cards (10+ types) | Complete | Need Desert Dawn polish |
| PDF reports (7 types) | Complete | Need highlight boxes + archive |
| Chat with history + session persistence | Complete | Needs themes + persona |
| RevenueCat paywall | Complete | Needs invisible funnel moments |
| Google Sign-In (lazy-loaded, Expo Go safe) | Complete | Working |
| PostHog analytics | Complete | Tracking app opens |

---

## Success Metrics (Per Phase)

| Phase | Key Metric | Target |
|-------|-----------|--------|
| Phase 1 | Morning notification open rate | 35%+ (from current ~20%) |
| Phase 1 | Daily active users reading full insight | 60%+ |
| Phase 2 | Onboarding screenshot rate | 15%+ share Big 3 reveal |
| Phase 2 | Day 1 -> Day 2 retention | 55%+ |
| Phase 4 | Compatibility checks per user per month | 2+ |
| Phase 4 | Users acquired per compatibility share | 0.5+ |
| Phase 5 | Chat sessions per active user per week | 3+ |
| Phase 7 | Cross-feature navigation per session | 2+ tabs visited |
| Phase 8 | Screenshot share rate (daily insight) | 5%+ of DAU |
| Phase 9 | Free -> Premium conversion | 12-18% |

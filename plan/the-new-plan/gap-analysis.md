# Celestia — Gap Analysis: Current State vs New Plan

> What's built, what's missing, what needs reshaping.

---

## Status Legend

- **DONE** — Fully built and functional
- **PARTIAL** — Foundation exists but needs significant rework
- **MISSING** — Not built at all
- **RESHAPE** — Built but needs reframing/restructuring for new plan

---

## 1. TODAY TAB (HomeScreen) — The Daily Navigator Briefing

### What's Built (Extensive)

| Feature | Status | Current Implementation |
|---------|--------|----------------------|
| Hero section | DONE | Greeting, name, streak badge, avatar, moon strip, archetype chip |
| Period tabs | DONE | Yesterday/Today/Tomorrow/Weekly/Monthly/Yearly with level-gating |
| AI forecast card | DONE | Header, mantra, 4-6 structured paragraphs, action items, daily ritual |
| Energy grid | DONE | 8 scrollable cards (Love/Career/Vitality/Mood/Social/Create/Focus/Luck) with % scores, tappable modals |
| Love & Career cards | DONE | Side-by-side cards with "Deep Dive →" → full AI domain modal (headline, analysis, YOUR MOVE, TIMING) |
| Lucky elements | DONE | Number, color, crystal — 3-column layout |
| Journal | DONE | Mood selector (5 emoji), energy slider (1-10), freeform text, saved to SQLite |
| Moon ritual | DONE | New/Full Moon modal with prompts, affirmation, intention writing |
| Mercury Rx banner | DONE | Orange banner with share survival kit |
| Sky Now strip | DONE | Top 6 planet positions, tappable → Sky tab |
| Cosmic Windows | DONE | 2 active transits to user's chart with EXACT badges |
| Tomorrow preview | DONE | "Next Chapter Preview" with moon/transit hooks |
| Previously On | DONE | Yesterday's forecast header + journal snippet |
| Cosmic Whisper | DONE | 10% easter egg with rarity tiers |
| Daily quests | DONE | 3-5 daily tasks with progress bars |
| Badge progress | DONE | Next unearned badge with progress bar |
| Quick actions | DONE | 4-card grid (Chart, Chat, QuickChart, Compatibility) |
| Reports promo | DONE | Dark card linking to Reports tab |
| Streak tracking | DONE | Animated badge, milestones, freeze mechanic |
| Share functionality | DONE | Native share + Stories capture for forecast, moon, compatibility |
| Pull-to-refresh | DONE | Refreshes all data sources |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **Today's Headline Hero** | HIGH | No single "anchor statement" that matches the notification excerpt. Current hero shows greeting + moon + archetype but not "Today rewards courage in relationships" style headline that the notification teased. |
| **Navigate Toward / Navigate Around** | HIGH | No explicit do's/avoids section. Current "actionItems" are 3 generic tasks (max 4 words each like "Breathe deeply"). Need full "NAVIGATE TOWARD" (4-5 items with reasons) and "NAVIGATE AROUND" (3-4 items with reasons + alternatives). |
| **Life Area Navigator Cards** | HIGH | Only Love & Career have domain cards. **Missing: Vitality & Rhythm, Growth & Learning, Social & Communication.** The energy grid shows percentages for 8 areas but doesn't provide navigational do/avoid advice per area — just a number and a vibe sentence. |
| **Notification-to-Hero Link** | HIGH | No mechanism to make the hero section display the expanded version of whatever the notification said. Currently hero and notification content are generated independently. |
| **Evening Reflection** | MEDIUM | Journal exists but is always visible. No time-gated "How did today match?" reflection prompt. No accuracy/mood rating tied to today's briefing. No feedback loop into tomorrow. |
| **Power Elements reframing** | LOW | Currently labeled "lucky" (luckyStats in AI schema). Need to reframe as "power" with planetary derivation shown (e.g., "Deep teal — Venus dominant today"). |
| **Sky absorption** | HIGH | Sky Now strip links to separate Sky tab. Need to absorb TransitsScreen content into Today's bottom section and remove Sky tab entirely. |
| **Guide Bar** | MEDIUM | No persistent "?" guide overlay explaining how to read the briefing. CosmicTooltip exists on individual elements but no holistic "How to read your daily briefing" guide. |

### Reshape Needed

| Current Feature | Change Needed |
|----------------|---------------|
| Energy grid (8 % cards) | Evolve into Life Area Navigator cards with do/avoid per area, not just percentage |
| Love & Career domain cards | Expand to 5 areas (add Vitality, Growth, Social) with consistent do/avoid format |
| Forecast hero card | Split into: Headline Hero (top) + detailed reading (scrollable below) |
| Action items (3 generic) | Replace with structured Navigate Toward / Navigate Around sections |
| Lucky elements | Reframe as Power Elements with planetary reasoning |

---

## 2. NOTIFICATIONS — The Foundation

### What's Built

| Feature | Status |
|---------|--------|
| 8 notification categories | DONE — Morning, Evening, Transit, Streak, Lapsed, Unlock, Milestone, Weekly |
| AI-generated batch (7-day buffer) | DONE — `generateCosmicNotificationBatch()` with curiosity-gap prompts |
| 40+ template fallbacks | DONE — Weighted selection, frequency capping, data-requirement gating |
| Deep linking (notification → tab) | DONE — Category-based routing via `handleNotificationNavigation()` |
| Frequency capping | DONE — Max 2/day, quiet hours, priority ordering |
| Lapsed re-engagement cascade | DONE — 7-message escalation over 21 days |
| Narrative awareness | DONE — Yesterday's forecast/journal, cosmic season, Mercury Rx available |
| Android channels | DONE — 6 channels with appropriate importance levels |
| Cold-start handling | DONE — `getLastNotificationResponseAsync()` in App.js |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **Excerpt-based notifications** | CRITICAL | Current AI notifications use "curiosity gap" strategy — tease without real value. New plan requires notifications to contain the **actual core insight** that's useful on its own. The notification IS the product's front door. Need to restructure `generateCosmicNotificationBatch()` prompt to output a real daily excerpt, not just a hook. |
| **Life-area specific hooks** | HIGH | No notifications reference specific life areas ("Your career energy peaks at 2 PM"). Current hooks are general ("Something shifted overnight"). Need notification to highlight the day's most relevant life area with a specific do/avoid. |
| **Notification → Section scroll** | HIGH | Deep linking opens the right tab but can't scroll to a specific section. If notification says "Career peaks at 2 PM" it should scroll Today to the Career navigator card. Need section-level scroll anchors with `scrollTo` refs. |
| **Notification time selection** | MEDIUM | Onboarding asks about notification types but not preferred time. New plan wants user to choose their briefing delivery time. |
| **"Useful even if unopened" test** | HIGH | Current notification body limit is 30 words. May need to increase or restructure to fit a genuinely useful excerpt + reason + action. |
| **Weekly navigator notification** | MEDIUM | Weekly digest exists but is template-based. Need AI-generated weekly theme excerpt. |
| **Re-engagement via chart** | LOW | The "explain their absence through their chart" feature exists in lapsed templates but could be richer with actual transit data for the absent days. |

### Reshape Needed

| Current Feature | Change Needed |
|----------------|---------------|
| `generateCosmicNotificationBatch()` prompt | Rewrite from "curiosity gap hooks" to "real daily excerpts with value" |
| Notification content schema | Add fields: `lifeArea`, `doAction`, `avoidAction`, `planetaryReason` |
| Template engine | Update templates to include actionable excerpts, not just teasers |
| Deep link params | Add `scrollToSection` parameter for section-level navigation |
| Onboarding Step 3 | Add time picker for preferred briefing time |

---

## 3. COMPATIBILITY → CIRCLE (Viral Engine)

### What's Built

| Feature | Status |
|---------|--------|
| Full synastry scoring (0-100 + 5 sub-dimensions) | DONE |
| AI analysis: core headline + detailed areas + insights + viral | DONE — 4 separate AI functions |
| Share cards (4 themes) | DONE — MatchStoryCard with Aura/Golden/Midnight/Rosé |
| PDF compatibility report | DONE — 20+ page deep report with A4 styling |
| Cross-device invite codes | DONE — 8-char codes, 30-day expiry, Supabase sync |
| Multiple partner carousel | DONE — Horizontal chip selector |
| Transit context in analyses | DONE — Active relationship transits woven into AI |
| Cosmic season context | DONE — Relationship season card shown |
| XP/badge tracking | DONE — Awards for match checks, shares, reports |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **Zodiac-sign-only matching** | HIGH | Requires full DOB + birth time + location. Must add a simplified flow: just name + zodiac sign → sun-sign compatibility analysis. Needs a separate lighter AI prompt and scoring model (no houses, no aspects beyond sun-sign). |
| **Relationship types** | HIGH | All profiles are `type: 'other'` with no distinction. Need: Partner, Best Friend, Parent, Sibling, Boss, Colleague, Child, Custom. Each type needs to modify AI prompt tone (boss = work dynamics, parent = generational patterns, etc.). |
| **Circle constellation view** | MEDIUM | Current view is a horizontal chip carousel. New plan wants a visual constellation/network layout showing all relationships with lines/scores. |
| **Relationship-type-specific AI prompts** | HIGH | All 4 match functions (core, details, insights, viral) use romantic language ("love languages", "attraction", "Venus-Mars chemistry"). Need conditional prompt blocks per relationship type. |
| **Group dynamics** | LOW | No view for "Your inner circle's element balance" or multi-person analysis. |
| **Add Partner: zodiac-only flow** | HIGH | Add Partner modal requires birth date + time + city. Need an alternate path: just name + zodiac sign dropdown. |
| **Relationship type in DB** | MEDIUM | `profiles` table has `type` field but only uses 'self'/'other'. Need to add `relationship_type` column or repurpose existing field. |

### Reshape Needed

| Current Feature | Change Needed |
|----------------|---------------|
| Add Partner modal | Add relationship type selector + zodiac-sign-only toggle |
| `profiles` table schema | Add `relationship_type` column (partner/friend/parent/boss/etc.) |
| All AI match prompts | Add conditional blocks per relationship type |
| SynastryService | Add simplified sun-sign-only scoring path |
| Screen title/framing | "Match" → "Circle", romantic framing → universal relationship framing |
| Tab bar icon/label | Update from "Match" to "Circle" |
| Partner carousel | Evolve into visual constellation layout |

---

## 4. CHART — Cosmic DNA

### What's Built

| Feature | Status |
|---------|--------|
| Chart wheel visualization | DONE — ChartWheel SVG with real planet positions |
| 3-tab navigation (Planets/Aspects/Houses) | DONE |
| Planet deep dive AI modals | DONE — Hook, definition, traits, house, transit context |
| Aspect deep dive modals | DONE — Nature badge, strength/challenge, YOUR MOVE |
| House deep dive modals | DONE — Theme, meaning, sign influence, planets, life lesson |
| Drip-feed unlock (Day 1-15) | DONE — Sequential planet reveal with narrative hooks |
| Live transit badges | DONE — Gold "LIVE" indicator on activated planets |
| Share cards (Big 3 + archetype) | DONE |
| CosmicTooltip integration | DONE — "?" buttons throughout |
| AstroText term highlighting | DONE |
| Unlock progress bar | DONE — "X/Y chapters revealed" |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **At-a-Glance vs Detailed toggle** | HIGH | Currently shows all planet rows in a single list. Need a default "At-a-Glance" view showing the top 3 most defining placements in plain language, with a toggle to switch to the full detailed planet/aspect/house tabs. |
| **Top 3 Patterns section** | HIGH | No section that says "Sun in Scorpio, 8th house — you transform through intensity." Need AI or rule-based extraction of the 3 most significant placements (angular planets, stelliums, tight aspects, packed houses). |
| **Guide header** | MEDIUM | No explanatory header like "Your birth chart reveals patterns, not fate." Current hero is just a gradient with Big 3 display. Need an educational intro card explaining what a birth chart is. |
| **Element/modality balance bar** | MEDIUM | Element/modality data is calculated and stored in `charts` table JSON, but not displayed as a visual bar on the chart screen. Only shown internally. |
| **Dominant planet/sign summary** | LOW | Not calculated or displayed. Would need a `getDominantPlanet()` function. |

---

## 5. ASK AI (ChatScreen)

### What's Built

| Feature | Status |
|---------|--------|
| Smart narrative-aware greeting | DONE — Season, Mercury Rx, yesterday's mood, today's Moon |
| Suggested questions (context-aware) | DONE — 5 initial + topic-based followups (love/career/self/transits) |
| Session persistence | DONE — Loads most recent session from DB |
| New Chat button | DONE |
| Proactive insight card | DONE — Transit/moon context with tap-to-ask CTA |
| Big Three context chips | DONE — Sun/Moon/Rising in header |
| Markdown rendering | DONE — Bold/italic in AI responses |
| Transit-triggered navigation | DONE — "Ask Celestia About..." from TransitsScreen |
| Chart-aware system instructions | DONE — Full natal chart in system prompt |
| Narrative context in system prompt | DONE — Yesterday's data, cosmic season, archetype |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **Session Themes UI** | MEDIUM | No visible theme selector (Love/Career/Growth/Today). Themes are implicit in greeting. Need a card/pill selector at session start. |
| **Reflective Mode** | MEDIUM | AI doesn't proactively ask reflective questions back. Would need a system prompt toggle: "In this mode, after answering, ask the user a reflective question connecting their natal chart to their lived experience." |
| **"Ask AI about this" from Today** | HIGH | Life area cards on Today should have "Ask AI →" buttons that navigate to Chat with pre-filled context about that life area. TransitsScreen already does this — need to extend pattern to Today's life area cards. |
| **Yesterday's journal surfaced** | LOW | Journal data exists in narrative context but isn't explicitly shown in chat UI. Could add a small card: "You wrote yesterday: '...'" |

---

## 6. REPORTS

### What's Built

| Feature | Status |
|---------|--------|
| 7 report types | DONE — Love, Career, Lunar, Purpose, Yearly, Transit, Solar Return |
| AI generation with overlay | DONE — 8-step cinematic loading per report theme |
| PDF export (A4) | DONE — Multi-page, premium navy/gold styling |
| Modal display | DONE — Scrollable sections (headline, overview, big three, planets, life areas, soul path) |
| Share quote cards | DONE — Captured + shared via native share |
| Narrative context in prompts | DONE |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **Report archival** | MEDIUM | Reports are generated fresh each time, not saved to DB. User can't revisit old reports. |
| **In-app PDF preview** | LOW | Currently launches print dialog directly. Could show PDF preview first. |
| **Dynamic descriptions** | LOW | Report card descriptions are static. Plan mentions descriptions that change based on active transits. |

---

## 7. ONBOARDING — The "Wow" Moment

### What's Built

| Feature | Status |
|---------|--------|
| Birth details (name, date, time, city) | DONE — DateTimePicker + Nominatim city search |
| Persona selection (4 types) | DONE — Poetic/Psychological/Direct/Spiritual |
| Depth level (3 tiers) | DONE — Beginner/Intermediate/Advanced |
| Notification preferences (4 toggles) | DONE — Daily, Moon, Transit, Weekly |
| Welcome screen (chart wheel + Big 3) | DONE — Animated chart reveal with zodiac pills |
| "Don't know exact time" toggle | DONE |

### What's Missing for New Plan

| Gap | Priority | Description |
|-----|----------|-------------|
| **Personality reveal** | CRITICAL | After chart calculation, must show 1-2 highly specific, resonant placement statements: "You have Moon in Pisces — you feel everything deeply, even when you wish you didn't." Currently WelcomeScreen shows Big 3 pills but no personality-level insight. Need AI or rule-based "most distinctive placements" extraction + human-resonant statement generation. |
| **Persona/depth persistence** | HIGH | Selected persona and depth are local state variables that are NEVER SAVED to the profile object. They're discarded after `setUserProfile()`. Must save to profile or AsyncStorage and use in all AI prompt tone instructions. |
| **Notification time picker** | MEDIUM | User picks notification types but not delivery time. Need time selector (default 8 AM). |
| **One-field-at-a-time flow** | LOW | Currently all fields on one screen (Step 1). Plan suggests one field per step for cleaner UX. May not be worth the extra screen transitions. |
| **"Your Navigator is Ready" framing** | LOW | Current Step 3 is basic toggles. Could reframe as "Allow Celestia to send your daily briefing?" with more context on value. |

---

## 8. NAVIGATION — Tab Structure

### What's Built

| Current | Plan Target |
|---------|-------------|
| 6 tabs: Today, Ask AI, Chart, Match, Sky, Reports | 5 tabs: Today, Ask AI, Chart, Circle, Reports |

### Changes Needed

| Change | Priority | Description |
|--------|----------|-------------|
| **Remove Sky tab** | HIGH | Absorb TransitsScreen content into Today's bottom section. Move transit cards, Mercury Rx section, "Building Toward" card, and "Coming Up" timeline into Today tab below the life area navigator. |
| **Rename Match → Circle** | HIGH | Update tab label, icon, and all references. |
| **Update TabBar.js** | HIGH | Remove Sky tab, reorder, update icons/labels. |
| **Update AppNavigator.js** | HIGH | Remove TransitsScreen from tab config, keep as modal or inline. |
| **Deep link updates** | MEDIUM | Transit alert notifications currently open Sky tab. Must redirect to Today → sky events section. |

---

## 9. ENGAGEMENT SYSTEM

### Status: FULLY BUILT — No Gaps

| Feature | Status |
|---------|--------|
| Streak system (check-in, freeze, milestones) | DONE |
| XP/levels (11 actions, 5 tiers, multipliers) | DONE |
| 20 badges (5 categories) | DONE |
| Haptic feedback | DONE |
| Daily quests | DONE |
| Badge unlock modal | DONE |
| Level-up modal | DONE |
| Welcome back modal | DONE |
| Profile badge grid + streak + XP display | DONE |

No gaps against the new plan. Engagement system is complete and integrated.

---

## 10. EDUCATION LAYER

### What's Built

| Feature | Status |
|---------|--------|
| CosmicTooltip (50+ entries) | DONE |
| AstroText (25 terms) | DONE |
| Integration across all screens | DONE |

### What's Missing

| Gap | Priority | Description |
|-----|----------|-------------|
| **Per-tab guide overlay** | MEDIUM | No holistic "How to read this tab" guide. Each tab should have a persistent "?" that explains the tab's purpose (Today → "How to read your briefing", Chart → "What is a birth chart?"). Current tooltips explain individual terms, not the tab itself. |
| **Progressive disclosure** | LOW | No differentiation between first-time and returning users. Could reduce tooltip density after N visits. |
| **Tooltip analytics** | LOW | No tracking of which tooltips are tapped most. Would inform content prioritization. |

---

## 11. AI CONTENT ENGINE — The Hidden Critical Gap

### Current State

| Function | Life Areas | Do/Avoid | Narrative |
|----------|-----------|----------|-----------|
| `generateDailyInsight()` | None | No (3 generic "actionItems") | No context |
| `fetchExtendedForecast()` | Love + Career only | Partial (implied in paragraphs) | Yes (full narrative) |
| `generateThemeAnalysis()` | Love OR Career (one at a time) | Yes (in "YOUR MOVE" section) | Partial |

### What's Needed

| Requirement | Status | Work Needed |
|-------------|--------|------------|
| **5 life-area navigator content** | MISSING | Need AI to generate per-area: energy level, 2-3 do's, 2-3 avoids, navigator note — for Love, Career, Vitality, Growth, Social. Currently only Love + Career get deep analysis. Vitality, Growth, Social don't exist. |
| **Structured do's/avoids** | MISSING | No schema field for explicit "navigate toward" / "navigate around" lists. Current "actionItems" are 3 words each with no reasoning. Need 4-5 do's and 3-4 avoids with planetary justification. |
| **Notification excerpt generation** | RESHAPE | Current batch generates curiosity hooks. Need to generate real excerpts: specific insight + planetary reason + action. |
| **Daily headline tied to notification** | MISSING | No mechanism to ensure the Today hero headline matches the morning notification. They're generated independently. |
| **Vitality/Growth/Social prompts** | MISSING | No AI prompts exist for Vitality & Rhythm, Growth & Learning, or Social & Communication life areas. Need new prompt sections in `fetchExtendedForecast()` or a new dedicated function. |
| **Content quality guardrails** | MISSING | No validation that AI-generated do/avoid advice is justified by actual transits. No fallback for "quiet sky" days where not all 5 areas have meaningful content. |
| **Dynamic area selection** | MISSING | No logic to determine which 2-3 life areas are most activated today and show those prominently while others show "steady skies." |

---

## Priority Summary — What to Build First

### P0: Critical (Breaks the core loop without these)

1. **Notification excerpt engine** — Rewrite `generateCosmicNotificationBatch()` to produce real, valuable daily excerpts with life-area hooks
2. **Navigate Toward / Navigate Around section** on Today tab — Structured do's/avoids with planetary reasoning
3. **Life Area Navigator cards** — Expand from 2 (Love/Career) to 5 (add Vitality, Growth, Social) with do/avoid per area
4. **Today's Headline → Notification link** — Hero headline must be the expanded version of the notification

### P1: High (Core experience quality)

5. **Remove Sky tab** — Absorb transit content into Today's bottom section
6. **Personality reveal in onboarding** — 1-2 resonant placement statements on WelcomeScreen
7. **Persona/depth persistence** — Save selections, use in AI prompt tone
8. **Zodiac-sign-only matching** — Simplified add-partner flow for Circle
9. **Relationship types** — Boss/friend/parent/etc. with type-specific AI prompts
10. **Chart at-a-glance** — Top 3 patterns view as default, toggle to detailed
11. **Notification → section scroll** — Deep link to specific Today tab section, not just tab

### P2: Medium (Polish and depth)

12. **Per-tab guide system** — Holistic "how to read this tab" overlays
13. **Evening reflection** — Time-aware prompt at bottom of Today
14. **Session themes in Chat** — Visual theme selector (Love/Career/Growth/Today)
15. **Circle constellation view** — Visual network layout replacing horizontal carousel
16. **Power elements reframing** — "Lucky" → "Power" with planetary derivation
17. **Report archival** — Save generated reports to DB for revisiting
18. **Notification time picker** — User chooses briefing delivery time
19. **"Ask AI about this" from Today** — Life area cards link to Chat with context

### P3: Low (Nice to have)

20. **Dynamic area activation** — Show only most relevant 2-3 life areas prominently
21. **Reflective mode in Chat** — AI asks questions back
22. **Group dynamics in Circle** — Multi-person element balance view
23. **Tooltip analytics** — Track and optimize education layer
24. **Progressive tooltip density** — Reduce for returning users
25. **Dominant planet/sign calculation** — For Chart at-a-glance

---

## File Change Map

| File | Changes Needed |
|------|---------------|
| `geminiService.js` | Add 3 new life area prompts (Vitality/Growth/Social), restructure do/avoid schema, rewrite notification batch prompt |
| `HomeScreen.js` | Add headline hero, navigate toward/around section, 3 new life area cards, sky absorption, evening reflection, notification-hero link |
| `notificationService.js` | Add section-scroll deep linking, notification time picker support |
| `notificationContentEngine.js` | Restructure for excerpt-based content with life-area specificity |
| `CompatibilityScreen.js` | Add relationship type selector, zodiac-only flow, rename to Circle |
| `SynastryService.js` | Add sun-sign-only scoring path |
| `ChartScreen.js` | Add at-a-glance toggle, top 3 patterns, guide header, element/modality bars |
| `ChatScreen.js` | Add session theme selector, "Ask AI" entry from Today life areas |
| `OnboardingScreen.js` | Persist persona/depth, add notification time picker |
| `WelcomeScreen.js` | Add personality reveal (1-2 resonant placement statements) |
| `AppNavigator.js` | Remove Sky tab, rename Match → Circle, update to 5 tabs |
| `TabBar.js` | Remove Sky tab, update labels/icons |
| `TransitsScreen.js` | Refactor as embeddable component for Today tab bottom section |
| `schema.js` | Add `relationship_type` to profiles table |
| `rep_profiles.js` | Support relationship_type field |
| `narrativeService.js` | Expose life-area-specific context for notification engine |
| `cosmicLineService.js` | Align with new excerpt-based notification strategy |
| `storage.js` | Add keys for persona, depth, notification time preference |

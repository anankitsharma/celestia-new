# Modern Mobile Patterns — Gap Inventory

A 17-item checklist of patterns that are table stakes (or near-table-stakes) for premium consumer iOS apps in 2026, scored against Celestia's current implementation.

---

## 1. iOS Widgets

**What it is:** Home-screen widgets (small / medium / large), available since iOS 14. For daily-use apps, the widget is the primary daily touchpoint.

**Who has it:** Co-Star (signature widget), Calm, Headspace, Strava, Apollo, Things 3, Notion Calendar, Instagram, Spotify.

**Celestia status: ❌ Not implemented.**

**Why it matters here:** This is **the most expensive miss in the entire app for an astrology product.** Astrology is consumed daily, for 30 seconds, often before the user opens any app. Co-Star has had widgets for 4+ years and they drive significant DAU. Without widgets, Celestia loses to Co-Star in daily-routine integration.

**Effort:** M-L (one-time cost ~3-5 days for small/medium widgets; ~1 week for full suite). Requires native iOS development outside React Native (Swift WidgetKit).

**Priority:** **HIGHEST.** This is the single biggest modern-pattern gap.

---

## 2. Live Activities (iOS 16+)

**What it is:** Real-time updates on the lock screen + Dynamic Island. Originally for sports scores / delivery tracking, increasingly used by lifestyle apps.

**Who has it:** Apple Sports, Uber, DoorDash, several reading apps (countdown to next chapter), some habit-trackers.

**Celestia status: ❌ Nothing.**

**Why it matters here:**
- Transit alerts are time-bounded and meaningful — perfect Live Activity material ("Mercury enters Cancer in 2 hours" pinned to lock screen).
- Streak countdowns on lock screen would prevent breaks.
- Solar return countdowns would be a delight feature.

**Effort:** M (~1 week). Native Swift via WidgetKit ActivityAttributes.

**Priority:** HIGH (after widgets).

---

## 3. Dynamic Island integration (iPhone 14 Pro+)

**What it is:** The compact + expanded states of the Dynamic Island. Used for system + app status.

**Who has it:** Apple system apps, Lyft, sports apps, music apps.

**Celestia status: ❌ Nothing.**

**Why it matters here:** A streak counter pinned to the Dynamic Island during morning briefing reading would be genuinely novel for an astrology app. Co-Star doesn't have this. **Differentiation opportunity.**

**Effort:** S-M (built on Live Activity infrastructure, ~2-3 days additional).

**Priority:** MEDIUM (paired with #2).

---

## 4. Bento layouts (asymmetric grids)

**What it is:** Apple's home-screen-ization of dashboards — different-sized tiles in an asymmetric grid. Established in Apple Health, Calm, Notion, Apple Sports.

**Who has it:** Apple Health, Calm, Strava, Notion, Apple Fitness+, Things 3.

**Celestia status: ❌ Uniform vertical stacks. No bento.**

**Why it matters here:** A dashboard with 11+ similar-sized cards looks like a 2018 app. The Inner-Work Practitioner audience uses Notion + Apple Health + Calm — they expect bento.

**Effort:** M (~3-5 days to redesign HomeScreen). Pure CSS/RN refactor; no new dependencies.

**Priority:** HIGH.

---

## 5. Bottom sheets

**What it is:** Modal alternative that slides up from the bottom, allows partial visibility of background, supports drag-to-dismiss. Apple Maps, Notion, Linear, Apple Music — all use bottom sheets.

**Who has it:** Almost every modern iOS app. Apple Maps's location card is the canonical example.

**Celestia status: ⚠️ Uses fullscreen `Modal` everywhere.** BrandModal was extracted but it's a fullscreen modal, not a sheet.

**Why it matters here:** Heavy modals interrupt the user's mental context. Bottom sheets preserve context. For Celestia: cancel flow, freeze offer, NPS prompt, journal entry composition — all benefit from being sheets, not takeovers.

**Effort:** M (~2-3 days to add `react-native-bottom-sheet` library + migrate 4-5 modals).

**Priority:** HIGH.

---

## 6. Skeleton loaders

**What it is:** Placeholder shapes (gray rectangles) that resemble the loading content's shape, replaced with real content as it loads. Eliminates spinner-then-pop layout shift.

**Who has it:** Instagram, Twitter, Substack, Notion, Hinge, virtually everyone.

**Celestia status: ❌ ActivityIndicator (spinner) most places.**

**Why it matters here:** The daily briefing takes 2-5 seconds to load. Currently shows a spinner. Modern: show a skeleton of the briefing card (gray "headline" rectangle, gray paragraph lines), then fade in real content.

**Effort:** S-M (~2-3 days). Build a `<Skeleton>` component, use in HomeScreen briefing, ReportsScreen generation, JournalHistoryScreen.

**Priority:** HIGH.

---

## 7. Pull-to-refresh

**What it is:** Pull-down gesture from top of scroll view to refresh content. iOS standard since iOS 6.

**Who has it:** Every social, news, email app.

**Celestia status: ⚠️ Implemented via `RefreshControl` in HomeScreen but probably not used elsewhere.**

**Why it matters here:** Forecast users naturally pull to refresh. Reports tab should support it for "refresh available reports." Chat history should support it.

**Effort:** S (~1 hour per screen).

**Priority:** MEDIUM.

---

## 8. Swipe-between-content gestures

**What it is:** Horizontal swipe between dates / siblings (yesterday / today / tomorrow). iOS Calendar, Apple Sports, Health.

**Who has it:** Apple Calendar, Twitter (between tabs), Hinge (between profiles).

**Celestia status: ❌ Floating tab pill row for date nav. No swipe.**

**Why it matters here:** Date-based content begs for swipe. The tab pill takes a chunk of below-hero real estate that could go to content. Replace with swipe gestures + invisible page indicators.

**Effort:** M (~2 days). Use `react-native-pager-view` or similar.

**Priority:** HIGH (frees up significant real estate).

---

## 9. Streaming AI responses

**What it is:** Word-by-word or token-by-token reveal of AI text as it's generated. ChatGPT, Claude, Perplexity, Bard all stream.

**Who has it:** Every modern AI chat app.

**Celestia status: ❌ Awaits full response, then dumps text.**

**Why it matters here:** Users expect streaming from AI. Pattern-users in particular will judge Celestia's chat quality based on whether it streams. **This is a generation behind ChatGPT users' baseline expectation.**

**Effort:** M (~2-3 days). Gemini SDK supports streaming; need to refactor `sendChatMessage` to consume the stream + animate UI.

**Priority:** HIGH.

---

## 10. Variable fonts

**What it is:** Single font file with infinite weight + width axes. Used by Apple SF Pro, GT Walsheim Variable, Cabinet Grotesk Variable.

**Who has it:** Apple system, Linear, Things 3, modern editorial sites.

**Celestia status: ⚠️ Uses fixed weights (400, 500, 600). Both Playfair and DM Sans have variable variants available but not used.**

**Why it matters here:** Lower priority. Variable fonts allow subtle weight transitions during animations (e.g., button press) and finer hierarchy control. Niche win.

**Effort:** S (~1-2 hours to swap font assets if available).

**Priority:** LOW.

---

## 11. 3-level theme (Light / Dim / Dark)

**What it is:** A middle theme between full light and full dark. Twitter/X popularized this.

**Who has it:** Twitter/X, Apollo for Reddit, some reading apps.

**Celestia status: ❌ Light + Dark only.**

**Why it matters here:** "Dim" is what astrology users want at 11pm — they don't want full black + white text, they want a softer dim. The Inner-Work Practitioner persona reads fiction in dim light. Worth considering.

**Effort:** M (~3 days). New `DIM` palette in ThemeContext + UI for selection.

**Priority:** LOW-MEDIUM.

---

## 12. Sticky bottom action bars

**What it is:** A persistent bar at the bottom of long-scroll content with primary action(s). Hinge has like/comment/pass. Apple News has share. Linear has reply.

**Who has it:** Hinge, Bumble, Linear, Apple News, Gmail.

**Celestia status: ❌ Buttons inline within scroll.**

**Why it matters here:** On Reports tab, "Generate this report" should be sticky-bottom while user reads description. On Chart tab, "Share my chart" should be sticky.

**Effort:** S (~1 day per screen).

**Priority:** MEDIUM.

---

## 13. Refined press states (scale + spring)

**What it is:** When a card is pressed, subtle scale-down (0.97) with spring back. iOS native feels do this. `Pressable` with proper transform animations.

**Who has it:** Apple system buttons, Linear, Things 3, Apollo, Notion.

**Celestia status: ⚠️ Most surfaces use `activeOpacity={0.7}` only. No scale, no spring.**

**Why it matters here:** Button press without spring feels dead in 2026. Adds significant felt-quality without changing layout.

**Effort:** S (~1-2 days to extract a `<PressableCard>` wrapper and roll out).

**Priority:** MEDIUM.

---

## 14. Hero animations / shared element transitions

**What it is:** A card visually expands into its detail screen — preserving identity. iOS standard since iOS 13.

**Who has it:** Apollo for Reddit, Apple Photos, Things 3, Mona for Mastodon.

**Celestia status: ❌ Hard navigation transitions.**

**Why it matters here:** Tapping a partner in Circle should expand them into their detail. Tapping a placement should expand into deep-dive. Currently hard-cut nav.

**Effort:** L (~1-2 weeks). Requires `react-native-reanimated` shared transitions or custom hero implementation.

**Priority:** LOW (high effort, modest reward).

---

## 15. Voice input + audio output

**What it is:** Speak-to-write for chat, voice-narrated briefings.

**Who has it:** Sanctuary (audio readings), Calm (audio meditations), most journaling apps support voice memos.

**Celestia status: ❌ Nothing.**

**Why it matters here:** For journal entries especially, voice is faster than typing. Sanctuary's whole MOAT is audio. Celestia's chat could speak responses for accessibility + drive-time use.

**Effort:** M (~3-5 days for voice input on journal + chat; ~1 week for voice output of briefings using ElevenLabs or system speech synthesis).

**Priority:** MEDIUM.

---

## 16. Adaptive icon (iOS 18+)

**What it is:** Apps can ship icons with multiple modes — light / dark / tinted. iOS 18 introduced color-tinted icon variants.

**Who has it:** Most well-maintained apps shipped tinted variants in 2024-2025.

**Celestia status: ❌ Single icon.**

**Why it matters here:** Power users curate their home screen. A tinted variant matching their wallpaper signals "this app cares." Polish, not strategic.

**Effort:** S (~half-day to design + ship variants).

**Priority:** LOW.

---

## 17. Interactive widgets (iOS 17+)

**What it is:** Widgets you can tap to do actions WITHOUT opening the app. Mark task done. Toggle reminder.

**Who has it:** Things 3, Reminders, several productivity apps.

**Celestia status: ❌ N/A — no widgets at all yet.**

**Why it matters here:** Once #1 (widgets) ships, an interactive widget could let users tap "I read today's briefing" → check-in done, streak +1, all from home screen without opening app. **Reduces friction for daily-habit retention.**

**Effort:** M (built on top of widget work).

**Priority:** MEDIUM (after #1).

---

## Net checklist

| # | Pattern | Status | Priority |
|---|---|---|---|
| 1 | iOS Widgets | ❌ | **HIGHEST** |
| 2 | Live Activities | ❌ | HIGH |
| 3 | Dynamic Island | ❌ | MEDIUM |
| 4 | Bento layouts | ❌ | HIGH |
| 5 | Bottom sheets | ⚠️ Modal-only | HIGH |
| 6 | Skeleton loaders | ❌ Spinners | HIGH |
| 7 | Pull-to-refresh | ⚠️ Partial | MEDIUM |
| 8 | Swipe gestures | ❌ Tab pills | HIGH |
| 9 | Streaming AI | ❌ Wait+dump | HIGH |
| 10 | Variable fonts | ⚠️ Static weights | LOW |
| 11 | 3-level theme | ❌ Light+Dark only | LOW-MED |
| 12 | Sticky bottom bars | ❌ | MEDIUM |
| 13 | Refined press states | ⚠️ Opacity-only | MEDIUM |
| 14 | Shared element transitions | ❌ | LOW |
| 15 | Voice input/output | ❌ | MEDIUM |
| 16 | Adaptive icon (iOS 18) | ❌ | LOW |
| 17 | Interactive widgets | ❌ | MEDIUM |

**Score: 0/17 fully implemented. 4/17 partially. 13/17 missing entirely.**

Of the 17, **the 6 HIGHs are non-negotiable for a 2026 premium consumer app.** Without widgets, bento, bottom sheets, skeleton loaders, swipe gestures, and streaming AI, Celestia is competing on brand alone — not on execution.

The good news: **5 of 6 HIGHs are pure RN code (no native Swift required).** Only widgets need native work.

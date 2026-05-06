# Micro-Patterns Catalog — Small Moves Mia Already Knows

The big interaction grammar (vertical scroll vs swipe) is decided in `03-scroll-vs-swipe-decision.md`. This doc catalogs the **small** patterns inside Mia's apps — the gestures, affordances, and micro-interactions she has reflexes for. Each one is a free design vocabulary item we can use without teaching her.

Organized by what they enable.

---

## A. Reactions — feeling without typing

### A1. Double-tap to like (TikTok, Instagram)
**What:** double-tap anywhere on the card → heart animation, content saved/liked.
**Mia knows it:** universal reflex. Done thousands of times.
**Use for Celestia:** double-tap a card to **save it to her journey/journal**. No typing, no decision burden. Visual feedback (heart pulse → save icon flash). The saved item appears in a "Saved" view she can revisit on Sundays.

### A2. iMessage Tapback (heart, thumbs, exclamation, question)
**What:** long-press a message → ring of 6 reactions. Pick one.
**Mia knows it:** uses daily. Frequent gesture.
**Use for Celestia:** long-press a card → reactions sized to introspection: 🪞 *this is me*, 💭 *making me think*, 💔 *too true*, ✦ *save for later*. Each reaction trains the AI on what hits her, becomes data for personalization.

### A3. YouTube "Not Interested" / Reels "Show me less"
**What:** soft thumbs-down without commitment to "block."
**Mia knows it:** pattern she's used to seeing on every algorithmic feed.
**Use for Celestia:** "show me less of this kind of content" on a card swipe-aside or long-press option. Uses her feedback to tune the daily card rotation. Avoids the cold "rate this 1-5 stars" anti-pattern.

---

## B. Depth-on-demand — opt into more

### B1. Long-press to peek (iOS context menu)
**What:** long-press an app icon, link, or card → blurred background + preview + actions menu.
**Mia knows it:** iOS native. Used 10+ times daily.
**Use for Celestia:** long-press a card → preview of the *deepened* version (full reading, chart-aware) without committing to navigate. She can release to dismiss or tap an action. Lower commitment than "tap to open."

### B2. Half-sheet (iOS modal sheet, IG comments, TikTok comments)
**What:** swipe-up from card brings a partial-height sheet over content; underlying card stays visible.
**Mia knows it:** TikTok comment sheet, iMessage reactions, Apple Maps directions.
**Use for Celestia:** ask AI chat about today's card via half-sheet. The card stays visible at top; chat is in the bottom half. She doesn't lose context. Closing the sheet returns her to today.

### B3. "More like this" inline reveal (Substack/Medium)
**What:** tap an inline element → expansion in place, not a navigation.
**Mia knows it:** read receipts in iMessage, "show more" on long captions.
**Use for Celestia:** tap a planet glyph on the chart preview within a card → the planet's meaning reveals inline, no nav. Keeps her in the flow.

---

## C. Bounded progress — feeling done

### C1. Story progress dots (IG Stories, Snapchat)
**What:** thin segmented bar at the top showing position in the sequence.
**Mia knows it:** every story she views.
**Use for Celestia:** at the top of Today, a 4–6 segment progress bar showing where she is in today's cards. Each segment fills as she advances. When all are filled, she's done with today.

### C2. End-of-feed soft floor (TikTok "you're all caught up", IG)
**What:** instead of more content, a friendly "you've seen everything." Implies completion.
**Mia knows it:** IG feed has had this since 2018.
**Use for Celestia:** after the last card, a soft floor — "Today is complete. The sky shifts again at 6am." Optional CTAs: open Chart, ask AI, journal. But the *primary* message is closure.

### C3. Streak count beside name (Snapchat fire emoji + number)
**What:** small "🔥 12" next to friend name. Loud on loss, silent on gain.
**Mia knows it:** Snapchat daily.
**Use for Celestia:** small streak indicator in the hero corner near her avatar. Don't draw attention. Don't say "tap to keep streak alive." Trust her muscle memory.

### C4. Duolingo lesson tree progression
**What:** linear ordered path with locked future, completed past, today's lesson highlighted.
**Mia knows it:** has tried Duolingo at least casually.
**Use for Celestia:** NOT this for daily Today, BUT useful for the weekly/monthly journey arc visible in Profile/Journey. "Week 3 of Saturn return" feels like a lesson tree.

---

## D. Sharing — screenshot as the unit

### D1. Built-in "send to" sheet (TikTok, IG)
**What:** prominent share button per card → opens the iOS share sheet pre-filled with a renderable image/link.
**Mia knows it:** ubiquitous. Top-right corner of every TikTok.
**Use for Celestia:** every card has a small share affordance. Tapping it opens iOS share sheet with a pre-rendered share-card image (already exist in code as `*ShareCard.js` files). Pre-filled message: "saw this on Celestia." Friend tap-through brings them to a personalized landing page that says "see what *your* chart says."

### D2. Story-as-share (IG, Snapchat)
**What:** "Add this to your story" — a single tap to repost something to your own story.
**Mia knows it:** uses weekly when something hits.
**Use for Celestia:** alongside iMessage share, an "Add to story" affordance that posts a vertical-format card to her IG/Snapchat story. The growth loop: her story is seen by 100+ followers; some tap through.

### D3. Linkable/shareable in DM with rich preview (iMessage, Telegram)
**What:** when she pastes a link, the recipient sees a rich card preview with image and headline, not just a URL.
**Mia knows it:** every link share generates one.
**Use for Celestia:** every shared card gets a deep link with OpenGraph metadata. When pasted into iMessage, the friend sees a beautiful preview tile, not "celestia.app/c/abc123."

---

## E. Discovery — finding what's hot for her

### E1. "For You" vs "Following" tabs (TikTok)
**What:** algorithm-curated default, friend-curated alternative.
**Mia knows it:** toggles daily.
**Use for Celestia:** less directly applicable since Today is *her* chart, not a feed. But the metaphor is useful for **Compatibility/Circle** — toggle between "Today's compatibility focus" (algorithm picks who to highlight based on transits) vs "All connections" (her list).

### E2. Pull-to-refresh (every iOS app)
**What:** drag down at the top → spinner → refreshed content.
**Mia knows it:** universal reflex.
**Use for Celestia:** at the top of Today, pull to refresh. Doesn't change the day's content (that's locked daily), but refreshes "right now" sky transits and time-of-day mood. Gives her agency without breaking the daily-anchor principle.

### E3. Search by emotion (Pinterest, Spotify mood playlists)
**What:** browse by emotional state ("anxious," "hopeful," "introspective"), not topic.
**Mia knows it:** searches Pinterest for "Scorpio moon aesthetic," Spotify for mood playlists.
**Use for Celestia:** in the chat interface, prompt suggestions organized by emotional state. "Feeling stuck → ask about Saturn." "Feeling restless → check transits." Reduces the blank-canvas problem.

---

## F. Personalization — make it feel like hers

### F1. Avatar in hero corner (every social app)
**What:** her face (or initial) visible top-right at all times.
**Mia knows it:** every social media app.
**Use for Celestia:** already exists. Keep. Tapping → Profile.

### F2. "Made for you / based on your activity" framing (Spotify Wrapped, Apple Music)
**What:** content is *demonstrably* tied to her behavior — "your top sign this week," "based on chats this week."
**Mia knows it:** loves Spotify Wrapped specifically. Screenshots it.
**Use for Celestia:** a recurring weekly/monthly recap card with stats — "this week you asked AI 4 times about love, your most-active life area was career." Format like Spotify Wrapped: bold sans, single fact, share button. **Already partly exists** as `MonthlyRecapCard.js` — make sure this is one of the daily-rotation surfaces, not buried.

### F3. Time-of-day mode (iOS Focus modes, Apple Health "this morning")
**What:** content shifts based on actual time. Morning vs evening tone.
**Mia knows it:** her phone already does this with Focus, Sleep mode, Sunrise alarm.
**Use for Celestia:** **already implemented** (`getTimeMode()` in HomeScreen). Keep. Lean harder — at 10:30pm, the late-night mode should be *meaningfully different* from morning mode. Different tone, different cards, different palette. Not just a timestamp.

---

## G. Trust — the small "I see you" moments

### G1. Read receipts / Seen by (iMessage, IG)
**What:** "Seen 10:34pm" — a tiny acknowledgment that someone's been there.
**Mia knows it:** core daily emotional signal.
**Use for Celestia:** subtle "based on your chat last Sunday" or "you saved this on May 3" timestamps on relevant cards. Signals the app *remembers* her. Counters Co-Star's "feels generic" problem.

### G2. Typing indicator (iMessage)
**What:** "..." dots while someone is composing.
**Mia knows it:** intuitive, expected.
**Use for Celestia:** AI chat already does this. Verify the feel — slow, organic, like a person is thinking, not "fetching from server."

### G3. "Last opened" / "Streak in danger" framing (Duolingo, Snapchat)
**What:** a soft warning that something Mia values is at risk if she doesn't engage.
**Mia knows it:** Duolingo guilt-pings.
**Use for Celestia:** **be careful here.** The "Inner-Work Practitioner" persona explicitly does NOT want infantilizing nags. Snapchat-style "your streak with Sarah is at risk" works because it's about a relationship; "your streak with the cosmos is at risk" is creepy. Use streak-jeopardy notifications very sparingly, only when she's genuinely lapsed (3+ days), and always opt-out-able.

---

## H. Visual / Typographic micro-patterns

### H1. Big-number-as-content (Cash App, Fitness rings)
**What:** the primary content of a screen is a single very-large number or word.
**Mia knows it:** Cash App balance, Apple Fitness rings.
**Use for Celestia:** the daily anchor card could lean into this. Instead of a paragraph, a single bold word: "RESTLESS." Subtitle: "Today's energy." Body: 1–2 sentence interpretation. Screenshot-grade.

### H2. Text overlay on photo/gradient (Spotify covers, IG carousels)
**What:** large typographic statement on a colored or photographic background.
**Mia knows it:** sees on every Spotify playlist cover, IG carousel hook.
**Use for Celestia:** today's anchor card = textured gradient backdrop + Playfair display sentence on top. Already partially in code via the time-of-day gradients we added in the migration.

### H3. Carousel dots (IG carousel posts, App Store screenshots)
**What:** "1/5" indicator at the bottom of a horizontally swipeable carousel.
**Mia knows it:** IG carousels weekly.
**Use for Celestia:** if any single card has multiple "panels" (e.g., today's anchor + an immediate sub-detail), use carousel dots, not a scroll spy. Keeps it bounded.

### H4. Skeleton loading (every modern app)
**What:** content-shaped grey placeholder while loading.
**Mia knows it:** ubiquitous.
**Use for Celestia:** while the AI generates today's content, show skeleton cards in the same shape as the real cards. **Code already has `Skeleton.js`** in the recent commits. Use it.

### H5. Empty state with personality (Notion, Linear)
**What:** when there's no content, a friendly illustrated/narrated empty state, not a blank screen.
**Mia knows it:** every app she likes has good empty states.
**Use for Celestia:** if today's reading isn't ready, don't show a spinner — show a "the sky is settling, back in a moment" line with brand. **`EmptyState.js`** already exists in recent commits. Use it.

---

## I. Friction-reducing micro-patterns

### I1. One-tap auth (Sign in with Apple, magic link)
**What:** one tap to authenticate without password.
**Use for Celestia:** already supported via Supabase. Keep prominent on AuthScreen.

### I2. Persistent floating button for primary action (Material FAB, IG +)
**What:** a single circular button always visible for the primary creation action.
**Mia knows it:** ubiquitous.
**Use for Celestia:** maybe. The primary create-action equivalent is "ask AI about today." A small floating button bottom-right of Today could say "ask Celestia." Watch out — Mia's persona says she avoids cluttered UI, so don't add this if the entry point is already clear elsewhere.

### I3. Smart defaults / "use last time" (Amazon, every form)
**What:** form fields pre-filled with her last entry.
**Use for Celestia:** when adding a person to Circle, default to last-used relationship type. When journaling, pre-fill yesterday's mood as a starting point.

---

## J. Anti-patterns Mia tolerates but we should NOT import

| Pattern | Source | Why not |
|---|---|---|
| Endless feed | TikTok | Trains compulsion, wrong for nighttime introspection |
| Streaks shown LOUDLY | Duolingo | Mia is post-Duolingo-shaming. Quiet streaks only. |
| Forced rating prompts | App Store, Uber | Mia's persona explicitly hates extraction-feeling UI |
| Read counts ("3 friends saw this") | LinkedIn, Reddit | Performative metrics conflict with introspection privacy |
| Push every day with "you missed" | Co-Star aggressively | Already a known Co-Star pain point — don't repeat |
| In-app upsell modal on open | Many freemium apps | Persona explicitly hates pushy paywalls |
| Required friend invitation to unlock | Snap, BeReal | Mia found this annoying enough that she didn't fully adopt BeReal |
| "Pull a card" tarot-style randomness | The Pattern, Co-Star Plus | Mia's persona = "no spiritual woo." Real chart > random card |

---

## Summary — the pattern vocabulary we have

If we use these micro-patterns intentionally, here's the resulting interaction grammar Mia can decode without instruction:

- **Vertical advance** through a finite set of cards with **progress dots at top** (Stories) and a **soft floor** at the end (TikTok end-of-feed).
- **Double-tap to save** (IG/TikTok) on any card. Saved items live in a Pinterest-style "saved" view.
- **Long-press to react** with introspection-flavored emojis (iMessage Tapback semantics).
- **Tap a card** for inline expansion (long-press peek for preview, full tap for half-sheet AI chat).
- **Share button** per card, top-right (TikTok/IG), opens iOS share sheet with pre-rendered share-card image.
- **Streak indicator** beside avatar, small, never demanding (Snapchat).
- **Pull-to-refresh** at the top of Today for "now" data (universal).
- **Single big typographic statement** as the daily anchor (Cash App / Spotify Wrapped).
- **Time-of-day mode** that genuinely shifts content + tone, not just timestamps (Apple Health "this morning").
- **Empty/skeleton states with personality** when content isn't ready (Notion/Linear).

Every one of these is something Mia already does in another app. Zero teaching cost.

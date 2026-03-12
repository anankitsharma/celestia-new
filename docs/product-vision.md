# Celestia — Product Vision & Redesign Plan

> "You are the captain. We are your celestial navigator."

---

## The Base: Notification → Open → Navigate → Return

**The notification is the app.** Everything else exists to deliver on the promise the notification makes.

This is the foundational loop that the entire product is built on:

```
NOTIFICATION (the hook — a real, specific, valuable excerpt)
    ↓
"That's interesting, let me see more"
    ↓
TODAY TAB (the full navigator briefing — detailed, actionable, explorable)
    ↓
User navigates their day with confidence
    ↓
Tomorrow morning: another notification arrives
    ↓
HABIT FORMED
```

The notification is NOT a generic "check your horoscope." It contains the **actual core insight** — a real excerpt from today's reading that is specific enough to be useful on its own, but compelling enough to make the user want the full picture.

**Examples of what the notification IS:**
- "Venus trines your natal Moon today — your emotional connections are unusually strong. Here's how to use it →"
- "Avoid starting new financial commitments today — Mars squares your 2nd house. Your full navigator briefing is ready →"
- "Today favors honest conversations you've been putting off. The Moon in your 3rd house supports it. See your full guide →"
- "Your career energy peaks between 2-4 PM today. Your navigator has the details →"

**Examples of what the notification is NOT:**
- "Check your daily horoscope!" (generic, no value)
- "Your stars have a message for you" (vague, clickbait)
- "Open Celestia for today's reading" (no reason given)

**The rule:** Every notification must pass the "useful even if they don't open" test. The user should get real value from reading just the notification. But the value of opening should be 10x more.

---

## Core Philosophy

1. **Notification-First Architecture** — The notification is the front door. The app is the house. Build the door first.
2. **Astrology as Navigation** — Pattern analysis, not prediction. The stars are a map. The user is the captain charting their own course.
3. **The Captain & Navigator** — The user commands their life. Celestia reads the celestial waters and advises: "There's favorable wind from the east" or "Rocks ahead on this route — here's the safer path." The captain always decides.
4. **Never Frighten, Always Navigate** — No "bad days." Only days where the navigator says "the current is tricky here — here's how to sail through it."
5. **Actionable Over Mystical** — Every insight ends with what to DO. Not "Mercury is retrograde" but "Communications may get tangled today — double-check important emails before sending, and avoid signing contracts if possible."
6. **Daily Habit by Design** — The morning notification is the alarm clock for the soul. The Today tab is the morning briefing. Together they create: "Let me check what my navigator says before I start my day."

---

## Tab Structure

| # | Tab | Purpose |
|---|------|---------|
| 1 | **Today** | The daily navigator briefing — what the notification opens to |
| 2 | **Ask AI** | Your personal astrologer — ask anything, get chart-aware answers |
| 3 | **Chart** | Your cosmic DNA — understand your lifelong patterns |
| 4 | **Circle** | Compatibility with everyone in your life (viral engine) |
| 5 | **Reports** | Deep-dive analysis documents for major life themes |

**Removed:** Sky tab (astronomical events absorbed into Today tab's bottom section)

---

## Screen-by-Screen Design

### 1. TODAY — The Daily Navigator Briefing

This is the screen the notification opens. It must deliver on the notification's promise and then offer much more.

**The user journey:** Notification teases one insight → user opens → sees that insight in full context → discovers the rest of today's briefing → explores specific life areas → leaves feeling prepared to navigate the day.

**Layout (top to bottom):**

#### A. Today's Headline (Hero)
The expanded version of what the notification said. One powerful sentence + the planetary reason behind it.

Example:
> **"Today rewards courage in relationships"**
> Venus trines your natal Moon in the 7th house — emotional honesty lands well today. Say what you've been holding back.

This is the anchor. Everything below supports and expands on this theme.

#### B. Day at a Glance — The Navigator's Summary

A clean, scannable overview card:

| | |
|---|---|
| **Overall Energy** | Flowing / Mixed / Challenging (visual meter, warm tones) |
| **Moon** | Waxing Crescent in Gemini — curiosity is high |
| **Best Window** | 2:00 PM – 4:30 PM (Jupiter hour) |
| **Power Color** | Deep teal — wear it or keep it near |
| **Power Number** | 7 |

**Key framing:** These aren't "lucky" elements (that's superstition). They're **power** elements — derived from actual planetary positions and the user's chart. The color comes from the dominant planetary energy (Venus = greens/pinks, Mars = reds, Jupiter = deep blues/purples). The number comes from numerological reduction of the day's chart. This makes them feel earned and real, not random.

#### C. Today's Navigation — Do's & Avoids

The core of the daily value. **Two columns or a clean card layout:**

**NAVIGATE TOWARD (Do's):**
- Start conversations you've been avoiding
- Physical activity, especially outdoors
- Creative projects — your 5th house is activated
- Financial planning (not spending — planning)

**NAVIGATE AROUND (Avoids):**
- Impulse purchases — Mars squares your 2nd house
- Starting brand new projects from scratch (better to continue existing ones)
- Overcommitting your evening — you'll want rest after 7 PM

**Framing matters:** Never "Don't do X." Always "Navigate around X because [reason], and instead try [alternative]." The captain gets advice, not orders.

#### D. Life Area Navigator — Explore by Domain

Horizontally scrollable cards, each a life area with its own Do/Avoid micro-briefing:

**LOVE & RELATIONSHIPS**
- Energy: Strong (Venus trine Moon)
- Do: Express feelings directly, plan a meaningful gesture
- Avoid: Bringing up old arguments — today's energy is for building, not excavating
- Navigator note: "If single, you're unusually magnetic today. If partnered, depth over surface."

**CAREER & MONEY**
- Energy: Mixed (Sun sextile Saturn, Mars square 2nd house)
- Do: Strategic planning, mentorship conversations, resume updates
- Avoid: Big financial moves, confronting authority figures
- Navigator note: "Good day to build — not to launch. Lay foundations."

**VITALITY & RHYTHM**
- Energy: High until evening (Mars in 1st house)
- Do: Morning movement, tackle physical tasks, align with your peak window
- Avoid: Pushing past 7 PM — your energy cliff is steep today
- Navigator note: "Your body wants to move. Let it."

**GROWTH & LEARNING**
- Energy: Excellent (Mercury conjunct Jupiter)
- Do: Study, read, have philosophical conversations, journal
- Avoid: Shallow scrolling — your mind wants depth today
- Navigator note: "Whatever you learn today sticks. Choose wisely what you feed your mind."

**SOCIAL & COMMUNICATION**
- Energy: Flowing (Mercury in 3rd house, Moon in Gemini)
- Do: Reach out to someone you've been meaning to, write that message
- Avoid: Gossip and venting — words carry extra weight today
- Navigator note: "You're more persuasive than usual. Use it for good."

Each card is tappable → expands to a detailed view with the full planetary reasoning, or the user can "Ask AI about this" to start a chat session focused on that area.

#### E. What's Happening in the Sky

Replaces the old Sky tab. Shows today's active transits and astronomical events:

- Active transits with timing labels (Exact / Building / Separating)
- Retrogrades currently active
- Cosmic windows (if any)
- Upcoming significant events (next 7 days preview)
- Each item tappable → detailed explanation

#### F. Evening Reflection (appears after 6 PM)
- "How did your day match the navigator's reading?"
- Quick mood/accuracy rating
- Optional journal entry
- Feeds back into tomorrow's briefing: "Yesterday you noted..."

---

### 2. ASK AI — Your Personal Astrologer

Not a chatbot — a **consultation session** with a chart-aware astrologer who knows Western astrology deeply.

**Key Principles:**
- Pre-loaded with questions a real astrology client would ask
- Knows the user's chart, today's transits, recent journal entries, and narrative thread
- Speaks like a wise, warm practitioner — not a robot, not a mystic

**Features:**

**Suggested Questions** (contextual, rotate based on transits):
- "What does today's Venus-Moon trine mean for my love life specifically?"
- "Why do I always feel drained during Scorpio season?"
- "What should I focus on this lunar cycle?"
- "My boss and I clash — what does our chart compatibility say?"
- "How do I work with my Saturn return?"

**Session Themes** — Start a focused consultation:
- Today's Briefing (deep dive into any part of today's reading)
- Love & Relationships
- Career & Purpose
- Personal Growth
- A Specific Transit or Placement

**Reflective Prompts** — AI occasionally asks back:
- "You mentioned feeling stuck in your career. Your North Node is in the 10th house — what does leadership mean to you?"
- "Your journal from Tuesday mentioned anxiety. With the Moon crossing your 12th house, have you been sleeping differently?"

**Chart-Aware** — Every response weaves in the user's actual placements, not generic zodiac advice.

---

### 3. CHART — Your Cosmic DNA

Positioned as: "This is who you are at the deepest level. The patterns that run beneath everything."

#### A. Guide Header
- "Your birth chart captures the exact sky when you took your first breath. It doesn't dictate — it illuminates patterns you already feel."
- Tap → interactive guide: What is a birth chart? How do the calculations work? What do planets/signs/houses mean?

#### B. At-a-Glance View (default)
- Chart wheel with key highlights
- **Your Top 3 Patterns** — the most defining placements in plain language:
  - "Sun in Scorpio, 8th house — you transform through intensity. You don't do shallow."
  - "Moon in Pisces, 12th house — your emotional world is vast and private. You feel things others don't even notice."
  - "Mars in Aries, 1st house — you lead with action. Patience isn't natural but is your growth edge."
- Element balance (Fire/Earth/Air/Water)
- Modality balance (Cardinal/Fixed/Mutable)
- Dominant planet and sign

#### C. Detailed View (toggle)
- Full planet list: sign, house, degree
- Aspect grid with orb values
- House cusps and rulers
- Each row tappable → AI deep dive
- Live transit badges showing which natal planets are currently activated

#### D. Interactive Education
- Every term tappable for explanation
- Progressive: new users see more tooltips, veterans see fewer

---

### 4. CIRCLE — Your Cosmic Relationships (Viral Engine)

**The key insight:** Nobody knows their boss's birth time. But everyone is curious about compatibility with their boss.

**Works with zodiac sign OR full DOB:**
- Full DOB → complete synastry analysis (planets, houses, aspects)
- Zodiac sign only → sun-sign compatibility (clearly labeled, still genuinely useful)

**Relationship Types:**
- Partner / Romantic interest
- Best Friend
- Parent (Mom / Dad)
- Sibling
- Boss / Manager
- Colleague
- Child
- Custom label

#### A. Your Circle (main view)
- Visual constellation of added people
- Each person: name, relationship type, compatibility score, one-line insight
- Add: Name + DOB or zodiac sign + relationship type

#### B. Individual Match View
- Overall harmony + breakdown by domain:
  - Communication style
  - Emotional connection
  - Values alignment
  - Energy dynamic
  - Growth potential
- "What works between you" / "What to navigate carefully"
- **Relationship-specific advice:**
  - Boss → work communication, managing up, timing requests
  - Parent → understanding generational patterns, emotional dynamics
  - Friend → loyalty, adventure compatibility, growth together
  - Partner → love language alignment, conflict patterns, long-term trajectory

#### C. Viral Mechanics
- Beautiful share cards ("Me + [Name]: 87% Communication, 92% Emotional bond")
- "Invite [Name] to see their perspective" → app download link
- The moment: someone shares → friend reads → "Wow that's accurate" → downloads → checks their own chart → shares with someone else
- Group view: "Your inner circle's element balance" / "Your social circle is 60% fire signs"

---

### 5. REPORTS — Deep Navigator Documents

Long-form AI analysis for major life themes. These are the "sit down and read for 20 minutes" pieces.

**Report Types:**
- Love & Relationships — your patterns, needs, growth edges
- Career & Purpose — what you're built for, timing for moves
- Lunar Cycle Guide — this month's emotional landscape
- Life Purpose (North Node) — your soul's direction
- Solar Return (Birthday) — your year ahead
- Year Overview — major transits and windows coming

**Each Report:**
- Narrative form (reads like a chapter, not a list)
- Specific dates and windows
- Actionable navigation advice
- Affirmations and practices
- Shareable summary card
- PDF export (A4, beautifully formatted)

---

## Onboarding — "This Actually Knows Me"

**Goal:** Within 60 seconds, the user feels personally seen.

**Step 1: Birth Details**
- Name, date, time, place
- One field at a time, clean and minimal
- "We need this to calculate your exact chart — the sky was different depending on where and when you arrived"

**Step 2: Chart Reveal + Personality Hit**
- Chart wheel animates into place
- Immediately surface 1-2 highly specific, resonant placements:
  - "You have a Scorpio Sun in the 8th house — you don't do anything at surface level. When you're in, you're ALL in."
  - "With Moon in Pisces, you absorb other people's emotions like a sponge. You've probably been told you're 'too sensitive' — you're not. You're perceptive."
- The user's reaction should be: "...okay, how does it know that?"
- These must come from the MOST distinctive placements — not generic sun sign descriptions. Look for: angular planets, stelliums, tight aspects, houses with multiple planets, the Moon sign (always resonates emotionally).

**Step 3: Your Navigator is Ready**
- "Every morning, your personal navigator briefing will be waiting."
- Notification permission prompt (framed as: "Allow Celestia to send your daily briefing?")
- Preferred briefing time selection (default: 8:00 AM)
- Enter the app → first Today tab experience

---

## Notification Architecture — The Foundation

### Why Notifications Are the Base

Most apps treat notifications as a re-engagement tool — "come back, you haven't opened us in a while." Celestia treats the notification as **the primary product surface.** The app is where you go for depth. The notification is where you get the daily value.

This means:
1. **Notification content is generated with the same AI quality as in-app content** — it's not a template, it's a real excerpt from today's full reading
2. **The notification must be valuable on its own** — if the user reads only the notification and never opens, they still got something useful
3. **The notification creates an information gap** — "That's interesting... but what about the rest of my day?" → open
4. **Notification timing is part of the experience** — it arrives when the user is planning their day, not randomly

### Notification Types & Content

#### Morning Navigator Briefing (Daily, user-set time)
**This is the core product.**

The notification contains a real excerpt — the single most important or interesting navigation point from today's reading. It changes every day because the sky changes every day.

**Content formula:** [Specific insight] + [Brief planetary reason] + [What to do about it]

Examples by category (the system picks the most relevant one each day):

**When love is the highlight:**
> "Your emotional radar is unusually sharp today (Moon conjunct natal Venus). Tell someone how you really feel — it'll land perfectly. Full briefing inside →"

**When career is the highlight:**
> "Between 10 AM and 2 PM, you have a window for bold career moves — Jupiter activates your 10th house. Your navigator has the full timing breakdown →"

**When caution is the highlight:**
> "Navigate carefully around financial decisions today — Mars squares your 2nd house until Thursday. Your briefing has the alternatives →"

**When growth is the highlight:**
> "Today's Mercury-Jupiter conjunction is rare and powerful. Whatever you study or learn today imprints deeply. Your navigator picked the best focus areas →"

**When energy is the highlight:**
> "You'll hit an energy wall around 4 PM today (Moon void of course). Front-load your important work. Full energy map inside →"

#### Weekly Navigator Summary (Monday morning)
> "This week's dominant theme: rebuilding a conversation that stalled. Venus enters your 3rd house Wednesday — that's your window. Full week map inside →"

#### Transit Alerts (event-driven, max 2 per week)
> "Mercury goes retrograde tomorrow in your career house. Your navigator prepared a 3-week survival guide →"

#### Smart Re-engagement (after 2+ days absent)
> "While you were away: the Moon crossed your 12th house (deep processing time — makes sense you withdrew). Today it enters your 1st house — energy returns. Your briefing is ready →"

This is powerful because it **explains their absence through their chart**, making them feel understood rather than guilt-tripped.

#### Evening Reflection (optional, user opts in)
> "Today's Venus trine peaked at 3 PM. Did you notice anything in your relationships around that time? Tap to reflect →"

### Notification → App Mapping

| Notification Type | Opens To |
|---|---|
| Morning briefing | Today tab, hero section (expanded version of the notification) |
| Life area highlight | Today tab, scrolled to that life area card |
| Weekly summary | Today tab, weekly section expanded |
| Transit alert | Today tab, sky events section |
| Reflection prompt | Today tab, evening reflection section |
| Re-engagement | Today tab (fresh briefing) |

---

## Interactive Education & Guide System

Every tab has a guide layer. The user should never feel lost or confused by astrology terminology.

### Per-Tab Guides
- **Today:** "How to read your daily briefing" — explains energy ratings, do/avoid logic, life area cards
- **Chart:** "What is a birth chart?" — planets, signs, houses, aspects in plain language
- **Circle:** "How compatibility works" — synastry basics, what scores mean
- **Reports:** "What you'll get" — how to read and use a report
- **Chat:** "What to ask" — example questions, what the AI knows about you

### In-Context Education
- **CosmicTooltip** — "?" button on any section → modal explainer
- **AstroText** — Astrological terms auto-highlighted with tap-to-learn
- **Progressive disclosure** — First-time users see gentle tour, returning users see clean UI
- **Analytics** — Track which tooltips get tapped most → surface popular explanations more prominently

---

## Design Principles

1. **Navigator aesthetic** — Warm, clear, confident. Think: a beautifully designed compass, not a crystal ball.
2. **Narrative flow** — Every screen reads like a page in the user's story, not a dashboard.
3. **Minimalist density** — Rich information that feels spacious, never cluttered.
4. **Warm tones** — Navy, gold, cream, warm stone. No electric neon. No dark fortune-teller vibes.
5. **Motion with purpose** — Transitions that feel like turning a page or watching a planet move.
6. **Accessible depth** — A total beginner and a seasoned astrology enthusiast both feel served.

---

## Viral & Retention Mechanics

### The Daily Habit Loop (Core)
```
Morning notification (real value, specific insight)
    → User opens (wants the full picture)
    → Reads Today tab (feels prepared and understood)
    → Navigates their day with the briefing in mind
    → Evening: optional reflection
    → Next morning: notification arrives again
    → HABIT
```

### The Viral Loop (Circle)
```
User checks compatibility with friend/boss/partner
    → "This is scarily accurate"
    → Shares beautiful card on Instagram/WhatsApp
    → Friend sees it → "Wait, let me check mine"
    → Downloads app → enters birth details
    → Gets their own chart personality reveal ("wow")
    → Checks compatibility with THEIR people
    → Shares → VIRAL
```

### Retention Levers
- **Content that literally changes every day** — new transits, new moon phases, new briefings
- **Streak system** (built) — consecutive daily opens
- **XP & Levels** (built) — Starling → Cosmos progression
- **Badge collection** (built) — 20 achievement badges
- **Narrative continuity** — "Yesterday you reflected on..." / "Last week's theme was..."
- **Circle growth** — each new person added = new reason to return

### Why This Drives Subscriptions
The habit IS the subscription. The user isn't paying for features — they're paying to keep their daily navigator running. Cancelling doesn't feel like dropping a product. It feels like firing your navigator mid-voyage.

---

## Analytics & Measurement

**North Star Metric:** Day 7 retention (do they come back after a week?)

**Key Metrics:**
- Notification → open rate (is the hook working?)
- Time to first "wow" in onboarding (personality hit accuracy)
- Today tab scroll depth (are they reading the full briefing?)
- Life area card tap rate (which areas do people care about most?)
- Circle shares per user (viral coefficient)
- Chat sessions initiated from Today tab (navigation → exploration flow)
- Evening reflection completion rate
- Streak length distribution
- Notification opt-in rate at onboarding

---

## Implementation Priority

### Phase 1: The Notification → Today Loop (Foundation)
1. Redesign Today tab: Hero headline, Day at a Glance, Do's/Avoids, Life Area Navigator cards
2. Build notification content engine: real AI-generated excerpts, not templates
3. Notification → Today tab deep linking (notification opens to relevant section)
4. Sky tab absorption into Today's bottom section
5. Evening reflection section

### Phase 2: Chart & Chat Enhancement
6. Chart: At-a-Glance (top 3 patterns) vs Detailed toggle
7. Chart: Guide header + interactive education
8. Chat: Suggested questions, session themes, chart-aware responses
9. Chat: Link from Today tab life area cards ("Ask AI about this")

### Phase 3: Circle — The Viral Engine
10. Redesign Compatibility → Circle with relationship types
11. Zodiac-sign-only matching option
12. Beautiful share cards + invite flow
13. Group dynamics view

### Phase 4: Onboarding & Polish
14. New onboarding: chart personality reveal (1-2 resonant placements)
15. Notification permission framing + time selection
16. Progressive tooltip system refinement
17. Analytics integration across all surfaces

---

## Summary

Celestia is not an astrology app. It is a **daily navigation tool** that uses celestial patterns to help the captain (the user) chart their course each day.

The notification is the product's front door — real, specific, valuable. The Today tab is the full briefing room. Every other tab serves the captain's need to understand themselves (Chart), their relationships (Circle), ask questions (Chat), or go deep (Reports).

The user opens every morning not because of a streak counter or a gamification trick, but because the navigator consistently gives them something **genuinely useful** for navigating the day ahead.

*The measure of success: Does the user reach for Celestia before they reach for anything else each morning?*

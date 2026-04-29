# Screenshot Selection — App Store Submission Set

**Status:** 5 of 6 spec frames matched to raw captures + 3 alternates ready as swaps.
**Missing:** Frame 6 (Privacy graphic) — needs Figma design work, not a UI capture.
**Plan source:** [`plan/03-screenshot-spec.md`](../../03-screenshot-spec.md) — the 6-frame specification.
**Marketing overlays to burn into each frame:** [`plan/ASO/screenshot-captions.md`](../../ASO/screenshot-captions.md).

---

## The 5 main picks (in spec order)

| # | File | Spec frame | Marketing overlay (per ASO captions) |
|---|---|---|---|
| 1 | `01_connections-list.jpg` | "All your people, in one place" | *Map every relationship pattern* |
| 2 | `02_compat-detail-partner.jpg` | "Real depth, not generic compatibility" | *Real compatibility, no clichés* |
| 3 | `03_ask-ai-chat.jpg` | "An advisor for the questions you actually have" | *Ask anything about your relationships* |
| 4 | `04_today-relational-themes.jpg` | "Today, framed as people-context" | *Daily reflection, weekly clarity* |
| 5 | `05_personality-blueprint.jpg` | "How you show up to others" | *Your attachment style, decoded* |
| 6 | **MISSING** | "Privacy you can verify" | *Privacy by default* |

---

## Per-frame mapping detail

### Frame 1 — `01_connections-list.jpg` ← raw `04_connections_list.jpg`

**Spec asked for:** Multi-relationship-type grid (Partner, Best Friend, Parent, Sibling, Boss, Colleague — diverse roles)
**What we have:** Maya (Partner ♡), Daniel (Best Friend ★), Priya (Parent ⊙) — 3 distinct relationship types visible
**Gap:** Spec wanted 5–7 people; we have 3
**Verdict:** Strong pick. The 3 visible pillars (romantic / platonic / family) tell the breadth story in 5 seconds. Adding more would crowd the frame visually. Keep at 3.

### Frame 2 — `02_compat-detail-partner.jpg` ← raw `05_compat_partner_maya_TOP.jpg`

**Spec asked for:** Specific relationship detail with score, strengths, friction points, conversation prompt
**What we have:**
- Sasha & Maya, "Partner", score 85 + label *"Deeply harmonious"*
- 4 dimension chips: Emotional 66% / Attraction 87% / Communication 89% / Stability 96% (with colored dots, no planet glyphs)
- *YOUR LOVE STORY* card with substantive paragraph
- Share Result button visible

**Gap:** Doesn't show the spec's "3 strengths / 3 frictions / Conversation prompt" structure
**Verdict:** Cleaner than the spec describes. The score + label + 4 dimensions + Love Story tells the depth story without the bullet-list density. Reviewer reads psychology-coded language ("Deeply harmonious", "secure base", "explore the world") not zodiac. Strong pick.

### Frame 3 — `03_ask-ai-chat.jpg` ← raw `08_ask_ai_chat.jpg`

**Spec asked for:** AI chat with one question + 3-4 line reply + AI disclaimer
**What we have:**
- *"Why do I always shut down right when things start getting real with someone?"* — relatable, psychology-coded
- AI reply: 8+ lines about regulation strategy / nervous system / closeness — exactly the psychology-led tone the spec wants
- *"Written with AI · here for reflection"* disclaimer visible at bottom
- ✦ AI label on the AI message timestamp

**Gap:** Reply is longer than spec's 3-4 lines (which is actually a strength — shows substantive AI not toy AI)
**Verdict:** This is the strongest single frame in the set. Apple-2024-AI-policy disclosure is visible. Question is universal/relatable. Reply names a real defense mechanism. Strong pick.

### Frame 4 — `04_today-relational-themes.jpg` ← raw `14_today_home_sasha.jpg`

**Spec asked for:** Today screen with "This week's relational themes" and 2-3 cards
**What we have:**
- Hero: *"Good afternoon, Sasha"*
- DRIFT ALERT: *"You haven't checked in on Priya in 4 weeks."* (clean — was buggy "2938 weeks" before today's fix)
- YOUR CIRCLE: M / D / P avatars, Priya highlighted
- TODAY card: *"What if the conversation you've been dreading is the one that frees you?"*
- TODAY'S READ: substantive psychology-led paragraph
- WHAT HELPS TODAY: 3 actionable bullets

**Gap:** Doesn't show the spec's "weekly relational themes" cards (Patience with parents / Direct conversation with partner / Be lighter with friends)
**Verdict:** Different shape from the spec but stronger Mindfulness-category alignment. The DRIFT ALERT + YOUR CIRCLE + TODAY copy together prove this is "the calm relationship app". Strong pick.

### Frame 5 — `05_personality-blueprint.jpg` ← raw `12_onboarding_big-reveal_sasha.jpg`

**Spec asked for:** Chart screen with 3-tile interpretation panel ("How you communicate / What you need to feel safe / What overwhelms you")
**What we have:**
- *"✦ YOUR PERSONALITY BLUEPRINT ✦"*
- *"Sasha"* (large serif name)
- 3 cards: HOW YOU ACT / WHAT YOU NEED / HOW OTHERS SEE YOU
- *"✦ See the framework details →"* opt-in pill
- Closing copy: *"You process the world differently than almost everyone around you — and there are clear reasons why."*

**Gap:** Tile labels differ from spec ("How you act" vs "How you communicate", etc.) — but the SPIRIT is identical (3 self-awareness tiles in plain English)
**Verdict:** Actually stronger than the spec's chart-screen recommendation. No chart wheel visible by default = pure psychology framing. The opt-in "framework details" pill telegraphs the Two-Window architecture (Apple sees psychology, opted-in users see astrology). Strong pick.

### Frame 6 — **MISSING** — Privacy graphic

**Spec asked for:** *"Stylized graphic (not a UI screenshot) showing a device with a lock icon and a small 'Local SQLite' tag"* + bullet list
**What we have:** Nothing — this is a designed asset, not a captured screen
**What to do:**
- **Option A (recommended):** Build in Figma per spec. Cream `#FAF8F2` background, lock icon centered, ✓ bullet list, *"Privacy by default"* hero text
- **Option B (faster):** Capture the Profile screen showing the privacy/legal rows. Lower visual impact but ships immediately
- **Option C (acceptable):** Skip Frame 6. App Store only requires 3 minimum, 10 max. Five strong frames > six with one weak

---

## 3 alternates available (swap in if any of 1–5 underperform in A/B testing)

| Alt | File | What it is | When to use |
|---|---|---|---|
| A | `alt_a_onboarding-hero.jpg` | Onboarding 1 — *"Understand the patterns in your relationships."* + clay Begin button | Strong opener. Could **replace Frame 1** if you want a brand-statement hero before showing features. Reviewer reads the headline in 2 seconds. |
| B | `alt_b_first-hit-attachment.jpg` | Onboarding 10 — *"You have a Self-Aware Anxious attachment pattern with free-spirited magnetism."* | Could **replace Frame 5** if you want to emphasize the personalization moment. Shows the AI-reveals-you payoff before the user even reaches the app's main surface. |
| C | `alt_c_journal-composer.jpg` | Journal entry composer with mood + energy + tags + people picker | Could **add as 7th frame** if you want to telegraph the daily-reflection feature. Strong Mindfulness-category alignment. |

---

## Recommended ordering (final answer)

**Conservative (matches spec exactly):** 1 → 2 → 3 → 4 → 5 → (Frame 6 Figma)

**My recommendation (strongest opening hook):**
1. `alt_a_onboarding-hero.jpg` — *"Understand the patterns in your relationships"* (brand statement, settles 4.3(b) in 2 seconds)
2. `01_connections-list.jpg` — multi-relationship proof
3. `03_ask-ai-chat.jpg` — AI differentiator + compliance signal
4. `02_compat-detail-partner.jpg` — depth proof
5. `04_today-relational-themes.jpg` — Mindfulness category alignment
6. `05_personality-blueprint.jpg` — self-discovery payoff
7. (privacy Figma graphic) — trust closer

The first 3 are auto-played in App Store carousel. Putting the brand hero, multi-relationship proof, and AI differentiator there carries the rejection-defense load.

---

## Pre-upload checklist (per `03-screenshot-spec.md`)

When the marketing overlays are applied and the final PNGs are exported:

- [ ] All frames 1290 × 2796 PNG, sRGB, no alpha, ≤8MB each
- [ ] Marketing overlay text in Playfair Display SemiBold (56–72pt) + DM Sans Regular (28–36pt)
- [ ] Hero overlay in top 25% of frame, app content in middle 60%, bottom 15% empty/tab bar
- [ ] No banned words (`horoscope`, `zodiac`, `fortune`, planet/sign glyphs) in any caption
- [ ] First 3 frames lead with relationships, not astrology
- [ ] AI disclaimer visible on Frame 3 (Ask AI)
- [ ] Privacy claim visible somewhere (Frame 6 if built, or as a sub-caption on another frame)

---

## What NOT to use (and why)

| Raw file | Reason for exclusion |
|---|---|
| `06_compat_friend_daniel_TOP.jpg` | Redundant — Frame 2 already has Maya partner detail. Friend version doesn't add narrative. |
| `07_compat_friend_daniel_SCROLLED.jpg` | Same — too similar to #06; text density too high for a marketing screenshot. |
| `09_ask_ai_chat_alt.jpg` | Near-identical to Frame 3 (same chat, slightly different scroll position). |
| `13_onboarding_connections-invite.jpg` | "Want to compare your patterns with someone?" — appears late in onboarding; weaker hook than `alt_a` or any of the 5 main frames. |
| `01_today_home_sasha_drift-priya.jpg` (raw #01) | Earlier capture; raw `#14` is cleaner. |
| `03_journal_calendar_history.jpg` | Calendar UI — strong feature proof but visually busy with date grid; `alt_c` (journal composer) is more compelling visually if we want to showcase journaling. |
| `11_onboarding_first-hit_self-aware.jpg` (when used as a main frame) | Lots of empty whitespace at top. Hero text overlay would have to fight the existing italic copy. Better as alt. |

# Transferable Principles — From Pattern Audit to Design Constraints

Synthesized from `01-app-pattern-audit.md`. These are the constraints the HomeScreen redesign must satisfy. They are *not* design proposals — they are the gates each design proposal must pass.

## The 5 principles

### 1. One thing greets her, not a wall

**From:** TikTok (already-playing), Co-Star (sentence-first), BeReal (one moment).

When Mia opens Today at 10:30pm, the visible viewport above the fold should contain **one anchor moment** — not a stack of cards, not a navigator briefing, not 5 life-area pills. One quote-class sentence and the brand around it.

Everything else — chart depth, sky transits, journal, life areas, AI chat, reports — must be reachable but **not visible at the same time**. Depth is opt-in, surfaced via tap or swipe, not via vertical wall.

**What this kills on the current Today:**
- Navigator briefing card AND summary AND 4–5 do-items AND 3–4 avoid-items AND 5 life-area cards AND sky section AND journal CTA all visible simultaneously.

**What this preserves:**
- All of those features still exist; they're just not ALL visible at once.

---

### 2. Each visible card is a screenshot artifact

**From:** Hinge prompts, Co-Star, IG Stories.

Every piece of content visible on Today must be designed to look right when **cropped to a screenshot and dropped into a group chat with no surrounding context**. That means:

- Brand watermark/wordmark in a consistent corner.
- Text large enough to read on a phone screenshot pasted into iMessage.
- A self-contained idea — no "see above" or "more below" references.
- No call-to-action chrome that would look weird in a group chat (no "tap to expand," no "swipe down for more").

**Why:** screenshot-to-group-chat is Mia's primary sharing reflex AND Celestia's primary growth loop. If a card can't be screenshotted as-is, it doesn't ship.

**The Mia Test for this principle:** "Would Mia screenshot this card and send it to her group chat without explaining anything?"

---

### 3. Daily anchor = lock-screen-to-app continuity

**From:** Co-Star push, BeReal once-a-day, IG morning-feed.

The push notification that lands at 8am and the hero sentence Mia sees if she opens Today at 10:30pm must be the **same sentence** (or a clearly related variant). No bait-and-switch.

This means:
- The morning push isn't a teaser; it's the headline.
- If she taps the push, she lands on the same content she just read on the lock screen, in expanded form.
- The hero card on Today changes once per day, not on every open.

**What this kills:** the current "navigator headline" + "navigator summary" + "navigateToward" + "navigateAround" — Mia sees too many distinct first-tier statements. Pick one. Make it *the* statement. Use it everywhere.

**What this preserves:** the rich AI-generated forecast still exists in the data layer. We just only surface ONE sentence as the day's anchor; the rest is in the depth tap.

---

### 4. Depth is tap-through, not scroll-down

**From:** TikTok swipe-up, IG Stories tap-advance, Hinge per-prompt depth.

Below the anchor, today's other moments should be **a small set of horizontally advanceable rings or cards** — not a long vertical scroll. Mia advances at her own pace, exits at any time, doesn't lose her place.

**Implication:** the 5 life-area cards become 5 (or fewer) horizontal moments. The sky section is a moment. The journal prompt is a moment. The pattern is **discrete, ordered, advanceable** — not a continuous scroll where she has to decide how far down to go.

**Why this works for Mia:** her attention span at 10:30pm is short bursts. A horizontal ring lets her bail after one, or stay for all. A vertical scroll demands she choose how far to commit upfront.

---

### 5. Streak and gamification are quiet furniture

**From:** Snapchat streak count.

Mia already knows the streak grammar. She doesn't need a "tap to extend your streak" button or a daily quest CTA on Today. Show the streak number small, near her avatar, the way Snapchat shows it next to a friend's name. Trust her muscle memory.

**What this kills:**
- Trial-elevated streak pill that grows in the hero ("loss-aversion trial pattern").
- Quest cards on Today.
- Multiple level/XP indicators.

**What this preserves:**
- The streak system itself, the milestones, the freezes — all still exist.
- They're just visible in Profile / Journey, not screaming on Today.

---

## What this means for what gets cut, kept, reshaped

### Cut from Today entirely

- Multi-section navigator briefing (one anchor sentence replaces it).
- "Navigate Toward" 4–5 do-items list as a visible card.
- "Navigate Around" 3–4 avoid-items list as a visible card.
- 5 life-area cards as a visible row (becomes the horizontal ring set).
- Quest cards / XP-level indicators on Today.
- Trial-elevated streak pill.
- Multiple CTAs ("See your chart," "Open chat," "Read sky," "Journal" all visible at once).

### Keep but reshape

- **Streak:** quiet furniture next to avatar.
- **Sky/transits:** one ring in the horizontal set, not a full inline section.
- **Journal:** one ring, OR moves entirely to its own tab depth (probably the latter — Mia journals on Sunday deep sessions, not weekday quick opens).
- **Life areas:** become discrete horizontal rings, not a row of stacked cards.
- **Compatibility/Circle:** a ring, OR surfaces only when there's a relevant transit (e.g., Venus retrograde → "check Marc's chart" ring appears).

### Keep as-is in concept but rebuild visually

- **Hero anchor card:** ONE sentence, screenshot-grade, brand-watermarked, tap to deepen.
- **Time-of-day awareness:** morning vs evening hero gradient + content tone — already in code, keep.
- **Avatar + streak in top corner:** lightweight, like Snapchat.

### Surface only on triggers (not always-on)

- Mercury Rx alert: only when active.
- Birthday year-ahead prompt: only in birthday week.
- Lunar event card: only on full moon / new moon / eclipse days.
- Welcome-back / streak-saver UI: only after lapse.

These already exist as conditional cards in code — the principle is to be **stricter** about conditional surfacing. If the trigger isn't urgent, don't show.

---

## Constraints for the redesign brief

Any design proposal that follows this research must:

1. **Render only one above-the-fold anchor moment** in the default state.
2. **Make every visible card screenshot-grade.** Watermark, contained, quotable.
3. **Use a horizontal advance pattern** for today's other moments, not a vertical wall.
4. **Match the morning-push content** verbatim or as a clear continuation.
5. **Treat gamification as furniture** — visible but not loud.
6. **Pass the Mia Test on every visible element:** would she use it at 10:30pm? would she screenshot it? would she pay $9.99 if it scaled?

---

## Open questions for the user before designing

1. **Is the hero anchor a sentence (Co-Star-class) or a card (Hinge prompt-class)?** Sentence is more shareable; card has more visual personality. My instinct: card with one quote-class sentence inside it, brand watermark, single tap-to-deepen affordance.
2. **How many horizontal rings/moments?** TikTok-style "infinite" is wrong. IG Stories style "5–8" feels right. BeReal "one" feels too sparse. Need to decide.
3. **What's the depth-tap destination?** Tapping the anchor card → full-screen reading view (Co-Star expanded), or → AI chat with the day pre-loaded as context, or → her chart filtered to today's transits? Each implies a different product positioning.
4. **Where does AI chat live in the flow?** Today's most resonant Mia moment is the chat ("how does it KNOW this?"). Should the anchor card *be* a chat prompt? Should there be a "ask about today" CTA right under the anchor?
5. **What gets demoted to other tabs vs. cut entirely?** Journal probably moves to its own tab as a Sunday-only ritual (BeReal-window pattern). Quests probably move to Profile or get cut. Need decisions.

These five answers determine the next deliverable: the actual HomeScreen redesign sketch.

# Voice Guide — Push Notifications

The single most-leveraged copy surface in the app. Co-Star's pushes ("be slow and strategic like a mushroom") get screenshotted, posted to Twitter, written about in Daily Dot. That's a free distribution channel built entirely on tone.

This guide is for **push copy specifically**. In-app long-form briefings keep their own navigator voice (do/avoid + alternatives). Pushes are different.

## The voice in three words

**Literary. Specific. Slightly unsettling.**

Never generic. Never "✨ cosmic ✨." Never the kind of thing a sun-sign horoscope app would write.

## Hard rules

1. **No exclamation marks.** Ever. They read as desperate.
2. **No emoji except one sparing typographic glyph** (✦ ★ ✶ ⌁ ❅ ◇). Never platform emoji (🔥 ✨ 🌙 etc.) — they break the brand.
3. **Title ≤ 60 chars** (iOS preview) — most users only read the title.
4. **Body ≤ 140 chars** — keep it screenshot-able.
5. **Second-person.** "You" not "I" not "we." Imperative or observational.
6. **No "the universe."** No "stars align." No "destiny." No "cosmic energy." No "high-vibration." If a generic horoscope app would write it, don't.
7. **Reference one specific thing** — a placement, a partner, a word from their journal, a date. Generic pushes are noise.
8. **Allow strangeness.** "be slow and strategic like a mushroom" works because it's specific and weird. Don't sand off the edges to be safe.

## Soft rules

- **Cut the user-name padding.** "{userName}, your day…" wastes characters that could be specific. Use the name only when the line is genuinely about them.
- **End with a beat, not a CTA.** "Open for your full insight →" is Hubspot copy. Trust the user to open if the line lands.
- **Active verbs.** "Mercury moves to Aries" beats "Mercury is moving to Aries."
- **Concrete > abstract.** "Fold the laundry" beats "honor your physical space." Co-Star's best lines are mundane-specific.

## Push-type voice swatches

For each push category, here are 3 **good** examples and 1 **bad** (current) example to deprecate.

### Cosmic Morning — generic (no special context)

**Good:**
- "The Moon is in your seventh house. Watch who gets quiet today."
- "Saturn isn't testing you. Saturn is showing you what you already know."
- "Two months from now, you'll thank yourself for whatever you start today."

**Bad (current):** "Good morning, {userName}. Your daily navigator briefing is ready."

### Cosmic Morning — D1 personal (referencing onboarding reveal)

**Good:**
- "Yesterday: you only fully feel yourself when reflected in someone else's eyes. Today's a 7th-house day. Notice who looks at you."
- "Yesterday's read about you was true. Today watch for the second part of it."

**Bad (current — too verbose):** "{userName}, yesterday you learned this: '{long quote}' — here's how it shows up today."

### Cosmic Morning — internal trigger (week 3+)

**Good:**
- "Stuck on someone? Your chart has an opinion."
- "What's heavier than it should be right now? Name it."
- "Anyone you've been thinking about who shouldn't be? Read why."

**Bad (current):** "Anyone on your mind today? {Name} came up in your chart this week. Want a read?"

### Lapse cascade

**Good (D2):** "Two days. The Moon's in {sign} now. You're going to want to know what that means."
**Good (D7):** "{partner name}'s chart shifted twice this week. Yours is still sitting here, waiting."
**Good (D14):** "Two weeks since you saved {partner}. The thing you wanted to know about them is starting to make sense."
**Good (D21):** "Three weeks. You don't owe us anything — but the patterns are getting clearer without you."

**Bad (current — all too "happy to see you"):** "Your week of briefings… The Moon moved to a new sign while you were away."

### Anticipation (D6 / D13 / D27)

**Good:**
- "One more morning. Then the streak counts as something."
- "Tomorrow: 14 days. The kind of consistency most people don't manage."
- "Two days to a full lunar cycle of showing up. Most people stop at week 1."

**Bad (current):** "★ One more morning to ★ 7 days. {userName}, hit today's check-in and you'll unlock your first weekly streak."

### Trial-end (2 days before charge)

**Good:**
- "Trial ends in 2 days. {N} journals written. You can keep them either way."
- "Two days. We don't want to charge you if you don't want this."

**Bad (current):** "Your trial ends in 2 days. {N} journal entries, {M} chats so far. Cancel any time in Settings if you want to — no charge if you do it before then."

### Pro feature discovery

**Good (weekly report):**
- "You haven't read a weekly. The next 7 days are a Saturn-square — you'll want this one."
- "30 seconds. Your weekly read. Pulled from your real chart."

**Good (deep dive):**
- "Pluto in your 8th house is one of the spicier reads in your chart. You haven't opened it yet."

**Bad (current):** "Your custom weekly read is ready. You're paying for it — give it 30 seconds. Pulled from your real transits, not your sun sign."

### Badge rescue ("X away from")

**Good:**
- "One chat from Question Seeker."
- "Two journal entries from Deep Diver. Tonight's a journal night."

**Bad (current):** "{N} {actions} from {badge name}. You're {N} away from unlocking {badge}."

### Subscription-ending (willRenew=false, 5 days before)

**Good:**
- "Five days. Your data stays no matter what — just say the word and we leave you alone."

**Bad (current):** "Your Pro access ends in 5 days. Reactivate any time — your chart, journals, Circle, and streak history all stay either way."

## How to write a Celestia push (process)

1. **Start with the SPECIFIC thing.** A placement, a partner name, a date, a word from their journal. Never start with "{userName}, your…"
2. **Cut every word that doesn't earn its place.** Push copy is poetry — nothing decorative.
3. **End on the implication, not the action.** Trust the user to open if the line lands.
4. **Read it out loud.** If it sounds like a horoscope app, rewrite. If it sounds like a friend who knows astrology too well, ship.
5. **Screenshot test:** would someone want to screenshot this and send it to a friend? If no, rewrite.

## Anti-patterns to remove from current code

The following phrases appear in current templates and should be removed/replaced:
- "Your cosmic [anything]" — generic
- "The stars [anything]" — generic
- "Cosmic insights are waiting" — generic
- "Open for your full insight →" — Hubspot CTA
- "{N} of [something]" stat-stuffing — replace with one specific stat
- "Your year ahead is forming" — vague
- "Multiple Moon sign changes" — pseudo-data

## Localization note

These guidelines assume English. If translating, the SPECIFIC + UNSETTLING pattern needs to land in the target language too — direct translation often makes pushes worse. Re-write per-language with native copywriters when possible.

## Measurement

After CA-B1b ships and CA-B2 wires the A/B framework, validate via:

| Metric | Target |
|---|---|
| Push open rate (literary vs informational) | Literary ≥ 15% lift |
| Day-1 retention of literary cohort | ≥ control |
| Manual: organic mentions on Twitter/Instagram (monthly) | ≥ 1 mention in 90 days = early signal |

If literary pushes underperform on retention but generate organic mentions, **keep them anyway** — distribution is worth more than a few percentage points of D1.

# Celestia — Card Concept Map

This is the inventory of every card type that lives on the **redesigned Today** (currently the "New" tab while we iterate). It defines what each card *is*, what it *contains*, and how it behaves — not what it looks like. The designer owns the visual language.

The card system has two surfaces:

1. **The Deck** — a Tinder-style horizontal swipe of full-bleed cards on the New tab. Each card is a self-contained "moment" in Mia's day.
2. **The Detail Screens** — pushed when Mia taps "Read more" on any deck card. Full-screen reading view for the topic.

Both surfaces should feel like pieces of one editorial system.

---

## Part 1 — Deck Cards

### Order of cards in the deck (left to right, in the swipe order)

```
TODAY  →  LOVE  →  CAREER  →  VITALITY  →  GROWTH  →  SOCIAL  →  SKY  →  REFLECT  →  [TRIGGER]  →  CLOSING
```

`TRIGGER` is conditional — only renders on certain days (birthday week, Mercury retrograde, Sunday/Monday, full/new moon, 1st-3rd of month, etc.). All other cards render every day.

Total deck length: 9 or 10 cards depending on the day.

---

### 1. TODAY (Anchor)

The day's emotional weather. The first card the user sees.

**Slot kind:** anchor
**Renders every day:** yes

**Content blueprint:**
- A short quote-class statement of today's energy (5–9 words). Comes from AI. Examples: *"Today wants you slower."* / *"Some conversations are overdue."* / *"Main character energy is heavily favored today."*
- A one-sentence supporting context line. Optional but usually present. Names a planetary mechanic in plain language. Example: *"Mars in your 7th asks you to listen first."*
- Date (day name + month + day)
- A small streak indicator if user has one
- A user-initial / avatar in a corner

**Affordances on the front face:**
- Tap card → opens the Today detail screen
- Save (heart action) — toggles saved-for-later
- Share (sends quote to iMessage / IG)
- Big primary CTA: "Read more →" — same destination as tap card
- Swipe left → next card (Love)
- Swipe right → no previous card (this is first)

**Tap → detail screen content:**
See **Today Detail** in Part 2.

**Mood note:** This is the day's headline. Should feel like the front cover of a personal magazine.

---

### 2. LOVE

Today's love & relationship energy.

**Slot kind:** life area
**Renders every day** (only skipped if AI returned no data for this area)

**Content blueprint:**
- Tag/category: LOVE
- Headline (1 line, ~5–10 words). AI-generated, area-specific. Example: *"Today wants honesty over comfort."*
- A short reasoning line — names the planetary mechanic. Example: *"Venus is moving through your 5th house."*
- An "intensity" signal (low–medium–high). Optional in the front-face render; can be a quiet visual.
- A symbol that anchors the area (heart-adjacent, but not literal hearts).

**Affordances:**
- Tap → opens the Life Area detail screen for love
- Save, share, big "Read more →" CTA
- Swipe to advance

**Tap → detail screen content:**
See **Life Area Detail** in Part 2.

**Mood note:** Intimate. The card is a quiet observation about her relational life today, not a love-horoscope-prediction.

---

### 3. CAREER

Today's career & finances energy.

**Slot kind:** life area
**Renders every day** (skipped if no AI data)

**Content blueprint:**
- Tag/category: CAREER
- Headline (1 line). Example: *"Manifesting Success."* / *"The earthy momentum favors structure today."*
- Reasoning line. Example: *"Saturn aspects your 10th house — long-game energy."*
- Optional signal: power source / wealth flow / market timing badge if AI returned them
- A symbol anchored to ambition/structure (diamond / mountain / column)

**Affordances:** same as LOVE

**Tap → detail screen content:**
See **Life Area Detail (Career variant)** in Part 2 — career has additional fields (Power Source, Wealth Flow, Market Timing) that other areas don't.

**Mood note:** Grounded, structured, NOT corporate-tech. Editorial professional.

---

### 4. VITALITY

Today's energy, body, rhythm.

**Slot kind:** life area
**Renders every day** (skipped if no AI data)

**Content blueprint:**
- Tag/category: VITALITY
- Headline. Example: *"Slow down before you move."*
- Reasoning line.
- Optional signal: energy level (low / medium / high) — could be visual
- A symbol of rhythm / breath / pulse

**Affordances:** same.

**Mood note:** Calming, body-aware, not a fitness app.

---

### 5. GROWTH

Today's inner work, learning, transformation.

**Slot kind:** life area
**Renders every day** (skipped if no AI data)

**Content blueprint:**
- Tag/category: GROWTH
- Headline. Example: *"Today, sit with the discomfort."*
- Reasoning line.
- A symbol of transformation (door / spiral / sprouting line)

**Affordances:** same.

**Mood note:** Reflective. This is the most "therapy-adjacent" card. Should feel deep, not preachy.

---

### 6. SOCIAL

Today's connections, conversations, communication energy.

**Slot kind:** life area
**Renders every day** (skipped if no AI data)

**Content blueprint:**
- Tag/category: SOCIAL
- Headline. Example: *"Reach out to one person you've been dodging."*
- Reasoning line.
- A symbol of connection (intersecting lines / paired marks)

**Affordances:** same.

**Mood note:** Warm, social, not networking-coded.

---

### 7. SKY

Today's most significant sky event for Mia's chart. Structurally different from the life-area cards.

**Slot kind:** sky
**Renders every day** (if any moon/transit data exists)

**Content blueprint:**
- Tag/category: TODAY'S SKY (with a moon glyph)
- Headline (1 line). Example: *"Mercury squares your Mars."* / *"The Moon enters Cancer at 2:14 am tonight."*
- Two side-by-side data widgets:
  - **MOON** — moon phase name + sign + illumination percent
  - **TRANSIT** — top transit planet + aspect type + natal planet
- Below: optional context line ("tonight at 2:14 am") or eclipse alert if active

**Affordances:**
- Tap → existing TodaysSky screen (Transits) — already designed; the deck card is a preview
- Save, share, big "Read more →" CTA opens TodaysSky
- Swipe to advance

**Mood note:** Almanac-like. The card looks more like a data card than a quote card. This variance is *intentional* — it proves the system can break its own template for the right reason.

---

### 8. REFLECT

A prompt to engage AI chat. Time-of-day adaptive.

**Slot kind:** reflect
**Renders every day**

**Content blueprint:**
- Tag/category: time-of-day label (MORNING / AFTERNOON / EVENING / TONIGHT)
- A single question prompt. Examples:
  - Morning: *"What do you want today to be about?"*
  - Afternoon: *"What's actually on your mind?"*
  - Evening: *"How did today actually feel?"*
  - Late night: *"Sit with this one for a minute."*
- A short subline pointing to the chat: *"Talk to Celestia. Today's chart is loaded."*
- A symbol of question / spark / pause

**Affordances:**
- Big primary CTA: "Open chat →" (replaces "Read more")
- No detail screen — tapping the CTA goes directly to AI chat with the prompt seeded
- Save, share OK

**Mood note:** Inviting, not demanding. Mia opts into typing only if she wants.

---

### 9. TRIGGER (conditional, max 1 per day)

A timely, contextual card that only appears on specific days. Slot is variable — its content depends on which "trigger kind" fires.

**Slot kind:** trigger
**Renders only when one of these is active** (priority order):

| Trigger Kind | When it fires | Headline shape |
|---|---|---|
| `birthday` | Birthday week (7 days before → 3 days after) | "Your year ahead is forming." / "Welcome to your year." |
| `mercury-rx` | Mercury Retrograde period | "Mercury is retrograde." |
| `lunar` | Full Moon or New Moon today | "Full Moon in Libra." / "New Moon in Capricorn." |
| `sunday-recap` | Sundays | "How was your week?" |
| `monday-week` | Mondays | "The week ahead." |
| `monthly-recap` | 1st–3rd of month | "A new chapter." |

**Content blueprint:**
- Tag/category: kind-specific (e.g., "✦ SOLAR RETURN" / "☿ MERCURY RX" / "🌕 FULL MOON" / "SUNDAY")
- Headline (kind-specific quote)
- A short meta line — practical advice or context. Example for Mercury Rx: *"Slow down on tech, contracts, and unsent texts. Re- words come naturally now."*
- A symbol matched to the trigger kind

**Affordances:**
- Big primary CTA points to a related screen (e.g., birthday → Reports / Year Ahead; mercury-rx → Sky; sunday → Journal; monthly → Reports)
- Save, share

**Mood note:** This card is the day's "highlight reel" moment. It should feel like a friend tapping you on the shoulder: *"hey, this is happening today, here's what to do with it."*

---

### 10. CLOSING

The soft floor of the deck. Last card. Tells Mia the day's reading is complete.

**Slot kind:** closing
**Renders every day**

**Content blueprint:**
- Tag/category: THAT'S TODAY
- Headline. Example: *"You're caught up."* / *"Sleep well, you."*
- A short sign-off line. Example (late night): *"The sky has your back tonight. The next one shifts at 6am."*
- The streak indicator (small, quiet) if user has one
- Quiet text links to other tabs: ask · chart · journal

**Affordances:**
- Big primary CTA: "Ask Celestia →" (opens chat)
- Save not needed (no detail content)
- Share OK
- Swipe right → goes back to TRIGGER or REFLECT (last content card)
- Swipe left at this card → no advance (this is the floor)

**Mood note:** Calming. The visual should feel like exhaling.

---

## Part 2 — Detail Screens

When user taps "Read more" on certain deck cards, a full-screen detail view is pushed (slide-from-right native nav). The deck stays underneath — they go back via the back button.

### Today Detail

Pushed from: TODAY card.

**Sections (in order):**

1. **Hero** — same headline as the deck card, but bigger. Tag pill, motif/symbol, supporting subline.
2. **THE READING** — the full horoscope paragraph (3–6 sentences of AI prose). The longer version of the deck card's punchy headline.
3. **NAVIGATE TOWARD** — a numbered list of 4–5 things to lean into today. Each item has an action (1 line) and optionally a reason (smaller, italic-ish, why this matters today).
4. **NAVIGATE AROUND** — 3–4 things to avoid. Each item has an action, optionally a reason, optionally an alternative ("try instead: …").
5. **TODAY'S MANTRA** (when AI returns one) — a short quote, treated as a callout / pull-quote.
6. **Bottom-fixed CTA** — "Ask Celestia about today →" — opens AI chat.

**Header chrome:** back button (left), date (center), share button (right).

---

### Life Area Detail

Pushed from: LOVE / CAREER / VITALITY / GROWTH / SOCIAL cards. Same template, same sections — but each section's content is filled with that area's data.

**Sections (in order):**

1. **Hero** — area glyph (large, framed), tag pill, area title, area subtitle ("Intimacy · Romance · Self-Love" for LOVE), and an "Energy + Intensity" sub-card showing:
   - An energy keyword pill ("Steady" / "Activated" / etc.)
   - A horizontal intensity meter (1–10, e.g. an X/10 score with a filled bar)
   - Optional secondary chips: archetype, driving planet
2. **Planetary Reason** — a single italic paragraph explaining the celestial mechanic in plain language. (1–3 sentences.)
3. **YOUR READING** — the full reading paragraph. (Equivalent to "THE READING" on the Today detail.)
4. **TODAY'S VIBE** — only on LOVE and CAREER. A pull-quote callout with a short quoted vibe statement.
5. **NAVIGATE TOWARD** — bulleted list of recommended actions (3–5 items). Bullet color tinted to the area's accent.
6. **POWER ACTIONS** — only on LOVE and CAREER. Similar to NAVIGATE TOWARD but a separate, more directive set of actions.
7. **NAVIGATE AROUND** — bulleted list of things to avoid (2–4 items). Visual treatment slightly more muted than NAVIGATE TOWARD.
8. **Career-only extras** — only on CAREER. A 3-row info table: POWER SOURCE / WEALTH FLOW / TIMING.
9. **BEST WINDOW** — a "best time of day" callout with a clock icon. (Sometimes blank.)
10. **TODAY'S PRACTICE** — a callout with a single ritual sentence.
11. **TODAY'S AFFIRMATION** — a centered pull-quote, large quoted statement. (Skipped if AI didn't return one.)
12. **Navigator Note** — a small italic last-word from the app, like a closing footnote.
13. **Bottom-fixed CTA** — "Ask about your love today →" / "Ask about your career today →" etc. Opens AI chat with seeded prompt.

**Header chrome:** back, date, share.

**Important:** sections 4, 6, 8 are conditional — only render when their content exists. The screen should gracefully accommodate any subset.

---

## Part 3 — Cross-cutting elements

These appear across multiple cards and should have consistent visual treatment.

### Tag / Category Pill

Small, soft-tinted, uppercase. Sits above the headline on every deck card. Carries the slot's name (TODAY / LOVE / CAREER / etc.). Optionally has an icon.

### Motif Badge

A small circular "stamp" with the slot's symbolic glyph. Sits above (or aligned with) the tag pill. Replaces the need for full hero photography. Adds visual weight to an otherwise text-heavy card.

### Brand Mark

The wordmark "✦ celestia" appears in a quiet, consistent location on every card so screenshots are recognizably Celestia. Treat as furniture, not ornament.

### Avatar + Streak

A small user-initial circle in the top corner of every deck card. Streak indicator (e.g. "🔥 12") sits beside it. Quiet, never demanding. Tapping opens Profile.

### Action Chips (below the deck card, on the page surface — not on the card itself)

Three floating circular chips below the deck card:
- ♡ (save) — toggles, fills when active
- "Read more ↑" or "Open chat →" or "Ask Celestia →" — the primary CTA, biggest of the three
- ↗ (share) — opens iOS share sheet

The middle chip is the brand-surface gradient signature button. Same gradient on every card, same shape.

### Progress Dots

A row of small horizontal dashes at the very top of the page (above the deck cards). One dash per card in today's deck. Active dash is wider and a higher contrast. Tapping a dash jumps to that card.

---

## Part 4 — States

| State | When | Visual treatment |
|---|---|---|
| Default | Card is current and content is loaded | The "designed" full state |
| Loading | Forecast hasn't returned yet | A skeleton / placeholder version of the card with the same layout. Should still feel like Celestia. |
| Empty / no data | AI returned nothing for that slot | A graceful "we're listening" message. Shouldn't show this often, but design it. |
| Saved | User has tapped the heart | Heart chip is filled (different color). May show a small saved-indicator on the card (optional). |
| Mid-swipe | Card is being dragged | Card rotates slightly; the next card behind is visible (already specced in code) |
| Off-screen | Card has flown away | Not visible; new card now in its position |

---

## Notes for designer

- **The visual variance between cards is what keeps the deck from feeling monotonous.** Each card should have its own personality (each life area has its own mood, the sky card looks like an almanac, the trigger card feels like a callout). But they all share the same brand language.
- **Mia screenshots the cards.** The visual design must hold up cropped to a screenshot pasted into iMessage with no surrounding context.
- **Mia is 24, Austin, single, lapsed Co-Star user.** She's not into "spiritual woo." She IS into well-designed products (Aesop, Glossier, Free People). She reads Cup of Jo. See `01-designer-brief-light-mode.md` for the full picture.
- **Light mode is the priority right now.** Dark mode follows once light is locked.

The next document (`01-designer-brief-light-mode.md`) is the brief — the *"why"* behind these cards and what we want the designer to bring.

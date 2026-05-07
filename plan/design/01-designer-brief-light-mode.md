# Designer Brief — Celestia Card System (Light Mode)

This is a creative brief, not a spec. Bring the visual.

`00-card-concept-map.md` defines **what** each card contains and how it behaves. This document defines **who** it's for, **why** it matters, and **what feeling** the design needs to deliver. The visual choices are yours.

---

## The User

Her name is **Mia Reyes**. She's the entire reason this product exists. Full persona is at `plan/ideal-user/Celestia-Mia-Reyes-Persona.html`. The summary:

- **24, Austin, single, marketing coordinator at a small DTC company.**
- Knows her Big 3 (Virgo Sun, Scorpio Moon, Leo Rising) without looking them up.
- **Lapsed Co-Star user.** Found it cold and generic by month 2.
- Phone: iPhone 14, 6.5 hrs/day. TikTok 2 hrs, IG 1.5, iMessage all day, Pinterest 30min, Google at 10pm+.
- Shops Free People + Target + Zara. Stanley cup on her nightstand. Half-read self-help book. Three plants she's trying not to kill. Tapestry on the wall.
- Reads Cup of Jo, NYT Modern Love, Lenny Letter (when it existed), substacks. Listens to Esther Perel.
- **Therapy-positive but priced out** — therapy is $200/session, she can't afford it weekly.

**She is not "into the stars" in a witchy way.** Astrology is her language for self-understanding. She uses it the way someone else might use Enneagram or Myers-Briggs — a vocabulary for talking about why she does the things she does.

---

## The Session

**Time:** Sunday night. 10:47pm. Phone in hand. Alone in bed. Maybe lights are off.

**Why she opened the app:** something happened today that she can't stop thinking about. Most likely candidates from the persona doc:

1. Got left on read by someone she likes
2. Generic Sunday dread (work tomorrow)
3. Met a new guy this week and wants compatibility info
4. A TikTok hit her (something astrology-adjacent felt eerily personal)
5. Got passed over at work
6. Birthday coming up

She is not opening the app to "get her daily horoscope." She's opening it because something feels unresolved and she wants to be seen.

She'll spend anywhere from 90 seconds (skim) to 12 minutes (deep dive + AI chat).

---

## The Job-To-Be-Done

When Mia opens the deck, the cards must do these in order:

1. **Make her feel seen** — within 2 seconds of looking at the first card.
2. **Give her permission to slow down** — the visual breathing room itself sends this signal before any words are read.
3. **Let her share if it hits** — the moment she screenshots a card and sends it to her group chat is the product's most important moment. **Every card must hold up as a screenshot.**
4. **Open a path to depth, on her terms** — she chooses which card to deepen by tapping. The system never demands she read more.
5. **Let her exit at peace** — the closing card tells her "you're caught up." She closes the app and sleeps better.

---

## The Mia Test

Every visual choice you make must pass three questions:

| Test | Question |
|---|---|
| **Product** | Would Mia use this card at 10:30pm in bed? |
| **Marketing** | Would she screenshot this and send it to her group chat without explaining anything? |
| **Revenue** | Would she pay $9.99 to keep getting these? |

If a card can't pass all three, it's not done.

---

## Brand Personality

Pick the words that describe Celestia:

- ✅ Editorial · Literary · Premium · Considered · Warm · Quiet
- ✅ Magazine · Cup of Jo · NYT Modern Love · Aesop · Apple Health "Today"
- ❌ Mystical · Cosmic · Witchy · Pastel-pink · Tarot · Crystal-shop
- ❌ Brutalist · Gen-Z neon · Y2K · Co-Star
- ❌ Corporate · Tech-bro · Linear · Notion · Productivity

The dial is pointed at **"editorial / premium / quiet,"** somewhere between **Apple News** and **Cup of Jo**.

If a Cup of Jo reader visited and saw Mia's home screen, they should think "huh, this looks nice, what is this?" — not "ohh, an astrology app."

---

## What's Already Decided

These are locked. Don't redesign them.

1. **The deck pattern.** Tinder-style swipe physics, lifted card with shadow + ring + sheen, peek-card behind, motif → tag → headline → meta → action chips below the card. The mechanics are working. Bring the visual.
2. **The card list.** TODAY → LOVE → CAREER → VITALITY → GROWTH → SOCIAL → SKY → REFLECT → [TRIGGER] → CLOSING. Per `00-card-concept-map.md`.
3. **Detail screens are full-screen native pushes** (slide from right), not modals. Header has back / date / share. Bottom has a fixed gradient CTA.
4. **The action chips below the card.** Save (♡) — Read more (↑) — Share (↗). Three of them. The middle one is the gradient signature.
5. **The brand mark "✦ celestia."** Lives somewhere on every card. Furniture, not ornament.

---

## What You Bring

### A. Light-mode visual language for the deck

Design **one frame per card type** at iPhone 16 dimensions (393×852pt). That's:

- TODAY (Anchor)
- LOVE
- CAREER
- VITALITY
- GROWTH
- SOCIAL
- SKY (the data-widget card — different layout)
- REFLECT
- TRIGGER (one example — pick the most exciting kind, e.g. Full Moon or Mercury Rx)
- CLOSING

You decide:

- **Color palette.** What feels right for each card type. Each card can have its own mood. They should still feel like one family.
- **Typography.** What headlines feel like. What body feels like. What the tag pill reads like at a glance.
- **Motif system.** Each card has a symbolic glyph (heart for love, etc.). Make these *yours.* Fine-line illustration, geometric, hand-drawn — your call. They should feel deliberate, not stock.
- **Decorative elements.** Constellations, geometric motifs, line drawings — anything that adds personality without becoming clutter.
- **Layout micro-decisions.** Where the brand mark sits. How the date is formatted. Whether the streak shows always or only above some threshold. How the data widgets in the SKY card look (don't have to be two side-by-side cells if you find a better way).

### B. Light-mode visual language for the detail screens

Two frames:

- TODAY DETAIL — the full reading screen pushed from the Today card.
- LIFE AREA DETAIL — show the LOVE variant. (CAREER has additional sections; design the LOVE first; we'll adapt for CAREER's extras later.)

The detail screens should feel like the **calmer, longer, more readable cousin** of the deck cards. Same brand language, but more whitespace, longer text rendering, more reading-friendly.

### C. The motif library

A set of 6–10 small symbols/glyphs:

- TODAY anchor mark
- Heart (LOVE) — non-literal, considered
- Diamond / structure (CAREER)
- Pulse / rhythm (VITALITY)
- Door / sprouting line / spiral (GROWTH)
- Intersecting lines / paired marks (SOCIAL)
- Moon glyph + planet ring (SKY)
- Question / spark (REFLECT)
- Lunar / mercury / sun-arc / etc. (TRIGGER variants)
- Sun-setting line / soft arc (CLOSING)

These should look like one family, but each one stands on its own. They appear on the cards in the motif badge AND on the detail screens (potentially larger).

### D. The states

For at least the TODAY and LOVE cards, also design:

- **Loading state** — what does the card look like while AI is generating today's content? A skeleton that still feels like Celestia.
- **Empty state** — what does it look like when AI returned nothing? Should be rare but graceful.
- **Saved state** — how is "this hit me, I want to come back to this" indicated visually?

---

## Hard Rules — Don't Do These

| Don't | Why |
|---|---|
| **Stock photos of moons, candles, crystals, planets** | Mia explicitly does not want spiritual-woo aesthetic. The persona doc is direct on this. |
| **Tarot cards or chakra rainbow gradients** | Same reason. Reads as Sephora-spiritual. |
| **Pure pastel pink + lavender** | Skews too feminine-coded. The design audit warned against this — Celestia is for both Mia AND the secondary "skeptical engineer" persona. Warmer / more grounded. |
| **Dark cosmic-blue gradients with star-fields** | Co-Star occupies that lane. Get out of it. |
| **Pushy paywalls or "upgrade" badges on cards** | Mia hates pushy paywalls. The cards are content surfaces; commerce belongs elsewhere. |
| **All-caps body text** | Editorial register requires sentence case for body. Caps only on small uppercase labels (tags, kickers). |
| **Owl mascots, gamified XP loud-mode confetti** | Persona is post-Duolingo-shame. |
| **More than 3 fonts** | Editorial restraint. |
| **Color used for color's sake** | Every accent color should mean something (this card is LOVE / this is CAREER / this is the active progress dot). |
| **Drop-shadows that look like buttons hovering on a Materials Studio surface** | Soft, color-tinted, ambient shadows — not engineering shadows. |

---

## Soft Rules — Lean Into These

- **Whitespace is content.** Generous margins. Air around the headline. Mia's card should never feel "full." A card that feels too quiet is better than one that feels too loud.
- **One topic per card.** No card should have multiple competing CTAs. The big "Read more" is the only CTA mid-card. Save and share are quiet chips below.
- **Typography hierarchy is brutal.** Headline is 4–5x the body size. Body is small and breathable. Caps labels are tiny and tracked.
- **The motif and the headline should both be screenshottable on their own.** A friend looking at a screenshot should be able to tell *what kind of moment* this is from a glance at the visual stamp alone.
- **Per-card moods, one family.** LOVE feels different from CAREER feels different from SKY — but a person should immediately see them as cards from the same product.
- **Detail screens are a long exhale.** When Mia taps "Read more," the page should feel like a magazine spread, not a technical manual. Long-form serif body text. Wide line-height. Section breaks that feel intentional.
- **The CTA gradient pill is the brand surface.** Same gradient on every card's primary CTA. Make it gorgeous. Make it the thing the eye lands on after reading the headline.

---

## References to Look At

In rough order of how much to draw from each:

1. **`/references/stitch_celestial_swipe_cards/`** — `daily_cosmic_high`, `love_connection`, `lunar_mood`, `career_hustle`, `lucky_symbols`, `planet_in_retrograde`, `self_care_ritual`, `celestial_airy/DESIGN.md`. Closest to what we want — editorial cards, soft-tinted backgrounds, fine-line motifs, peach-lavender-CTA pattern. Borrow the structural moves, NOT the pastel-pink palette.
2. **`/references/flick-main/`** — `app-code/components/swipe/SwipeCard.tsx`. The Tinder-style swipe physics. The lifted card shadow. Already implemented in code; reference for the *card object* visual treatment.
3. **Apple News (Today section)** — for the editorial-cards-stacked feel (the detail screens reference this more than the deck does).
4. **Tinder + Hinge** — for the deck mechanics. NOT for the visual aesthetic.
5. **Cup of Jo, NYT Modern Love, Lenny Letter** — the body copy register and the editorial mood.
6. **Aesop, Glossier, AllBirds product pages** — the "premium quiet" aesthetic Mia responds to.

## References to Avoid

- Co-Star (brutalist black + Helvetica)
- Sanctuary / Nebula (psychic-reading marketplace aesthetic)
- The Pattern (brown grid, dense info)
- Generic horoscope sites (purple gradients, sparkles)
- Productivity apps (Linear / Notion / Things — too utilitarian)

---

## Deliverables

For first review, please bring:

1. **Light-mode frames** for the 10 card types listed above. iPhone 16 dimensions (393×852pt). Static frames are fine — no animation prototypes needed yet.
2. **Light-mode frames** for the two detail screens (TODAY DETAIL, LIFE AREA DETAIL — LOVE variant).
3. **Motif library sheet** — all 6–10 glyphs together so we can see them as a system.
4. **A two-card "screenshot test"** — render one TODAY card and one LOVE card as if they were screenshots in an iMessage thread. If they don't look like something a 24-year-old in Austin would actually send to her group chat, iterate.
5. **One color/type/motif sheet** with your choices written down so the next design pass and the engineering team can both reference it.

Format whatever's natural for you (Figma, Sketch, hand-drawn iPad, doesn't matter). The output is the visual — the file format is your call.

---

## Working Together

Iterate in passes. Don't wait until everything's perfect to share.

- **Pass 1:** rough — show us the TODAY card and one life-area card (probably LOVE). Get the brand language locked.
- **Pass 2:** apply the language to the other 8 card types. Surface the variances.
- **Pass 3:** the detail screens.
- **Pass 4:** states (loading / empty / saved) and the motif library polish.

We can review each pass quickly and respond. Don't optimize for "presenting the final" — optimize for "moving the language forward each round."

---

## One Last Thing

Read the persona file first. Don't skip it. Mia is real to us — she should be real to you too before you draw anything.

`plan/ideal-user/Celestia-Mia-Reyes-Persona.html`

If after reading her you feel the brand needs to be 30% bolder than this brief suggests, push back. The brief is the floor, not the ceiling.

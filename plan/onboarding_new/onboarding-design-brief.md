# Celestia Onboarding — Design Brief (Light Mode)

A handoff for the designer producing the visual comps. This document explains *what each screen is for*, *what's on it*, and *what the user does*. It deliberately does not specify exact colors or token values — those should come from your visual interpretation of the brand direction below.

---

## What Celestia is

Celestia is a real-chart astrology companion. Unlike sun-sign apps (Co-Star, The Pattern), every reading is generated from the user's actual birth chart — Sun, Moon, Rising, full planetary placements, transits. The product promise is **"Your real chart. Not your sun sign."**

Tone: editorial, warm, calm. Closer to a Sunday-magazine horoscope column than a glossy tech app. Thoughtful, not mystical-tacky.

The audience skews 22–34, mostly women, astrology-curious to astrology-fluent. They are tired of vague horoscopes and want something *specific* to them.

## Brand direction (broad palette only)

The app uses a **warm burgundy + cream "Liquid Glass" palette**. Think:

- Cream and ivory base tones — soft warmth, never stark white
- Deep burgundy as the primary brand anchor (used sparingly, ceremonial)
- Muted gold as a single accent — for kickers, active states, premium signal
- Stone-grey neutrals for body text, never pure black
- One soft warm-grey for cards/surfaces above the cream base

**Avoid**: electric blue, neon purple, gradient-heavy "cosmic" purple-pinks, dark navy. Those read as Co-Star / Sanctuary / Nebula — exactly the look we are differentiating from. We are *editorial*, not *cosmic-tech*.

Surfaces should feel like cream paper with a subtle warm glow, not like a black hole with stars. Hairline strokes. Generous whitespace. Gold appears in maybe five places per screen, never as a full button on the brand-anchor (HeroCta) — gold buttons are reserved for a secondary, transactional action tier.

## Typography

- **Playfair Display** — display headings, hero statements, the ceremonial "magic moment" copy. Always large, generous line-height, often centered.
- **DM Sans** — body copy, button labels, all UI chrome. Sometimes used in semibold for kickers and small caps.
- **Newsreader / Playfair Italic** — italic editorial accents (taglines, quote-style insights, the "core question" copy).

Kickers ("YOUR INTENT", "ABOUT YOU", "GOING DEEPER") are 9–10pt, semibold, all-caps, letter-spaced ~2px, in the gold accent.

## Layout & motion principles

1. **One screen = one moment.** No internal scrolling unless the screen is genuinely a list (paywall is the only exception — it earns its scroll).
2. **Single hero CTA.** The brand-anchor button (deep burgundy solid, often labeled with a ceremonial verb) is the ceremonial action. The gold-gradient button is for transactional steps ("Continue", "Cast My Chart"). Don't mix two ceremonial CTAs on the same screen.
3. **Hairlines and breathing room** beat boxes and dividers. Cards have very subtle borders (~1px hairline) and tiny shadows.
4. **Light haptics on every meaningful tap.** Selections, reveals, advances.
5. **Spring animations on the magic moments** (chart reveal, planet flips, finale). Smooth tween (~150–250ms) on advance transitions between steps.
6. **Progress dot/bar at the top** on every step except the first hook and the final paywall. The user always knows roughly how far they are.

---

# The flow — 14 onboarding screens

The flow is structured in five arcs:

```
Arc 1 — HOOK            (1)         Promise
Arc 2 — INVESTMENT      (2–4)       Three commitment moments
Arc 3 — PAYOFF          (5–10)      Birth data → calculation → big-3 reveal → meaning
Arc 4 — PROOF           (11)        Tinder-style preview of what they'll get
Arc 5 — COMMITMENT      (12–14)     Wake anchor → notification preference → paywall
```

Arc 6 lives **after** onboarding — the welcome / first-action moment in the app itself. We document it at the end of this brief because the designer's job extends one screen past "finish onboarding."

---

## Screen 1 — Hook

**Purpose**: First impression. Promise the differentiator in one breath. Set tone.

**Layout**: Full-bleed cream gradient. Center-stacked, generous vertical spacing.

- A single ornament glyph at the top (a gold "✦" star) acting as a visual anchor.
- A short hairline rule — two thin strokes with a small gap, signalling "editorial."
- The hero statement (Playfair, two lines, large): **"Your real chart. Not your sun sign."**
- A subtitle (DM Sans, two lines, muted): *"A 2-minute reading from your actual birth moment."*
- HeroCta — the brand-anchor solid button: **Show Me My Chart**
- Tiny disclaimer below the CTA: *"2 minutes · completely free"*

No progress bar here. No back button. This is the front door.

---

## Screen 2 — Motivation

**Purpose**: First commitment moment. The user picks why they're here. Their answer feeds the paywall later (the goal-back card mirrors this exact phrase).

**Layout**: Standard scroll layout, hero kicker at top, four option cards below.

- Kicker: "ABOUT YOU"
- H1 (Playfair, two lines): **"What brought you here tonight?"**
- Subtitle: *"No wrong answers. Just honesty."*
- Four large option cards, vertically stacked. Each card has a soft cream background, a 1px hairline border, an emoji icon on the left, the label on the right. On select, the border tints gold, a subtle shadow appears, and the screen auto-advances after a short beat.

The four options:

1. 🪞 *I want to understand myself better*
2. 🌊 *I'm going through something big*
3. 💫 *I need clarity on a relationship*
4. ✨ *I'm curious — show me what you've got*

No explicit Continue. Tapping a card advances.

---

## Screen 3 — Pain Points (multi-select)

**Purpose**: Stronger commitment. Multi-select gives more signal per screen and feeds Screen 4's solution-bridge.

**Layout**: Same vertical structure as Screen 2, but cards stay selectable in parallel. A Continue button sits below the list, disabled until at least one is picked.

- Kicker: "GOING DEEPER"
- H1 (Playfair, three lines): **"What's hardest about your inner world right now?"**
- Subtitle: *"Pick as many as fit. Honesty serves you here."*
- Six option cards (multi-select). Selected state: gold border, light gold-tinted background, a subtle check.
- Continue button (gold gradient, transactional tier) — disabled until ≥1 selection.

The six options each have an icon, a short title, and a hidden "solution" string used on the next screen. Examples: *"I overthink everything"*, *"My relationships feel hard"*, *"I don't know my purpose"*, *"I feel misunderstood"*, *"My career feels stuck"*, *"I want to understand my patterns"*.

---

## Screen 4 — Solution Bridge

**Purpose**: Strongest commitment-consistency move in the flow. Mirror the user's pains back to them, paired with how Celestia specifically fixes each one. This is the moment the user thinks *"oh — they actually heard me."*

**Layout**: Editorial pain → solution rows. Top kicker reads "WE HEARD YOU."

- Kicker: "WE HEARD YOU"
- H1 (Playfair, two lines): **"Here's what we'll do for you."**
- Subtitle: *"Specific fixes for what you just told us. From your real chart, every day."*
- A list of cards, one per pain the user selected. Each card has two stacked rows:
  - **Top row** — a muted "✗" mark and the user's pain phrasing in muted grey ("I overthink everything").
  - **Bottom row** — a gold "✓" mark and the Celestia solution in heading color ("Daily readings on which thoughts to trust today").
- Below the list: gold-gradient transactional CTA — **Show Me My Chart ✦**.

Cards should feel like a magazine "before/after" pairing — restrained, calm, not gimmicky.

---

## Screen 5 — Birth Date + Name

**Purpose**: First data-collection screen. Friction is unavoidable, so we frame it as ceremony.

**Layout**: Standard scroll, two field groups stacked.

- Kicker: "YOUR CHART"
- H1 (Playfair, two lines): **"When did your story begin?"**
- Subtitle: *"Your birth moment is unique to you. No two charts are alike."*
- Field 1: "FIRST NAME" — text input with placeholder "What should we call you?"
- Field 2: "BIRTH DATE" — tap-to-open native date picker (iOS spinner style, light theme).
- Continue button (gold gradient) — disabled until both filled.

Fields use cream-tinted backgrounds, hairline borders, with a gold border highlight when filled.

---

## Screen 6 — Birth Time

**Purpose**: Birth time determines the Rising sign. Many users don't know it; we need a graceful fallback.

**Layout**: Standard scroll. Two large radio cards.

- Kicker: "PRECISION"
- H1 (Playfair, two lines): **"Do you know what time you were born?"**
- Subtitle: *"This determines your Rising sign — the mask you show the world."*
- Two option cards:
  1. 🕐 *"Yes, I know my birth time"* — opens a native time picker on tap. The card's subtitle updates to show the chosen time.
  2. 🤷‍♀️ *"I'm not sure"* — subtitle: *"We'll use a noon chart — still powerful"* — auto-advances on tap.
- Continue button appears once a time is chosen.

---

## Screen 7 — Birth Place

**Purpose**: Last birth-data field. Live city search via geocoding.

**Layout**: Standard scroll. One search field, dynamic suggestion list, a confirmed-city pill, and two CTAs (primary + skip).

- Kicker: "LOCATION"
- H1 (Playfair, two lines): **"Where did you first see the sky?"**
- Subtitle: *"Your birthplace completes your chart."*
- Field: "BIRTH CITY" — text input. As the user types, a suggestion list expands below the field with matched cities.
- Once a city is selected, the field shows the city name and a small confirmation pill appears below: *"📍 City Name, Region"* in gold.
- Primary CTA (gold gradient): **Cast My Chart ✦** — disabled until a real city is selected.
- Below it, a small underlined text link: *"Skip for now"* — uses an approximate location, advances anyway.

The suggestion list uses cream backgrounds with hairline dividers between items.

---

## Screen 8 — Calculating

**Purpose**: A 4-phase loading "theatre" that makes the calculation feel substantive, not instant. Sets up the dopamine for the reveal that follows.

**Layout**: Full-bleed cream gradient, centered. Deliberately restrained — *not* a swirling cosmic orb.

- Hairline rule at top
- Title (Playfair): **"Casting your chart"**
- Phase text below (DM Sans, italic muted): cycles through four phrases, one every ~700ms:
  1. *Locating your planets...*
  2. *Calculating house cusps...*
  3. *Mapping natal aspects...*
  4. *Reading your chart patterns...*
- Four small dots in a row beneath the phase text. Each lights up gold as that phase completes.

No progress bar at top. No back button. Auto-advances when complete.

---

## Screen 9 — Big 3 Reveal (tap to unlock)

**Purpose**: The magic moment, part 1. The user *does* something to learn their placements — three taps, three little ceremonies. Earned reveal beats passive display.

**Layout**: Single viewport, no scroll. Three reveal pills sit horizontally, each one a tap target.

- Kicker: "✦ YOUR COSMIC BLUEPRINT ✦"
- The user's first name (Playfair, ~30pt, centered)
- Subhint: *"Tap each card to read your placement."*
- A row of three vertical pill cards, equal width, ~170pt tall:
  - **Locked state**: a large gold planet glyph (☉ Sun, ☽ Moon, ↑ Rising) at low opacity, a tiny "TAP" label in muted letter-spaced caps.
  - **Revealed state**: a small kicker label in gold (e.g. "☉ SUN"), the user's sign in Playfair (e.g. "Aries"), and a 2–3 line italic Playfair tagline describing that placement's energy.
- A footer that swaps:
  - When 0–2 are revealed: muted text *"X of 3 revealed"*.
  - When all 3 are revealed: a HeroCta (brand-anchor solid) — **Show Me What This Means** — springs in.

Each tap fires a soft success haptic, and the card's revealed state springs in with a slight scale-up. The order doesn't matter; the user can tap them in any sequence.

**No chart wheel on this screen.** The wheel gets its own moment on the Chart tab inside the app — adding it here crowds the viewport.

---

## Screen 10 — Blueprint Synthesis

**Purpose**: The magic moment, part 2. Now the user knows their three placements; this screen gives them the *meaning* of those three together. Reciprocity primer for the paywall.

**Layout**: Single viewport. Editorial. Content stacked top-to-bottom with the CTA pinned to the bottom.

- Kicker: "✦ WHAT THIS MEANS ✦"
- Synthesis headline (Playfair, ~26pt, two lines, centered):
  *"A {Sun sign} Sun with a {Moon sign} Moon is rare."*
- A soft cream insight card with a 1–2 sentence personalized paragraph. The copy adapts based on the motivation/pain the user picked earlier — for "love" picks, it talks about Moon-driven connection patterns; for "change" picks, it talks about transformational chart energy; for "career" picks, it references the Midheaven; default is a "you process the world differently" line.
- A "core question" editorial card (centered, narrow width, top-and-bottom hairlines in faint gold):
  - Tiny gold kicker: "YOUR CORE QUESTION"
  - The Sun-sign-specific question in italic Playfair (e.g. for Aries: *"How do I lead without burning out?"*)
  - A muted footer: *"Most {Sun sign}s spend years on this one."*
- HeroCta (brand-anchor solid) at the bottom: **This Is Just The Beginning**

This screen is the most "magazine" feeling moment of the whole flow. Generous vertical spacing, one focused statement, no list view.

---

## Screen 11 — Preview (Tinder swipe stack)

**Purpose**: Show the user *exactly* what they'll receive in the app each day. Three faithful mock cards from the actual home screen, populated with the user's real Sun / Moon / Rising. The user physically *handles* what they're about to commit to. Auto-swipe demo teaches the gesture.

**Layout**: A single Tinder-style stack centered in a near-full-screen card frame (~90% screen width × 4:5 aspect). Behind the active card sits a subtle stacked sibling at slight offset and reduced opacity.

The three mock cards (designed to match the actual Today tab's card aesthetic):

1. **Today's Anchor** — magazine-style layout. Soft cream gradient background, a small motif badge in the top-left corner (gold sun glyph + kicker "TODAY'S ANCHOR"), a Playfair headline ("Today asks you to pause before reacting"), a 2-line italic body, a small attribution "From your {Sun sign} Sun · {Moon sign} Moon."

2. **Life-area spotlight** — same chrome as card 1 but with a different motif color and kicker (e.g. "LOVE TODAY"). Headline tied to the user's strongest pain selection. Italic supporting body. The intent is to look like a featured article.

3. **Sky tonight** — centered layout. A constellation-style icon top-center, a Playfair headline ("Mars enters {sign} tonight"), a 2-line body explaining what to feel for, attribution at bottom.

**Interactions**:
- ~800ms after entering, the first card does a small tease wobble (left-right) to telegraph "swipe me."
- ~3.2s after entering, if the user hasn't touched anything, the card auto-flies off-screen-left with a smooth tween. The next card surfaces. Repeats for cards 2 and 3 (~2.4s each).
- The moment the user touches the stack, auto-mode is permanently disabled — manual gesture takes over. Drag past ~22% of screen width in either direction triggers a swipe-off; release short of that springs back.
- After all 3 cards have swiped, the stack area shows a small final-state card or text: *"This is yours, every morning."* with a HeroCta below.

The point of this screen is not to teach swiping (the home tab uses scroll, not swipe). The point is to **let the user touch the product before paying for it.**

---

## Screen 12 — Wake Anchor

**Purpose**: Highest-ROI question we ask. *When* the morning push fires. We frame it as an anchor to an existing routine — *when does your day start?* — rather than a setting (*pick a notification time*). Per Fogg's behavior model, anchoring to an existing habit is the most reliable prompt strategy.

**Layout**: Standard scroll. Kicker + heading + subtitle + a 6-chip selector + reassurance + CTA.

- Kicker: "YOUR MORNING"
- H1 (Playfair, two lines): **"When does your day usually start?"**
- Subtitle: *"Tomorrow's first reading lands 5 minutes before. First thing you see — not another alarm."*
- A 3×2 chip grid (six chips):
  - 6 AM, 7 AM, 8 AM, 9 AM, 10+ AM, Varies
  - Default is unselected. Selecting a chip lights its border gold and tints its background light-gold. Soft haptic on tap.
- A reassurance line below in muted italic: *"We'll never wake you up. Promise."*
- HeroCta — **Set My Morning** — disabled until a chip is selected.

If the user picks "Varies", we silently fall back to a default time (7:30am). If they pick a numeric hour, the morning briefing is scheduled for 5 minutes before that.

---

## Screen 13 — Notification Bundle

**Purpose**: The user calibrates how present we are in their day. Three bundles map to seven underlying notification channels. A separate binary toggle for transit alerts (the highest-engagement push type) sits below.

**Layout**: Standard scroll. Kicker + heading + three OptionCards + a toggle row + Continue.

- Kicker: "YOUR RHYTHM"
- H1 (Playfair, two lines): **"How often do you want the stars to reach out?"**
- Subtitle: *"You can change this anytime in Settings."*
- Three vertically-stacked OptionCards (mutually exclusive):
  1. **Just the morning** — *"One reading to start your day."* · "1 push · 7am"
  2. **Morning + evening** *(default-selected)* — *"A briefing and a reflection."* · "2 pushes · 7am, 9pm"
  3. **Everything cosmic** — *"Big moves, transits, milestones, all of it."* · "3–5 pushes · throughout the day"
- A separator, then a "supplementary" toggle row with subtle warm-grey background:
  - On the left: a gold ⚡ icon in a small circular wrap.
  - In the middle: bold heading *"Alert me when planets hit my chart"* and muted subtitle *"Real transits, real time. Only when something actually shifts."*
  - On the right: an iOS-style switch. Default ON. Soft haptic on flip.
- Continue button (gold gradient).

The toggle is independent of the bundle choice — a user on Minimal can still opt in to transit alerts. The default-ON state matters: transit pushes are our highest-engagement channel.

---

## Screen 14 — Paywall

**Purpose**: Convert. Personalized goal-back, personalized benefit list (each line references the user's actual Sun and Moon by name), one testimonial, plan select, free trial CTA.

**Layout**: This is the only screen that scrolls intentionally. Generous top padding to push the kicker glyph below the safe area.

- Top: a gold "✦" glyph
- H1 (Playfair, two lines): **"Your chart is cast, {firstName}. Now what?"**
- "YOUR INTENT" goal-back card (gold kicker, soft cream background, hairline border):
  - Body (DM Sans): *"You came here to {motivation goal}. Pro is what gets you there."*
  - The motivation goal text comes from Screen 2 (e.g. "understand yourself" → *"You came here to understand yourself."*).
- A list of five personalized benefit rows. Each row has a small circular icon-chip on the left (cream background, hairline border, emoji icon) and a 2-line text block on the right (heading + muted description):
  1. ☉ *Daily readings from your {Sun sign} Sun & {Moon sign} Moon* — "Not generic horoscopes. Your actual placements, every morning."
  2. ♡ *Real compatibility — chart-to-chart* — "See exactly why someone clicks (or doesn't)."
  3. ⚡ *Transit alerts when planets hit your placements* — "Know it before you feel it."
  4. 💬 *Unlimited AI conversations about your chart* — "Ask anything. Get answers grounded in your actual placements."
  5. 📊 *Deep reports — love, career, lunar, purpose* — "PDF-ready, written for the chart we just cast."
- One testimonial card (cream background, hairline border):
  - Body (italic Playfair): *"I screenshot my chart reading and sent it to everyone. It was THAT accurate."*
  - Attribution (small, gold semibold caps): *"— Mia, 24"*
- Two plan cards, both tap-to-select:
  - **Annual** (default-selected, "BEST VALUE" badge in the top-right corner): radio + "Annual" + "$49.99/year" on the left; "Save 40%", "$4.17/mo", "$83.88 value" on the right; a free-trial chip below: *"✦ FREE for 7 days — cancel anytime"*.
  - **Monthly**: radio + "Monthly" + "$6.99/month"; chip: *"✦ FREE for 3 days — cancel anytime"*.
  - Selected state: card border tints gold, slightly thicker stroke.
- Primary CTA (gold gradient): **Start My Free Trial** with a small subtitle below it: *"FREE for 7 days · You won't be charged"* (or 3 days for monthly).
- A small text link below: *"Continue with limited access"* (this is the "skip the paywall" affordance — quiet, not buttoned).
- Legal fine print at the bottom: trial terms.

This is the densest screen. Use generous vertical spacing between sections so it still feels editorial, not stuffed.

---

# Post-onboarding (Arc 6)

These are *not* part of the onboarding flow proper, but they are the same continuous experience for the user. The designer should treat them as part of the brief.

## Screen A — Welcome / Chart Reveal

After the paywall completes (whether the user trialed or skipped), they land on a Welcome screen. This is the first time they see the full chart wheel.

- Kicker: their first name in a small caps treatment.
- A live chart wheel (SVG), large, centered, with all twelve houses, planet glyphs, and aspect lines visible.
- Below the wheel, a 1–2 sentence editorial reveal statement personalized to their strongest placements (e.g. *"Your Moon in Cancer asks you to be the safe place you needed."*) — this gets re-used in the notification permission modal below.
- Below the reveal, two share affordances (small icon buttons) and a primary CTA: **Step Into The Stars**.

This screen is the most "magazine cover" moment of the whole experience. Treat it with care.

## Screen B — Notification Permission Modal

Triggered after the user taps the Welcome CTA. This is the *system* notification permission ask, but we wrap it in a custom modal that primes the user before iOS shows its prompt.

- Modal sheet, ~80% screen height, rounded top corners, cream background.
- Top: a small gold star ornament.
- Hero statement (Playfair): **"Tomorrow at {wakeTime - 5min}"** (e.g. "Tomorrow at 6:55am").
- Below it: a faithful preview of the actual D1 push notification — small notification-bubble shape with the app icon, app name, and a 1-line preview using the user's real reveal statement from Screen A.
- Body (DM Sans, two lines): *"Your real chart, not your sun sign. Allow notifications and we'll start with this — first thing tomorrow."*
- Primary CTA (brand-anchor solid): **Allow Notifications** — taps trigger the iOS native prompt.
- Below it: text link *"Maybe later"* — closes the modal, no permission asked.

If the user denies the iOS prompt, we don't re-ask. If they allow, we schedule the first morning push for 5 minutes before their wake time.

---

# Notes on consistency

- **Kicker treatment** is identical on every screen that has one — small, semibold, gold, letter-spaced ~2px, all caps.
- **Headings** use Playfair, two lines whenever the copy allows. Line breaks are hand-tuned for visual rhythm; designer should preserve them.
- **Subtitles** use DM Sans, ~14pt, muted color, often two lines. Slightly italic on screens where the tone is more reflective (Screens 5, 6, 9).
- **Buttons** come in two tiers:
  - HeroCta (brand-anchor solid, deep burgundy) — used on ceremonial moments: Screens 1, 9, 10, 12, and the post-onboarding Welcome CTA.
  - GoldButton (gold gradient) — used on transactional Continue moments: Screens 3, 4, 5, 6, 7, 13, 14.
- **Cards** all share: cream background, ~16pt corner radius, 1px hairline border, very subtle shadow. Selected/active state: gold border, slight shadow lift.
- **Animations**: 150ms slide-out + spring slide-in on advance(). Spring scale-up on reveal. 240ms tween on swipe-off (preview screen). Soft haptic on every meaningful tap.

**Final note**: the goal of the visual design is to make the user feel like they are reading a *very thoughtful editorial column written specifically for them*, not playing with a tech product. When in doubt: less ornament, more whitespace, hairline strokes over filled boxes, italic Playfair instead of bold Playfair, gold as a single accent rather than a fill.

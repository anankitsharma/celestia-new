# 📸 Screenshot Captions — OCR-Indexed Marketing Overlays

**Status:** Live — these are the captions actually rendered by `plan/screenshots/generator/src/app/page.tsx` and exported into the App Store screenshot PNGs.
**Why this file is critical:** As of June 2025, Apple's algorithm extracts caption text from screenshots via OCR and indexes it as a Tier 1 ranking signal — equal weight to App Name and Subtitle. Captions that reinforce the title/subtitle keywords add measurable ranking lift. Captions that contradict the listing, or that miss the keyword opportunity, leak ranking signal.

If the generator changes, this file must be re-synced — it is the auditable record of what is OCR-readable in the uploaded PNGs.

---

## Anchor keywords being reinforced

The 7 captions together must reinforce these high-ranking-signal terms from the listing:

| Source | Keyword | Why it must appear in captions |
|---|---|---|
| App Name | `Relationship` | Tier 1 anchor — every relevant query starts here |
| App Name | `Pattern` | Differentiator — no other relational app owns this |
| Subtitle | `Attachment` | Therapy-coded, low-saturation-category opportunity |
| Subtitle | `Compatibility` | High-volume transactional intent |

Plus high-volume terms from the keyword field that gain ranking lift via OCR-extracted captions:

`Communication`, `Psychology`, `Family`, `Couples`, `Therapy`, `Self-discovery`, `Privacy`

---

## OCR design rules (from June 2025 Apple algorithm research)

- **Top of frame** — OCR scans top and bottom most aggressively. Captions belong in the top ~30% of each screenshot.
- **High contrast** — light text on dark backgrounds OR dark text on light backgrounds. Avoid low-contrast (light-on-light, busy gradients behind text).
- **Standard fonts** — Playfair Display SemiBold or DM Sans Bold. No decorative scripts. OCR fails on stylized type.
- **3–7 words per hero line** — short enough to be readable in the ~7-second decision window, long enough to carry a keyword phrase.
- **Sentence case or title case** — both work for OCR. Avoid ALL CAPS for the main caption (less natural search match).
- **Action verbs lead** — "Map every relationship" beats "Every relationship is here" (verb at start).

---

## The 7 frames, in upload order

The order matters: Apple's auto-play carousel shows the first 3 most prominently, so the first 3 carry the rejection-defense load. Frames 4–7 expand the keyword footprint.

---

### Frame 1 — Brand hook / onboarding hero (`01_hero`)

**Hero (Playfair Display SemiBold, ~9.5% canvas width):**

```
Understand the patterns
in your relationships.
```

**Sub (DM Sans Regular):**

```
Why you love who you love.
Why you keep doing what you do.
```

**Pre-tag:** *(none — opener frame, no kicker)*
**Keywords reinforced:** `Pattern` · `Relationship` (both anchors from App Name) · `Love` (from keyword field)
**OCR target word count:** 6 (hero) + 12 (sub) = 18 — within OCR sweet spot
**Why this caption first:** First-impression hook. The reviewer reads "Understand the patterns in your relationships" in 2 seconds and knows the app's category before scrolling. No astrology language anywhere in the OCR-readable area. The two-question sub is the hook for users.

---

### Frame 2 — Multi-relationship breadth (`02_connections`)

**Pre-tag (DM Sans SemiBold, 0.18em letterspace, uppercase):**

```
Every Connection
```

**Hero:**

```
Map every relationship
that matters.
```

**Sub:**

```
Partner, friend, family, colleague —
see how each one works.
```

**Keywords reinforced:** `Relationship` (re-anchored) · `Partner`, `Friend`, `Family` (all keyword-field terms) · `Connection` (semantic neighbor of "relationship")
**OCR target word count:** 2 (pre) + 5 (hero) + 9 (sub) = 16 words
**Why this caption second:** Multi-relationship breadth is the #1 4.3(b) defense — it shows the app is NOT a personal-horoscope app. By listing 4 distinct relationship types, the reviewer immediately understands "this is a tool for the people in my life," not a daily-card app.

---

### Frame 3 — Ask AI advisor (`03_ask-ai`)

**Pre-tag:**

```
Ask Anything
```

**Hero:**

```
A calm advisor for
the questions you have.
```

**Sub:**

```
Psychology-led. Personal. Always available.
```

**Keywords reinforced:** `Psychology` (keyword-field anchor) · "Calm advisor" semantic match for `Calm`-app-pool overlap · `Personal` for personalization signal
**OCR target word count:** 2 + 8 + 5 = 15 words
**Why this caption third:** Ask is the most distinctive feature vs the saturated category — Co-Star and The Pattern don't have a free, on-demand AI advisor on relationships. "Calm advisor" telegraphs Mindfulness-pool positioning. "Psychology-led" is the explicit anti-mysticism signal.

---

### Frame 4 — Compatibility depth (`04_compat`)

**Pre-tag:**

```
Real Depth
```

**Hero:**

```
Not generic
compatibility.
```

**Sub:**

```
Strengths, friction, and what to do — without the jargon.
```

**Keywords reinforced:** `Compatibility` (subtitle anchor) · "Not generic" telegraphs anti-saturated-category positioning · "Without the jargon" reinforces plain-English Mindfulness positioning
**OCR target word count:** 2 + 3 + 10 = 15 words
**Why this caption fourth:** "Compatibility" is the highest-intent keyword in the relational-mindfulness space. "Not generic" plus "without the jargon" is the explicit anti-zodiac-quiz framing — exactly the differentiation the 4.3(b) reviewer needs to see. Pairs with the screenshot's content (specific strengths + frictions, not generic adjectives).

---

### Frame 5 — Today / daily reflection (`05_today`)

**Pre-tag:**

```
Daily Reflection
```

**Hero:**

```
One question.
A thoughtful read back.
```

**Sub:**

```
Designed to glance at —
not obsess over.
```

**Keywords reinforced:** `Daily Reflection` (Mindfulness-category anchor — verbatim language used by Calm, Headspace, Stoic) · "Glance at, not obsess over" telegraphs anti-engagement-loop positioning
**OCR target word count:** 2 + 6 + 7 = 15 words
**Why this caption fifth:** This is the screenshot where the Mindfulness category positioning lands hardest. "Daily Reflection" is verbatim language the reviewer's expected pool uses. "Not obsess over" telegraphs *no daily horoscope addiction loop* — exactly the differentiation against Co-Star.

---

### Frame 6 — Personality blueprint (`06_blueprint`)

**Pre-tag:**

```
Your Blueprint
```

**Hero:**

```
Your attachment style,
decoded.
```

**Sub:**

```
How you connect, where you get stuck, what you need.
```

**Keywords reinforced:** `Attachment` (subtitle anchor) · `Style` · `Decoded` (analytical action verb, not mystical) · "Connect" semantic match for psychology positioning
**OCR target word count:** 2 + 5 + 11 = 18 words
**Why this caption sixth:** Re-anchors the subtitle's flagship keyword inside a screenshot — Apple's Full Text Search rewards this kind of repetition across surfaces. "Decoded" reads as analytical, not mystical. Pairs with the screenshot's content (3-tile self-awareness breakdown). Slight rotation + gold halo on this frame cue "moment of reveal" — the only frame with that visual treatment.

---

### Frame 7 — Privacy commitment (`07_privacy`)

**Hero:**

```
Privacy by default.
```

**Sub:**

```
Your data lives on your device.
No tracking. No selling. Ever.
```

**Bullet card (4 items, OCR-readable as compact text block):**

```
No sign-in required
No data sold
AI requests sent without your name
Reset all data anytime
```

**Footer:** Celestia wordmark + app icon (small)

**Keywords reinforced:** `Privacy` (trust signal — measurable conversion lift) · `Data`, `Tracking` — negative differentiation (anti-saturated-category positioning) · "AI requests" — discloses AI use plainly (Apple 2024 generative-AI policy alignment)
**OCR target word count:** 3 (hero) + 13 (sub) + 17 (bullets) = 33 words (intentionally heavier — privacy frame is end-of-carousel and rewards detail)
**Why this caption seventh:** Closing position is for the trust-builder. "Privacy by default" is short, declarative, and the OCR-extracted phrase ranks for *privacy* and *privacy app* queries that overlap with mindfulness searches. The four-bullet card is the kind of explicit privacy disclosure that lets a reviewer mentally check "this is NOT a data-extractive astrology spam app." This is also the only frame with no phone mockup — the trust commitment is the entire visual.

---

## Combined keyword footprint after OCR extraction

When Apple's OCR extracts and indexes the 7 captions + subtexts, the listing gains ranking signal for these phrases on top of title + subtitle + keyword field:

| Phrase | Source | Ranks for queries like |
|---|---|---|
| `understand the patterns relationships` | F1 hero | "relationship patterns app", "understand my relationship" |
| `every relationship that matters` | F2 hero | "relationships app", "every relationship" |
| `partner friend family colleague` | F2 sub | "family relationships app", "friend compatibility" |
| `calm advisor questions` | F3 hero | "calm relationship advisor" — overlaps with the Calm app brand pool |
| `psychology-led personal always` | F3 sub | "AI psychology", "psychology app" |
| `not generic compatibility` | F4 hero | "real compatibility test", "not generic compatibility" |
| `strengths friction without jargon` | F4 sub | "plain English relationship advice" — long-tail mindfulness terms |
| `daily reflection one question` | F5 hero | "daily reflection app", "daily journal" — Mindfulness anchor |
| `attachment style decoded` | F6 hero | "attachment style test", "attachment style quiz" — therapy-search overlap |
| `how you connect where you get stuck` | F6 sub | "relationship help", "communication issues" |
| `privacy by default` | F7 hero | "private journal app", "no-tracking app" |
| `data lives on your device` | F7 sub | "local-only app", "private data app" |

This is **net new ranking surface** — captured without spending any character budget in the title, subtitle, or keyword field.

---

## Anchor coverage verification

| Anchor | F1 | F2 | F3 | F4 | F5 | F6 | F7 | Total |
|---|---|---|---|---|---|---|---|---|
| `Relationship` | ✓ | ✓ |   |   |   |   |   | 2 |
| `Pattern` | ✓ |   |   |   |   |   |   | 1 |
| `Attachment` |   |   |   |   |   | ✓ |   | 1 |
| `Compatibility` |   |   |   | ✓ |   |   |   | 1 |
| `Psychology` |   |   | ✓ |   |   |   |   | 1 |
| `Privacy` |   |   |   |   |   |   | ✓ | 1 |

All four App Name + Subtitle anchors covered ✓

---

## What every caption deliberately avoids

Each caption was written to avoid every one of these triggers:

- ❌ The word `horoscope` anywhere in the OCR-readable area
- ❌ The word `astrology` / `astrological` / `astrologer` anywhere
- ❌ The word `zodiac` anywhere
- ❌ Zodiac glyphs (♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓)
- ❌ Planet glyphs (☉ ☽ ☿ ♀ ♂ ♃ ♄)
- ❌ Mystical emojis in marketing text (🔮 ✨ 🌙 — they auto-pattern-match to the saturated category)
- ❌ "Predict your future", "destiny", "fortune", "the universe says"
- ❌ Comparative claims ("better than", "vs", "unlike other apps") — Apple Guideline 2.3.1 risk
- ❌ "FREE" / "$0" overlay badges — restricted in App Store screenshots
- ❌ "#1", "Best", "Award-winning" badges — restricted
- ❌ Influencer faces or fake-user photos — manipulated-marketing flag risk

---

## Banned-word audit (across all 7 frames)

| Term | Required | Verified |
|---|---|---|
| horoscope | 0 | 0 ✅ |
| astrology / astrological / astrologer | 0 | 0 ✅ |
| zodiac | 0 | 0 ✅ |
| tarot | 0 | 0 ✅ |
| fortune | 0 | 0 ✅ |
| destiny | 0 | 0 ✅ |
| predict / prediction | 0 | 0 ✅ |
| Mercury retrograde | 0 | 0 ✅ |
| cosmic | 0 | 0 ✅ |
| divine / sacred / oracle | 0 | 0 ✅ |
| crystal / numerology | 0 | 0 ✅ |
| birth chart / birth-chart | 0 | 0 ✅ |
| zodiac/planet glyphs | 0 | 0 ✅ |

---

## Visual rules for the marketing overlay (composition / typography)

Implemented in `plan/screenshots/generator/src/app/page.tsx` Caption component.

| Element | Spec | Token |
|---|---|---|
| Hero font | Playfair Display SemiBold | `var(--font-playfair)` weight 600 |
| Hero size | ~9.5% of canvas width | `canvasW * 0.095` |
| Sub font | DM Sans Regular | `var(--font-dm-sans)` weight 400 |
| Sub size | ~2.9% of canvas width | `canvasW * 0.029` |
| Pre-tag font | DM Sans SemiBold, 0.18em letterspace, uppercase | `canvasW * 0.022` |
| Hero color (light bg) | `#2A2418` (T.fg / ink) | All 7 frames are light-bg |
| Pre-tag color | `#5C2434` (T.accent / clay) | — |
| Sub color | `#6E5E64` (T.fgDim) | — |
| Background | Per-frame cream/rose/champagne/mauve/slate gradient | `SLIDE_TINTS` per frame |
| Hero text alignment | Left-aligned (Western reading flow) | F1–F6 |
| Hero text occupies | Top ~30% of the 1320×2868 frame | `paddingTop: canvasW * 0.12` |
| App content occupies | Middle 50% (phone mockup) | varies per frame |
| Footer | Bottom 15% — empty (or wordmark on F7) | — |

---

## Pre-upload caption QA

Before exporting the 7 PNGs, verify (re-run the generator at http://localhost:3001):

- [ ] Every caption renders in clean, OCR-friendly type — no script fonts, no over-stylized characters
- [ ] Caption + subtext together = ≤ 18 words per frame (OCR sweet spot — F7 is the deliberate outlier with the bullet card)
- [ ] All 4 anchor keywords (`Relationship`, `Pattern`, `Attachment`, `Compatibility`) appear at least once across the 7 captions ✅
- [ ] Zero banned words appear in any caption, sub, pre-tag, or bullet ✅
- [ ] Zero zodiac/planet glyphs appear anywhere in the marketing text ✅
- [ ] Each PNG is 1320×2868 (6.9" iPhone 16 Pro Max), sRGB, ≤8MB
- [ ] Order in App Store Connect upload matches the order above (1 → 7)

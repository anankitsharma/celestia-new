# Iconography Audit

Audit of how Celestia uses icons, glyphs, planet symbols, and illustration. Built using `icon-system` and `illustration-style` skill methodologies.

## What's there today

| Iconography | Used for | Approach |
|---|---|---|
| **Planet symbols** (☉ ☽ ↑ ♀ ♂ ♃ ♄ ♅ ♆ ♇ ☿) | Chart wheel, Big 3 chips, planet labels | Unicode characters in brand fonts ✅ |
| **Zodiac glyphs** (♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓) | Sign labels | Unicode in brand fonts ✅ |
| **Typographic glyphs** (★ ✶ ⌁ ◇ ❅ ✦ ✧ ◊ ◌) | Streak emoji escalation, Pro insight kicker, hidden badges | Unicode in brand fonts ✅ Recently fixed in CA-A1 |
| **Platform emoji** (🔥 ⭐ ✨ 💎 ⚡ ❄️ 🌙 ☀️ 💕 💼 🔋 🟢) | Some retention chrome, mood selector, content tags | Platform emoji rendering ⚠️ Mixed legacy |
| **Badge emojis** | 20 visible + 5 hidden badges | Platform emoji ✅ Acceptable here (they ARE the iconography) |
| **Hand-drawn glyph icons** | None used | — |
| **SVG/vector icons** | ChartWheel only | One reusable SVG component |
| **Animated glyphs** | None | — |

## What works

### 1. Planet symbols are typographic
Using Unicode characters (☉ ☽ ↑) means they:
- Render in Playfair Display / DM Sans (matches brand)
- Inherit text color (gold, navy, cream — depending on mode)
- Scale with type
- No bundle size cost
- No emoji-style platform variation

This is **the correct approach for an astrology app** with editorial typography. Sanctuary uses illustrated planet icons; Celestia's typographic approach is more sophisticated.

### 2. Real chart wheel as the iconic visual
`ChartWheel.js` renders an actual astronomical visualization with planets at their real degrees. This is:
- Functional (you read it as a chart, not just decoration)
- Brand-distinct (no competitor renders charts this cleanly)
- Authority signal (this app does math correctly)

✅ Hold this approach. Don't replace with stylized illustration.

### 3. CA-A1 fixed the worst emoji-clash on retention chrome
- Streak emoji: 🔥⭐✨💎 → ★ ✶ ⌁ ◇
- Freeze icon: ❄️ → ❅
- Anticipation push glyphs: 🔥⚡✨ → ★ ⌁ ✶

These now render in brand fonts. Major brand-consistency win.

## What still needs work

### 1. Content emoji in mood/tag systems
`HomeScreen.js` has zodiac archetype pickers + life area selectors that use platform emoji:

```js
Aries: { emoji: '🔥' }
Aquarius: { emoji: '⚡' }
Pisces: { emoji: '🌙' }
// ...
CT_EMOJI = { love: '💕', career: '💼', energy: '🔋', headsup: '⚡', greenlight: '🟢' }
```

These are **content-level** emoji, not chrome. Replacing them is more nuanced — they ARE acting as iconography for content categories. But they clash with the editorial typography just as much as the streak emoji did.

**Options:**
- A. Replace with custom monochrome SVG icons (effort: M-L)
- B. Replace with typographic glyphs (✦, ❤, ◆, ⚡ → ⌁, etc.) — limited symbol availability
- C. Remove icons entirely; let labels carry meaning (effort: S, but reduces visual differentiation)

**Recommendation:** option A. Build a small custom icon library (10-15 icons) for: love, career, energy, growth, social, vitality, dreams, gratitude, health, headsup, greenlight, reflection, lunar, mercury_rx. Render at 16-20pt with `currentColor` so they take the parent text color. ~1.5 days of work.

### 2. Mood selector emojis
`JournalScreen.js` mood picker:

```js
{ key: 'great', emoji: '😊', label: 'Great' },
{ key: 'good', emoji: '🙂', label: 'Good' },
{ key: 'okay', emoji: '😐', label: 'Okay' },
{ key: 'low', emoji: '😔', label: 'Low' },
{ key: 'anxious', emoji: '😰', label: 'Anxious' },
```

Face emoji are universally understood and tap into emotional shorthand. **For a journal interface, this might actually be the right call** — even Notion uses emoji for mood. Anti-luxury but pro-utility.

**Decision: keep face emoji for mood selection.** They map to feelings. Editorial purity here would feel cold.

### 3. Tag pills in JournalScreen
```js
{ key: 'love', icon: '♡', ...},
{ key: 'career', icon: '◆', ...},
{ key: 'growth', icon: '◎', ...},
{ key: 'health', icon: '✦', ...},
{ key: 'dreams', icon: '☽', ...},
{ key: 'gratitude', icon: '✧', ...},
```

✅ These already use typographic glyphs. Reference for the rest of the app.

### 4. NPS prompt emoji
`HomeScreen.js`: `{ emoji: '✨', label: 'Spot on', value: 5 }` and others.

This is part of a sentiment-rating UI. Like the mood selector — face emoji here would actually be more honest. Currently mixes ✨ with letter values — slightly off.

**Recommendation:** swap the NPS prompt to face emoji 😍/🙂/😐/😞 to match the mood pattern. Or, alternatively, use stars (★★★★★ → ★★★☆☆ → etc.) for clarity. Don't mix abstract glyphs with sentiment scoring — it's confusing.

## Audience-fit assessment

The Inner-Work Practitioner persona has a sophisticated visual literacy. They notice:

- ✅ Real chart wheel = "this app respects astrology"
- ✅ Typographic glyphs in chrome = "this app is well-designed"
- ⚠️ Random platform emoji in life-area cards = "wait, why is this here?"
- ✅ Face emoji on mood selector = "ok, makes sense, that's how I feel"
- ❌ Sparkle emoji in survey + bolt emoji in tag + flame in streak = visual chaos

The audience can hold *one* iconographic register at a time. Mixing typographic glyphs + face emoji + content emoji is too many languages.

## Recommended icon-system approach

Per the `icon-system` skill methodology, a coherent icon system has:

### Three tiers

```
TIER 1 — Astronomical glyphs
  Planet symbols (☉ ☽ ↑ ♀ ♂ ...) and zodiac (♈ ♉ ♊ ...)
  → Unicode in Playfair / DM Sans
  → Used wherever astrology-specific reference needed

TIER 2 — Custom monochrome SVG icons
  Categories (love, career, growth, health, social, dreams)
  Actions (share, save, more, settings)
  System (success, warning, error, info)
  → 16-24pt, currentColor, 1-2px stroke
  → Used for non-astronomical iconography in chrome

TIER 3 — Typographic glyphs (typographic asterisms)
  ★ ✶ ⌁ ◇ ❅ ✦ ✧ ◊ ◌
  → Decorative, milestone, kicker accents
  → Always renders in brand font
```

### What NOT to do
- Don't add platform emoji in chrome (chrome = retention surfaces, headers, kickers)
- Don't add tarot-card-style illustration
- Don't add color icons (they fight the gold accent)
- Don't add filled shape icons (they'd compete with the chart wheel as the iconic visual)

### Open question — face emoji for mood/sentiment
This is the one place I'd allow platform emoji. They communicate emotional state better than any abstract glyph. Document the exception.

## What about illustration?

Currently: zero illustration. Just chart wheel + typography.

**Should there be?** For this audience and brand: **probably not.** Illustration risks:
- Looking "cosmic startup-y" if not done well
- Aging quickly (hand-drawn / line styles cycle)
- Pulling visual weight from the typography (which is the brand)

**If illustration is added:** keep it minimal, monochrome (gold or ink), and treat it like watermarks behind text — not as primary visual. Reference: New Yorker spot illustrations.

## Iconography audit score: 7/10

After CA-A1 fix: 7/10. With recommended SVG icon library + content emoji audit: 9/10. The system is two-thirds of the way to coherent.

See `07-recommendations.md` for sequencing.

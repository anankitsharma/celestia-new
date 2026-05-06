# Visual Design — Head-to-Head

How Celestia's design choices compare against the four competitors. The verdict: **Celestia's visual lane is unclaimed** and works in its favor — but a few specific choices need tightening.

## Color palette comparison

| App | Primary surface | Accent | Background | Mode |
|---|---|---|---|---|
| **Co-Star** | Pure white type | None / occasional gray | Pure black | Dark only |
| **The Pattern** | Soft lavender | Teal | Dark with gradient washes | Dark primary |
| **Sanctuary** | Deep purple | Rose gold | Midnight blue + cosmic gradients | Dark primary |
| **Nebula** | Cosmic blue/violet | Magenta highlights | Starfield gradients | Dark primary |
| **Celestia** | Cream `#FAF8F2` (light) / Navy `#0E0E22` (dark) | Gold `#C8A84B` | Cream / Navy | **Both light + dark** |

### What this means

**Celestia is the only competitor with a true light mode.** Every other app commits to dark-only or dark-primary. This is a real differentiator — many users prefer light mode for daytime reading + accessibility.

**Celestia is the only competitor whose accent isn't tech-app default purple/blue/magenta.** Gold reads as luxury, editorial, intentional — not "cosmic startup."

**Celestia's hero gradients are warm muted plum-charcoal** (`#0E0E22 → #1A1535 → #0F1628`), explicitly NOT the electric blue/purple of Sanctuary/Nebula. This was a deliberate choice (per CLAUDE.md). It works.

### Recommendation
**Hold the line on the palette.** Don't drift toward purple-cosmic conventions to match the category. The differentiation IS the point.

## Typography comparison

| App | Headings | Body | Distinctive |
|---|---|---|---|
| **Co-Star** | Brutalist sans, tight tracking | Same family, smaller | The typography IS the brand |
| **The Pattern** | Modern humanist sans | Same family | Long-form paragraphs feel therapy-app |
| **Sanctuary** | Decorative serif | Modern sans | Dual family, traditional |
| **Nebula** | Geometric sans | Same family | Large numerical readouts |
| **Celestia** | **Playfair Display** (serif) | **DM Sans** (sans) | Editorial luxury — closer to Aesop / Cereal magazine |

### What this means

**Celestia's serif-display + sans-body pairing is unique in the category.** Co-Star is the only other app with strong typographic identity, and it's a different lane entirely (brutalist vs editorial).

The serif heading reads as "this took craft to write." Most astrology apps use sans throughout, which reads as "this was generated."

### Recommendation
**Hold typography too.** This is a moat. But: ensure body text contrast meets WCAG AA in both light and dark modes — a known issue in light mode where `T.stone` (#97907F) on `T.cream` (#FAF8F2) is borderline.

## Iconography & illustration comparison

| App | Approach | Examples |
|---|---|---|
| **Co-Star** | Minimal — line glyphs, dots | Almost no iconography |
| **The Pattern** | Hides astrology iconography | Almost no zodiac glyphs |
| **Sanctuary** | Rich illustrated mystical | Tarot card art, planetary symbols |
| **Nebula** | Cosmic illustration + animation | Animated zodiac wheels, energy rings |
| **Celestia** | Subtle glyph use (☉ ☽ ↑ ♀ ♂) | Real chart wheel SVG; no mystical illustration |

### What this means

Celestia sits between Co-Star (minimal) and Sanctuary (rich-mystical). The chart wheel is a real astronomical visualization — that's distinctive.

But: Celestia uses emoji extensively in retention copy and badges (🔥 ⭐ ✨ 💎 🌑 🌕 🔮 ❄️ ✦ ◊ etc.). Co-Star uses zero emoji. The Pattern uses zero. This is **inconsistent with the editorial-luxury positioning** of the typography + palette.

### Recommendation
**Audit emoji usage.** Replace narrative-context emoji (in copy, in pushes) with custom glyphs or remove. Keep gamification emoji (badges) since they ARE iconic and shareable.

Specific files to audit: `notificationContentEngine.js` (push copy uses ⚡✨🔥), `streakService.js` (emoji escalation), `WelcomeToProScreen.js` (✦).

The ✦ glyph is probably fine — it's actually a typographic asterism, not an emoji. The 🔥⚡✨ ones break the brand.

## Layout & information density

| App | Density | Layout |
|---|---|---|
| **Co-Star** | Very low — one big idea per screen | Stacked cards, lots of negative space |
| **The Pattern** | Medium — paragraph-heavy | Card-based dashboard with audio |
| **Sanctuary** | Medium-high — feature-rich | Tabbed navigation, chat-bubble UI |
| **Nebula** | High — multiple metrics visible | Marketplace + horoscope hybrid |
| **Celestia** | **High — many sections on Today tab** | Hero + briefing + life areas + journal + quests + sky + recap |

### What this means

Celestia's Today tab has the most going on of any competitor. This is partly the strength of the engagement system, but it's also a risk:
- New users might feel overwhelmed
- Visual hierarchy is hard to maintain when there are 8+ card types on one screen
- Scroll fatigue is real

### Recommendation
- **Time-mode-aware content trimming** is already done (different sections show by morning/evening/etc) — good.
- **Consider an explicit "less is more" mode for D1-D3** users to reduce overwhelm during the activation window.
- **Audit visual hierarchy** — currently every card has its own border/background; result is "card soup." Consider giving the navigator briefing card more visual weight (it IS the daily hero) and downplaying the tertiary surfaces.

## Brand voice in UI copy

| App | Voice | Example |
|---|---|---|
| **Co-Star** | Cryptic, mean, literary | "Your heart busts its knuckles against society" |
| **The Pattern** | Earnest, fatalistic, therapeutic | "You may find yourself feeling..." |
| **Sanctuary** | Wellness-pro | "Connect with a verified astrologer" |
| **Nebula** | Generic horoscope | "Today brings opportunities for..." |
| **Celestia** | Navigator (do/avoid + alternatives) | "Navigate toward: stay consistent — stable planetary energy" |

### What this means

**Celestia's "navigator" tone is genuinely differentiated.** It's neither mean (Co-Star) nor fatalistic (The Pattern) nor mystical-generic (Sanctuary/Nebula). The "navigator + captain" frame in fetchExtendedForecast is well-established.

But: most users will never read the verbose navigator copy. The voice that matters most is **push notification copy** — that's where Co-Star wins. Celestia's push copy is currently informational ("Your trial ends in 2 days") rather than memorable.

### Recommendation
- **Hold the navigator voice in long-form content** (briefings, reports, chat).
- **Develop a distinctive push voice** — separately. Push notifications should be quotable, not informational. See `04-gaps-and-opportunities.md` Gap 2.

## Dark/light mode

| App | Light mode? | Dark mode quality |
|---|---|---|
| Co-Star | ❌ Dark only | Default brutalist |
| The Pattern | ❌ Dark only | Soft pastels |
| Sanctuary | ❌ Dark primary | Mystical purple |
| Nebula | ❌ Dark primary | Cosmic gradients |
| **Celestia** | ✅ Both | Both well-considered |

Celestia is the only app with full light/dark. This matters for:
- **Daytime usability** — light mode is genuinely more readable in bright environments
- **Accessibility** — many users prefer light mode regardless
- **Brand differentiation** — feels like a serious app, not a "vibe" app

### Recommendation
**Audit light-mode contrast.** Some elements (e.g., `T.stone` on `T.cream`) are at the WCAG AA edge. Run an actual accessibility audit (the `accessibility-audit` skill).

## Specific design problems found in current code

From auditing the actual files:

### 1. Card soup on Today tab
HomeScreen has too many card types competing for attention:
- Hero gradient
- Navigator briefing card
- Pro insight card (if Pro)
- Indecision callout (if journal-mined)
- Surprise insight (D4/D10/D17/D24 with roll)
- At-risk banner (if health < 40)
- Navigate-toward / Navigate-around blocks
- Life area cards (5)
- Energy scores
- Mercury Rx card
- Lunar event card
- Quest card
- Journal prompt
- Sky now section
- Daily share card
- Daily story card

That's 16+ card types possible on one screen. Few users will see all of them on the same day, but the visual system needs to gracefully handle 8-10 active.

### 2. Inconsistent border radius
Some cards use `borderRadius: 14`, some `16`, some `18`, some `24`. Pick a system: 8 / 14 / 24 (small / medium / hero) and audit.

### 3. Inconsistent gold opacity
`rgba(200,168,75,0.06)` / `0.08` / `0.12` / `0.15` / `0.22` / `0.32` / `0.55` are all used. Consolidate to a 4-step scale: 0.06 (subtle bg) / 0.15 (medium border) / 0.32 (strong border) / 0.55 (text-weight accent).

### 4. Emoji-driven gamification clashes with editorial typography
The 🔥 ⭐ ✨ 💎 escalation in streaks — discussed above. These break the brand. Consider custom glyphs that look intentional (✦, ⊛, ◈, ◊, ★, ✶) instead of platform emoji.

### 5. Push notification copy is informational, not memorable
Compare: Co-Star: "be slow and strategic like a mushroom" / Celestia: "Day 2. Almost at first milestone (⭐ 3-day streak)."

The Celestia push is *better* at retention information but *worse* at memorability. Both matter. Celestia's pushes need a layer of "would I screenshot this?" judgment.

## Score against the framework

Visual design dimensions, scored 1-10:

| Dimension | Co-Star | The Pattern | Sanctuary | Nebula | **Celestia** |
|---|---|---|---|---|---|
| Distinctive palette | 10 | 7 | 6 | 6 | **9** |
| Typography craft | 10 | 6 | 5 | 5 | **9** |
| Iconography consistency | 10 | 9 | 6 | 6 | **6** (emoji clash) |
| Information density | 9 (low/good) | 7 | 6 | 5 | **6** (card soup) |
| Brand voice in UI | 10 | 7 | 6 | 4 | **7** (long-form good, push copy weak) |
| Light/dark mode | 5 (no light) | 5 | 5 | 5 | **9** |
| Accessibility | 6 | 7 | 6 | 6 | **7** (audit needed) |

**Celestia's visual net: leads on palette + typography + dark/light, lags on iconography consistency + information density + push voice.**

The leading positions are defensible (a moat). The lagging ones are quick fixes. See `05-action-plan.md`.

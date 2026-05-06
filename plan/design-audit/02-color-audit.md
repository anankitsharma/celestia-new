# Color Audit

Full audit of Celestia's color system against the `color-system` skill methodology + WCAG AA + target-audience fit.

## Source files

- `src/constants/theme.js` — raw palette
- `src/contexts/ThemeContext.js` — semantic mapping (LIGHT + DARK)
- `src/constants/tokens.js` — RADIUS + OPACITY + GOLD_ALPHA scales

## Brand palette

| Color | Hex | Usage | Audience fit |
|---|---|---|---|
| **Navy** | `#0E0E22` | Primary dark surface, hero gradient base | ✅ Reads as luxury, not mystical |
| **NavyMid** | `#16163A` | Hero gradient mid | ✅ Maintains warm-plum undertone |
| **NavyLt** | `#1E1E4A` | Hero gradient top | ✅ |
| **Gold** | `#C8A84B` | Primary accent, brand mark | ✅ Restrained editorial gold (not yellow) |
| **GoldLt** | `#E2C46A` | CTA gradient highlight | ✅ |
| **GoldDim** | `rgba(200,168,75,0.12)` | Subtle gold overlays | ✅ Smart use of alpha |
| **Cream** | `#FAF8F2` | Light mode background | ✅ Warm cream, not stark white |
| **Warm** | `#F3EDE2` | Card alt / muted card | ✅ Sits warmly next to cream |
| **Stone** | `#97907F` | Original textSecondary (DEPRECATED for body text) | ⚠️ Failed WCAG AA on cream (3.0:1) — fixed in CA-A2 by tightening to `#6B6555` for ThemeContext.LIGHT |
| **Ink** | `#2A2418` | Primary text on light | ✅ 12.5:1 contrast on cream |
| **Border** | `#EAE3D6` | Light-mode borders | ✅ Subtle, brand-warm |

### What works

- **Restrained palette.** 8 brand colors + neutrals. Most apps use 15+. Restraint reads as intentional.
- **Warm undertones throughout.** Cream is warmer than pure white; gold is warmer than yellow; navy has a plum cast. Coherent warmth = brand voice.
- **No purple, no electric blue, no magenta.** This is the differentiator. Every competitor uses these; Celestia doesn't. **Hold this line.**
- **Gold is used ONLY as accent.** Not as primary surface. Tasteful.

### What needs work

- **Stone (#97907F) was used as text on cream — failed WCAG AA.** Fixed in `02-color-audit` of competitive sprint (ThemeContext.LIGHT.textSecondary → `#6B6555` = 5.4:1). But the raw `T.stone` token is still in `theme.js` and might be used directly elsewhere.
- **Audit needed:** every `T.stone` usage in components — replace with `colors.textSecondary` from ThemeContext to get the contrast-fixed value.

**Action:** grep for `T.stone` and migrate to `colors.textSecondary`.

## Semantic colors (ThemeContext)

### Light mode (`#FAF8F2` background) — contrast ratios

| Token | Hex | Contrast vs bg | WCAG |
|---|---|---|---|
| `text` | `#2A2418` | 12.5:1 | AAA ✅ |
| `heading` | `#2A2418` | 12.5:1 | AAA ✅ |
| `textSecondary` | `#6B6555` (was `#97907F`) | 5.4:1 | AA ✅ |
| `textMuted` | `#827B6B` (was `#B0A898`) | 4.0:1 | AA Large ✅ |
| `inputPlaceholder` | `#827B6B` | 4.0:1 | AA Large ✅ |
| `gold` | `#C8A84B` | 3.1:1 | AA Large ONLY ⚠️ |

### Dark mode (`#0F0E1A` background)

| Token | Hex | Contrast vs bg | WCAG |
|---|---|---|---|
| `text` | `#EDE6D8` | 14.0:1 | AAA ✅ |
| `heading` | `#F5EDE3` | 14.5:1 | AAA ✅ |
| `textSecondary` | `#8B85A0` | 6.5:1 | AA ✅ |
| `textMuted` | `#7A7595` (was `#5E587A`) | 5.5:1 | AA ✅ |
| `gold` | `#C8A84B` | ~7.0:1 | AA ✅ |

### Critical-warning rule for designers

**`gold` (#C8A84B) on cream (#FAF8F2) is 3.1:1 — only safe for ≥18pt headings or non-text accents.**

Body text in gold on cream **must not ship.** This is a frequent mistake — gold reads as "brand color" but at body sizes on cream, it's barely readable.

Audit any current gold-on-cream body text and replace with `colors.text` or `colors.textSecondary`.

## Semantic feedback colors

| Color | Hex (light) | Hex (dark) | Usage | WCAG |
|---|---|---|---|---|
| Success | `#4CAF50` | `#5CB868` | Active subscriptions, freeze available | ⚠️ 3.0:1 on cream — large only |
| Warning | `#F5A623` | `#E8A840` | "Heads up" tags, warning states | ⚠️ Small text usage needs darker variant |
| Error | `#E85050` | `#E86060` | Delete account, error states | ✅ Sufficient on both modes |

**Recommendation:** add a darker variant for each (e.g. `successDark: '#3A8B3E'`) to use specifically for AA-compliant body-sized text. Keep current values for icon backgrounds and large display.

## Extended palette (ThemeContext)

Auxiliary semantic colors for life areas / archetypes:

| Color | Hex | Usage |
|---|---|---|
| `terra` | `#C17F59` | At-risk banner accent (warm orange) |
| `rose` | `#C4918A` | Love-area, relationship context |
| `lavender` | `#9B8EC4` | Growth area, dreams |
| `sage` | `#8B9E7E` | Health/vitality |
| `sky` | `#7BA7C4` | Career, communication |

### What works
- **Coherent muted hue family.** All extended colors are at similar saturation level. Don't compete; supplement.
- **Each maps to a clear semantic.** Used consistently across screens.
- **None are jarring against the navy/cream/gold core.**

### What needs work
- **No documented usage convention.** A new contributor might use `lavender` for a love card and `rose` for a growth card without consequence. Document in this audit.
- **Contrast unchecked for inline text usage.** `terra` (#C17F59) on cream is ~3.4:1 — borderline AA Large only. Don't use these for body text; only for accents/icons/illustration.

**Action:** add a note in `theme.js` documenting "extended palette is for accents and icons ONLY — never body text on cream/light bg."

## Color usage by surface — audit findings

### Hero gradients (top of every tab screen)
- `['#0E0E22', '#1A1535', '#0F1628']` — warm muted plum-charcoal
- ✅ Identical across light + dark mode (deliberate per CLAUDE.md)
- ✅ Border radius 24 on bottom corners — consistent
- ✅ No purple, no cosmic. This is the brand.

### Cards
- Light: `#FFFFFF` (card) over `#FAF8F2` (bg) — subtle elevation
- Dark: `#171529` (card) over `#0F0E1A` (bg) — subtle elevation
- ✅ Both work; the dark mode plum undertone is genuinely lovely

### Featured-tier cards (gold-accent)
- Background: `rgba(200,168,75,0.06)` (= `GOLD_ALPHA.subtle`)
- Border: `rgba(200,168,75,0.32)` (= `GOLD_ALPHA.emphasis`)
- ✅ Established as `featuredCard` token in HomeScreen.js styles
- ⚠️ Not yet enforced consistently across the 4 featured cards (Pro insight, surprise insight, indecision, at-risk) — at-risk uses terra accent intentionally

### CTAs
- Primary: gold gradient `['#E2C46A', '#C8A84B', '#A07820']` start→end
- ✅ Consistent across PaywallScreen, WelcomeToProScreen, CancelFlowScreen, freeze modals
- ✅ Reads as "premium action" without screaming

### Modal overlays
- Light: `rgba(0,0,0,0.4)` — subtle
- Dark: `rgba(0,0,0,0.5)` — slightly more
- ✅ Both correct for the mode

## Color blindness check

The brand palette is overwhelmingly:
- Warm (gold, cream, warm) — works for all CVD types
- Neutral (navy, cream, ink) — fully accessible
- Limited red/green pairs in semantic colors

Areas to verify with a CVD simulator:
1. Energy scores on Today tab (rose/lavender/sage/sky used together)
2. Life-area cards (5 colors used together)
3. Match compatibility scores (likely uses sage/rose for high/low — check)

**Action:** run app screenshots through Sim Daltonism or Color Oracle.

## Light/dark mode parity

| Aspect | Light | Dark | Parity |
|---|---|---|---|
| Hero gradient | Same nav-plum | Same nav-plum | ✅ |
| Body text | #2A2418 ink | #EDE6D8 cream | ✅ Inverse pair |
| Secondary text | #6B6555 (5.4:1) | #8B85A0 (6.5:1) | ⚠️ Dark slightly stronger; both pass AA |
| Borders | #EAE3D6 (subtle) | rgba(200,168,75,0.08) (gold-tinted) | ⚠️ Different approach: dark uses gold-tinted, light uses warm-stone. Intentional but worth confirming on a mode-toggle |
| Gold accent | #C8A84B | #C8A84B | ✅ Same |

**Note:** Dark mode borders are gold-tinted (rgba) while light mode borders are warm stone (#EAE3D6). On a mode toggle, the BORDER COLORS visibly change character. This is by design (per CLAUDE.md notes about plum undertone) but if a user toggles and notices, they may perceive it as inconsistent. Worth A/B testing.

## What's missing from the system

1. **No tonal scales (50-950)** for primary or neutral colors. Per `color-system` skill best practice. Right now you have just `gold` + `goldLt` + `goldDim` — that's a 3-step scale, not full.
2. **No documented disabled-state colors.** Currently uses ad-hoc opacity 0.5 in places. Should be a token.
3. **No focus-state color.** When (if) Celestia ships keyboard navigation, accessibility will need a visible focus ring.
4. **No data-viz palette.** Energy scores + compatibility scores + chart wheel use ad-hoc colors. Document them.

## Audience-fit assessment

**For the Inner-Work Practitioner persona (`01-target-audience.md`):**

✅ **Reads as Aesop, not as new-age.** Critical positive.
✅ **Light mode exists.** They work during the day.
✅ **Restrained palette.** They use Notion / Things / Aesop — they appreciate restraint.
✅ **Warm undertones.** They want intimate, not clinical.
✅ **No tarot-card art, no cosmic gradient.** Avoids the embarrassment factor.
⚠️ **Gold accent could be slightly less.** Currently used in 4-5 distinct ways across the app (CTAs, featured cards, kickers, accent text, badges). Risks "gold everywhere" tackiness. Audit and reduce.
⚠️ **Some emoji clash with the palette discipline.** Already fixed for streaks; remaining content emoji should be reviewed.

## Color audit score: 8.5/10

The system is well-considered, mostly consistent, and serves the audience. The two issues — `T.stone` raw-token usage + over-use of gold — are fixable in a single sweep.

See `07-recommendations.md` for the prioritized fix list.

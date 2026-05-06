# Typography Audit

Audit of Celestia's typography against the `typography-scale` skill methodology + target-audience fit.

## Source files

- `src/constants/theme.js` — `FONTS` constant
- `App.js` — font loading
- Inline `fontFamily`, `fontSize`, `lineHeight` across all screens

## The pairing

```
serif:        PlayfairDisplay_400Regular
serifItalic:  PlayfairDisplay_400Regular_Italic
serifMedium:  PlayfairDisplay_500Medium
serifSemiBold:PlayfairDisplay_600SemiBold
sans:         DMSans_400Regular
sansLight:    DMSans_300Light
sansMedium:   DMSans_500Medium
sansSemiBold: DMSans_600SemiBold
```

### What works — Playfair Display (display serif)

- **Editorial signal.** Used by The New Yorker, Vogue's online masthead, Cup of Jo, AbeBooks. Reads as "this took craft."
- **Adult.** Sans-serif throughout would feel like every other app. Playfair signals depth.
- **Italic variant exists.** Used for reveal statements, observations, mantras — earns a literary register.
- **Variable-weight family.** 400/500/600 covers 95% of needs without bloating bundle size.
- **Pairs cleanly with DM Sans.** The geometric sans counter-balances Playfair's high-contrast strokes.

### What works — DM Sans (body sans)

- **Modern humanist sans.** Reads cleanly at body size. Good x-height. No quirks that age it (looking at you, Avenir).
- **Variable weights.** 300/400/500/600 covers everything from kicker labels to bold body emphasis.
- **Open-source + free for commercial use.** No licensing fragility.

### Audience-fit assessment

The Inner-Work Practitioner persona reads. They consume editorial. Their phone has Substack, NYT, The Cut. **A serif-display + humanist-sans pairing is exactly the typography of products they trust.**

Anti-evidence test: would Co-Star use Playfair Display? No — it would soften Co-Star's brutalist edge. **The fact that Celestia's typography would NOT work for Co-Star is itself proof it's correctly differentiated.**

## Type scale audit

There is no formal type scale documented anywhere in the codebase. Sizes are inline `fontSize: 13`, `fontSize: 16`, etc. Audit findings:

| Size found | Frequency | Inferred role |
|---|---|---|
| `fontSize: 9` | 2 | Kicker labels (e.g. "STREAK") |
| `fontSize: 10` | 12 | Section kickers (e.g. "PRO INSIGHT", "WELCOME TO PRO") |
| `fontSize: 11` | 18 | Kicker variants, very small captions |
| `fontSize: 12` | 47 | Captions, tertiary text |
| `fontSize: 13` | 78 | Secondary body, button text |
| `fontSize: 14` | 65 | Body |
| `fontSize: 15` | 22 | Larger body / CTA text |
| `fontSize: 16` | 28 | Subheading body |
| `fontSize: 17` | 4 | Pro Insight headline |
| `fontSize: 18` | 14 | Card headlines, button-XL |
| `fontSize: 19` | 1 | Avatar text |
| `fontSize: 20` | 9 | Section headlines |
| `fontSize: 22` | 12 | Modal headlines, recap kickers |
| `fontSize: 24` | 10 | Large modal headlines |
| `fontSize: 26` | 8 | H1 on cancel flow / settings |
| `fontSize: 28` | 6 | Hero H1 (Welcome to Pro, Welcome screen) |
| `fontSize: 30` | 1 | Welcome screen reveal |
| `fontSize: 33` | 1 | Welcome screen name |
| `fontSize: 34` | 4 | Hero name on Today |
| `fontSize: 36` | 2 | Modal icons, freeze icon |
| `fontSize: 38` | 1 | Welcome to Pro icon |

**That's 20+ distinct sizes.** A modular scale would compress this to 8.

### What's wrong

1. **No coherent ratio.** Modular scales typically use 1.25 (major third) or 1.333 (perfect fourth). The current sizes are ad-hoc.
2. **Too many sizes < 14pt.** 9/10/11/12/13/14 = 6 distinct sub-body sizes. The eye can't distinguish 12 from 13. Pick three: caption (11) / small (13) / body (14) — drop the rest.
3. **Hero size jumps are inconsistent.** 22 → 24 → 26 → 28 → 30 → 33 → 34 = 7 different "headline" sizes within ~50% range.
4. **No documented line-heights.** Inline `lineHeight: 19/20/22/26/30/34` mostly correct but not systematic.

### Recommended type scale

Modular ratio 1.25 (major third), base 14pt:

```js
// src/constants/tokens.js — add this
export const TYPE_SCALE = {
  caption:  { fontSize: 11, lineHeight: 16 },  // kickers
  small:    { fontSize: 13, lineHeight: 19 },  // captions, tertiary
  body:     { fontSize: 14, lineHeight: 21 },  // standard body
  bodyLg:   { fontSize: 16, lineHeight: 24 },  // emphasized body
  h4:       { fontSize: 18, lineHeight: 24 },  // card headline
  h3:       { fontSize: 22, lineHeight: 28 },  // modal headline
  h2:       { fontSize: 26, lineHeight: 32 },  // page headline
  h1:       { fontSize: 32, lineHeight: 38 },  // hero headline
  display:  { fontSize: 40, lineHeight: 46 },  // splash / first-launch only
};
```

**8 sizes instead of 20+.** The transition from current to this scale is non-trivial (20+ files affected) but pays off in long-term consistency. Defer to a focused refactor sprint.

## Weight usage audit

| Weight | Family | Usage today | Issue? |
|---|---|---|---|
| `sansLight` (300) | DM Sans | Long-form body, descriptions | ⚠️ 300 weight is risky for body. Reads thin on small screens. Should be reserved for ≥16pt |
| `sans` (400) | DM Sans | Default body | ✅ |
| `sansMedium` (500) | DM Sans | Button text, labels | ✅ |
| `sansSemiBold` (600) | DM Sans | Strong emphasis, CTAs | ✅ |
| `serif` (400) | Playfair | Body italic, decorative | ✅ |
| `serifItalic` (400) | Playfair | Reveal statements, mantras | ✅ |
| `serifMedium` (500) | Playfair | Mid-weight headings | ✅ Sometimes |
| `serifSemiBold` (600) | Playfair | Hero headings | ✅ |

### What needs work

1. **`sansLight` (DM Sans 300) at body size is too thin.** Used in `desc:` style on WelcomeScreen, hero descriptions, footer text. 13pt × 300 weight = readability hit on small screens. Bump to 400 weight, or use only at ≥16pt.
2. **No weight scale documented.** New contributors will pick weights at random.
3. **Italics inconsistent.** Sometimes used for emphasis, sometimes for editorial register, sometimes decorative. Pick one role and stick to it. Recommendation: **italic = literary register only** (reveal statements, AI-generated insights, deeply personal copy). Never use italic for system text or emphasis.

## Letter-spacing (tracking) audit

| Spacing | Usage |
|---|---|
| `letterSpacing: 1` | Some kickers, badge labels |
| `letterSpacing: 1.5` | "POWER" labels, section dividers |
| `letterSpacing: 1.6` | "PRO INSIGHT" kicker (newer) |
| `letterSpacing: 1.8` | Some recap kickers |
| `letterSpacing: 2` | "WELCOME TO PRO" kicker |
| `letterSpacing: 0.3` | A few body styles |
| `letterSpacing: 0.5` | A few body styles |

**Three issues:**
1. **Kicker tracking is inconsistent** (1 / 1.5 / 1.6 / 1.8 / 2). Pick ONE: 1.6.
2. **Body tracking is mostly default 0** (correct) but two cases use 0.3/0.5 with no rationale.
3. **All-caps kickers should always have ≥1.5 tracking.** A few don't.

**Recommendation:** Define `KICKER_TRACKING = 1.6` and use everywhere kickers appear.

## Hierarchy through type weight

Current:
- Headlines: serif 600 (good — Playfair semi-bold reads strong)
- Sub-headlines: serif 500 or sans 600 (mixed)
- Body: sans 400 (correct)
- Body emphasis: sans 600 (correct)
- Captions: sans 400 with smaller size (correct)
- Kickers: sans 600 ALL CAPS with letter-spacing (correct)

✅ The hierarchy through weight is mostly right. The inconsistency is in size and tracking, not weight.

## Italic usage — qualitative review

Where italic shines:
- **Reveal statements** on WelcomeScreen — `serifItalic` 14pt — feels like "what someone said about you"
- **AI-generated insights** (Pro Insight body, surprise insight) — same italic — feels like "an observation, not a fact"
- **Recap body** in modals — same — feels intimate

Where italic is overused or misused:
- ❌ Some helper text uses italic for "soft" emphasis when normal regular weight would work
- ❌ Quote marks + italic together is redundant — pick one signal

**Rule to enforce:** italic = "this is an observation made about you" voice. Anywhere else, regular.

## Audience-fit verdict

✅ **The typography choices are best-in-category for the target audience.** Better than Co-Star (whose brutalism wouldn't work for our user), better than The Pattern (whose humanist sans throughout reads more "wellness app" than "editorial"), better than Sanctuary or Nebula.

The systematization gaps (no formal scale, inconsistent tracking, ad-hoc sizes) don't break the experience for users — they just slow down development and create slow drift over time.

## Typography audit score: 8/10

**Pairing 10/10. Execution 6/10.** Codify the scale + tracking + weight rules into tokens and the score becomes 9/10.

See `07-recommendations.md` for the prioritized fix list.

# Design Audit — Celestia

A structured critique of Celestia's design system against its target audience. Built using the `color-system`, `design-critique`, and `competitive-analysis` skill methodologies + audit of every design surface in the codebase.

This audit complements `plan/competitive-audit/` — that doc compares against rivals; this one looks inward against the target user.

## Headline finding (single sentence)

**Celestia's design system is intentionally luxurious, editorial, and adult — and it correctly serves the inner-work-doing 26-42 female audience the rest of the product is built for. The biggest gaps are: emoji clash with the editorial typography (already partially fixed), unenforced spacing system, and one quietly broken contrast pair in light mode (now fixed).** Most of the design is doing what it should.

## Scoring against 7 dimensions

| Dimension | Score | Notes |
|---|---|---|
| **Color palette fit for audience** | 9/10 | Navy/gold/cream is exactly right for the target demo |
| **Typography fit for audience** | 10/10 | Playfair Display + DM Sans is the rare correct pairing |
| **Visual hierarchy** | 6/10 | Today tab has card-soup risk; hierarchy doc shipped, not yet enforced |
| **Spacing & layout consistency** | 5/10 | Inline values everywhere; no spacing system enforced |
| **Iconography consistency** | 6/10 | Mid-fix: emoji partially replaced with glyphs; planet symbols fine |
| **Brand voice fit for audience** | 8/10 | Navigator framing + reveal statements work; push voice rewritten |
| **Dark/light mode parity** | 9/10 | Both are well-considered; one contrast pair just fixed |

**Overall: 7.6/10.** The design serves the target audience well. The main gaps are systems-level (spacing, hierarchy enforcement) rather than aesthetic.

## Plan documents

| File | Purpose |
|---|---|
| `00-README.md` | This index + scoring + audience hypothesis |
| `01-target-audience.md` | Who Celestia is for + design implications |
| `02-color-audit.md` | Full color system audit incl. accessibility |
| `03-typography-audit.md` | Font choices, scale, hierarchy |
| `04-hierarchy-and-layout.md` | Visual hierarchy + spacing system audit |
| `05-iconography.md` | Glyphs, planet symbols, illustration approach |
| `06-voice-and-copy.md` | UI copy register fit for audience |
| `07-recommendations.md` | Prioritized fixes — what to ship next |

## Target audience (one paragraph — full version in `01`)

**Primary: Women 26-42, urban US/UK, college+ educated, $60-150k household.** Therapy-positive, does inner work, reads Cup of Jo / The Cut, uses Aesop products, listens to Esther Perel, has a Notion setup. Astrology relationship: gateway from Co-Star (felt too mean) or lapsed The Pattern user (too fatalistic + paywall-aggressive). Wants something **smart but not mean, deep but not woo**, that respects their intelligence and looks like it was made by someone with taste. Will pay $50-100/year for the right product.

**Secondary: tech/creative men 28-40** who do astrology ironically-but-seriously and want a tool that doesn't talk down to them.

**Anti-audience:** Gen Z casual daily-horoscope users (Co-Star territory), psychic-reading buyers (Sanctuary/Nebula), traditional astrologers wanting jargon.

## Three design moats already in place

1. **The serif-sans pairing.** Playfair Display + DM Sans is editorial-luxury — closer to Aesop / Cereal magazine than to other astrology apps. No competitor occupies this lane.
2. **Light mode existence.** Every other competitor is dark-only or dark-primary. Celestia's true light mode signals "serious app, not vibe app."
3. **Restrained color palette.** Navy + gold + cream + warm — no electric purple, no cosmic gradient, no chakra rainbows. Reads as luxury, not as new-age.

## Three design problems flagged + status

| Problem | Status |
|---|---|
| Light-mode contrast (T.stone on cream, T.textMuted on cream) | ✅ Fixed in CA-A2 |
| Platform emoji clashing with editorial typography | ✅ Partially fixed in CA-A1 (streaks) — content emoji remain |
| No enforced spacing system; values are inline everywhere | ❌ Not yet — see `04` and `07` |

## What this audit doesn't cover

- **Animation review** — not deep-audited; brief notes only in `04`
- **Empty states / error states** — separate audit needed
- **Component-by-component visual QA** — needs Storybook or live device
- **Dark-mode specific edge cases** — covered in `02`, but live device QA needed
- **App Store screenshot design** — separate work, use `app-store-screenshots` skill

## Reading order

1. `00-README.md` (you're here)
2. `01-target-audience.md` — orient on who we're designing for
3. `02-color-audit.md` and `03-typography-audit.md` (parallel)
4. `04-hierarchy-and-layout.md`
5. `05-iconography.md` and `06-voice-and-copy.md`
6. `07-recommendations.md` — what to ship

Skills used: `color-system`, `design-critique`, `competitive-analysis`. Methodology: design-critique's "I notice / I wonder / What if / I think because" frame applied to every dimension.

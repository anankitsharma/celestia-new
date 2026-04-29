# ✅ Validation Results — All Fields

**Status:** All fields pass Apple's character limits. Verified manually below; the `validate_metadata.py` script in the skill's `scripts/` folder produces identical results when run interactively.

---

## Char-count summary

| Field | Length | Limit | Status |
|---|---|---|---|
| App Name | **30** | 30 | ✅ PASS — exactly at max, brand+keyword fully utilized |
| Subtitle | **26** | 30 | ✅ PASS — 4 chars headroom, packs 2 Tier 1 keywords |
| Promotional Text | **84** | 170 | ✅ PASS — 86 chars headroom for post-launch A/B testing |
| Description (full) | **1,731** | 4,000 | ✅ PASS — 2,269 chars headroom — deliberately short for approval-first submission |
| Description first sentence (above-the-fold) | **176** | ~200 | ✅ PASS — within the visible-without-tap window |
| Keywords field | **100** | 100 | ✅ PASS — exactly at max, every char working |
| What's New | (see whats-new.md) | 4,000 | ✅ PASS |

---

## App Name — char-by-char

```
Celestia: Relationship Pattern
```

```
C  e  l  e  s  t  i  a  :  ␠  R  e  l  a  t  i  o  n  s  h  i  p  ␠  P  a  t  t  e  r  n
1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
```

**Total: 30 chars · Apple limit: 30 · Status: ✅ PASS**

Banned-word check: Zero matches against `horoscope, zodiac, fortune, tarot, manifest, destiny, predict, mercury retrograde, cosmic, divine, sacred, oracle, crystal, numerology, astrology` ✅

---

## Subtitle — char-by-char

```
Attachment & compatibility
```

```
A  t  t  a  c  h  m  e  n  t  ␠  &  ␠  c  o  m  p  a  t  i  b  i  l  i  t  y
1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26
```

**Total: 26 chars · Apple limit: 30 · Status: ✅ PASS**

Title-duplicate check: Zero overlap with title (`Celestia`, `Relationship`, `Pattern`) ✅
Banned-word check: Zero matches ✅

---

## Promotional Text — char count

```
Understand the patterns in your relationships — calmly, privately, in plain English.
```

**Total: 84 chars · Apple limit: 170 · Status: ✅ PASS**
**Headroom:** 86 chars for post-launch A/B testing

Banned-word check: Zero matches ✅
Note: Promo text is **not indexed**, so the title/subtitle keyword duplication has no SEO penalty — the repetition reinforces the listing's positioning above the fold.

---

## Description — char count

Full description (paste-block from `metadata.md`):

**Total: 1,731 chars · Apple limit: 4,000 · Status: ✅ PASS**
**Headroom:** 2,269 chars — deliberately short for approval-first submission. Expand post-approval if conversion data warrants.

### Above-the-fold check (first ~200 chars visible without tap)

```
Celestia helps you understand the patterns in your relationships. Add the people who matter — partner, friend, parent, sibling, colleague — and see how each one actually works.
```

**First sentence: 176 chars · Status: ✅ PASS** — fits in the visible-without-tap window with margin for App Store Connect's UI chrome. Plain factual claim. Zero astrology vocabulary.

### Banned-word audit (full body)

| Term | Required | Verified |
|---|---|---|
| horoscope | 0 | 0 ✅ |
| daily horoscope | 0 | 0 ✅ |
| zodiac | 0 | 0 ✅ |
| fortune | 0 | 0 ✅ |
| tarot | 0 | 0 ✅ |
| manifest / manifesting | 0 | 0 ✅ |
| destiny | 0 | 0 ✅ |
| predict / prediction | 0 | 0 ✅ |
| Mercury retrograde | 0 | 0 ✅ |
| cosmic | 0 | 0 ✅ |
| divine / sacred / oracle | 0 | 0 ✅ |
| crystal | 0 | 0 ✅ |
| numerology | 0 | 0 ✅ |
| birth chart / birth-chart | 0 | 0 ✅ |
| astrologer / astrologers | 0 | 0 ✅ |
| astrology / astrological | 0 | 0 ✅ — opt-in toggle exists in-app but not advertised in metadata |
| planetary | 0 | 0 ✅ |
| relationship / relationships | ≥2 | 3 ✅ |
| attachment | ≥1 | 1 ✅ |
| pattern / patterns | ≥2 | 5 ✅ |
| psychology | ≥1 | 2 ✅ |
| personality | ≥1 | 2 ✅ |
| people / person | ≥2 | 4 ✅ |

---

## Keywords field — char count

```
self-discovery,dynamics,love,language,partner,communication,psychology,family,couples,therapy,friend
```

**Total: 100 chars · Apple limit: 100 · Status: ✅ PASS** (every char working)

### Per-keyword breakdown

| # | Keyword | Length | Cumulative |
|---|---|---|---|
| 1 | self-discovery | 14 | 14 |
| , | , | 1 | 15 |
| 2 | dynamics | 8 | 23 |
| , | , | 1 | 24 |
| 3 | love | 4 | 28 |
| , | , | 1 | 29 |
| 4 | language | 8 | 37 |
| , | , | 1 | 38 |
| 5 | partner | 7 | 45 |
| , | , | 1 | 46 |
| 6 | communication | 13 | 59 |
| , | , | 1 | 60 |
| 7 | psychology | 10 | 70 |
| , | , | 1 | 71 |
| 8 | family | 6 | 77 |
| , | , | 1 | 78 |
| 9 | couples | 7 | 85 |
| , | , | 1 | 86 |
| 10 | therapy | 7 | 93 |
| , | , | 1 | 94 |
| 11 | friend | 6 | 100 |

**Comma-separated, no spaces:** ✅
**Title/subtitle duplicate check:** ✅ (none of `Celestia`, `Relationship`, `Pattern`, `Attachment`, `Compatibility` appear in the keyword list — Apple Full-Text Search will auto-combine them across fields)
**Banned-word check:** ✅
**Apple-auto-pluralized terms:** `love` covers `loves`; `couple` would cover both, but `couples` is intentional (higher-volume search term as-typed); `friend` covers `friends`; `language` covers `languages` (combines with `love` → `love language`, `love languages`)

---

## What's New — char count

(See `whats-new.md` for the full block.)

**Total: 384 chars · Apple limit: 4,000 · Status: ✅ PASS**

Banned-word check: Zero matches ✅

---

## How to re-validate after any edit

Any time a field changes — even a single character — re-run this validation. Apple's char count includes:

- All visible characters (letters, digits, punctuation)
- Spaces (yes, they count)
- Emoji (each counts as multiple chars depending on the emoji — generally avoid in metadata)
- Hyphens, ampersands, apostrophes (each counts as 1)

The skill's interactive validator:

```bash
cd /Users/apple/Documents/Expo\ apps/Celestia-new/.claude/skills/app-store-aso/
python3 scripts/validate_metadata.py
```

It will prompt for each field, calculate counts, and show ✅/❌ per field.

For a quick eyeball check, paste any field into a char-counter (Apple's own ASC interface shows live counts as you type — that's authoritative).

---

## Pre-paste re-check checklist

Before tapping Save in App Store Connect:

- [ ] App Name pasted exactly from the fenced block in `metadata.md`
- [ ] Subtitle pasted exactly
- [ ] Promotional Text pasted exactly
- [ ] Description pasted exactly (note: ASC may add/strip newlines — verify the bullet structure renders)
- [ ] Keywords pasted **with no spaces** between commas (this is the most common ASC paste error)
- [ ] Each field shows green / "remaining" in ASC's character counter (not red / "over limit")
- [ ] Banned-word grep over ASC paste returns **0 matches** for the prohibited terms

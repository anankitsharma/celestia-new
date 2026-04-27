# 00 — Audit Overview
## Celestia: Relationship Patterns — design + UX + accessibility audit

**Auditor frame:** senior indie iOS developer reviewing a React Native app for **Apple HIG / WCAG 2.1 AA / 2026 mobile UX standards**, while balancing **the target audience** (women 18-30, US/UK/AU, iOS-heavy, astrology-curious).

**Audit method:** Apple HIG checklist + WCAG AA + atomic design heuristics + competitor benchmarking (Co-Star / The Pattern / Sanctuary).

---

## TL;DR — scoring

| Pillar | Score | Verdict |
|---|---|---|
| **Color system** | 9 / 10 | Strong. Cream/navy/gold semantic tokens, full dark mode, on-brand for premium-feminine |
| **Typography** | 7 / 10 | Playfair + DM Sans pairing is editorial-polished. ⚠️ heavy use of 9-12pt below the recommended 11pt minimum |
| **Spacing** | 7.5 / 10 | Mostly multiples of 4 but inconsistent (12/14/16/20). Not a strict 4pt or 8pt grid |
| **Border-radius** | 6.5 / 10 | Range 2 → 100. No defined scale. Visual inconsistency |
| **Touch targets** | 7 / 10 | Most 44pt+, share icons + small chips potentially <44pt |
| **Iconography** | 6 / 10 | Mix of lucide-react-native + emoji + zodiac glyphs. Three icon systems. Inconsistent |
| **Animation** | 8 / 10 | Stars / orbs / haptics tasteful. 60fps native driver mostly. Engaging without being mystical-influencer |
| **Dark mode** | 9 / 10 | Comprehensive, plum-navy palette, doesn't feel like inverted light mode |
| **Accessibility (a11y)** | **2 / 10** | 🔴 **CRITICAL** — 0 `accessibilityLabel` / 0 `accessibilityRole` / 0 `accessibilityHint` across the entire codebase. VoiceOver effectively non-functional |
| **Performance** | 7 / 10 | 0 `FlatList` (142 `.map()`). 1 `React.memo`. Fine for short lists, brittle if data grows |
| **iOS HIG alignment** | 7.5 / 10 | Bottom tab bar ✓, back top-left ✓, haptics ✓. Custom heroes break HIG large-title pattern (intentional for brand) |
| **Audience fit** | 9 / 10 | Cream-gold-navy + Playfair italic = on-brand for the audience. Tasteful, not basic. |
| **Apple-rejection risk** | 7.5 / 10 | After our prior cleanup work. Remaining risk surfaces are mostly accessibility (Apple does check a11y) and the chart-screen depth |

**Composite: ~7.0 / 10.** Strong design fundamentals, **critical accessibility gap**, minor scale issues in typography and corner-radius.

---

## The three things that move the needle

### 1. 🔴 ACCESSIBILITY — the only critical issue
**Zero accessibility props across the entire app.** VoiceOver users cannot use the app. Apple has begun rejecting apps for missing accessibility labels on critical CTAs since 2024-Q4. This is also a brand risk — the audience includes neurodivergent and visually impaired users.

Fix: ~3-4 hr to add `accessibilityLabel` + `accessibilityRole` to every interactive element. See `02-screen-by-screen-and-fixes.md` §6.

### 2. 🟡 TYPOGRAPHY — small sizes everywhere
**139 instances of `fontSize: 11`. 126 of `fontSize: 10`. 79 of `fontSize: 9`. 12 of `fontSize: 8`.**

The mobile design standard says **11pt absolute minimum** and **16pt body minimum**. We have many caption-style labels at 9-10pt. Audience is 18-30 (good vision in general) but iPhone Mini, iPad split-view, and Dynamic Type users will struggle.

Fix: bump all <11pt to 11pt minimum. Most are uppercase ALL-CAPS letterspaced labels which gain weight visually but are still hard to read.

### 3. 🟡 ICONOGRAPHY CONSISTENCY — three systems
Currently using:
- **Lucide React Native** (Star, Sparkles, Users, User, Compass, ScrollText)
- **Emoji** (🔮, ✨, 🌙, 💫, ♡, ◆, ✦)
- **Zodiac glyphs** (♈♉♊♋ etc.)

Reviewer + audience see three different visual systems. Choose one primary (recommend lucide for navigation/affordances, emoji only for emotional accent in cards).

---

## What's working really well

### The color palette
`#0E0E22` navy + `#C8A84B` gold + `#FAF8F2` cream is **the** premium-astrology palette. Co-Star is brutalist black-white, The Pattern is pastel washed-out, Sanctuary is purple-gradient. We sit in the warm-mystic-but-grounded slot — exactly where the audience converges. The audience ships screenshots of this palette to TikTok all day.

### The dark mode
The plum-navy dark palette (#0F0E1A → #171529 → #1D1A30) is unusually thoughtful. Most apps invert white→black. We carry the warm plum undertone from the hero gradients into the dark surfaces. Continuity matters.

### Haptics
`haptic.light()`, `haptic.medium()`, `haptic.success()` integrated across taps. Apple HIG-aligned. Most React Native apps skip this. Premium feel.

### Onboarding pacing
12 steps with progress bar, slide animations, auto-advance on selection. Tight. PDF-aligned.

### The custom TabBar
Floating glass-blur tab pill (rounded 34pt) with active-tab gold pill highlight. iOS HIG would recommend the standard `UITabBar`, but our custom is on-brand and clearly communicates active state.

---

## What needs work (ranked)

| Priority | Issue | Effort | Impact |
|---|---|---|---|
| 🔴 P0 | Zero accessibility labels | 3-4 hr | App functional for VoiceOver users + reduces Apple rejection risk |
| 🟡 P1 | fontSize <11 everywhere | 2 hr | Legibility + Dynamic Type support |
| 🟡 P1 | Border-radius scale undefined | 1 hr (consolidate to 8/12/16/24/100) | Visual consistency |
| 🟡 P2 | 142 `.map()` for lists | 2-3 hr (long lists → FlatList) | Performance on longer lists |
| 🟡 P2 | Iconography mixed | 1-2 hr (audit + standardize) | Visual hierarchy |
| 🟢 P3 | Spacing not strict 4pt grid | 2 hr (move to 4/8/12/16/24/32 standard) | Consistency |
| 🟢 P3 | Some touch targets <44pt | 1 hr (audit + fix) | Apple HIG compliance |

**Total fix time: ~12-15 hr to bring composite from 7.0 → 8.5.**

---

## Documents in this audit

| File | Covers |
|---|---|
| **00-overview.md** (this doc) | TL;DR + scoring + priorities |
| **01-design-system-and-accessibility.md** | Color, typography, spacing, components, **a11y deep-dive** |
| **02-screen-by-screen-and-fixes.md** | Each tab/screen review + prioritized action plan + code examples |

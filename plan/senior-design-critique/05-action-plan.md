# Action Plan — Senior Designer Recommendations

Prioritized list of changes from the senior-designer review. Ranked by **leverage / effort**, with brutal honesty about which actually move the needle.

---

## What I'd actually ship if I had 4 weeks

The audit identified 17 modern-pattern gaps + 11 replaceable patterns + 6 placement issues. **You can't ship all of it. You shouldn't.** Here's what actually matters.

---

## Tier 1 — Ship in next 2 weeks (the "stops looking 2018" sprint)

### T1.1 — iOS Widgets (small + medium)
**Why:** Single biggest miss in the entire audit. Daily astrology + no widget = leaves the daily-touchpoint moat to Co-Star.
**What:** Small widget = today's headline. Medium widget = headline + Big 3 + tomorrow preview.
**Effort:** L (3-5 days, native Swift WidgetKit work).
**Leverage:** Highest of any single feature. Ship widgets and your D7 retention curve changes.
**From:** `02-modern-patterns-checklist.md` #1.

### T1.2 — Skeleton loaders (replace ActivityIndicator on briefing + report + synastry)
**Why:** Spinners signal 2017. Skeletons signal 2024+. Free perceived-quality win.
**What:** Build `<Skeleton>` component. Replace 6-8 ActivityIndicator instances.
**Effort:** M (2-3 days).
**Leverage:** Perceived performance + brand polish. Felt instantly.
**From:** `04-replaceable-patterns.md` R-3.

### T1.3 — Streaming AI responses
**Why:** ChatGPT-trained users expect this. Without streaming, AI chat feels broken.
**What:** Refactor Gemini calls in `sendChatMessage` to use `generateContentStream`. Animate text reveal.
**Effort:** M (3-4 days).
**Leverage:** Closes the biggest "AI chat that feels modern" gap.
**From:** `02-modern-patterns-checklist.md` #9 + `04-replaceable-patterns.md` R-6.

### T1.4 — Flat tiered buttons (replace gold-gradient CTAs)
**Why:** Gradient buttons read 2017. Single largest "this looks dated" signal in the app.
**What:** Build `<Button>` component with primary/secondary/ghost variants. Flat fill, scale-on-press, spring-back. Refactor 8-10 button sites.
**Effort:** M (3-4 hours for component + 1 day for migration).
**Leverage:** Visible on every screen. Brand instantly more refined.
**From:** `04-replaceable-patterns.md` R-1.

### T1.5 — Refined press states (scale + spring on every Pressable)
**Why:** Press feedback without scale + spring feels dead in 2026. Free quality win.
**What:** Build `<PressableCard>` wrapper using `react-native-reanimated`. Use it everywhere a card or button is tappable.
**Effort:** S-M (1-2 days).
**Leverage:** Pervasive felt-quality lift.
**From:** `02-modern-patterns-checklist.md` #13.

**Tier 1 total: ~10-12 dev days. Closes the biggest "outdated execution" gaps.**

---

## Tier 2 — Ship in weeks 3-6 (the "starts to feel premium" sprint)

### T2.1 — Bottom sheets for secondary modals
**Why:** Fullscreen modals for transient surfaces (NPS, freeze offer, journal entry) are heavy. Bottom sheets are the modern pattern.
**What:** Add `react-native-bottom-sheet`. Build `<BrandSheet>`. Migrate 5 secondary modals (keep BrandModal for true takeovers like Welcome-to-Pro and CancelFlow).
**Effort:** M (3-5 days).
**From:** `02-modern-patterns-checklist.md` #5 + `04-replaceable-patterns.md` R-2.

### T2.2 — Swipe-between-days on Today
**Why:** Frees ~60pt of prime real estate. Date navigation should be a gesture, not a tab pill.
**What:** Replace floating tab pill with horizontal pager (`react-native-pager-view`). Add swipe gesture for yesterday/today/tomorrow.
**Effort:** M (2-3 days).
**From:** `02-modern-patterns-checklist.md` #8 + `04-replaceable-patterns.md` R-4.

### T2.3 — Bento dashboard on Today (top half)
**Why:** Closes the biggest placement gap vs The Pattern + Calm. Asymmetric grid > stacked feed.
**What:** Redesign top portion of Today tab — hero briefing + 3-cell bento (Today's sky / Streak / Quest of the day) + life areas as horizontal stack. The lower half stays as cards for now.
**Effort:** M-L (4-6 days incl. visual design).
**From:** `01-placement-by-screen.md` Today section + `03-comparative-visuals.md` Calm/Pattern.

### T2.4 — Live Activity for transit alerts
**Why:** Lock-screen presence for time-sensitive cosmic events. Modern iOS pattern.
**What:** When a transit window opens, push a Live Activity with countdown. Dynamic Island shows compact glyph.
**Effort:** M (3-5 days, native Swift via ActivityKit).
**From:** `02-modern-patterns-checklist.md` #2-3.

**Tier 2 total: ~15 dev days.**

---

## Tier 3 — Ship over weeks 7-12 (the "competitive on every dimension" sprint)

### T3.1 — Animated chart wheel
**Effort:** M (3-5 days)
**From:** `04-replaceable-patterns.md` R-5

### T3.2 — Voice input on chat + journal
**Effort:** M (3-5 days)
**From:** `02-modern-patterns-checklist.md` #15

### T3.3 — Floating-pill tab bar (replace standard tab bar)
**Effort:** S-M (1-2 days)
**From:** `04-replaceable-patterns.md` R-10

### T3.4 — Custom monochrome icon library (12-15 icons)
**Effort:** L (1-2 weeks; needs designer)
**From:** Design-audit DA-3.1

### T3.5 — Card-stack with momentum-swipe for life areas
**Effort:** M (2-3 days)
**From:** `04-replaceable-patterns.md` R-8

### T3.6 — Screen-specific hero treatments
**Effort:** M (4-6 hours per screen × 5)
**From:** `04-replaceable-patterns.md` R-7

### T3.7 — Compact greeting hero
**Effort:** S (1-2 hours)
**From:** `04-replaceable-patterns.md` R-11

### T3.8 — Branded loading copy library
**Effort:** S (2-3 hours)
**From:** `04-replaceable-patterns.md` R-9

### T3.9 — Pull-to-refresh on Today + Reports + Chat history
**Effort:** S (1 hour per screen)
**From:** `02-modern-patterns-checklist.md` #7

### T3.10 — Friends-on-Today (Co-Star pattern)
**Effort:** M (~3 days; needs at least Phase A social from `plan/competitive-audit/05-action-plan.md`)
**From:** `03-comparative-visuals.md` Co-Star section

**Tier 3 total: ~25 dev days + 1-2 weeks designer time.**

---

## What I'd defer indefinitely

| Item | Why defer |
|---|---|
| Variable fonts | Marginal benefit, niche win |
| 3-level theme (Dim) | Audience can be served by Light/Dark; not worth the complexity |
| Adaptive icon (iOS 18 tinted) | 30-min polish item, ship in next major release as a freebie |
| Shared element transitions | High effort, modest reward; come back to it once the basics are modern |
| Interactive widgets | Build *after* basic widgets prove themselves |

---

## Anti-recommendations (do NOT ship)

These look like they should be on the list but explicitly aren't:

- ❌ **Don't add tarot iconography or chakra rainbows.** The audience escaped these.
- ❌ **Don't add live human astrologers.** Wrong lane (Sanctuary/Nebula).
- ❌ **Don't change the typography or palette.** Moats.
- ❌ **Don't redesign the tab bar to be "fun."** Restraint is the brand.
- ❌ **Don't gamify harder.** The streak/XP/badge system is already best-in-category; pushing further would feel like Duolingo, which doesn't fit the audience.
- ❌ **Don't add a "social feed" or community tab.** That's a different product. Friend graph (Co-Star pattern) yes; community feed no.

---

## What success looks like 12 weeks out

If Tier 1 + Tier 2 ship:

- **D7 retention curve shifts up** because widgets bring users back without opening the app.
- **App Store reviews mention "feels premium"** instead of "looks beautiful but..."
- **Power-user retention strengthens** because chat streaming + skeleton loaders + bottom sheets + bento layout fix the daily-friction moments.
- **The brand goes from "best typography in category" to "best typography AND best execution in category."** That's the actual win.
- **Senior-design score moves from 7.5/10 to 9/10** by my framework.

---

## What success looks like 24 weeks out

Tier 1 + 2 + 3 shipped:

- **Live Activities + widgets + animated chart** make Celestia feel like an iOS-native app, not a React Native app.
- **Streaming chat + voice input + bottom sheets** make AI feel cutting-edge.
- **Custom icon library + screen-specific heroes** give the brand visual depth that matches the typography depth.
- **Friends-on-Today** closes the biggest placement gap vs Co-Star.

At that point: **Celestia would be a clear #1 in the category for design.** Co-Star wins on push virality + brutalist conviction; Celestia wins on every other dimension.

---

## The single sentence

> **Ship Tier 1 (10-12 days). Then assess.** Most apps can't justify the full Tier 2-3 plan, but if Tier 1 moves the metrics, Tier 2 is fast-follow ROI work.

The rest is for when you have a designer hire + a more dedicated mobile engineer. Until then, the brand is doing the work, and Tier 1 is the smallest-cost, highest-impact closing-of-the-execution-gap available.

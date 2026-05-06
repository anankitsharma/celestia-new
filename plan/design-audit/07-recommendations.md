# Recommendations

Prioritized list of design fixes from the audit. Ranked by **leverage / effort**.

Each item is tagged with which audit doc identified it, expected effort, and impact on the target user (the Inner-Work Practitioner per `01-target-audience.md`).

## Tier 1 — Ship now (≤1 day total)

### DA-1.1 — Migrate `T.stone` raw-token usages to `colors.textSecondary`
- **Source:** `02-color-audit.md`
- **What:** grep for direct `T.stone` usage in components; replace with theme-context `colors.textSecondary` (already fixed at #6B6555 for AA contrast).
- **Effort:** S (~30 min — single grep + edit pass)
- **Impact:** closes the last WCAG AA contrast failure. Required for App Store accessibility compliance.

### DA-1.2 — Audit and reduce gold-on-cream body text
- **Source:** `02-color-audit.md`
- **What:** find any `color: T.gold` on body-sized text in light mode. Either upsize to ≥18pt or change to `colors.text` / `colors.textSecondary`.
- **Effort:** S (~1 hour)
- **Impact:** body text becomes legible for the 5-10% of users with marginal vision. Brand "looks expensive" without sacrificing readability.

### DA-1.3 — Rewrite milestone messages to match voice guide
- **Source:** `06-voice-and-copy.md`
- **What:** rewrite the 7 messages in `getMilestoneMessage()` in `streakService.js` to remove exclamation marks + match the voice guide's literary register.
- **Effort:** S (~30 min)
- **Impact:** removes the most visible brand-voice drift in the app.

### DA-1.4 — Establish kicker tracking constant
- **Source:** `03-typography-audit.md`
- **What:** add `KICKER_TRACKING = 1.6` to `tokens.js`. Replace inline `letterSpacing: 1 / 1.5 / 1.6 / 1.8 / 2` with the constant in kicker styles.
- **Effort:** S (~45 min)
- **Impact:** subtle but real. The eye perceives "consistent typographic detail" without knowing why.

## Tier 2 — Ship within 1-2 weeks (~2 days total)

### DA-2.1 — Spacing system tokens + first refactor
- **Source:** `04-hierarchy-and-layout.md`
- **What:** add `SPACING = { xxs:4, xs:8, sm:12, md:16, lg:24, xl:32, xxl:48, hero:64 }` to `tokens.js`. Refactor HomeScreen + WelcomeScreen + ProfileScreen to use it. Defer other screens to a follow-up sweep.
- **Effort:** M (~4-6 hours for the three target screens)
- **Impact:** establishes the rhythm. Visible to careful eyes; transformative to long-term consistency.

### DA-2.2 — Type scale tokens + first refactor
- **Source:** `03-typography-audit.md`
- **What:** add `TYPE_SCALE = { caption, small, body, bodyLg, h4, h3, h2, h1, display }` to `tokens.js`. Refactor HomeScreen + ProfileScreen + CancelFlowScreen to consume it. Defer others.
- **Effort:** M (~4-6 hours)
- **Impact:** compresses 20+ inline sizes to 8 deliberate ones. Fixes hierarchy ambiguity.

### DA-2.3 — Extract `<BrandModal>` component
- **Source:** `04-hierarchy-and-layout.md`
- **What:** the 7+ modals (freeze offer, NPS, streak restore, D30 callback, recap modals, surprise insight modal, etc.) all share the same gradient-card-overlay pattern. Extract to `src/components/BrandModal.js`. Refactor existing modals to use it.
- **Effort:** M (~3-4 hours)
- **Impact:** locks in modal consistency. Future modals can't drift.

### DA-2.4 — Card-tier hierarchy enforcement on Today tab
- **Source:** `04-hierarchy-and-layout.md`
- **What:** apply the TIER 1 / TIER 2 / TIER 3 hierarchy from the shipped doc. Specifically:
  - Tier 1 (navigator briefing) — increase visual weight: stronger background contrast, slightly larger headline, more vertical space
  - Tier 2 featured cards — confirmed gold-border + GOLD_ALPHA.subtle bg
  - Tier 3 — reduce visual weight: lower opacity backgrounds, secondary type weight, more restraint
- **Effort:** M (~4-6 hours including visual QA)
- **Impact:** the single most impactful design change for everyday Today-tab use.

## Tier 3 — Ship within 1 month (~3-5 days)

### DA-3.1 — Custom monochrome SVG icon library
- **Source:** `05-iconography.md`
- **What:** build 12-15 custom icons replacing platform emoji in life areas, content tags, and contextual chrome (love, career, growth, etc.). 16-24pt, `currentColor`, 1-2px stroke.
- **Effort:** L (~1-2 days incl. design + integration)
- **Impact:** fully closes the emoji-typography clash. Brand reads as cohesive top-to-bottom.

### DA-3.2 — Disabled / focus / loading state tokens + components
- **Source:** `02-color-audit.md` + `04-hierarchy-and-layout.md`
- **What:**
  - Disabled state: opacity token + color override
  - Focus state: visible focus ring color + outline (for accessibility)
  - Loading state: standard spinner + text component pattern
- **Effort:** M (~4-6 hours)
- **Impact:** unblocks the next accessibility-audit pass. Makes the app keyboard-navigable.

### DA-3.3 — Animation timing tokens
- **Source:** `04-hierarchy-and-layout.md`
- **What:** add `MOTION = { fast:200, base:300, slow:500, hero:800 }` to `tokens.js`. Refactor existing inline durations.
- **Effort:** S-M (~2 hours)
- **Impact:** subtle. Movement starts to feel intentional rather than ad-hoc.

### DA-3.4 — Empty states for Journal / Chat / Reports / Circle
- **Source:** `06-voice-and-copy.md`
- **What:** design + ship empty state for each. Voice: name what's missing, explain why it matters, offer one action.
- **Effort:** M-L (~4-8 hours including copy + visual)
- **Impact:** brand voice extends to currently-silent moments. Activation loop strengthens (empty = call to action).

### DA-3.5 — "Cosmic" cleanup pass
- **Source:** `06-voice-and-copy.md`
- **What:** halve the user-facing usages of "cosmic." Keep where it's the right word (cosmic season, cosmic identity); replace where it's filler ("your cosmic story" → "your story").
- **Effort:** S (~1-2 hours)
- **Impact:** voice tightens. Brand stops being defined by an over-used adjective.

### DA-3.6 — Touch-target audit + hitSlop sweep
- **Source:** `04-hierarchy-and-layout.md`
- **What:** find every TouchableOpacity below 40pt total touch area. Add `hitSlop` props. Ensures iOS HIG compliance.
- **Effort:** S-M (~2-3 hours)
- **Impact:** improves usability for users with larger fingers / motor issues. Incremental but real.

## Tier 4 — Defer (over 1 month, scoped per quarter)

### DA-4.1 — Full-app spacing/type token migration
- Continuation of DA-2.1 + DA-2.2 across all remaining screens.
- Scoped per quarter as part of regular dev work.

### DA-4.2 — Color-blindness simulator pass
- Run app screenshots through Sim Daltonism / Color Oracle.
- Spot fixes for any failure modes (life-area cards, energy scores, match scores).
- Scope: 1 day for QA + fixes.

### DA-4.3 — Loading-state copy library
- Replace generic "Loading..." with branded "Reading the sky..." / "Asking the chart..." / "Mapping the synastry..."
- Per `loading-states` skill methodology.
- Scope: 0.5 day.

### DA-4.4 — Tonal scale (50-950) for primary + neutral
- Per `color-system` skill best practice.
- Generates a full 11-step scale for navy + gold + ink.
- Used as foundation for future component states + variants.
- Scope: 1 day.

### DA-4.5 — Pattern library entry per design pattern
- Document the 8-10 patterns: hero, card-tier-1/2/3, button-primary/secondary/ghost, modal, kicker, reveal-statement-card, etc.
- Per `pattern-library` skill methodology.
- Scope: 2-3 days.

## Sprint suggestion

**Sprint 1 (Today)**: DA-1.1 + 1.2 + 1.3 + 1.4 — "small wins" sprint. ~3 hours total.

**Sprint 2 (Next session)**: DA-2.1 + 2.2 + 2.3 + 2.4 — "tokenization + hierarchy" sprint. ~1.5-2 days.

**Sprint 3 (Backlog)**: DA-3.x — pick the highest-leverage 2-3 items based on what's most visible to users.

## What this audit doesn't recommend

- ❌ Don't change the brand palette. Hold the navy/gold/cream.
- ❌ Don't change the typography pairing. Playfair + DM Sans is right.
- ❌ Don't add cosmic gradient backgrounds, tarot illustration, chakra rainbows, or new-age vocabulary. The audience explicitly avoids these.
- ❌ Don't add color-coded streak badges (going from gold-only to multi-color would weaken the brand).
- ❌ Don't reduce the navigator long-form voice — that's the strongest copy in the app.
- ❌ Don't replace the real chart wheel with stylized illustration.

## Audit total

The design system is **structurally sound** for the target audience. The gaps are all execution-level (consistency, enforcement, polish) rather than strategic.

Ship Sprint 1 + Sprint 2 over the next 2 sessions and the design score moves from 7.6/10 to ~9/10. The remaining 1.0 is the slow polish work that unfolds over months.

## Score progression

| Phase | Score |
|---|---|
| Before this audit | 7.6/10 |
| After Sprint 1 (small wins) | 8.2/10 |
| After Sprint 2 (tokens + hierarchy) | 9.0/10 |
| After Sprints 3-4 (pattern + polish) | 9.5/10 |

That's the realistic ceiling for a single-developer mobile app. Beyond 9.5 requires a dedicated design hire + months of pattern-library work, which is overinvestment for the current stage.

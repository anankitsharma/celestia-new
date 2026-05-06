# Gaps & Opportunities

The actionable findings from the competitive audit. Each gap is paired with a recommendation. Prioritized by leverage / effort.

---

## Gap 1 — No memorable push voice (priority: HIGH)

### What competitors do
**Co-Star's pushes are screenshot-and-share viral.** Examples in the wild:
- "Your heart busts its knuckles against society"
- "be slow and strategic like a mushroom"
- "start a cult"
- "do your laundry. Fold it immediately."

These get tweeted, posted to Instagram, written about in Daily Dot articles, made into Know-Your-Meme entries. Free distribution channel.

### What Celestia has today
Pushes are personalized, well-targeted, and informational. Examples:
- "Day 2. Almost at first milestone (⭐ 3-day streak)"
- "Your trial ends in 2 days. 5 journal entries, 12 chats so far"
- "🔥 One more morning to hit your first 7-day streak"

These are *better at retention* than Co-Star's. They're *worse at memorability*.

### Why this matters
Memorable pushes are a free customer acquisition channel. One viral screenshot reaches more people than $1000 of paid ads.

### Recommendation
**Develop a "voice guideline" for push notifications separate from in-app voice.** Keep navigator-tone for long-form briefings. For pushes, layer in a more literary register — short, specific, slightly unsettling, never generic.

Specific changes to ship:
- New copy variants for `cm_d1_personal`, `cm_internal_trigger_*`, anticipation pushes — written by someone with copywriting craft, not just by Gemini
- Keep the personalization data structure; replace the body templates
- A/B test memorable vs informational copy via PostHog feature flag (the framework already exists from cancel_flow_variant)

**Effort:** S (copy work, no architecture change)
**Impact:** HIGH (organic distribution + brand differentiation)
**Whose problem to solve:** copywriting skill or human copywriter

---

## Gap 2 — No social graph (priority: HIGH)

### What competitors do
**Co-Star's friends list is the killer retention feature.** Users open the app to see:
- Who added them as a friend (notification)
- New compatibility scores with friends
- What their friend's "day at a glance" looks like

It's a self-reinforcing loop. The more friends someone has on Co-Star, the more reasons they have to open the app.

The Pattern has Bonds — softer version, same idea.

### What Celestia has today
Circle is **private and one-way.** You add other people's charts to your Circle. They never see you back. You don't see *them* updating their charts. There's no notification when a friend on Celestia adds you.

This makes Circle essentially a contact list, not a social graph.

### Why this matters
Social graph retention is K-factor: each user that joins increases retention for users they connect with. Celestia is missing this multiplier.

### Recommendation
**Build a minimal opt-in social layer** that doesn't require a full backend:

**Phase A (no-backend, ships now):**
- When user A invites user B via the existing `inviteService`, upon B's app install/onboarding completion, surface a "X invited you to their Circle" prompt
- B can accept, which triggers a one-time event to A: "B accepted your invite — see your dynamic"
- This requires a small server-side relay (could be Supabase Edge Function — the project already uses Supabase for auth)

**Phase B (small backend):**
- Two-way Circle entries: when both users are app users AND both have added each other, both see "you and X have synastry" updates
- Notification when a Circle member's transit window opens for synastry alignment
- Anonymous "your Circle members felt off today" aggregation

**Phase C (full social):**
- Friends list visible in app
- Daily push: "X just opened the app — they're in their Mars-square-Pluto window"

### Effort tiers
- Phase A: M (Supabase function + invite-acceptance flow)
- Phase B: L (data model + UI for two-way state)
- Phase C: XL (full social + notifications + abuse handling)

**Recommendation: ship Phase A immediately.** Phase B/C only after A validates user demand.

**Impact:** HIGH (closes the biggest competitive gap; could be 2-3x retention boost based on Co-Star case study)

---

## Gap 3 — Iconography clashes with editorial typography (priority: MEDIUM)

### What's wrong
Celestia's typography (Playfair Display + DM Sans) reads as luxury-editorial. The emoji used in retention copy (🔥 ⭐ ✨ 💎 ❄️ etc.) reads as gaming-app. The mismatch is jarring on close inspection.

Co-Star uses zero emoji. The Pattern uses zero emoji. Both have weaker engagement systems but more consistent visual identity.

### Recommendation
**Replace narrative-context emoji with custom typographic glyphs.** Keep emoji on badges (they ARE the iconography of badges; users recognize them).

| Current emoji | Suggested replacement |
|---|---|
| 🔥 (fire / 7-day streak) | A custom flame glyph or `✦` with a hot-color tint |
| ⭐ (star / 3-day) | `★` (proper typographic star) |
| ✨ (sparkle / 30-day) | `✶` |
| 💎 (diamond / 100-day) | `◇` or custom diamond outline |
| ⚡ (bolt / 14-day) | `⌁` or custom bolt |
| ❄️ (freeze) | `❅` |

These are typographic characters available in standard Unicode + most fonts. They feel intentional, not platform-default.

### Effort: S (constant changes in `streakService.js`, `badges.js`, push templates)
### Impact: MEDIUM (brand consistency; doesn't move retention numbers but makes the app feel more premium)

---

## Gap 4 — Card soup on Today tab (priority: MEDIUM)

### What's wrong
Today tab has 16+ possible card types. On a typical day, 8-10 are visible. Visual hierarchy is hard to maintain.

Competitors do less per screen:
- Co-Star: hero + chart + 1-2 cards
- The Pattern: hero card + tabs (one focus per tab)
- Sanctuary: tabs separate the layers
- Nebula: hero + 3 metrics + advisor browse

Celestia tries to do everything on the home tab, which works for power users but overwhelms new ones.

### Recommendation
**Establish a visual hierarchy with three weights:**

1. **Hero (one per session)** — the navigator briefing card. Largest, most distinct background, top of scroll.
2. **Featured (1-2 per session)** — surprise insight, indecision callout, at-risk banner, Pro insight (whichever is active). Distinct gold-accent border.
3. **Standard (the rest)** — life areas, energy scores, journals, quests, sky. Subtle backgrounds, secondary type weight.

Then audit each card to make sure it falls into the right tier. Currently many cards have equal weight, which is the source of card-soup.

Specific changes:
- Navigator briefing: stronger background, larger headline (already mostly done)
- Featured cards: existing gold-border treatment is correct; ensure there's never more than 2 simultaneously visible
- Standard cards: reduce border opacity, smaller headings, more visual restraint

**Effort:** M (style audit + adjustments across HomeScreen)
**Impact:** MEDIUM (reduces overwhelm for new users; helps activation funnel)

---

## Gap 5 — Inconsistent border-radius and color-opacity scales (priority: LOW)

### What's wrong
Border radius uses 12 / 14 / 16 / 18 / 24 / 36 across the codebase. Gold opacity uses 0.06 / 0.08 / 0.12 / 0.15 / 0.18 / 0.22 / 0.32 / 0.55 / etc.

Both should be a small finite set.

### Recommendation
**Establish design tokens:**

```js
// src/constants/tokens.js (new file)
export const RADIUS = {
  sm: 8,    // chips, small buttons
  md: 14,   // cards
  lg: 24,   // hero corners, large modals
  pill: 999,
};

export const OPACITY = {
  subtle: 0.06,   // backgrounds
  border: 0.18,   // standard borders
  emphasis: 0.32, // strong borders
  text: 0.55,     // text-weight accents
};
```

Then refactor `HomeScreen.js`, `WelcomeToProScreen.js`, `CancelFlowScreen.js`, `ProfileScreen.js` to use the tokens.

**Effort:** S (single refactor pass)
**Impact:** LOW (visual consistency; not user-visible but improves dev velocity)

---

## Gap 6 — Light-mode contrast may not meet WCAG AA (priority: MEDIUM)

### Suspected issue
`T.stone` (#97907F) on `T.cream` (#FAF8F2) in light mode is around contrast ratio 3.0:1 — fails WCAG AA for normal text (requires 4.5:1) and borderline-fails AA Large.

### Recommendation
Run the `accessibility-audit` skill across all screens. Specifically check:
- All `T.stone` text usages in light mode
- Gold accent text on cream backgrounds
- Disabled state opacity (currently 0.5 in some places)
- Touch target sizes (44pt minimum on iOS)

### Effort: M (audit + remediation)
### Impact: MEDIUM (App Store accessibility is increasingly enforced + opens user base to vision-impaired users)

---

## Gap 7 — No daily share-card with viral potential (priority: MEDIUM)

### What competitors do
- **Co-Star**: pushes themselves go viral when screenshotted
- **The Pattern**: "Your Pattern" personality portrait is shareable
- **Both**: users do this organically without prompting

### What Celestia has
Multiple share cards (DailyShareCard, DailyStoryCard, WhisperShareCard, MatchStoryCard, CompatibilityShareCard). These are well-built but don't seem to be going viral.

### Why
Three reasons:
1. **No single iconic asset** — lots of share options dilutes which one is "THE" Celestia share moment
2. **Visual identity isn't quote-able** — Co-Star's notifications are shareable because they're TEXT (anyone can re-tweet text). Celestia's share cards are images that need a different sharing affordance.
3. **No recurring share moment** — Co-Star users habitually screenshot the daily push; Celestia has no equivalent recurring moment

### Recommendation
**Identify the ONE Celestia share asset and make it the moment.**

Options:
- A. **The first reveal statements from WelcomeScreen** ("You only fully feel yourself when reflected in someone else's eyes" for 7H moon) — these ARE quote-worthy. Build a one-tap "share this insight" button and make it the post-onboarding ritual.
- B. **The daily "PRO INSIGHT" card** — only Pro users see it; could position as "exclusive" share content
- C. **The D7 first-week recap** — share-ready by design but rare (one per user)
- D. **The morning push itself** — if Gap 1 is fixed (memorable voice), the push becomes the share asset

**Recommendation: B + D.** Build push memorability AND make the daily Pro insight the defining share moment for paid users.

**Effort:** M (share-card design + share affordance + analytics)
**Impact:** HIGH if it works (organic acquisition); MEDIUM otherwise

---

## Gap 8 — No "moment of being seen" beyond the chart reveal (priority: MEDIUM)

### What The Pattern does
"Your Pattern" personality portrait is the moment that goes viral. Channing Tatum's 2019 video reaction was him reading his Pattern out loud and saying "this is freaking me out."

Celestia's equivalent: the WelcomeScreen reveal statements (MOON_HOUSE_INSIGHTS / SUN_MOON_COMBOS / VENUS_SIGN_INSIGHTS). Excellent content, hit once at onboarding, then never resurface.

### Why this matters
The Pattern's portrait is referenced by users for years after onboarding. Celestia's reveal statements are seen once and forgotten.

### Recommendation
**Resurface the reveal statements throughout the user lifecycle:**
- Day 7: in the first-week recap, reference one of them ("Remember that thing about your moon? Here's how it showed up this week.")
- Day 30: full re-reveal with new statements pulled from the same lookup tables
- Anniversary (1 year): full retrospective featuring multiple statements
- Make the WelcomeScreen reveal statements **shareable** as cards (currently they're just on-screen text)

**Effort:** S–M (re-use existing statements in new contexts)
**Impact:** MEDIUM (deepens emotional engagement; supports virality if statements become share-worthy)

---

## Gap summary table

| # | Gap | Priority | Effort | Impact | Code-buildable? |
|---|---|---|---|---|---|
| 1 | Memorable push voice | HIGH | S | HIGH | Yes (copy work) |
| 2 | Social graph | HIGH | M-XL phased | HIGH | Phase A yes; B/C need backend |
| 3 | Emoji-typography clash | MEDIUM | S | MEDIUM | Yes |
| 4 | Card soup on Today | MEDIUM | M | MEDIUM | Yes |
| 5 | Inconsistent tokens | LOW | S | LOW | Yes |
| 6 | Light-mode contrast | MEDIUM | M | MEDIUM | Yes (accessibility-audit skill) |
| 7 | No iconic share moment | MEDIUM | M | HIGH if works | Yes |
| 8 | Reveal statements one-shot | MEDIUM | S-M | MEDIUM | Yes |

**Six of eight are fully code-buildable now. One needs a tiny backend (Supabase function for Phase A social). Two are content/copy work.**

See `05-action-plan.md` for prioritized sequencing.

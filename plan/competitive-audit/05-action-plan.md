# Action Plan

What to ship next, prioritized by leverage / effort. Sequenced so the highest-impact items go first.

## Sprint A — High-leverage quick wins (this week)

| # | Item | Effort | Why now |
|---|---|---|---|
| **A1** | Replace narrative emoji with custom glyphs (Gap 3) | S | Brand consistency; fixes the "feels gamey vs feels editorial" mismatch in 2-3 hours |
| **A2** | Light-mode contrast audit + fixes (Gap 6) | M | Pre-App Store submission; accessibility increasingly enforced. Run `accessibility-audit` skill |
| **A3** | Design tokens (RADIUS + OPACITY) (Gap 5) | S | Single refactor that prevents drift; useful before more code lands |
| **A4** | Resurface WelcomeScreen reveal statements at D7 + D30 (Gap 8 light version) | S | Existing data, new triggers; deepens emotional retention |

**Sprint A total:** ~1 day of focused work. All four are independent and can ship in parallel or sequence.

---

## Sprint B — Brand voice + virality (next 1-2 weeks)

| # | Item | Effort | Why next |
|---|---|---|---|
| **B1** | Push notification voice rewrite — develop and ship a "voice guideline" for pushes; rewrite the templates with literary register (Gap 1) | M | Single biggest organic-distribution lever the audit identified |
| **B2** | A/B test memorable vs informational push copy via PostHog feature flag | S | Validates B1 works (or doesn't) before doubling down |
| **B3** | Card-soup hierarchy fix on Today tab (Gap 4) | M | Reduces overwhelm during activation window; should move D1→D7 retention |
| **B4** | Iconic share moment — make Pro daily insight + memorable pushes the share moments (Gap 7) | M | Closes a real gap vs Co-Star (the only screenshot-able astrology app) |

**Sprint B total:** ~3-4 days of focused work.

---

## Sprint C — Social graph Phase A (2-3 weeks)

| # | Item | Effort | Why later |
|---|---|---|---|
| **C1** | Supabase Edge Function: relay invite-accepted events between users | M | Foundation for any social layer — touches infrastructure |
| **C2** | "X added your chart" prompt when an invite-recipient adds you back | S | The first true social moment; closes Gap 2 partially |
| **C3** | Push notification: "X is in their [transit] window — here's your synastry" | M | The recurring trigger that makes social retentive |
| **C4** | Two-way Circle UI — show which Circle entries are mutual | S | Visual reinforcement of the social state |

**Sprint C total:** ~5-7 days. Largest of the three sprints; needs Supabase function dev + invite-flow QA.

**Note:** Sprint C is the only one in this plan that requires backend work. If you want to defer infrastructure, ship A + B first and validate retention impact before building social.

---

## Sprint D — Long-tail (later)

These are documented but lower-priority:

| # | Item | Why later |
|---|---|---|
| Live human readings (vs Sanctuary/Nebula) | Requires astrologer supply + payment ops; not a code-only build |
| Celebrity endorsement push | Marketing/PR work, not code |
| Full friends list with feed | Sprint C Phase B/C; only after Phase A validates |

---

## Sprint A detail — what to actually do

### A1 — Custom glyphs replacing narrative emoji

**Files to touch:**
- `src/services/streakService.js` — `getStreakEmoji()` returns ✦ → ★ → ✶ → ⌁ → ❅ → ◇ instead of platform emoji
- `src/services/notificationContentEngine.js` — anticipation push templates use new glyphs
- `src/screens/HomeScreen.js` — wherever streak emoji renders inline

**Test:** check that the glyphs render identically across iOS/Android (some Unicode varies). Use a font with strong typographic Unicode coverage; DM Sans + Playfair handle these well.

**Estimated time:** 1.5 hours.

### A2 — Light-mode contrast audit

**Approach:** Use the `accessibility-audit` skill against:
- HomeScreen (light mode)
- ProfileScreen (light mode)
- ChatScreen (light mode)
- WelcomeToProScreen (always dark — verify dark mode contrast)

**Likely findings + fixes:**
- `T.stone` text on cream backgrounds: tighten to a darker stone for light mode (`#7A7363` instead of `#97907F`)
- Gold text in light mode: ensure size ≥ 15pt or contrast ≥ 3:1 (Large) / 4.5:1 (Normal)
- Disabled states: ensure opacity ≥ 0.4

**Estimated time:** 2-3 hours.

### A3 — Design tokens

**Create:** `src/constants/tokens.js` with `RADIUS` and `OPACITY` exports as proposed in Gap 5.

**Refactor:** find and replace inline values in HomeScreen, WelcomeToProScreen, CancelFlowScreen, ProfileScreen. Don't refactor every file at once — start with the 4 most-touched screens.

**Estimated time:** 2 hours.

### A4 — Resurface reveal statements

**Day 7 trigger:** in `generateFirstWeekRecap` Gemini call, pass the user's first reveal statement as context. Reference it once in the recap body.

**Day 30 trigger:** add a new "month one — what you've learned" card on Day 30 that re-shows the reveal statements + adds new ones from the same lookup tables (with progression — e.g., on month 1 show the statements they got at onboarding + 1 new one from a different placement).

**Files:** `geminiService.js` (extend prompt), `HomeScreen.js` (D30 trigger), `storage.js` (store FIRST_REVEAL_STATEMENT — already done in FINAL-4).

**Estimated time:** 3 hours.

---

## Sprint B detail — push voice rewrite

This is the highest-leverage item in the entire audit. Treat it carefully.

### Step 1 — Voice guidelines doc
Write a 1-page voice guide for push notifications specifically. It should specify:
- **Register**: literary, slightly unsettling, never generic
- **Length**: ≤ 80 chars (preview), ≤ 180 chars (expanded)
- **POV**: second-person you, mostly imperative or observational
- **What NOT to do**: no exclamation marks, no emoji except 1 sparing accent, no "✨ cosmic ✨" generic horoscope language, no "stars align"
- **Examples** (good + bad) for each push type

### Step 2 — Rewrite the existing templates
Files: `notificationContentEngine.js`. Targets:
- COSMIC_MORNING templates (esp. internal-trigger ones for week 3+)
- LAPSED templates (already personalized — make them MORE memorable)
- Anticipation pushes (D6/13/27)
- Pro discovery pushes
- Trial-end push

Either:
- Have a copywriter do this (recommended)
- Use the `copywriting` skill to draft, then human-review
- Self-write with the voice guide as the constraint

### Step 3 — A/B test framework
PostHog feature flag `push_copy_variant` with two variants: `informational` (existing) vs `literary` (new). Cohort by app open rate within 6h of push delivery. Validate before rolling out 100%.

### Step 4 — Measure
Targets:
- Push open rate: literary variant should beat informational by ≥ 15%
- D7 retention: literary variant cohort should match or beat informational
- Organic mentions: track if the pushes start appearing in social media (manually monthly)

### Estimated total Sprint B effort: 3-4 days

---

## Sprint C detail — social graph Phase A

### Architecture
The app already uses Supabase for auth (see `src/services/supabase/client.js`). Adding a small Edge Function for social events is low-cost.

**Required server-side:**
- A `social_events` table: `id, from_user_id, to_user_id, event_type, payload, created_at`
- An Edge Function that's called when invite-acceptance happens, writing a `chart_added` event for the inviter
- Push notification trigger when a new event lands for a user

### Client-side changes
- `inviteService.js` — call the Edge Function when invite is accepted
- `notificationService.js` — poll for or subscribe to new social events; surface as pushes
- `CompatibilityScreen.js` — show a "X added you back" banner

### Privacy / abuse handling
- Default opt-in but with explicit per-event opt-out
- Never expose the from_user's birth data to to_user (only the synastry result)
- Rate-limit social events (e.g., max 3 per day per user)

### Estimated Sprint C effort: 5-7 days

---

## Recommended order

If you want to ship maximum impact for minimum time:

**Week 1:**
- Day 1: A3 (tokens) + A1 (glyphs) — small, foundational
- Day 2-3: A2 (contrast audit) + A4 (reveal statements resurface)
- Day 4-5: B1 step 1 (voice guidelines) + B1 step 2 (rewrite templates)

**Week 2:**
- Day 1-2: B2 (A/B framework) + B3 (card hierarchy)
- Day 3-5: B4 (iconic share moment design + ship)

**Week 3-4:**
- Sprint C if data from Week 2 supports it; otherwise iterate on B

**Total to fully close all 8 gaps: ~4 weeks of focused work, code-side only.**

---

## What this plan does NOT do

- **Does not change the engagement system.** It's already best-in-category. Don't fix what works.
- **Does not change the navigator voice** in long-form briefings. That's a moat.
- **Does not chase Co-Star's brutalist aesthetic.** Celestia's editorial-luxury palette is a moat too.
- **Does not require pricing changes.** Subscription work is separate (covered in `plan/improve-retaition/`).
- **Does not require additional Gemini integrations.** Existing 3-model fallback is sufficient.

---

## Acceptance for the whole audit

This audit succeeds if, at the end of Sprint A + B + C:
- Push open rate climbs ≥ 15% (Gap 1 fixed)
- ≥ 30% of new users get an "X added you" social moment within their first 30 days (Gap 2 Phase A fixed)
- WCAG AA contrast violations are zero (Gap 6 fixed)
- Today tab visual hierarchy is one-glance comprehensible (Gap 4 fixed)
- Three months in, organic mentions of Celestia push notifications appear in at least one screenshot on Twitter/Instagram (Gap 1 + 7 working)

Track each in PostHog cohorts.

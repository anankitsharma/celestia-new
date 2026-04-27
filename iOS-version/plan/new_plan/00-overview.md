# V1.x Relationship-First Overhaul — Plan

**Goal:** Eliminate the remaining "horoscope app" surfaces from the default user flow so an Apple reviewer scanning the app for 30 seconds reads it as a relationship/pattern app, not a daily-content astrology app.

**Constraint:** Keep the core engine intact. We are reshaping the surface, not rewriting the app. Every astrology feature stays — it just moves off the default flow.

**Mental model:** Two windows.
- *Default surface (what Apple sees):* relationship pattern recognition tool.
- *Opt-in surface (what astrology-curious users find one tap away):* the full chart, transits, sign details, deep dives.

The `showAstrology` toggle in Profile is the gate between them. This plan extends that gate to the surfaces still leaking astrology by default.

---

## Priority order

Each item is a self-contained spec in this folder. Implement in order — earlier items have the biggest 4.3(b) impact and unblock later ones.

| # | Spec | Surface | Impact | Est. effort |
|---|------|---------|--------|-------------|
| 1 | [01-today-restructure.md](01-today-restructure.md) | Today tab | **Highest** — biggest single move | 2–3 hr |
| 2 | [02-reports-rebrand.md](02-reports-rebrand.md) | Reports stack | High — second-strongest 4.3(b) tell | 1 hr |
| 3 | [03-journal-gating.md](03-journal-gating.md) | Journal stack | Medium — astro on a non-opt-in screen | 30 min |
| 4 | [04-profile-glyph-fix.md](04-profile-glyph-fix.md) | Profile hero | Low (bug fix) | 5 min |
| 5 | [05-todays-sky-gating.md](05-todays-sky-gating.md) | TodaysSky stack | Medium — pure astro entry from Today | 30 min |
| 6 | [06-connections-cleanup.md](06-connections-cleanup.md) | Connections tab | Medium-low — orbit + celebrity feature | 1 hr |
| — | [99-implementation-order.md](99-implementation-order.md) | — | sequenced rollout + verification gates | — |

Estimated total: **~6 hours of focused work** (excluding owner manual tasks).

---

## What's already done (for context)

These shipped in earlier sprints — this overhaul builds on them:
- `showAstrology` toggle in Profile (default OFF)
- Discovery banner on Profile (first 3 visits)
- V1 language override on Gemini (3-part response, no banned words)
- 19 astrology notification templates blocked via `V1_DISABLED_TEMPLATES`
- Tab structure: Today / Connections / Ask / Profile (Reports + Chart stack-pushed only)
- Tier 0 accessibility audit (a11y props on every interactive surface)
- AI disclaimers on briefing card and chat bubbles

The remaining work is structural surface — the layout shape that still says "horoscope app" even when the words don't.

---

## Success criteria

After this overhaul, the **default Today surface** (showAstrology=false, fresh install) should:

1. **Hero shows people, not a date.** The first card a user sees on Today is their connections, not "Your November Briefing."
2. **No period tabs.** Today/Week/Month is removed.
3. **Reports tab uses relational icons** (♡ ◆ ✦), not planetary glyphs (♀ ♄ ☽).
4. **Journal looks like a mood journal.** Sky strip and cosmic context only appear when astrology toggle is ON.
5. **Profile hero has no zodiac glyph** when toggle is OFF.
6. **TodaysSky is unreachable** on the default flow.
7. **Connections has no orbiting astro visual** as the empty-state hero.

A reviewer who never touches the astrology toggle should never see a horoscope-shaped surface.

---

## Out of scope for this overhaul

- Owner manual tasks (privacy host, screenshots, EAS build) — tracked separately in `plan/manual/`.
- Auth and IAP — stubbed in v1, returning post-approval.
- Rewriting the AI engine — the 3-part language override does the heavy lifting.
- Adding new features — this is a reshape, not a rebuild.

---

## Verification gate (before submission)

After all 6 specs ship, run this 30-second mental walkthrough as if you were the reviewer:

1. Launch app → onboarding → land on Today → **what does the hero show?** People ✓ / horoscope ✗
2. Bottom-nav through every tab → **any tab feel like a daily reading app?** No ✓ / Yes ✗
3. Open Profile (don't toggle astrology) → **any zodiac glyph or sign label visible?** No ✓ / Yes ✗
4. Open Reports → **do the icons read planetary?** No ✓ / Yes ✗
5. Open Journal → **is the cosmic strip at the top?** No ✓ / Yes ✗

All five must be ✓ before TestFlight.

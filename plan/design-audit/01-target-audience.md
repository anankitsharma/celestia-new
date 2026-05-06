# Target Audience — Who Celestia Is For

**This doc is the foundation for every design decision.** If a design choice doesn't serve this user, it doesn't ship.

Per the design-critique skill: "Always tie feedback to goals and user needs." Without a clear audience POV, a design audit becomes opinion-by-committee.

## The hypothesis

Built from triangulating: brand voice (navigator framing, reveal statements), pricing ($49.99/yr post-trial), feature set (AI chat flagship, Circle with 8 relationship types incl. Boss/Colleague, journal mining, NPS prompts), and explicit positioning vs competitors (in unclaimed space between Co-Star and The Pattern).

### Primary persona — "The Inner-Work Practitioner"

| Trait | Detail |
|---|---|
| Age | 26-42 |
| Geography | Urban US/UK (NYC, LA, SF, London, Berlin, Toronto) |
| Income | $60-150k household |
| Education | College+, often graduate-degree |
| Gender | ~75% female, but design should not be feminine-coded |
| Astrology relationship | Gateway from Co-Star (felt too mean), or lapsed The Pattern user (too fatalistic + paywall-aggressive). Has read at least one book about astrology. Knows their Big 3 unprompted |
| Adjacent identities | Therapy-positive, journals, has a Notion or Apple Notes setup, uses period-tracking app, listens to Esther Perel / Glennon Doyle / Brené Brown podcasts |
| Brands they use | Aesop, Glossier, AllBirds, Headspace (or Calm, lapsed), Notion, Substack, Marie Howe poetry collections |
| Reads | Cup of Jo, The Cut, NYT Modern Love, Cereal magazine, Lenny Letter (RIP), substacks |
| Has tried | Astrology apps (Co-Star definitely, sometimes The Pattern), meditation apps, mood trackers, language apps (Duolingo) |

### What this user wants from an astrology app

Ranked by importance:

1. **A way to make sense of relationships** — partner dynamics, family patterns, why they keep choosing the same friends. The dominant use case.
2. **Daily moments of being seen** — "this app gets me." Not predictions; reflections.
3. **Decision support** — "should I take this job? Stay in this relationship?" Tools to think with, not answers.
4. **Beautiful aesthetic** — they live in a world of well-designed products. An ugly app is a dealbreaker.
5. **A non-mean voice** — Co-Star's "your heart busts its knuckles against society" is funny but exhausts them by month 2.
6. **No spiritual woo** — they don't want chakra rainbows, "the universe," or live psychic readings. Astrology is their language for self-understanding, not mysticism.
7. **Light intellectual stimulation** — they read. They want copy that respects them.

### What this user explicitly does NOT want

- Brutalist Co-Star aesthetic (already past that phase)
- Sanctuary / Nebula psychic readings ($/min reading-room model feels scammy + cringe)
- Cosmic-gradient backgrounds, purple-tarot-card vibes
- Pushy paywalls (they CAN pay; they hate feeling extracted from)
- Generic horoscope copy ("today brings opportunities for love" → uninstall)
- Apps that infantilize them (Duolingo's owl scolding works for languages, NOT for inner work)

### Secondary persona — "The Sceptical Engineer"

Tech / creative men, 28-40. Does astrology "ironically but seriously." Wants a tool that:
- Respects their intelligence (no woo)
- Has API-quality data (real ephemeris, not made up)
- Has chat that's actually intelligent (Co-Star Plus's "ask the stars" disappointed them)
- Looks like a Notion / Linear / Things adjacent product, not a "cosmic" app

This persona is smaller (~20-25% of users) but has higher CAC tolerance and very high LTV. Celestia's design serves them well already because it doesn't pander.

### Anti-personas — explicitly NOT serving

| Anti-persona | Why not |
|---|---|
| Gen Z casual daily-horoscope users | Co-Star owns them. Don't compete on viral pushes alone |
| Psychic-reading buyers | Sanctuary / Nebula serve them. We're not building a marketplace |
| Traditional astrologers wanting jargon | They're a tiny audience; serving them would alienate the primary |
| Spiritual-bypass / law-of-attraction crowd | Tonally incompatible. Their app is The Pattern or Insight Timer |

## Design implications

If the audience above is right, here's what each design surface must do:

### Color
- **Navy / gold / cream is correct.** It reads as Aesop, not new-age.
- **Light mode is essential.** This user works during daylight. Dark-only is a dealbreaker for daytime use.
- **Avoid electric purple, cosmic gradients, chakra rainbows.** Those signal "spiritual app I am embarrassed to have on my phone."
- **Gold should be restrained.** Used as accent, not as primary brand color. Gold-everywhere reads tacky.

### Typography
- **Serif headings are essential.** Playfair Display says "this took craft." A geometric sans throughout would feel like a horoscope app.
- **Long-form copy must be readable at length.** This user will read 200+ word briefings. DM Sans body type does this well.
- **No display fonts trying to look "mystical."** No script fonts. No all-caps anywhere except small kickers (≤12pt, ≥1px tracking).

### Voice
- **"Navigator" frame works.** Recommendations, alternatives, doable actions. Not commands, not predictions, not mystical pronouncements.
- **Reference psychology over astrology.** "Your moon in the 7th house means..." → "You only fully feel yourself when reflected in someone else's eyes." Translate the mechanism into the felt experience.
- **No exclamation marks.** This user is over enthusiastic copy.
- **No emoji in narrative copy.** Acceptable in badges (it IS the iconography). Not acceptable in pushes or briefing text.
- **Permit literary register.** This user reads. They will appreciate a beat of strangeness if it's earned.

### Imagery
- **Real chart wheel.** Not stylized illustration. The fact that it's an actual astronomical visualization signals competence.
- **No tarot-card art, no chakra diagrams, no "cosmic" stock illustration.**
- **Subtle planet symbols** (☉ ☽ ↑ ♀ ♂) are fine. They're typographic.
- **Photography:** if used at all, should be editorial — Cup of Jo aesthetic. Not stock-cosmic.

### Interaction patterns
- **Engagement gamification (streaks, XP, badges) MUST stay subtle.** This user is not Duolingo's owl. The mechanics can be there but the UI should treat them as quiet recognition, not Look-At-Me notifications.
- **Push frequency matters.** This user has 50+ apps. Max 1-2/day. The per-day cap shipped is correct.
- **Long-form briefings + AI chat are the killer features.** Both align with this user's pattern of using apps for thinking + reflection.

### Pricing
- **$50-100/year is the sweet spot for this user.** $49.99/yr current pricing is well-positioned.
- **Per-minute psychic-reading pricing would alienate them.** Don't add that revenue stream.
- **7-day free trial is right.** They want to try before buying. They're not impulse buyers.

## Validation plan

This audience hypothesis is testable. Three ways to validate:

1. **Onboarding survey** — already collects motivation + pain point. Add: age range, income range (optional), other apps used. Update CLAUDE.md with results once you have ≥100 responses.
2. **App Store reviews** — read the ~20 most thoughtful reviews after launch. Look for the language patterns above ("therapy" / "introspective" / "design") vs the misfit patterns ("cosmic energy" / "psychic" / "weekly horoscope").
3. **NPS qualitative responses** — the NPS prompt shipped in EXTRA-3 captures a numeric score. Add an optional free-text field ("anything you want us to know?") to capture verbatim language.

If after 3 months the actual user base differs significantly from this hypothesis, **rewrite this doc and re-audit the design.** Audience drift is the most common cause of design rot.

## What this means for the rest of this audit

Every other doc in `plan/design-audit/` evaluates design choices against this audience. The question isn't "is this beautiful?" The question is **"does this serve the Inner-Work Practitioner?"**

If a design choice serves this user but offends a different audience, ship it. If a choice is broadly attractive but doesn't serve this user, rethink it.

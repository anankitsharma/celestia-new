# App Store Connect — Manual Tasks

3 tasks: category fix (P0 blocker), screenshot set, description copy.

Estimated total: 2-4 hours including design time for screenshots.

---

## Task 01.1 — Fix ASC categories (REMOVE ENTERTAINMENT)

**Task ID:** #89
**Priority:** P0 — blocks 4.3(b) resubmit
**Estimated time:** 5 minutes

### Why this matters

Apple's 4.3(b) review process flagged the Entertainment category as inappropriate for an astrology app oriented toward inner-work / self-reflection. Submitting again with Entertainment still listed will result in another rejection. This is the single hardest blocker on the resubmit.

### What to do

1. Sign into App Store Connect (https://appstoreconnect.apple.com)
2. Apps → Celestia → App Information (left sidebar)
3. Scroll to **Category** section
4. Change **Primary Category** to: **Lifestyle**
5. Change **Secondary Category** to: **Health & Fitness** (if approved by Apple's lifestyle/health crossover rules) OR leave blank
6. **Remove** any reference to: Entertainment
7. Click **Save**
8. Verify by refreshing the page — Entertainment should be gone

### Acceptance criteria

- [ ] Primary category set to Lifestyle
- [ ] Entertainment removed from primary AND secondary
- [ ] Page saved successfully (no error)
- [ ] Re-load the page to confirm changes persisted

### Notes / gotchas

- ASC App ID for Celestia: `6757995238` (per memory)
- Bundle ID: `com.ask.celestia`
- This change applies to the next submission — already-shipped versions retain old categorization until they're re-submitted

---

## Task 01.2 — Final App Store screenshot set

**Task ID:** #116
**Priority:** P1 — should ship same week as next release
**Estimated time:** 2-3 hours (mostly design)

### Why this matters

App Store conversion rate is 87% determined by the first screenshot. Generic UI screenshots underperform compositions that show emotional outcome + product UI overlay. The current Sprint 1 changes (paywall asymmetry, goal-echo, streak elevation) are not yet reflected in App Store screenshots.

### What to do

Produce 5-6 screenshots in iPhone 16 Pro Max dimensions (1290 × 2796 px). Suggested order (first screenshot is most critical):

1. **Chart reveal with first reveal statement** — peak personalization moment
   - Showcase the WelcomeScreen chart wheel + reveal statement
   - Caption: *"This app sees me."* or *"Your chart, written for you."*

2. **Daily briefing on Today tab**
   - Bento layout with navigator headline
   - Caption: *"What today asks of you."*

3. **Circle compatibility**
   - Synastry view with relationship-type pills
   - Caption: *"How your charts move together."*

4. **AI chat with personalized response**
   - Show first chat pre-fill + an actual response
   - Caption: *"Ask anything. Get a real answer."*

5. **Weekly report cover**
   - PDF cover or report-detail screen
   - Caption: *"Long-form reads, written from your transits."*

6. **Optional 6th: streak / badges achievement**
   - Show streak elevated display
   - Caption: *"For people who do their inner work."*

### Brand guidelines to follow

- Typography: Playfair Display (headings) + DM Sans (body)
- Colors: navy `#0E0E22`, gold `#C8A84B`, cream `#FAF8F2`
- Hero gradients: warm muted plum-charcoal (NOT electric blue)
- Avoid stock-image lifestyle photography

### Acceptance criteria

- [ ] 5-6 screenshots produced at 1290 × 2796 px
- [ ] Captions use unity language (not generic horoscope-speak)
- [ ] Brand typography + colors match in-app design
- [ ] Uploaded to App Store Connect → Apps → Celestia → Versions → [active version] → Screenshots

### Notes / gotchas

- Apple supports up to 10 screenshots per device size
- Must include 6.7" (iPhone 16 Pro Max) screenshots; 6.1" auto-derives
- For Android (Play Store), produce 1080 × 1920 versions in the same compositions
- Keep screenshot text within 4-7 words — anything longer reads as cluttered

---

## Task 01.3 — App Store description / subtitle copy

**Task ID:** #117
**Priority:** P1
**Estimated time:** 30-45 minutes

### Why this matters

ASO copy is one of the few unity-language touchpoints discoverable BEFORE install. Subtitle is a small (30 character) field that's heavily indexed for search. Description is full-text indexed and is what convinces undecided browsers.

### What to do

1. **Subtitle (max 30 chars)** — pick one:
   - "For people who do the work."  *(28 chars — preferred — unity)*
   - "Astrology for the questioners." *(31 — too long, drop period)*
   - "Inner-work, written for you." *(28 — alternate)*

2. **Promotional Text (max 170 chars)** — refresh seasonally, current copy:
   *"This is not a horoscope app. This is your chart, your transits, your real questions — written by AI tuned to actual astronomy. For the questioners."*

3. **Description (max 4000 chars)** — full revision below.

4. **Keywords (max 100 chars)** — focus on Inner-Work Practitioner audience:
   - Include: `astrology`, `birth chart`, `journaling`, `self-discovery`, `transits`, `compatibility`, `synastry`, `natal chart`, `mindfulness`, `reflection`
   - **Avoid**: `horoscope`, `psychic`, `tarot`, `prediction`, `fortune` (wrong audience)

### Recommended description (4000 chars target)

```
Celestia is astrology for people who do their inner work.

Not horoscopes. Not predictions. Not "Capricorns are stubborn."

We calculate your real birth chart from NASA JPL DE-441 ephemeris — the exact same astronomical positions astronomers use. Then AI tuned to established Western astrology traditions writes you a daily reading from your actual transits.

—

WHAT'S INSIDE:

— Your full natal chart, with every planet, house, and aspect.
— A daily navigator briefing — what today asks of you, written from your real transits.
— Weekly reports — Love, Career, Lunar, Purpose. Long-form reads from your chart.
— AI chat — ask anything. Get an answer rooted in your placements, not generic advice.
— Your Circle — compatibility for partners, friends, parents, colleagues. 8 relationship types.
— Streaks, journaling, badges. Tools for people who track their own patterns.

—

WHO THIS IS FOR:

If you've outgrown horoscope apps. If you read NYT, listen to On Being, journal occasionally, and want astrology that doesn't insult your intelligence — this is for you.

We're built for the questioners, not the believers.

—

PRO MEMBERSHIP:

Free includes: full chart, daily briefing, limited chat, basic reports.
Pro unlocks: unlimited chat, weekly reports across all themes, transit alerts, full Circle.

7-day free trial on annual ($49.99/year). 3-day free trial on monthly ($6.99/mo). Cancel anytime — your data stays yours either way.

—

PRIVACY:

Your birth data lives on your device. Calculations happen locally. AI calls are anonymized. No psychic hotline, no upsells, no ads. Just your chart.

—

ESTABLISHED METHODOLOGY:

Astronomical positions: NASA JPL DE-441 ephemeris (the modern standard).
Astrological tradition: synthesis of established Western astrology — Hellenistic, modern psychological, evolutionary.
House system: Placidus (default) + Whole Sign (optional).

—

If you've ever felt like every other astrology app was written for someone else — this one wasn't.
```

### Acceptance criteria

- [ ] Subtitle ≤ 30 chars, contains unity language
- [ ] Promotional Text refreshed (170 char limit)
- [ ] Full description ≤ 4000 chars, lead with audience identity
- [ ] Keywords avoid horoscope/psychic terms
- [ ] All copy reviewed against `plan/competitive-audit/voice-guide-pushes.md` voice rules
- [ ] Submitted to ASC for review along with the next version submission

### Notes / gotchas

- Description CAN be edited without a new app submission (in some cases) — check ASC submission rules
- Subtitle is search-indexed; promotional text is NOT
- For Play Store (Google), the description structure is similar — same copy can be reused
- If you have international markets active, schedule localization separately (out of scope for this doc)

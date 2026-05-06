# Android Play Store Listing Package

Production-ready ASO bundle for Celestia's Android launch. Built on the competitor analysis in doc 00-01 + the Inner-Work Practitioner audience documented across `plan/intraction/` and `plan/design-audit/`.

This doc covers everything except the full description body (which is in doc 03 separately because of its size).

---

## Title

**Recommended (primary):** `Celestia: Birth Chart & Read`
**Character count:** 28 / 30 max

### Why this title

- Leads with brand
- Includes "Birth Chart" — high-volume Play Store keyword that the competitor's listing doesn't fully claim
- "Read" hints at reflection/reading vs. horoscope-prediction (audience signal)
- Distinct from competitor's plain "Celestia Astrology"
- 2 chars of headroom for future iteration

### Alternatives ranked

| # | Title | Chars | Why this might win | Why it might not |
|---|---|:-:|---|---|
| 1 | `Celestia: Birth Chart & Read` | 28 | Keyword + audience signal | Slightly longer than alternatives |
| 2 | `Celestia – Real Astrology` | 25 | Differentiation lead | "Real" is a softer keyword |
| 3 | `Celestia: Astrology for You` | 27 | Audience-focused | "Astrology" alone overlaps with competitor |
| 4 | `Celestia: Daily Birth Chart` | 27 | "Daily" + "Birth Chart" combined | Sounds like horoscope-app territory |
| 5 | `Celestia: Astrology + Chart` | 27 | Two keywords, neutral | Doesn't differentiate audience |

**Decision logic:** primary title trades a small character increase for a clearer differentiator. Run option #1 at launch, A/B test against option #2 after 4 weeks of data.

### What NOT to use

- ❌ `Celestia Astrology` — direct collision with the existing competitor app
- ❌ `Celestia` alone — wastes 22 chars of search-indexed real estate
- ❌ Anything with "Best" / "#1" / "Free" — Play Store guideline violations
- ❌ Anything mentioning iOS / Apple — not allowed in Play Store copy

---

## Short description (Play Store)

**Recommended:** `Astrology for people who do the work. Your real chart, written for you.`
**Character count:** 72 / 80 max

### Why this works

- **Audience identity in first 5 words** — "people who do the work" filters in the Inner-Work Practitioner, filters out passive-horoscope shoppers
- **Methodology hint** — "your real chart" implies astronomical accuracy without using jargon
- **Possessive frame** — "for you" personalizes; signals the app produces personalized content rather than generic horoscopes
- 8 chars of headroom

### Alternatives

| # | Short description | Chars | Lead |
|---|---|:-:|---|
| 1 | Astrology for people who do the work. Your real chart, written for you. | 72 | Audience |
| 2 | Real birth chart + daily astrology reading. Made for the questioners. | 70 | Methodology |
| 3 | Astrology that respects your intelligence. Real chart, real reading. | 68 | Tone |
| 4 | Your birth chart, your transits, your real questions — written for you. | 74 | Specificity |

### Play Store SEO note

Short description is HEAVILY weighted in Play Store search ranking. Every word counts. The recommended copy includes:
- "Astrology" (high-volume search term)
- "Chart" (related keyword cluster)
- "Real" (differentiator from horoscope-style competitors)
- Audience signal ("people who do the work")

---

## Keywords (Play Store)

Play Store doesn't have a separate keywords field — keywords are auto-extracted from title + short description + full description. The relative frequency in the description determines ranking weight.

### Target keyword cluster

**Primary (must appear 5+ times across description):**
- astrology
- birth chart
- natal chart
- daily reading

**Secondary (must appear 3-5 times):**
- transits
- compatibility
- synastry
- horoscope (compromise — high search volume; use sparingly)
- self-discovery
- journaling

**Tertiary (must appear 1-2 times):**
- mindfulness
- reflection
- inner work
- moon phase
- AI astrology

### Keywords to AVOID

- ❌ "predict" / "prediction" / "fortune" — wrong audience
- ❌ "psychic" / "tarot" / "fortune teller" — wrong category
- ❌ "best" / "#1" / "free" — Play Store guideline issues
- ❌ Brand names of competitors (Co-Star, The Pattern, Sanctuary, Nebula)
- ❌ Jurisdiction-restricted terms (some regions restrict "consultation", "advice")

### Long-tail phrases to include verbatim

- "real birth chart"
- "daily astrology reading"
- "your astrology profile"
- "transit alerts"
- "natal chart calculation"
- "Western astrology traditions"
- "AI astrology insights"

These phrases match how thoughtful users (vs. casual horoscope users) search.

---

## Tags (Play Store)

Play Console asks you to pick 5 tags from their predefined list. Recommended:

1. **Lifestyle** (primary category)
2. **Self-Improvement**
3. **Daily Tracking**
4. **Reflection / Mindfulness** (if available)
5. **Personal Development**

Avoid:
- ❌ "Entertainment" — wrong audience signal (also caused the iOS 4.3(b) review issue per memory)
- ❌ "Fortune Telling" — distances you from the Inner-Work positioning
- ❌ "Games" — not a game

---

## Visual assets

### Feature Graphic (REQUIRED on Play Store)

**Spec:** 1024 × 500 px PNG/JPG

**Recommended composition:**
- Left half: hero photo or chart wheel illustration
- Right half: app name "Celestia" + tagline "For people who do the work."
- Background: warm gradient (navy `#0E0E22` → plum `#1A1535`) — NOT electric blue
- Typography: Playfair Display + DM Sans
- DO NOT include screenshot frames — feature graphic is its own thing
- DO NOT include CTAs ("Download Now") — Google strips those

**Feature graphic alternates ranked:**

1. **Chart wheel + tagline** — most distinctive; positions as serious astrology app
2. **Reveal statement quote + sigil** — leans into the "this app sees me" moment
3. **Big-3 placement composition** — "Sun · Moon · Rising" pills with name

Note from existing assets: `feature_graphic.png`, `feature_graphic_chat.png`, and `feature_graphic_chat copy.png` already exist in `ASO/`. Audit which best matches the unity-language positioning before using.

### Phone screenshots

**Spec:** 1080 × 1920 px (or 1080 × 2400 for taller phones), JPG/PNG, max 8 screenshots

**Recommended sequence (5 screenshots — Play Store rewards quality over quantity):**

| # | Composition | Caption (8-10 words max) |
|---|---|---|
| 1 | Chart reveal with first reveal statement (peak personalization) | This app sees you. |
| 2 | Today tab: navigator briefing + bento layout | What today asks of you. |
| 3 | AI chat: real personalized response | Ask anything. Get a real answer. |
| 4 | Weekly report cover (PDF or report-detail) | Long-form reads, written from your transits. |
| 5 | Circle compatibility view | How your charts move together. |

**Optional 6-8 screenshots if budget allows:**
- Streak / badges achievement: "For people who do the work."
- Birth chart deep-dive: "Every planet. Every house. Every aspect."
- Cosmic identity / Big-3 share: "A rare combination."

**Caption styling:**
- Top of screenshot, large serif (Playfair Display, ~48pt scaled)
- 1-2 lines max
- Brand colors only (cream `#FAF8F2` on warm gradient backgrounds)
- NO emoji, NO exclamation marks, NO ALL CAPS

### Video preview (RECOMMENDED on Play Store, big ASO boost)

**Spec:** 30 seconds, 1920 × 1080 (landscape) OR 1080 × 1920 (portrait), MP4

**Recommended structure:**
- 0:00-0:03 — Splash screen → Brand reveal
- 0:03-0:08 — Onboarding: "What brings you here?" pull
- 0:08-0:15 — Chart reveal: zoom in on the chart wheel + first reveal statement
- 0:15-0:22 — Today tab: navigator briefing scrolling
- 0:22-0:27 — AI chat: typing a question, response appearing
- 0:27-0:30 — Tagline frame: "For people who do the work. — Celestia"

**Music:** ambient/contemplative — NOT trending pop, NOT meditation tropes. Think Cup of Jo blog post sound — warm, intelligent, restrained.

---

## In-app purchase pricing (Play Console listing)

This is what shows in "In-app purchases" range on the Play Store:

- **Monthly subscription:** $6.99 (₹599)
- **Annual subscription:** $49.99 (₹4,199)

Both are within standard global subscription pricing. Free trials are configured in RevenueCat + Play Console (per `plan/intraction/manual/02-qa-and-ship.md`).

---

## Content rating

**Target rating:** 3+ (matches the competitor — appropriate for the audience)
**Justification:** No violence, no profanity, no gambling, no controversial themes. Birth chart calculations + thoughtful astrological content.

When filling out the IARC questionnaire on Play Console:
- Violence: None
- Profanity: None
- Drug/Alcohol references: None
- Gambling: None
- User-Generated Content: None (chat is between user and AI, not other users)
- Location sharing: None (location is used locally for chart calc only)
- Personal information: Yes (birth date, birth time, birth location for chart calc)

---

## Privacy + data safety section

Play Console requires a Data Safety form. Per the Sprint 1 + 3 architecture:

| Data type | Collected? | Shared? | Why |
|---|:-:|:-:|---|
| Name | Yes | No | Personalization |
| Email | Optional (auth only) | No | Account / cloud backup |
| Birth date / time / location | Yes | No | Chart calculation (computed locally) |
| Journal entries | Yes (local) | No | Stored in SQLite on device |
| Chat history | Yes (local) | No | Stored in SQLite on device |
| Device IDs | Yes (PostHog) | No | Anonymous analytics |
| Approximate location | No | No | (Description references this — REMOVE if not needed) |

**Action item:** review what location permissions the app actually requests. If only birth-place geocoding (one-time at onboarding), the manifest shouldn't ask for runtime location at all. Audit before submission.

---

## Privacy policy URL

The competitor's listing uses a Google Docs URL — looks unprofessional and may flag during review. Recommended:

- Host privacy policy on a real domain (e.g., `https://celestia.app/privacy` or `https://hicelestia.com/privacy`)
- Single page, plain HTML, no tracking, no auth
- Required content: data collected, purpose, retention, deletion procedure, contact email
- Generator option: use Termly or iubenda if you don't want to write from scratch

If you don't have a domain yet, use Notion's public-page hosting as a temporary solution:
- `https://celestia-app.notion.site/privacy-policy` (more credible than Google Docs)

---

## Submission checklist

| # | Item | Owner | Done? |
|---|---|---|:-:|
| 1 | Pick title from this doc | You | ☐ |
| 2 | Pick short description from this doc | You | ☐ |
| 3 | Use full description from doc 03 | You | ☐ |
| 4 | Set tags: Lifestyle + Self-Improvement + Daily Tracking + Mindfulness + Personal Development | You | ☐ |
| 5 | Produce feature graphic (1024 × 500) | Design | ☐ |
| 6 | Produce 5 phone screenshots (1080 × 1920) | Design | ☐ |
| 7 | Optional: produce 30-second video preview | Design | ☐ |
| 8 | Configure $6.99 monthly + $49.99 annual subs in Play Console | You | ☐ |
| 9 | Complete IARC questionnaire → 3+ rating | You | ☐ |
| 10 | Fill Data Safety form per the table above | You | ☐ |
| 11 | Host privacy policy on real domain | You | ☐ |
| 12 | Configure free trials (3-day monthly / 7-day annual) in Play Console | You | ☐ |
| 13 | Upload AAB build to internal testing track | You | ☐ |
| 14 | Smoke test on physical Android device | You | ☐ |
| 15 | Promote internal → production at 5% rollout | You | ☐ |

---

## Estimated impact

Without ASO data baseline (you don't have a Play listing live yet), these are directional:

| Metric | Generic listing | This package |
|---|:-:|:-:|
| Search impressions | baseline | +30-60% from keyword density |
| Listing-to-install conversion | 25-30% (Play average) | 35-45% (with quality screenshots + video) |
| 30-day retention of new installs | 25-30% | 40-50% (audience filtering via positioning) |

The bigger lift comes from **filtering OUT wrong-audience installs**. The Inner-Work positioning will surface to fewer people but convert at 2x the rate — and those installs will retain at 2x.

This is the right trade for a subscription-monetized app. Casual horoscope-shoppers don't convert; thoughtful users do.

---

## Don't ship without

- [ ] **Trademark search** — verify "Celestia" isn't trademarked in your target markets (India + US minimum)
- [ ] **Privacy policy on real domain** — Play review flags Google Docs URLs
- [ ] **Real screenshots** — placeholder/template screenshots cause review delay
- [ ] **Internal-track smoke test** — at least 24h before pushing to production

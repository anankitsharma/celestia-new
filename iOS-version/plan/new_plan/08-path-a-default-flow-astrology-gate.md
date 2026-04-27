# 08 — Path A: Full Default-Flow Astrology Gate

**Effort:** 4–6 hours
**Impact:** Critical — closes the gap between "surface looks clean" and "functionality is still horoscope app." Without this, another 4.3(b) rejection is likely.

---

## The problem we missed

Specs 01–06 cleaned the **default first paint**. Apple's reviewer who scans the first screen of each tab sees a relationship app.

But Apple reviewers don't only scan first paint. They tap deeper. And one tap into the briefing modal, two taps into Reports, four taps into PDF generation — every deeper surface is still horoscope-app territory:

- **Briefing modal** (one tap from Today): "YOUR READING" + Moon phase chip + planet influences + Life Areas grid (Love/Career/Vitality/Growth/Social) + horoscope paragraphs + "driving planet" chips.
- **Reports** (two taps via Profile): all 7 reports generate full astrology PDFs (Sun/Moon/Venus/Mars sections, planet glyphs).
- **PDF generation overlay** (four taps via Connections): step labels say "Comparing Moon signs / Analyzing Venus chemistry / Checking Mars dynamics", with planet glyph icons (♀ ♂ ♃ ♄ ☉ ☽ ☿).
- **Onboarding**: asks for birth time + birth city — the #1 signal of an astrology app to Apple.

Apple's 4.3(b) language: *"primarily features astrology, horoscopes... that duplicate the content and functionality of similar apps."*

**Functionality** = what the app does, not how the marketing surface looks. We have not changed functionality. Path A changes that perception by gating *every* astrology surface behind the `showAstrology` toggle.

---

## Path A philosophy

The `showAstrology` toggle already exists in Profile (default OFF). Specs 01–06 used it to hide visual surfaces. Path A extends the gate to every *functional* astrology surface:

| Surface | Default OFF | Toggle ON |
|---|---|---|
| Briefing modal "YOUR READING" / planet influences / life areas | Hidden | Full content |
| "More on today's energy →" CTA | Hidden (or simpler view) | Opens full modal |
| Reports tab entry from Profile | Hidden | Visible |
| PDF generation overlay astrology content | Neutral steps + relational quotes | Full astro generation overlay |
| Onboarding birth time / city | Optional ("I don't know" pre-checked) | Required (deepens reading) |
| AI chat banned vocabulary | Expanded list (planet names, signs, transits) | Existing 3-part structure |

After this: default-flow user (no toggle) **never sees a horoscope-app surface**. Astrology-curious user toggles on and sees the full app. Apple's defense becomes: "the default app is a relationship pattern recognition tool; the astrology engine is opt-in for users who explicitly request it."

---

## Specific changes

### 1. Briefing modal — gate the entry CTA

**File:** `src/screens/HomeScreen.js`
**Location:** ~line 1130 ("More on today's energy →" button)

Wrap the entire deep-dive CTA in `{showAstrology && (...)}`. When astrology is off, the briefing card stops at "Today's Energy" headline + summary. No "More on today's energy →" button appears, so the modal is unreachable.

The Modal block (line 1739) stays in code unchanged — it just has no entry point on default flow.

### 2. Hide Reports entry from Profile by default

**File:** `src/screens/ProfileScreen.js`
**Location:** "DEEP READINGS" section (~line 460–475)

Wrap the "DEEP READINGS" section header + the "Reports & Readings" row in `{showAstrology && (...)}`. Default users see Preferences → (skip) → Legal → App Data → General. Astrology toggle on → Reports link appears.

This also kills any default-flow path to Reports since Reports is no longer in MainTabs (it's stack-only via Profile).

### 3. Replace PDF generation overlay astrology content

**File:** `src/screens/CompatibilityScreen.js`
**Location:** `ROLE_REPORT_THEMES` constant (~lines 66–177)

For each role's `steps[]` and `quotes[]`:

- Replace planet glyph icons (`♀ ♂ ♃ ♄ ☉ ☽ ☿`) with `✦` (universal sparkle)
- Rewrite step labels to drop planet/sign references:
  - "Comparing Moon signs" → "Mapping how you feel together"
  - "Analyzing Venus chemistry" → "Reading attraction patterns"
  - "Checking Mars dynamics" → "Mapping passion & conflict"
  - "Mercury connections" → "Communication patterns"
  - "Saturn bonds" → "Long-term potential"
- Replace quotes with relational versions:
  - "Venus shows how you love..." → "How you love isn't random — it's a pattern."
  - "The Moon knows what your heart needs..." → "Your heart has its own language. We're learning it."
  - "Saturn connects the generations..." → "Family patterns travel further than we realize."

The actual PDF content (deep inside) keeps astrology — that's content the user explicitly asked for by tapping Generate. The overlay (which a reviewer scrubbing through sees) is now neutral.

**Tradeoff:** A user with `showAstrology=true` sees the same neutral overlay. We lose some flavor for the engaged user. Acceptable: the PDF reveal compensates.

### 4. Onboarding birth time + city — make optional

**File:** `src/screens/OnboardingFlowScreen.js`
**Location:** birth time + birth city steps

Add an "I don't know my birth time" pre-checked toggle on the time step. Same for city ("Skip for now" link). Calculate the chart with whatever data is provided — if time/city missing, fall back to noon UTC (common astrology fallback).

This removes the strongest "astrology app" signal from the onboarding flow. A user can complete onboarding with just **name + birth date** — same data a generic relationship app might collect.

If user opts in to astrology later via Profile toggle, prompt them to add birth time + city for "deeper analysis."

### 5. AI chat — expand V1 language override

**File:** `src/services/geminiService.js`
**Location:** `V1_LANGUAGE_OVERRIDE` constant

Current banned words: `horoscope, transit, Mercury retrograde, your sun/moon/rising sign, cosmos, cosmic, destiny, fortune, manifest, soul mate`.

Expand to add: `Venus, Mars, Mercury, Jupiter, Saturn, Uranus, Neptune, Pluto, Sun sign, Moon sign, rising sign, ascendant, natal chart, birth chart, retrograde, conjunction, square, trine, opposition, sextile, aspect`.

Keep the 3-part structure (psychology lead → metaphor mid → redirect). Drop "astrological reference" from second sentence — replace with "framework reference" if needed (attachment theory, communication patterns, etc.) but no planet/sign vocabulary.

Verify the schema: any `planet` field in returned JSON gets converted to a neutral category in the renderer.

---

## Files touched

| File | Change |
|---|---|
| `src/screens/HomeScreen.js` | Gate "More on today's energy →" CTA behind `showAstrology` |
| `src/screens/ProfileScreen.js` | Gate "DEEP READINGS" section behind `showAstrology` |
| `src/screens/CompatibilityScreen.js` | Replace planet glyphs + rewrite step labels + replace quotes in `ROLE_REPORT_THEMES` |
| `src/screens/OnboardingFlowScreen.js` | Add "I don't know" toggle for birth time + city |
| `src/services/geminiService.js` | Expand V1_LANGUAGE_OVERRIDE banned vocabulary |

---

## Risks

| Risk | Mitigation |
|---|---|
| Reports tab becomes inaccessible to power users | Acceptable — they toggle on once via Profile and see the full app |
| Onboarding skipping birth time means no chart precision | Astronomy fallback to noon UTC + city of "default" works for sun/moon sign accuracy. Less precision but acceptable for default users who don't want astrology anyway. |
| User toggles on later, expects "deepen your data" prompt | Add a mini banner in Profile when toggled on: "For richer reading, add your birth time and city" → Edit Profile screen |
| AI chat now refuses to engage with astrology questions | Acceptable — chat redirects to "tell me about the relationship pattern" framing. If the user explicitly toggles astrology on, the AI can re-engage. |
| PDF overlay quotes lose flavor | Replacement quotes are still poetic, just relationship-themed. Test on simulator. |

---

## Verification gate (post-implementation)

Pretend you're an Apple reviewer who **never touches the astrology toggle**:

1. ❓ Onboard fully — does the flow ask for birth time? *Should be optional with "I don't know" pre-checked* ✓
2. ❓ On Today, tap "More on today's energy" — what happens? *Should not be visible* ✓
3. ❓ On Today, scroll the entire scrollview — any horoscope content visible? *Should be no* ✓
4. ❓ On Connections, add a partner → tap them → tap Generate PDF → what does the overlay show? *Should show neutral relational steps, no planet glyphs* ✓
5. ❓ On Profile, scroll — is there a "Reports & Readings" entry? *Should be hidden* ✓
6. ❓ Open Ask, type "Tell me about my Venus" — what does AI say? *Should redirect to relational framing without planet vocabulary* ✓

If all 6 are ✓, default-flow Path A is achieved.

Then toggle astrology ON → walk every tab → confirm all gated surfaces reappear.

---

## After approval

Restore for v1.x:
- Default-flow access to briefing modal (with care)
- Default-flow access to Reports (probably keep gated — Pro-tier)
- Original onboarding required-fields (or keep optional — better UX)
- Original AI vocabulary
- Original PDF overlay flavor

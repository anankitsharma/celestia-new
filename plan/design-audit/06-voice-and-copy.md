# Voice & Copy Audit

Audit of UI copy register against the target audience. Built using `ux-writing` and `design-critique` skill methodologies.

## The voice

Per `01-target-audience.md`, the Inner-Work Practitioner wants copy that is:
- **Smart but not mean** (the gap between Co-Star and The Pattern)
- **Specific not generic** ("your moon in the 7th house" → "you only fully feel yourself when reflected in someone else's eyes")
- **Literary but not precious** (reads, but doesn't show off)
- **Honest about uncertainty** (avoids "the universe / destiny / meant to be")
- **Direct without being cold**

This translates to four voice rules already partly enforced in the codebase:

1. **No exclamation marks** (with rare exceptions for actual exclamations like "Welcome!")
2. **No mystical vocabulary** ("the universe," "destiny," "stars align," "meant to be")
3. **Active voice, second-person**
4. **Specificity wins over generality**

## The four voice contexts

Different parts of the app speak in slightly different registers. Audit findings:

### 1. Long-form content (briefings, reports, AI chat)
**Voice:** Navigator. Recommendations + alternatives. "Navigate toward / navigate around."

**Source:** `geminiService.fetchExtendedForecast` prompt — the TONE block is well-written ("You are a NAVIGATOR advising the captain. Never give orders — give recommendations.").

✅ Strongest voice in the codebase. The prompt enforces tone at generation time.

### 2. Reveal statements (onboarding, D7 recap, D30 callback)
**Voice:** Literary, intimate, "I notice." Italics, second-person.

**Source:** Hand-written `MOON_HOUSE_INSIGHTS / SUN_MOON_COMBOS / VENUS_SIGN_INSIGHTS` in WelcomeScreen.js + Gemini prompts for first-week-recap, surprise-insight, moon-cycle-pattern, pro-week1-recap.

Examples:
- *"You only fully feel yourself when reflected in someone else's eyes"* (7H moon)
- *"You burn bright, feel fast, and recover quickly. But you rarely let anyone see the ashes."* (Fire-Fire sun-moon)
- *"You love by taking care of people — and resent them when they don't notice."* (Cancer Venus)

✅ The strongest copy in the entire app. This is Celestia's brand-defining voice. Already share-worthy (and now share-able after CA-B4).

### 3. Push notifications
**Voice:** Per the voice guide we shipped (`plan/competitive-audit/voice-guide-pushes.md`) — short, specific, slightly unsettling, never generic.

✅ Recently rewritten across ~25 templates in CA-B1b. Examples after rewrite:
- "Two days. The Moon's in Scorpio." (lapse D2)
- "[Partner]. Two days." (partner-aware lapse)
- "One more morning. Then it counts." (D6 anticipation)
- "Two days. We don't want to charge you if you don't want this." (trial end)

✅ Significantly better than category baseline. Co-Star-tier voice.

### 4. Functional / system copy
**Voice:** Direct, helpful, no flourish. Buttons, labels, error messages, settings.

Examples found in code:
- Button: "Continue", "Got it", "Stay with Pro", "Continue cancelling"
- Error: "Something went wrong" / "Could not save your entry"
- Empty state: (sparse — most screens don't have empty states yet)

✅ Mostly fine. ⚠️ Some inconsistency: "Continue" vs "Got it" vs "OK" used interchangeably. Pick one default.

## Specific copy issues found

### Issue 1: Exclamation mark leakage
The voice guide says "no exclamation marks." Spot checks found:
- `Alert.alert('Saved with cosmic imprint', ...)` — title is fine, no `!`, but "cosmic imprint" is borderline mystical
- `'Welcome!'` (was in PaywallScreen — replaced in Sub-3)
- `'Cosmic Explorer! 3 days strong'` (`getMilestoneMessage` in streakService.js)
- `'Stargazer! A full week with the cosmos'`
- `'Dedicated! Two weeks of cosmic wisdom'`
- `'Moon Cycle Master! 30 days!'` (double `!`)
- `'Half Century! 50 days of cosmic alignment'`
- `'Celestial Devotee! 100 days!'`
- `'Cosmic Legend! A full year!'`

The streak milestone messages are an exclamation marks farm. This was probably written casually before the voice guide existed.

**Recommendation:** rewrite all milestone messages to match voice guide. Examples:
- "Cosmic Explorer! 3 days strong" → "Three days. The first sign you mean it."
- "Stargazer! A full week with the cosmos" → "A week. Most people don't make it past four days."
- "Moon Cycle Master! 30 days!" → "Thirty days. One full lunar cycle of you."

### Issue 2: "Cosmic" overuse
`grep "cosmic"` finds 80+ matches across the codebase. Some legitimate (cosmic_morning, cosmicLineService — internal names). Many user-facing.

The voice guide says: "Never: 'the universe', 'stars align', 'destiny', generic 'your cosmic'."

User-facing "cosmic" usages:
- `'Saved with cosmic imprint'` — Alert title
- `'Cosmic Explorer'` — milestone label
- `'Cosmic Strategy'` — paywall benefit (intentional aspirational)
- `'Cosmic Connector'` — referral badge
- `'Your cosmic portrait has evolved'` — lapse template (already replaced)
- `'Welcome to your cosmic story'` — etc.

**Decision per audience:** "cosmic" used 1-2x as flavor is fine. As default modifier ("your cosmic [anything]") it becomes the verbal equivalent of cosmic gradient backgrounds — exactly what the audience signed up for Celestia to escape.

**Recommendation:** halve the count. Keep "cosmic" only where the alternative is meaningfully worse.

### Issue 3: Inconsistent button verb tense
Found: "Stay with Pro", "Continue cancelling", "Got it", "Manage my data", "Reactivate any time", "Try the weekly read", "Ask Celestia about this", "Continue to your dashboard".

Some imperative ("Stay", "Try", "Ask"), some declarative ("Continue cancelling"), some contraction ("Got it").

**Recommendation:** establish a button verb convention. Default: imperative present tense ("Stay", "Try", "Ask", "Cancel"). Reserve descriptive labels for tertiary/secondary actions.

### Issue 4: Loading state copy
Spot-check: most loading states are empty (just a spinner) or use generic copy like "Loading...". The Inner-Work Practitioner notices these moments — they're micro-anchors of brand voice.

Per `loading-states` skill methodology: name what's loading, name what they'll see.

Examples to add:
- "Reading the sky..." (forecast load)
- "Asking the chart..." (chat AI thinking)
- "Mapping the synastry..." (compatibility load)

Should be a P3 polish — not breaking anything; just elevating the brand at every micro-moment.

### Issue 5: Empty state copy missing
Most screens don't have empty states designed. JournalScreen with no entries shows... nothing. ChatScreen with no history shows... nothing. ReportsScreen with no reports shows... nothing.

Empty states are brand voice opportunities. Per `error-handling-ux` + `ux-writing` skills:
- Name the empty state ("Your journal is empty")
- Explain why it matters ("the patterns show up here")
- Offer one action ("Write your first entry")

This is genuinely missing. Worth a P2 sprint.

## What's done exceptionally well

### 1. The reveal statements
Already best-in-category. Hand-crafted, specific, share-worthy. **These are the reason a serious user signs up.**

### 2. The cancel-flow save offers
Reason × variant matrix in CancelFlowScreen.js — 3 voices (control / data-loss / value-deepening) for each of 8+ reasons. Tone discipline is high. The "value-deepening" variant especially reads as luxury.

### 3. The Welcome to Pro screen
Three hero cards with copy that's specific ("Generate your weekly chart reading", not "Unlock weekly content"), action-oriented ("Add the people who matter to your Circle"), and respectful ("Or continue to your dashboard").

### 4. Trial-cancel-aware copy
The CancelFlowScreen detects trial vs paid state and swaps ENTIRE reason set + offer set. Trial copy is non-anxious ("That's on us. We sent a heads-up notification 2 days before your trial charges. You can decide then, on your own time. No need to cancel now."). Almost no astrology app does this.

## Copy audit score: 8/10

The voice is strong where it's been deliberately written (briefings, reveal statements, pushes, cancel flow). It drifts where casual writing happened (milestone messages, alert titles, button labels). Two days of focused copy QA brings the score to 9.5/10.

See `07-recommendations.md`.

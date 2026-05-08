# 03 — New Flow Spec

The proposed onboarding, screen by screen, with copy, design intent, and the reasoning behind each decision. This is implementation-ready.

---

## At a glance

```
ARC 1 — HOOK
  01. Splash promise

ARC 2 — INVESTMENT
  02. Why are you here? (motivation)
  03. What feels uncertain? (pain point)
  04. How often misunderstood? (depth)

ARC 3 — PAYOFF (no commerce yet)
  05. Birth data — name + date
  06. Birth time (with "I'm not sure" path)
  07. Birth place (with cached recents)
  08. Calculating (theatre)
  09. Sun-sign first hit
  10. The big chart reveal

ARC 4 — COMMITMENT
  11. Wake-time anchor (NEW dedicated screen)
  12. Notification bundle choice (NEW)
  13. Paywall (consolidated benefits + plan select + testimonials)

ARC 5 — FIRST USE (post-onboarding)
  WelcomeScreen — chart reveal + 2 personality statements + permission ask
  HomeScreen — first session with subtle "save your first insight" affordance
```

11 screens in onboarding flow + WelcomeScreen + Home first-session affordance.

Compared to today: -3 screens (consolidate paywall stack, drop step 11's mixed-purpose Daily Hook), +2 screens (dedicated wake + bundle), net -1 screen and *much* clearer arc structure.

---

## Screen 01 — Hook (the promise)

**Purpose:** Get them past the splash with one clear promise. Set the difference vs. sun-sign garbage.

**Copy:**
> ✦
> **Your real chart.**
> **Not your sun sign.**
>
> A 2-minute reading from your actual birth moment.
> No two charts are alike.
>
> [ Show Me My Chart ✦ ]
>
> *2 minutes · completely free*

**Design notes:**
- LinearGradient background: ivory ramp `['#F4ECE5','#F0E4DC','#ECDCD3']` per V1.2 light Liquid Glass.
- Single ✦ glyph + gold glow halo behind headline. Animation: glow pulses once on mount.
- Headline: Playfair Display 34pt, two lines.
- Sub: DM Sans Light 15pt, three lines.
- Gold gradient CTA, full-width with 8pt horizontal margin.
- Disclaimer below CTA in Stone, 11pt, 0.5 opacity.

**Why this copy:** The current "*The stars remember when you were born*" is poetic but vague. The new copy makes the differentiator explicit on the *first* screen. Co-Star and Pattern get away with poetry because their app icon already establishes brand. We're newer; we earn the poetic copy by establishing the value claim first.

**Psychology:** Anticipation (hope) trigger. The "not your sun sign" frame names the user's prior bad experience with horoscope apps and positions us against it (Cialdini: positioning by contrast).

**Analytics:** `ONBOARDING_STARTED` (existing, fires on mount).

---

## Screen 02 — Why are you here? (motivation)

**Purpose:** First commitment. Tags user for downstream personalization.

**Copy:**
> ABOUT YOU
>
> **What brought you**
> **here tonight?**
>
> No wrong answers. Just honesty.
>
> 🪞  I want to understand myself better
> 🌊  I'm going through something big
> 💫  I need clarity on a relationship
> ✨  I'm curious — show me what you've got

**Design notes:** Identical to current step 2. Already excellent. Keep `OptionCard` component and `selectAndAdvance` pattern (auto-advances on tap with 500ms confirm pause).

**State:** sets `motivation` ∈ `{self, change, love, curious}`. Drives:
- AI tone calibration in `geminiService.js`
- Paywall callback at screen 13
- D1 morning push priority weighting

**Psychology:** Commitment-consistency primer. The 4 options are deliberately broad enough that ~95% of users will find a fit and tap.

---

## Screen 03 — Pain point

**Purpose:** Second commitment. Surfaces life-area focus for AI personalization.

**Copy:** Identical to current step 3 — works as-is.

**State:** sets `painPoint` ∈ `{love, career, self, all}`. Drives:
- Life-area emphasis in homepage navigator briefing
- The personalized insight on screen 10 (Big Reveal)

---

## Screen 04 — Depth

**Purpose:** Third commitment + sets emotional register for the rest of the flow.

**Copy:** Identical to current step 4. Already excellent.

**State:** sets `depth` ∈ `{always, often, sometimes, aware}`. Drives:
- The "whisper" line under the Sun-sign hit at screen 09
- The voice/tone of AI responses in chat

---

## Screen 05 — Birth data: name + date

**Purpose:** First effort-investment. The data we *must* have to do anything.

**Copy:**
> YOUR CHART
>
> **When did your**
> **story begin?**
>
> Your birth moment is unique to you.
> No two charts are alike.
>
> FIRST NAME
> [ ⌨ pre-filled if available, else "What should we call you?" ]
>
> BIRTH DATE
> [ Select your birth date  ›   ]
>
> [ Continue ]

**Design notes:**
- **Pre-fill name** from device user via `expo-application` `Application.applicationName` is wrong; use `expo-localization` or AsyncStorage if previously set. Fallback to empty.
- Date picker: keep iOS spinner. Suggest defaulting to 1995-01-01 (covers our Mia/Jade demographic median better than 2000-01-01).
- Keep the gold border-on-fill pattern.

**Psychology:** Effort-investment phase. Two fields, both required. The user has now invested 4 taps + ~25s of typing — sunk cost is real.

**Analytics:** `ONBOARDING_STEP_COMPLETED` with `from_step: 4, to_step: 5`.

---

## Screen 06 — Birth time

**Purpose:** Get the time without scaring anyone who doesn't know it.

**Copy:** Keep current copy. The "I'm not sure" path is correctly framed ("We'll use a noon chart — still powerful").

**Design notes:**
- Keep the two-card layout.
- Subtle improvement: when user taps "Yes, I know my birth time," reveal the time picker inline with a smooth height-spring animation rather than a popover. Reduces context-switching cost.

---

## Screen 07 — Birth place

**Purpose:** Final required input. Currently a leak point due to network latency on Nominatim.

**Copy:** Keep current copy.

**Design improvements:**
- **Cache the last 5 city searches** in AsyncStorage. Show as "Recent" suggestions if input is empty.
- **Suggest top cities for the user's locale** if no recent. (e.g. for India locale: Mumbai, Delhi, Bangalore, Chennai, Kolkata.) Optional but high-impact.
- Show a skeleton-loader for 600ms before suggestions appear, instead of the current ActivityIndicator. Feels faster.
- After selection, the chart-cast CTA should pulse once (haptic + subtle glow) — celebration for completing the form.

**Psychology:** Final effort moment. Reducing friction here directly improves D0 completion. The "Cast My Chart ✦" CTA is good — protects the magic frame.

---

## Screen 08 — Calculating

**Purpose:** Theatre. Build anticipation.

**Copy:** Keep current 4 phases ("Locating your planets... / Calculating house cusps... / Mapping natal aspects... / Reading your chart patterns...").

**Design notes:** Keep the gold orb + glow + dot progression. The 4.2s duration is correct — long enough to feel real, short enough not to bore.

**Psychology:** Variable reward setup. The longer the wait (within reason), the bigger the reveal feels. This is why slot machines have spinning reels — the anticipation phase produces more dopamine than the reward phase.

---

## Screen 09 — Sun-sign first hit

**Purpose:** First reward. One specific fact about them, beautifully framed.

**Copy:**
> Your Sun is in
> **Cancer**
>
> *You feel everything. And you remember all of it.*
>
> ─
>
> *That feeling of being misunderstood?*
> *Your chart explains exactly why.*
>
> YOUR CORE QUESTION
> "Who do I let in close?"
> Most Cancers spend years on this one.
>
> [ Show Me Everything ]

**Design notes:** Keep current implementation (already excellent). The core-question card is doing real work here.

**Psychology:** Single dopamine hit. The whisper line below the divider is conditional on `depth` — for `always`/`often` depth respondents, we name their misunderstood feeling directly. For others, we tease the deeper material.

**Critical:** Make sure the haptic.success() fires on mount. Currently silent — should celebrate this moment. **Add `haptic.success()` to the screen's enter animation.**

---

## Screen 10 — The big reveal

**Purpose:** The chart. The actual product. The screenshot moment.

**Copy structure:** Keep current. Chart wheel + Big 3 cards + stats strip + personalized insight.

**Design improvements:**
- **Subtle entrance animation on the wheel** — currently just appears. Suggest: wheel rotates 15° while fading in over 800ms, settles into final position. Gives a sense of "drawing the chart."
- **Each Big 3 card should fade in with a 150ms stagger** — sun first, then moon, then rising. Reads as "we're showing you yourself, layer by layer."
- **The personalized insight should reference the user's name** ("With your Moon in Cancer, *Mia*, you love…"). Adds 2 percentage points to perceived personalization.

**Psychology:** Variable reward — multiple distinct reward types in one screen (chart visual, big-3 cards, stats, insight). User can't predict exactly what they'll see. This is the screen they screenshot.

**Save to AsyncStorage:** the insight text should be saved to `FIRST_BIG_INSIGHT` (new key) so future sessions can reference it ("You came back. Last time we said: …"). This is investment-loads-trigger work.

**CTA:** "This Is Just The Beginning" → advance.

---

## Screen 11 — Wake-time anchor (NEW dedicated screen)

**Purpose:** Set the morning push schedule. The single most important post-reveal question.

**Copy:**
> YOUR MORNING
>
> **When does your**
> **day usually start?**
>
> Tomorrow morning, your first reading.
> We'll send it 5 minutes before you wake up —
> so it's the first thing you see, not another alarm.
>
>   ⏰  Pick your wake time
>
>   [    6:30 AM    ‹  ›  ]   (large picker wheel or chip row)
>
> [  Set My Morning  ]
>
> *We'll never wake you up. Promise.*

**Design notes:**
- **The hero element is the time itself, large and gold.** Like a clock. The user is choosing *their* morning, not a setting.
- Default to 7:00 AM on the wheel.
- Chip-row alternative for fast-tappers: 6 / 7 / 8 / 9 / Later / Varies.
- "Varies" maps to default 7:30 internally and a softer copy in the morning push.
- Gold-button copy is *"Set My Morning"* — possessive framing, not "Continue."
- Reassurance line below: "*We'll never wake you up. Promise.*" — directly addresses the implicit fear of being notified before chosen wake time.

**Persistence:** writes `morningTime` and `morningMinute: 5` to notification settings, same as today.

**Psychology:** Tiny Habits anchor. The user is committing to a real-world routine — wake-up — with the app attached. This is the strongest possible prompt anchor in product design.

**Why dedicated:** the current implementation buries this as a chip row inside step 11's "Daily Hook" mixed-content card. Many users skip-tap. Dedicated screen ensures everyone makes a deliberate choice.

**Analytics:** `ONBOARDING_WAKE_TIME_SET` with `wake_hour` and `is_default` (true if user just hit Continue without changing).

---

## Screen 12 — Notification bundle choice (NEW)

**Purpose:** Calibrate frequency expectations. Give the user agency. Default to "Morning + evening reflection."

**Copy:**
> YOUR RHYTHM
>
> **How often do you want**
> **the stars to reach out?**
>
> ○  **Just the morning.**
>    One reading at sunrise. Nothing else.
>    *(1 push/day)*
>
> ●  **Morning + a moment to reflect.**          ← default
>    A reading to start. A prompt to close.
>    *(2 pushes/day)*
>
> ○  **Everything cosmic.**
>    Transits, retrogrades, lunations — the whole sky.
>    *(up to 5 pushes/week)*
>
> [ Continue ]
>
> *Change anytime in Settings.*

**Design notes:**
- Three large radio cards. Middle one pre-selected (default).
- Use the existing `OptionCard` component pattern for consistency.
- Each card has a frequency chip in the lower-right corner ("1/day", "2/day", "5/wk") for clarity without label noise.
- Soft footer link ("Change anytime in Settings") below the CTA — relieves the commitment pressure.

**Mapping to existing notification settings:**

```js
const BUNDLE_PRESETS = {
  minimal: {
    cosmic_morning: true,
    evening_reflection: false,
    transit_alerts: false,
    streak_guardian: false,
    reactivation: true,        // keep on for win-back
    cosmic_milestones: false,
    weekly_digest: false,
  },
  balanced: {                  // default
    cosmic_morning: true,
    evening_reflection: true,
    transit_alerts: false,
    streak_guardian: true,
    reactivation: true,
    cosmic_milestones: true,
    weekly_digest: false,
  },
  everything: {
    cosmic_morning: true,
    evening_reflection: true,
    transit_alerts: true,
    streak_guardian: true,
    reactivation: true,
    cosmic_milestones: true,
    weekly_digest: true,
  },
};
```

**Persistence:** Writes the chosen preset to notification settings, plus a new `notification_bundle` key for analytics.

**Psychology:** Three reasons this matters more than the wake-time question for retention:
1. **Agency.** A user who chose their notification level is much less likely to disable iOS-level permission. The choice itself is investment.
2. **Calibration.** Setting expectation at 1 vs. 2 vs. 5 pushes/week prevents future "this app is spammy" reactions.
3. **Persona signal.** The bundle the user picks is a useful AI-tone signal: minimal-pickers want concise, everything-pickers want maximalist content.

**Analytics:** `ONBOARDING_NOTIF_BUNDLE_PICKED` with `bundle: 'minimal'|'balanced'|'everything'`.

---

## Screen 13 — Paywall (consolidated)

**Purpose:** Convert. Replace the current 3-screen stack with one focused screen.

**Copy:**
> ✦
> **Your chart is cast,**
> **Mia. Now what?**
>
> *You came here to navigate something big.*
> *Pro is what gets you there.*
>
> ━━━ FREE FOR 7 DAYS ━━━
>
> **What's inside:**
>
> ☉ Daily readings from *your* Cancer Sun & Pisces Moon
>     Not generic horoscopes. Your actual chart, every morning.
>
> ♡ Real compatibility — chart-to-chart
>     See exactly why someone clicks (or doesn't).
>
> ⚡ Transit alerts when planets hit *your* placements
>     Know it before you feel it.
>
> 💬 Unlimited AI conversations about your chart
>     Ask anything. Get answers grounded in your actual placements.
>
> *"I screenshot my chart reading and sent it to everyone.*
> *It was THAT accurate." — Mia, 24*
>
> ┌──────────────────────────────────────────┐
> │ ●  ANNUAL          $49.99/year (BEST VALUE)│
> │     $4.17/mo · Save 40% · 7-day free trial │
> ├──────────────────────────────────────────┤
> │ ○  MONTHLY         $6.99/month             │
> │     3-day free trial · Cancel anytime      │
> └──────────────────────────────────────────┘
>
> [ Start My Free Trial ]
> *No charge today · Cancel in Settings anytime*
>
> Continue with limited access
>
> *Free 7-day trial. Then $49.99/year. Cancel anytime.*

**Design notes:**
- Single screen, scrollable.
- The benefit list references the user's *actual* sun/moon by name. Falls back to "your Sun & Moon" if signs are missing.
- ONE testimonial inline (not three). The Mia testimonial works because it matches our target user.
- Plan-select cards stay visually similar to today's hard-close.
- "Maybe later" → "Continue with limited access" — clearer framing.

**Mapping the current 3-screen stack to this 1-screen:**
- Step 12 benefits → top half (personalized).
- Step 13 reassurance / testimonial → middle (one quote).
- Step 14 plan select → bottom.

**Psychology:**
- **Personalized benefits**: 1.5–2x conversion lift over generic feature lists in subscription-app benchmarks.
- **Goal-back callback** ("You came here to navigate something big") at the top: commitment-consistency. Currently happens on screen 14; moves up.
- **One testimonial, not three**: less is more. Three feels promotional; one feels like a friend's recommendation.
- **Single decision instead of three**: removes the "I already declined twice, why is this still asking" feeling.

**Analytics:** `PAYWALL_VIEWED`, `PAYWALL_PLAN_SELECTED { plan }`, `TRIAL_STARTED { plan }`, `PAYWALL_DISMISSED`.

---

## Post-onboarding — WelcomeScreen

Already exists. **Keep almost as-is** with these changes:

1. **Permission ask copy upgrade.** Currently the modal is generic. New copy:

> Your morning reading at **7:30am, Mia.**
>
> *Tomorrow's first message:*
> *"Yesterday you read this about yourself: 'Your emotions are written all over your face.' Today, watch for the second part."*
>
> [ Allow notifications ]
> Maybe later

The preview line is the actual D1 push body. Showing the user the first push they'll receive is the strongest possible permission-grant pitch.

2. **CTAs reordered.** Keep "Ask Celestia about this →" as primary. The dashboard secondary CTA stays.

3. **Save the bundle choice + wake time** to AsyncStorage on WelcomeScreen mount, before permission ask. Currently this happens during onboarding, which is correct — just verify it persists past the Auth → WelcomeScreen transition.

---

## Post-onboarding — HomeScreen first-session

**For the dashboard-CTA cohort** (~50% of users who skip the chat prefill), add a single Starter Step on Today:

**A "save this for later" affordance on the navigator briefing card.**

> [Navigator briefing copy]
>
> ─
>
>   ☆  Save this  →   [ Saves to Journal ]

One tap. Creates a journal entry tagged "from onboarding." This is:
- A Tiny Habit Starter Step (smallest meaningful action).
- An investment that loads tomorrow's trigger (we now have a journal entry to reference in D1 push).
- Personalized content the user owns — switching cost.

**Psychology:** Headspace/Duolingo pattern of "do something tiny on day 0." Increases D1 retention by 15–25% in published case studies.

**Analytics:** `FIRST_INSIGHT_SAVED { source: 'onboarding_card' }`.

---

## Animation and haptic spec

| Moment | Haptic | Animation |
|---|---|---|
| Splash → Hook (screen 01) | none | Glow halo pulses once (800ms) |
| Each option-card tap (02–04) | light | Card border gold-flash (300ms) |
| Birth-date / time / place selection | light | Field border gold-fill (200ms) |
| "Cast My Chart" tap (07) | medium | Button scale 0.96 → 1.0 (150ms) |
| Calculation orb (08) | none | Pulsing glow + dot progression |
| Sun-sign reveal (09) | success | Sign name scales 0.9 → 1.0 over 600ms with gold glow |
| Big reveal (10) | success | Wheel rotation entrance (15°), Big 3 stagger (150ms each) |
| Wake-time set (11) | medium | Time digits flip up |
| Bundle pick (12) | light | Selected card border gold-glow |
| Trial start (13) | success | Button scales 1.0 → 1.05 → 1.0 with gold particle burst (use existing `cosmicIdShareBtn` glow style) |

These are not decoration. Each celebration is a Tiny Habits-style positive emotion that helps the next step feel rewarded. Total time added across the flow: ~3 seconds. Total perceived quality lift: significant.

---

## Copy register notes

The existing copy voice (Playfair-and-DM-Sans, Cancer-tagline tone) is good. Maintain:

- **Sentence-case headlines.** No ALL-CAPS in hero copy.
- **Tiny phase labels in spaced ALLCAPS gold** (e.g. "ABOUT YOU", "YOUR CHART", "YOUR MORNING") — these orient the user without taking attention.
- **Short serif headlines, two lines max.** Italicized words for emphasis (`<Text style={s.h1em}>`).
- **Sub-copy in DM Sans Light, two lines max.** No paragraphs.
- **CTA copy is verb-driven and possessive** ("Cast My Chart", "Set My Morning", "Show Me Everything", "Start My Free Trial"). Not "Continue" or "Next."
- **Disclaimer copy is small, italicized, low opacity.** Defuses commitment without hiding it.

**Anti-patterns to avoid:**
- Generic "your cosmic anything" copy.
- Astrology jargon in CTAs (no "natal," "ephemeris," etc.).
- ALL-CAPS in body text.
- More than two emoji per screen.
- Time-pressure language ("ends in 24h", "limited spots") — kills trust.

---

## Step transitions

Same animation as today: `slide` of `Animated.Value(0 → -20 → 20 → 0)`. Keep. Adds rhythm to the flow.

**Back button:** present on screens 02–12. Hidden on 01 (hook), 08 (calculating), 13 (paywall — we explicitly don't let them go back from here, the chart is in the rear-view at this point; they go forward or skip).

**Progress bar:** show on screens 02–12 (so 11 of 13 screens). Hide on 01 (no progress to show), 13 (paywall is post-progress, the bar is full and would distract from conversion).

---

## State map

```js
const onboardingState = {
  // Investment phase
  motivation: null,       // 'self' | 'change' | 'love' | 'curious'
  painPoint: null,        // 'love' | 'career' | 'self' | 'all'
  depth: null,            // 'always' | 'often' | 'sometimes' | 'aware'

  // Chart inputs
  firstName: '',
  birthDate: null,
  birthTime: null,
  isTimeUnknown: false,
  selectedCity: null,

  // Computed
  chart: null,
  todayTransits: [],
  moonData: null,

  // Commitment phase (NEW spec)
  wakeHour: null,                // numeric or 'varies'
  wakeMinute: 0,                 // for fine-grained picker
  notificationBundle: 'balanced', // 'minimal' | 'balanced' | 'everything' (default to balanced)

  // Plan
  selectedPlan: 'annual',
};
```

---

## Open questions

1. **Should the bundle choice be skippable?** Recommendation: no — it's a 1-tap question with a default already selected. The cost of asking is near-zero; the cost of not asking (everyone defaults to all-channels-on) is significant.
2. **Should we pre-fill firstName from device locale?** iOS exposes `Application.applicationName`; better source is contacts but requires permission. Simple win: check AsyncStorage for prior session, otherwise leave blank.
3. **Should "Varies" wake-time map to 7:30 default or to a smarter per-day estimate?** Recommendation: ship 7:30. Smarter per-day is a v2 enhancement.
4. **Should we add an optional pronouns / gender screen?** Recommendation: skip in v1. Only ~10% of AI tone improvements come from this; not worth the friction.
5. **Should the chart insight on screen 10 use Gemini live or a template?** Currently it's a template based on motivation/painPoint. Live Gemini would be slightly better content but adds 2–4s of latency to a screen that should feel instant. Stay with template; live Gemini happens later in the user's first chat.

# 09 — Notifications Deep Dive

How competitor apps ask for permission and what they let users configure, mapped against what our notification system can already do. Use this to decide which knobs we expose in onboarding before writing any new code.

---

## TL;DR — three dimensions of choice

Every notification system can let the user choose along three axes:

| Dimension | What it controls |
|---|---|
| **WHEN** | Time of day, days of week, quiet hours |
| **WHAT** | Type of content (morning reading, transit alert, evening prompt, streak reminder, etc.) |
| **HOW MUCH** | Frequency, channels, daily cap |

Most apps expose 1–2 axes during onboarding and hide the rest in Settings. The retention thesis you raised — *user-chosen = more retention* — is correct, but with a sharp caveat: each additional question costs ~2-4% completion. The sweet spot is **the smallest set of choices that still produces ownership.**

---

## Competitor teardowns

### Co-Star — *the zero-choice extremist*

**Permission ask:** End of onboarding, immediately after the chart reveal. One-shot, no configurable preview.

**WHEN:** No control. Co-Star picks a randomized morning time inside its own window (~9–11am).

**WHAT:** No control. One push per day. Same shape every day: a brutal ~140-character line about your placements ("*Your Mars in Cancer is sulking*").

**HOW MUCH:** No control. Fixed 1/day (their famous discipline).

**In Settings:** Single on/off toggle. That's it.

**Retention bet:** The *unpredictability* is the variable reward. They lose users who hate notification anxiety; they retain users who treat the daily push as a small ritual.

**What works for us to copy:** Discipline. One push per day per channel. Don't blast.
**What doesn't:** Their "we choose the time" model gets review-pile complaints. We let users pick — keep that.

---

### The Pattern — *the brutal once-a-day*

**Permission ask:** Mid-flow, after birth data but before the deepest chart reveal. Frames it as "your daily insight."

**WHEN:** Single fixed time chosen by app, no user picker.

**WHAT:** One type — the daily "your most pressing pattern" push. No transit alerts, no journal prompts.

**HOW MUCH:** Daily. No frequency control.

**In Settings:** On/off + a "weekly summary" toggle. That's the entire surface.

**Retention bet:** Same as Co-Star — the *daily certainty* is a habit anchor. They sacrifice flexibility for predictability.

**What we can steal:** The single-question discipline. They don't ask the user 5 questions about notifications because there's nothing to configure.

---

### Nebula — *the configurable maximalist*

**Permission ask:** Mid-onboarding, with a slide-up modal. Asked early-ish (before paywall).

**WHEN:** Time picker for daily horoscope. User chooses morning hour.

**WHAT:** **Multi-toggle** — daily horoscope, weekly forecast, love updates, career updates, full moon alerts. Probably 6–8 types.

**HOW MUCH:** Frequency dial: low / medium / high (which silently maps to channel counts).

**In Settings:** Full per-type toggles + push-text language preference.

**Retention bet:** Heavy commitment-consistency funnel. Each toggle is investment.

**Cost:** Their notifications get aggressive. Many users disable iOS-level permission within a week. Reviews mention "spammy."

**What we can steal:** The frequency dial concept (more elegant than per-channel toggles).
**What we shouldn't:** The 6–8 type toggle list — overload at exactly the wrong moment.

---

### Sanctuary — *the middle path*

**Permission ask:** Late onboarding, after chart reveal. Two preference questions before the system prompt:
1. *"What time do you want your daily horoscope?"* (time picker)
2. *"Get transit alerts when something big is happening?"* (binary)

**WHEN:** User picks morning time. Fixed for transit alerts.

**WHAT:** Two types, gated by binary toggle.

**HOW MUCH:** Daily horoscope + opportunistic transits.

**In Settings:** Same two toggles + quiet hours.

**Retention bet:** Two questions = enough commitment, low decision fatigue.

**What we can steal:** The binary supplementary toggle for transit alerts. Clean. Doesn't add a screen.

---

### Headspace / Calm — *anchor-framed time picker*

**Permission ask:** After meditation preferences are set. The frame is: *"Remind me to meditate at __."*

**WHEN:** User picks time (free-text or scrubber). Days-of-week selector below: every day / weekdays / custom.

**WHAT:** Single type — the practice reminder.

**HOW MUCH:** Daily by default. Some apps offer "every other day."

**Retention bet:** Anchored to an existing routine intention ("when I want to meditate"), not "what time should we send notifications." This is Fogg's anchor pattern done well.

**What we can steal:** The *days-of-week* selector. Many users want morning pushes on weekdays only and weekends off.

---

### Duolingo — *the gamified granularity*

**Permission ask:** Just after first lesson. Modal explains stakes: *"Don't lose your streak."*

**WHEN:** User picks a daily reminder time. Streak warnings fire at fixed times (e.g. 8pm if not yet practiced).

**WHAT:** **Per-type toggles** in Settings:
- Practice reminders
- Streak warnings
- Friend activity
- Leaderboard updates
- Promotions
- Achievements

**HOW MUCH:** Each type independently togglable.

**Retention bet:** Heavy per-type granularity, but it's gated *behind* the gamification. The user isn't picking notification types in the abstract — they're picking which game systems they want to be reminded about.

**Cost:** Notification fatigue is real. Users frequently disable everything except streaks.

**What we can steal:** The "context the toggle in user value" framing. Don't say "transit alerts on/off." Say *"When planets hit your chart, want to know? On / off."*

---

### Cal AI / Noom — *the quiz-funnel approach*

**Permission ask:** Late, after paywall. Quiz funnel earlier captured the inputs.

**WHEN:** Asked mid-funnel as a quiz question: *"When do you want your daily nudge?"*

**WHAT:** Inferred from the quiz. User stated their goal → app picks the relevant push types.

**HOW MUCH:** "How motivated are you right now?" — a thinly disguised frequency proxy. High motivation → more pushes.

**Retention bet:** The *funnel* IS the choice — every quiz question is a future-personalization signal.

**What we can steal:** The "motivation" question as a frequency-mapping. We could ask *"How present should I be in your day?"* and map to bundles.

---

## Side-by-side comparison

| App | Permission timing | Time picker | Type toggles | Frequency dial | Days of week | Quiet hours |
|---|---|---|---|---|---|---|
| **Co-Star** | Post-reveal | ❌ | ❌ | ❌ | ❌ | ❌ |
| **The Pattern** | Mid-flow | ❌ | binary | ❌ | ❌ | ❌ |
| **Nebula** | Mid-onboarding | ✅ | 6-8 types | ✅ low/med/high | ❌ | ❌ |
| **Sanctuary** | Post-reveal | ✅ | binary (transit) | ❌ | ❌ | Settings only |
| **Headspace** | Post-onboarding | ✅ | ❌ (1 type) | ❌ | ✅ | Settings only |
| **Duolingo** | Post first-lesson | ✅ | 6 types | ❌ | ❌ | Settings only |
| **Cal AI** | Post-paywall | ✅ (quiz) | inferred | quiz proxy | ❌ | ❌ |
| **Celestia (current)** | Post-paywall | ✅ (anchor) | 3 bundles | bundle = freq | ❌ | Settings only |

The pattern: **most apps ask 1–2 questions in onboarding and put the rest in Settings.** Nebula is the outlier on configurability and pays for it in retention.

---

## What our notification system can actually do today

Mapping from `notificationService.js`:

**Already configurable in onboarding:**
- ✅ Wake time (step 11) → `morningTime`, `morningMinute`
- ✅ Bundle (step 12) → maps to 7 underlying channels via `BUNDLE_PRESETS`

**Configurable in Settings only:**
- ☑️ Per-channel toggles (7 channels: morning / evening / transit / streak / reactivation / milestones / weekly digest)
- ☑️ Bundle picker (mirrors onboarding)
- ☑️ Quiet hours (start/end hour, on/off)
- ☑️ Morning time picker (overrides onboarding choice)

**Not yet configurable anywhere:**
- ❌ Evening reflection time (hardcoded 8:30pm)
- ❌ Streak guardian time (hardcoded 9pm)
- ❌ Weekly digest day/time (hardcoded Sunday 9am)
- ❌ Days of week (every day, no weekday-only mode)
- ❌ Per-day daily cap (auto: 1-2 based on weeks since install)

**Notification engine:** template-driven (`notificationContentEngine.js`), variable-reward weighted, lapsed-cascade safety net, voice-guide enforced. The infrastructure is solid.

---

## What we could expose in onboarding

Each option costs a screen (or partial-screen). Ranked by retention ROI:

| Option | Effort | Retention ROI | Reasoning |
|---|---|---|---|
| Wake time anchor | shipped | High | Anchors morning push to existing routine |
| 3-bundle picker | shipped | Medium | Easy choice, light commitment |
| Add Customize as 4th bundle | XS | Medium | Power users get granular toggles |
| Days-of-week selector | S | Medium | Many users want weekday-only pushes |
| Evening reflection time | S | Low-Medium | Currently hardcoded; making it user-picked = small commitment + better fit |
| Quiet hours | S | Low | Most users default; useful for night-shift workers |
| Per-type toggles (5+) | M | Variable | Can hurt completion rate; high commitment for power users |
| Frequency dial low/med/high | XS | Low | Mostly redundant with bundle picker |
| Type-by-type swipe (Tinder) | L | High but adds screen | Could replace bundle picker, not add to it |

---

## Three concrete paths forward

### Path 1 — Minimal (ship now)
Keep current 3-bundle + wake-time. Add "Customize" as 4th option that expands inline to show 5 toggles (morning / evening / transit / cosmic events / streaks). Settings already has this UI.

- Onboarding screen count: same (12)
- Effort: ~30 min
- Retention upside: small but real — power users get ownership

### Path 2 — Sanctuary-style (recommended)
Keep wake-time + bundle. Add a single supplementary binary toggle on the bundle screen: *"Send me alerts when planets hit your chart? (on/off)"* — independent of bundle, defaults ON.

- Onboarding screen count: same (12) — adds one toggle row
- Effort: ~45 min
- Retention upside: explicit commitment to the most powerful retention push (transit alerts), without a new screen

### Path 3 — Headspace-style days picker
Keep current. Add "Which days do you want this?" → Every day / Weekdays / Custom. Below the wake-time anchor on step 11.

- Onboarding screen count: same (12) — adds a row to wake screen
- Effort: ~1 hr (new field in settings, scheduler logic update)
- Retention upside: medium — many users want weekday-only and currently can't get it

### Path 4 — Combination (best impact, most effort)
All three above:
- "Customize" as 4th bundle option (Path 1)
- Transit alerts binary toggle (Path 2)
- Days-of-week selector under wake-time (Path 3)

Onboarding screen count: still 12 (additions inline, not new screens)
Effort: ~2 hrs
Retention upside: highest — three commitments instead of two

---

## My recommendation

**Path 2 (Sanctuary-style) for v1, Path 4 if we have time for v2.**

Reasoning:
1. The bundle picker already gives users the basic choice. Adding a single binary transit-alert toggle on the same screen creates a second commitment moment with zero new screens.
2. Transit alerts are the highest-engagement notification type in our system (event-based, specific, urgent feeling). Users who explicitly opt in are the cohort we most want to retain.
3. Days-of-week is a real ask but has more engineering surface (scheduler needs to filter by day). Worth it but not blocking.
4. Per-type 5-toggle picker is decision-fatigue prone and the bundle picker already does this work cleanly.

**For permission ask timing:** stay with current (post-paywall on WelcomeScreen). The chart-reveal moment + concrete D1 push preview ("Tomorrow at 7am: Yesterday you read this about yourself...") is the strongest possible specificity. Moving the ask earlier trades concrete-preview for marginally-better-commitment-consistency. Bad trade.

**Optional sweetener:** when permission denied, show a small in-app banner on Today (once, day 3) with the same preview copy — a second-chance ask without a system-level re-prompt that would deep-link to Settings.

---

## What we'd ship under Path 2

The bundle screen (step 12) gains one extra row below the bundles:

```
YOUR RHYTHM
How often do you want the stars to reach out?

  ◯  Just the morning (1/day)
  ●  Morning + a moment to reflect (2/day)        ← default
  ◯  Everything cosmic (5/wk)

  ─────────────────────────────────

  ⚡  Alert me when planets hit my chart
                                          [ ON / off ]

  [ Continue ]
  Change anytime in Settings.
```

The toggle is independent of bundle choice. Defaults ON. Maps directly to `transit_alerts` channel in `BUNDLE_PRESETS` — overrides the bundle's default for that channel.

That's the smallest addition that produces a third commitment in onboarding without a new screen. Bundle, transits, wake-time = three explicit choices about how the app shows up in their day.

---

## Questions for you to decide

1. **Permission timing**: keep on WelcomeScreen (post-paywall) or move to step 12.5?
2. **Granularity**: Path 1 (Customize) / Path 2 (transit toggle) / Path 3 (days-of-week) / Path 4 (all three)?
3. **Days-of-week**: yes or skip? (Affects Path 3 / 4)
4. **Quiet hours in onboarding**: yes or skip? (I'd skip — Settings is enough)

When you've decided, we wire it up. Until then this doc is just research.

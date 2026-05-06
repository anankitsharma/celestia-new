# Stage 2 — Day 1 through Day 7

The activation window. Habit either takes hold this week or it doesn't. **Everything in the retention plan is tuned to this period.**

## Sub-stage 2.1 — D1 morning return

**Trigger:** Wake-time-anchored push fires at user's stated wake-up time + 5min (default 7:30am if they declined the wake-time question).

**Push template:** `cm_d1_personal` (weight: 110 — outranks every other morning template). Fires only on D1 with `data.firstRevealStatement` available.

**Push copy:**
> Title: *"Yesterday you read this about yourself:"*
> Body: *"'[their reveal statement]' Today watch for the second part."*

**User action:** Tap notification.

**App opens to:** Today tab (HomeScreen).

**What they see:**
- Hero gradient with name + greeting + streak pill ("1 day")
- Navigator briefing card (the Pro Insight card if they're already in trial)
- Bento row (Today's Sky / Streak / Quest)
- Time-mode-aware life-area cards
- Journal prompt
- Sky now / Mercury Rx / Lunar event cards

**Analytics:**
- `push_opened` (with template_id=cm_d1_personal, channel=cosmic_morning, cold_start=true if from notification, false if app already open)
- `daily_briefing_viewed`
- `streak_milestone_hit` if streak hit 1 (first_light badge unlocks)

**Emotional state:** +3 (the "they remembered me" feeling)

---

## Sub-stage 2.2 — Streak start prompts (D2-D3)

**Without streak ≥3:** No streak_guardian push. The user is in the most vulnerable window.

**At D2 — proactive freeze offer (P1.6):**
- One-time modal: *"You've got 1 free streak freeze. Save it for a busy day — it'll keep your streak going automatically."*
- Pre-loads loss aversion BEFORE risk
- Captures `streak_freeze_offer_shown`, `_acknowledged`

**At D3 streak milestone:**
- StreakMilestoneModal fires with: ✦ + "Three days. The first sign you mean it." (DA-1.3 voice rewrite)
- Streak emoji escalates: ◌ → ✦ at 3 days
- New badge `cosmic_explorer` unlocks

**If user breaks streak (skips a day):**
- D2 lapse push: *"Two days. The Moon's in [sign]. You're going to want to know what that means."*
- (Personalized per P1.4 — uses moonData + lastPartnerName + lastChatTitle if available)

**Analytics:**
- `streak_milestone_hit`
- `badge_unlocked` (cosmic_explorer)
- `streak_broken` (with previous_streak, days_absent, comeback_bonus, source)

---

## Sub-stage 2.3 — Variable reward at D4

`maybeGetSurpriseInsight()` runs on each app open. Trigger days are **D4 / D10 / D17 / D24** with a 30% probability roll.

**If roll lands at D4:**
- A "SOMETHING I NOTICED" card replaces nothing on Today tab
- Gemini-generated 2-3 sentence chart-grounded observation
- One-shot per user; tracked in `SURPRISE_INSIGHT_STATE` storage so it never repeats

**Example:**
> *"Something I noticed — about your moon: Your sun-saturn aspect means you're probably the friend who feels older than your years. That comes with a particular kind of loneliness — the wisdom is real, but so is the gap."*

**Analytics:**
- (Card render is silent; no specific event yet, but user interaction with subsequent chat is captured)

**Emotional state:** +4 (variable reward — the dopamine spike Hook Model targets)

---

## Sub-stage 2.4 — D6 anticipation push

**Trigger:** Streak hits 6.

**Push fires next morning at wake-time:**
- Title: *"One more morning. Then it counts."*
- Body: *"Tomorrow ★ — the kind of consistency most people don't manage past day 4."*

**Why this exists:** Anticipation is a stronger dopamine driver than the milestone itself. **Hook Model: anticipation > reward.**

**Analytics:**
- `push_opened` if tapped (template_id=`cm_streak_anticipation_7`)

---

## Sub-stage 2.5 — D7 first-week recap (the activation milestone)

**Triggers in cascade when streak hits 7:**

1. **`stargazer` badge unlocks** (`achievementService.js streak_update` case)
2. **30% chance of hidden surprise badge** roll (5 hidden badges in pool: `first_glimpse`, `cosmic_curious`, `quiet_observer`, `pattern_finder`, `night_dweller`)
3. **StreakMilestoneModal** fires: ✦ + *"A week. Most people don't make it past four days."* (DA-1.3 voice)
4. **First-week-recap modal** fires (Gemini-generated, references the FIRST_REVEAL_STATEMENT for continuity per CA-A4):
   - Headline: 4-7 word summary of their week
   - Observation: 2-sentence "I noticed about you" reflection referencing their reveal
   - Thread forward: 1-sentence whisper about week 2
5. **Permission re-ask** if user declined notifications during onboarding (FINAL-5 — capped at 2 lifetime re-asks)

**Modal CTAs:**
- Share button (fires `SHARE_INITIATED` with `source='first_week_recap'`)
- Continue (closes)

**Analytics fired:**
- `streak_milestone_hit`
- `badge_unlocked` (stargazer + maybe surprise badge)
- `pro_week1_recap_shown` (if Pro)
- `share_initiated` if shared

**Emotional state:** **+5 (PEAK).** Equivalent to the chart reveal in emotional intensity. Habit consolidates here.

---

## Sub-stage 2.6 — D7 lapse path (alternate)

**If user does NOT hit a 7-day streak by D7:**
- Lapse cascade has been firing per `notificationService.js` schedule:
  - D2: *"Two days. The Moon's in [sign]. You're going to want to know what that means."*
  - D3: *"Three days. Your chart moved twice without you."*
  - D5: *"Five days. Three transits hit your chart while you were away."*
  - D7: *"A full week. The Sun moved 7 degrees."*
- All on `reactivation` channel (P1.5 — independent from streak channel so disabling streaks doesn't kill re-engagement)
- All copy is partner-aware / chat-aware / chart-fallback tiered (P1.4)

**Analytics:**
- `push_delivered` per template fire
- `push_opened` per tap

---

## End-of-week-1 success criteria

Per the playbook (`plan/retaintion-new/05-7day-playbook.md`):

| Metric | Target |
|---|---|
| D1 return (any open) | 50%+ |
| D7 return (any open) | 35%+ |
| Streak ≥3 by week-end | 30% |
| Streak = 7 by week-end | 15% |
| First chat sent | 50%+ |

These are measurable in PostHog once cohorts are configured. Without the dashboards (P0.3), the activation funnel is shipped blind.

---

## Risk points + mitigations

| Risk | Mitigation in code |
|---|---|
| User declines notifications | Modal post-chart (P1.2); `cm_d1_personal` requires permission to fire — no permission, no D1 ping. Permission re-ask at D7/D14 (FINAL-5) |
| User opens app once on D1 then forgets | Lapse cascade D2/D3/D5/D7 (P1.4) |
| User finds D1 push generic | `cm_d1_personal` references their actual reveal statement (FINAL-4) |
| User feels behind without a streak | "Fresh start" framing in D5 lapse pushes; comeback bonus on broken streaks (`rep_streaks.js`) |
| User skips ahead to "weekly view" too early | Period tabs (yesterday/tomorrow/weekly) intentionally deprioritized in audit findings |
| User overwhelmed by Today tab content | Time-mode-aware content trimming; bento row added (AND-7) for visual rhythm |

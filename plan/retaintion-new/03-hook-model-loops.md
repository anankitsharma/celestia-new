# 03 — Hook Model: Loop Design

Applying Nir Eyal's Hook Model: **Trigger → Action → Variable Reward → Investment**, repeated until the behavior is automatic. Each cycle must move the user from external triggers (notifications) to internal triggers (emotion).

> *"Habits are not created — they are built through successive cycles through the Hook."*

---

## Diagnosis: Celestia's current loop

```
   ┌────── Trigger ──────┐
   │ EXTERNAL: morning   │       Trigger is generic.
   │ push at 7:30am      │       Internal trigger is undefined.
   └──────────┬──────────┘
              ▼
   ┌────── Action ──────┐
   │ Open app, read     │        Low friction. ✓
   │ daily briefing.    │
   └──────────┬─────────┘
              ▼
   ┌─── Variable Reward ───┐
   │ Daily forecast +      │     Variability is FINITE.
   │ moon phase + quests.  │     By week 3, structure
   └──────────┬───────────┘     feels predictable.
              ▼
   ┌────── Investment ──────┐
   │ Streak +1, XP awarded, │    Investment exists but
   │ maybe a journal entry. │    is largely INVISIBLE
   └──────────┬─────────────┘    to the user.
              │
              ▼
        (loops back to push tomorrow)
```

**Score: 6/10.** All four phases exist; none are best-in-class.

---

## Phase 1 — Trigger

### Current external triggers

| Trigger | Type | Status |
|---|---|---|
| Cosmic Morning push 7:30am | Time-based | ✓ active |
| Evening Reflection 8:30pm | Time-based | ✓ active |
| Transit Alert 11am on cosmic windows | Event-based (cosmic event) | ✓ active |
| Streak Guardian 9pm if streak ≥3 | Event-based (loss aversion) | ✓ active |
| Weekly Digest Sunday 9am | Time-based | ✓ active |
| Lapse cascade D2/3/5/7/10/14/21 | Inactivity-based | ✓ active but generic |

**The gap:** all triggers are external. After 30 days, if the user disables notifications, do they still open the app? Today: **probably not.** The internal trigger has not been wired.

### Internal-trigger thesis for Celestia

**Map the product to a specific negative emotion.** From the audit, the emotions Celestia *could* resolve:

| Emotion | Fit | Rationale |
|---|---|---|
| **Uncertainty about a person** | ★★★★★ | Compatibility/Circle is built on this. Chat opens with "Why do I keep choosing the same…" |
| **Anxiety about a decision** | ★★★★ | Daily navigator briefing frames the day as do/avoid |
| **Loneliness** | ★★★ | Risk: ethical boundary. Evening reflection brushes against this. |
| **Boredom** | ★★ | Possible but low-fit; better-served by social apps |
| **Curiosity about self** | ★★★★ | Strong in onboarding; fades after week 1 |

**Recommendation: pick ONE primary emotion and ruthlessly design for it.** Strongest candidate:

> **"I don't know what to do about [person/situation]."**

Every chat suggestion, every push, every surface in week 3+ should evoke or resolve this emotion. The app should become the automatic response when the user feels stuck about a relationship or decision.

### External-to-internal transition plan

| Phase | Trigger source | Mechanism |
|---|---|---|
| Week 1 | External: morning push, onboarding flow | App tells user when to open |
| Week 2 | External + emerging anchor | Push + "I noticed I check this with my coffee" |
| Week 3 | Anchored | User opens app at habitual time without push |
| Week 4+ | Internal | User opens app *when stuck about a person* — with or without push |

Measure transition by tracking organic-open rate (app opens with no push delivered in prior 4 hours). Goal: rises from <20% in week 1 to >50% by week 4.

### Trigger redesigns

| Current | Redesigned | Why |
|---|---|---|
| Morning push, generic copy | Anchor to user's actual wake time (asked in onboarding) | Anchor moment > scheduled time |
| Lapse push: "Your patterns kept moving" | Lapse push: "[Partner name] came up in your chart this week. Want to read?" | Reference user's investment |
| No event-based prompt | "Your unfinished chat from Tuesday — pick up?" | Action-prompt tied to real event |
| Streak Guardian only if streak ≥3 | Also fires "fresh start" push if no streak by D5 | Don't only protect existing streaks |
| No internal-trigger surfacing | "Stuck on something? Ask Celestia." in-app prompt when user lingers on home for 5+ seconds | Make the emotion explicit |

---

## Phase 2 — Action

The simplest behavior in anticipation of reward. **B = M·A·P** — make M·A high enough that the prompt fires the action.

### Current actions and their friction

| Action | Friction (Ability Chain) | Score |
|---|---|---|
| Read daily briefing | < 30s, 1 tap | 9/10 |
| Send a chat | 4–5 taps, decide what to ask, type | 5/10 |
| Read a report | 1 tap to open, but content is long | 6/10 |
| Add a partner to Circle | 6+ fields (name, DOB, time, location, type) | 3/10 |
| Write a journal entry | Open keyboard, decide what to write | 4/10 |

### Starter Steps (the smallest meaningful action)

Hook Model: scale by starting tiny. Define starter steps for each:

| Behavior | Starter step | Why it works |
|---|---|---|
| Send a chat | Tap one of 4 pre-filled suggestion chips on the home screen | One tap, no typing |
| Read a report | Auto-show a 2-line summary card on home; tap "Read more" if interested | Removes "open report" decision |
| Add a partner | Just name + zodiac (zodiac-only mode already exists in `SynastryService.js`) | Eliminates 4 of 6 fields |
| Write a journal entry | One-tap "How was today?" → 3 emoji options + optional note | Removes blank-page resistance |
| Daily check-in | Auto-checkin on app open if user spends >5s on home | Streak earned passively |

### Action sequence prioritization

Currently the home screen presents many parallel actions. Hick's Law: more choices = slower decisions. **Prioritize one primary action per session by time-of-day:**

| Time | Primary action | Why |
|---|---|---|
| Morning | Read briefing → tap one life-area card | Sets up the day |
| Afternoon | Send a chat | High-engagement window |
| Evening | Journal prompt with one-tap mood selection | Reflection routine |
| Late night | Tomorrow's briefing preview | Anticipation |

Reduce home-screen decision load by hiding/dimming non-primary actions for the current time mode.

---

## Phase 3 — Variable Reward

Three types: **Tribe** (social), **Hunt** (resources/info), **Self** (mastery). Predictable rewards lose power. **Variability is what sustains engagement.**

### Current reward audit

| Reward | Type | Variability |
|---|---|---|
| Daily briefing | Hunt + Self | **Low** — same structure every day |
| Streak increment | Self | None — fully predictable |
| XP gain | Self | Low — fixed values per action |
| Badge unlock | Self | Moderate — surprises exist but milestones are visible |
| AI chat response | Hunt | **High** — genuinely variable, this is Celestia's strongest reward |
| Compatibility result | Self + Tribe | High first time, low on repeat |
| Moon phase change | Hunt | Predictable — astronomical fact |
| Forecast content | Hunt | Moderate — varies by day-of-year seed |

**Score: 6/10.** Chat is the strongest variable reward. Daily briefing is the weakest. Tribe rewards are nearly absent.

### Recommendations by reward type

**Hunt (resources/info):**
- Vary the *structure* of the daily briefing weekly. Week 1: full briefing. Week 2: pattern-recognition mode. Week 3: partner-focused mode. Week 4: archetype mode. Don't let the user predict the format.
- "Surprise" insights: 1 in 10 days, replace the standard briefing with a special card ("3 patterns I've noticed about you") generated from journal/chat history.

**Self (mastery):**
- Hide a fraction of badges from the catalog so users discover them by accident.
- Variable XP: standard chat = 5 XP, but with 10% chance of 2× bonus shown as a confetti animation. Slot-machine effect.
- Streak milestones should *unexpectedly* unlock something at non-round numbers (e.g., D11 unlocks a "secret" feature) — currently only D1/7/30/100 trigger anything.

**Tribe (social):**
- Currently nearly zero. Possible additions:
  - **Cosmic Connector badge** exists but is single-trigger. Make it tiered (1, 5, 25 referrals).
  - Synastry sharing: when partner views their Circle entry, the original user gets a notification "Sarah read what you saved about her." (Requires light social layer — could be opt-in and one-way.)
  - Anonymous community insights: "1,247 Geminis felt off today." Aggregate, no PII.

### Ethical guardrail

The skill warns against extractive variability. Celestia's Manipulation Matrix score:

| | Maker uses product | Maker doesn't |
|---|---|---|
| Materially improves user's life | **Facilitator** ← aim here | Peddler |
| Doesn't improve life | Entertainer | Dealer |

Reflection helps; compulsive engagement hurts. **Never** add infinite scroll, never add notification storms, never add streak-loss-anxiety patterns that exceed real value. Variable reward is for genuine surprise, not slot-machine extraction.

---

## Phase 4 — Investment

The IKEA effect: users value what they put effort into. Investment loads the next trigger. Each cycle must add stored value that makes leaving costlier.

### Current investment audit

| Investment | Loads next trigger? | Visible to user? |
|---|---|---|
| Birth chart | No follow-up trigger | Yes (chart screen) |
| Partner / Circle entries | No | Yes (Circle screen) |
| Chat history | No — chats sit unread | **No** — no "your unread chats" surfacing |
| Journal entries | No | Partial — entries listed but not surfaced as patterns |
| Streak | Loosely — Streak Guardian | Yes (home pill) |
| XP / badges | Loosely — Level-Up modal | Yes |
| Saved reports | No | Partial |

**Score: 7/10.** Investment exists; very little of it loads the next trigger.

### Investment redesigns: every input creates a future prompt

| Investment | New triggered output | Mechanism |
|---|---|---|
| Add partner to Circle | Notification 2 days later: "I noticed [partner] has Mars in your 7th house. Want to know what that means for you?" | Gemini-generated insight referencing the partner |
| Send chat | Notification 1 day later (only if user didn't return): "About your chat yesterday — here's something that came up." | Continues the thread with a new angle |
| Write journal entry | Weekly notification: "You wrote about [theme] 3 times this week. Patterns I'm noticing…" | Pattern recognition over journal corpus |
| Hit 7-day streak | Trigger an "earned content" unlock — e.g., "Your custom monthly report is ready." | Reward the investment with new resource |
| Read report | Notification 3 days later: "A new section for your [type] report just unlocked." | Periodic refresh based on transits |

**Each of these is an event-based prompt that the audit flagged as missing.** The Hook Model demands them.

### Surface the IKEA effect

Users should *see* their accumulated investment:

- On profile: "152 journal entries · 47 chats saved · 12 charts in your Circle."
- On 30-day milestone: a personalized "Your year so far" recap card (data-driven, share-ready).
- Before any cancel/delete action: show what they'd lose ("You've built 4 months of patterns Celestia knows about you. Want a backup before you go?").

---

## Redesigned loop

```
   ┌─────────── Trigger ───────────┐
   │ External (early): anchored    │
   │ push at user's wake-time      │
   │                               │
   │ Internal (target): "I don't   │
   │ know what to do about X."     │
   └────────────────┬──────────────┘
                    ▼
   ┌─────────── Action ────────────┐
   │ Time-mode primary action only │
   │ (one tap to chat / journal /  │
   │ read briefing). Starter steps │
   │ everywhere.                   │
   └────────────────┬──────────────┘
                    ▼
   ┌─────── Variable Reward ───────┐
   │ Hunt: rotating briefing       │
   │   formats; surprise insights  │
   │ Self: hidden badges, XP       │
   │   bonus rolls, secret unlocks │
   │ Tribe: tiered referrals,      │
   │   opt-in synastry signals     │
   └────────────────┬──────────────┘
                    ▼
   ┌──────── Investment ───────────┐
   │ Each input → loads next       │
   │ trigger (chat → follow-up,    │
   │ partner → insight push,       │
   │ journal → weekly pattern)     │
   │                               │
   │ Surface IKEA effect on        │
   │ profile + at risk moments     │
   └────────────────┬──────────────┘
                    │
                    └──► back to Trigger (now event-based, eventually internal)
```

**Target score: 9/10** — variable reward type-3 (Tribe) and event-based investment-driven prompts close the gap.

---

## Habit Zone check

Hook Model: a product enters the habit zone when **frequency × perceived value** is high enough.

| | Low frequency | High frequency |
|---|---|---|
| **High value** | Viable (needs marketing) | **HABIT ZONE ← Celestia** |
| **Low value** | Failure | Failure |

Celestia is *targeting* the habit zone (daily use × high perceived value). Whether it lands depends on whether the redesigned loop holds users past D14 — which is exactly what `05-7day-playbook.md` and `06-30day-playbook.md` are for.

---

## Habit-testing methodology (post-launch)

Once analytics is back online (P0), apply Hook's 5% rule:

1. **Who are the habitual users?** — find the 5% who open daily without push.
2. **What are they doing?** — trace their Habit Path (most common action sequence).
3. **Why are they doing it?** — survey for the internal trigger.

Run this monthly. If the internal trigger is *not* "uncertainty about a person/decision," update the thesis and redesign accordingly.

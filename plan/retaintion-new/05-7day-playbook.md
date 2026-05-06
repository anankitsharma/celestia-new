# 05 — 7-Day Retention Playbook

The activation window. Everything that happens in days 0–7 determines whether the user becomes a habitual user. Built from the B=MAP diagnostic (`02`) and the Hook redesign (`03`).

---

## North-star: D7 return rate

**Definition:** % of installers who open the app on at least 5 of days 1–7.

**Current (estimated, no data):** likely 15–25%, given strong onboarding aha but missing D0-after / D1-personalized prompts.

**Target after this playbook:** 35–45%.

---

## D0 — Install day

### Pre-onboarding (first 30 seconds)

- **Splash → onboarding** flows uninterrupted. Already good.

### Onboarding (B=MAP fix)

- Add **"I don't know my birth time"** path → sun-only chart with a one-line caveat. Don't block the aha for 30%+ of users who can't dig up their birth certificate.
- Add **explicit progress bar** ("3 of 12 — almost at your chart"). Reduces time-perception cost.
- Onboarding step new question: **"When do you usually check your phone first thing in the morning?"** Use the answer to schedule the morning push to that time + 5 minutes. (Anchor moment > scheduled 7:30am for everyone.)

### Chart reveal (the aha)

Already strong. Two additions:

- **Celebration moment**: a gentle confetti / orb animation as the chart loads in. The Hook Model demands a felt-success moment to wire the habit.
- **Immediately followed by a one-tap CTA**: "Want to ask Celestia why your moon is in the 7th house?" → opens chat with that question pre-filled. **This is the highest-leverage moment in the entire app for the missing prompt.**

### Notification permission

- Ask for it **right after the chart reveal**, not earlier and not later. This is peak motivation.
- Frame: "Mornings are when this app is most useful — turn on a daily 30-second briefing tailored to your chart?"
- If declined: do NOT re-ask in this session. Show an in-app daily-tomorrow card on D1.

### End of D0 session

- If user opened chat from the post-chart prompt → they completed the activation Hook. ✓
- If they didn't, fire one in-app prompt before they background the app: "Tomorrow morning, you'll get your first daily briefing." Sets the next-trigger expectation.

### Telemetry events to fire (assumes analytics restored)

```
onboarding_started
onboarding_step_completed (n)
onboarding_completed
chart_revealed
post_chart_prompt_shown
post_chart_prompt_tapped
notification_permission_requested
notification_permission_granted | denied
first_chat_message_sent  ← activation event
```

---

## D1 — First return

### The push (anchored, personalized)

Fires at user's stated wake-time + 5min (from onboarding answer).

**Copy template:**
> "Yesterday you learned your moon is in the 7th house. Today's a 7th-house day too — here's how it shows up."

This references **D0 content** (their moon position) AND today's transit. Generic templates fall apart at D1; personalization is what gets them back.

### On open

- Daily briefing already loads. Add **"Welcome back"** subtle banner if it's their first return.
- Streak pill shows **"1 day"** with **"1 day from your first badge ⭐"** below it. Loss-aversion needs an existing thing to lose — make it visible.

### Activation re-attempt

If they did NOT send a chat on D0:
- Top of home screen: **"You haven't asked anything yet — here's what people ask first"** with 4 chips, all one-tap.
- Highest-conversion chip: pre-filled with their dominant placement ("Tell me about my Mars in Scorpio").

### Telemetry

```
day_1_returned  ← key cohort metric
day_1_push_delivered, day_1_push_opened
streak_started (value: 1)
```

### Lapse path

If user does NOT open on D1:
- D2 morning push (currently the lapse cascade kicks in here): **rewrite copy to reference D0 chart**, not generic "things shifted while you were away."
- New copy: "Your chart had something new for you yesterday. Still here when you're ready."

---

## D2–D3 — Building the streak

Most dangerous window. Novelty is gone, streak loss-aversion isn't yet meaningful.

### D2 push

> "Day 2. One more morning to unlock ⭐ (3-day streak)."

Anticipation framing. The ⭐ emoji is the streakService milestone visual.

### D2 in-app: proactive freeze offer

First-time message: **"You've got 1 free streak freeze. Save it for a busy day — it'll keep your streak going for one missed day automatically."**

This pre-loads the loss-aversion mechanism *before* they need it. By the time they're at risk of breaking, they already know they're protected.

### D3 push (streak-formed window)

If user has 2-day streak going into D3:
> "One open today and you hit ⭐ — your first milestone."

If user broke the streak (missed D1 or D2):
> "Fresh start? Most people who restart on day 3 hit a 7-day run."

The "fresh start" framing is critical — without it, broken-streak users have no reason to come back.

### Activation deepening

By end of D3, target user has:
- ✓ Sent at least 1 chat
- ✓ Read at least 2 daily briefings
- (stretch) Opened a report or added a partner

If they haven't done a chat by D3, the in-app suggestion chips should escalate: instead of generic "what people ask," show "the chart you had questions about — pick one."

---

## D4–D5 — Variable reward escalation

Hook Model: predictable rewards lose power. Inject something new.

### D4: surprise insight

In place of the standard daily briefing, show a **special card** for ~30% of users (variable):

> "I noticed something about your chart that most people don't see in week 1. Want to know?"
> [Tap to reveal]

The insight: a Gemini-generated 2–3 line observation grounded in their actual chart (e.g., "Your sun-saturn aspect means you're probably the friend who feels older than your years."). High-personalization, high-shareability.

### D5: pattern recognition (early version)

If user has journaled 2+ times: "I noticed you wrote about [theme] twice this week. Worth thinking about?"

If no journals: "Want to try a 30-second journal? I'll ask you three questions."

This is the **investment-loads-trigger** mechanism in action.

### Push for non-streakers (no streak by D5)

> "Start your streak tonight — most people who do hit 7 days within a week."

Social-proof + low-effort + anticipation. Targets the cohort the existing system ignores.

---

## D6 — Anticipation for D7

Anticipation is the strongest dopamine driver. Use it for the D7 milestone.

### D6 push

> "🔥 One more morning to hit your first 7-day streak."

### D6 in-app

- Streak pill animates slightly (subtle — not annoying).
- Home screen shows a **"Tomorrow"** preview card teasing the D7 reward without showing it.

---

## D7 — The first milestone

Currently: badge unlock fires (`stargazer` badge), Level-Up modal may fire. **Make this bigger.**

### D7 reward stack

1. **Expected reward**: badge unlock + 7-day streak emoji 🔥 + XP bonus.
2. **Variable surprise** (new):
   - Personalized "Your first week" card — share-ready, includes their name + 3 patterns Celestia "noticed."
   - Random reward roll: 30% chance of unlocking a hidden badge (`first_glimpse`, `cosmic_curious`, etc. — add 5–6 hidden badges to the catalog).
   - 10% chance of a "secret" feature reveal: e.g., "You unlocked Tomorrow's briefing 24h early."

### D7 push

> "🔥 7 days. Here's your first weekly pattern."

Tap → opens the weekly recap card directly.

### D7 ask

Right after the celebration, gently introduce:
- **Permission expansion**: if they denied notifications on D0, ask again now (motivation is back up). "Your weekly recap is ready every Sunday — want a heads-up?"
- **Referral nudge**: "Send your friend their Big 3 — they'll thank you." (Tribe reward, low-effort share.)

---

## Lapse-path overrides for week 1

If user goes silent in week 1, the existing cascade fires but with **rewrites**:

| Day silent | Current copy | New copy |
|---|---|---|
| D2 | "Your week of briefings…" | "Your moon-in-7th day was today. Still here when you want to read it." |
| D3 | "Three days away…" | "Day 3 of you, on pause. Restart your streak tonight in 30 seconds." |
| D5 | "Your five-day briefing…" | "[Partner name from Circle, if any] came up in your chart this week. Want to read?" — or fall back to chart-personalized if no partner |
| D7 | "A week of briefings…" | "A week ago you saw your chart for the first time. Here's what's changed since." |

All copy templated server-side from user data so personalization is automatic.

---

## Week-1 success criteria (per cohort)

| Metric | Target |
|---|---|
| Onboarding completion | 70% (industry-good for 12-step) |
| D0 first-action (chat OR report) | 50%+ |
| Notification permission grant | 60%+ |
| D1 return | 50%+ |
| D7 return | 35%+ |
| Streak ≥ 3 days by end of week | 30% of installers |
| Streak = 7 days by end of week | 15% of installers |
| ≥ 1 chat sent by end of week | 50% |
| ≥ 1 partner added to Circle | 20% |

These targets are aspirational; the only way to know baseline is to ship analytics first (P0).

---

## Implementation references

| Item | File to modify |
|---|---|
| "I don't know birth time" path | `src/screens/OnboardingFlowScreen.js` (birth-data step) |
| Wake-time question + push scheduling | `OnboardingFlowScreen.js` + `src/services/notificationService.js` |
| Post-chart celebratory CTA | `src/screens/WelcomeScreen.js` |
| Notification permission ask, post-chart timing | `src/components/NotificationPermissionModal.js` invocation point |
| D1 personalized push copy | `src/services/notificationContentEngine.js` |
| D2 freeze pre-offer | `src/services/streakService.js` + new in-app banner component |
| D5 fresh-start push for non-streakers | `notificationService.js` (new template) |
| D7 surprise reward stack | `src/services/achievementService.js` + new modal |
| Lapse-cascade rewrites (chart/partner-aware) | `notificationContentEngine.js` |

See `07-implementation-roadmap.md` for sprint sequencing.

# 06 — 30-Day Retention Playbook

Habit-consolidation phase. The user has survived week 1; now we wire the internal trigger and start adding sticky weekly/monthly cycles.

---

## North-star: D30 retention

**Definition:** % of installers active in days 23–30.

**Target:** 20–25% of installers active in week 4. (Industry benchmark for habit-forming consumer apps: 15–25% D30.)

---

## Week 2 (D8–D14): break the predictability

By D8 the user has seen 7 versions of the daily briefing. The format will start to feel routine — and that's *bad*. Hook Model: predictable rewards lose power.

### Rotate the briefing format weekly

Implement a **briefing-mode** state that cycles per week:

| Week | Mode | What's different |
|---|---|---|
| 1 | Standard | Hero + life areas + journal + quests |
| 2 | Pattern Mode | "What I'm noticing about you so far." Pulls from journal + chat history. |
| 3 | Partner Mode | Centers Circle entries. "Today is a [partner] day — here's why." |
| 4 | Archetype Mode | Frames the day as a chapter in their archetype journey. |
| 5+ | Cycle restarts but with deeper insight (now has 4 weeks of data to draw on) |

This is the **single most important week-2 change.** It directly attacks the "I've seen this" plateau.

### D10 surprise-insight rotation

Same mechanism as D4 (surprise insight in place of briefing) but the pool refreshes — never repeat an insight a user has already seen. Easy to track in SQLite.

### D14 milestone

`streakService` already escalates emoji to ⚡ at 14 days. Add:

- **Variable reward roll**: hidden-badge chance.
- **Permission expansion**: if user still hasn't enabled notifications, ask one final time with social proof: "70% of users at this point use morning briefings — want to try?"
- **Soft monetization probe** (only after paywall ships): show ONE benefit they'd unlock with Pro. No paywall yet — just plant the seed.

### Sticky-data surfacing on Profile

By D14 most users have meaningful accumulated data. Add to Profile screen:

```
Your 14 days with Celestia
✦ 9 daily briefings read
✦ 12 chat messages
✦ 3 journal entries
✦ 2 partners in your Circle
✦ Currently on a 9-day streak 🔥
```

This is the **IKEA effect made visible.** Critical pre-condition for any future win-back: user must *feel* they've built something.

---

## Week 3 (D15–D21): wire the internal trigger

Per `03-hook-model-loops.md`, the target internal trigger is:

> **"I don't know what to do about [person/situation]."**

Week 3 is where you stop relying on push and start training the user to come to the app *because they feel that emotion*.

### Push copy shift

D15 onward, swap morning push from "here's your day" framing to "what's on your mind?" framing:

| Old | New |
|---|---|
| "Today's energy is X." | "Anyone on your mind today? Here's what your chart says." |
| "Mercury in your 3rd house." | "Stuck on a decision? I might have something." |

The shift directs the user toward *their own emotion*, not the cosmic context. The cosmic context is the answer; the emotion is the trigger.

### Chat suggestion pool refresh

The suggestion chips on home should rotate to person/decision focus:

- "Why does [partner] react the way they do?"
- "Should I [decision the user might be sitting on]?" — if you have journal data, mine for indecisive language ("should I", "I don't know if")
- "What's coming up for [partner]?"

Use the journal corpus to detect indecision keywords and surface relevant chat suggestions.

### Investment surfacing weekly

D15 / D17 / D20 add subtle reminders:

- "[Sarah] hasn't come up in your chats this week — check her transit?"
- "Your journal pattern from last week — want to revisit?"

Each is an event-based push tied to **a thing the user already invested in.**

### D21 milestone (lapse-cascade boundary)

Per the existing lapse cascade, D21 is the last automated re-engagement push. Also a meaningful streak boundary if they made it. Add:

- "21 days. The pattern is forming." (acknowledge the habit psychology)
- Surprise unlock: a deep-dive 6-page report ("Your first 21 days") — feels earned, share-ready.

---

## Week 4 (D22–D30): habit confirmation + soft monetization

By week 4 the user is either habituated or drifting. Both cohorts need different treatment.

### For habituated users (active 5+ of last 7 days)

- Reduce push frequency (don't burn out a working habit). Cosmic Morning yes; Streak Guardian only if streak at risk.
- Introduce a *new* feature surface they haven't seen: e.g., monthly cosmic-event preview, deep-dive on an archetype.
- **Begin paywall priming**: subtle in-app moments showing what Pro unlocks. **No hard wall yet** — weeks 1–4 are free.

### For drifting users (active <3 of last 7 days)

- Trigger a **"check-in" notification** different from the lapse cascade: "Want to take a break, or pick up where you left off?" Offers two clear options:
  - "Pick up where I left off" → opens to home with a "what you missed" recap card.
  - "Pause for a week" → suspends notifications without breaking streak (uses freeze logic).
- Tag this user `at_risk_<week_4>` in analytics for cohort tracking.

### D28 milestone

Add a hidden milestone (not surfaced in the badge catalog):

- "28 days — that's a moon cycle. Your first lunar pattern report just unlocked." 
- Lunar phase is psychologically resonant for an astro app, and a 28-day report is *earned*, not given.

### D30: monetization moment (post-paywall)

Once monetization is live:

- Show a personalized paywall: "You've made [N] briefings, [N] chats, [N] journals. Pro keeps it all + adds [3 specific things]."
- Free trial offer (7-day) timed to the user's habit cycle: trial ends Sunday after a Monday show.
- Use anchored copy referencing their data: "You'd lose 30 daily briefings/year on the free tier — Pro keeps them."

If paywall is NOT live yet:
- D30 user gets a "thank you" card + personalized recap. No ask. Build goodwill.

---

## Beyond D30 — sustaining habits

### Weekly cycles

- **Sunday weekly digest** (already exists) — but rewrite to show the *previous week's actual usage* + 3 things to focus on.
- **Friday: pattern recognition push** — "I noticed something this week. Want to read?"

### Monthly cycles

- **Full Moon report** every ~28 days — earned, deep-dive, archetypal.
- **Birthday/solar return** — auto-trigger 7 days before user's birthday: "Your solar return is in 7 days. Your year ahead is waiting." High emotional resonance moment.

### Variable reward replenishment

The audit flagged that variable reward is finite. Solutions:

- **Generative content** is your friend — Gemini can produce indefinite variety as long as the prompts are diverse.
- Rotate prompt templates monthly for the AI briefing generator (file: `src/services/geminiService.js`).
- Quarterly: introduce a new content type (cosmic letter, archetype quiz, partner-only briefing) so the surface area itself expands.

### Tribe reward (the missing third)

By D60, most users still have low tribe-reward exposure. Two opt-in additions:

1. **Anonymous community insights** — "1,247 Geminis felt off today." Server aggregates app-mood. Zero PII. Surface on home weekly.
2. **Synastry signal (one-way)** — when partner views their Circle entry (if they're a Celestia user), original user gets "Sarah read what you saved about her." Opt-in for both sides.

These are ethical tribe rewards: real, low-anxiety, no infinite scroll.

---

## D30 success criteria (per cohort)

| Metric | Target |
|---|---|
| D30 retention (any open in days 23–30) | 20–25% |
| Active 5+ of last 7 days at D30 | 12–18% |
| 30-day streak unlocked (`moon_cycle` badge) | 8–12% |
| ≥ 1 partner in Circle by D30 | 35% |
| ≥ 1 journal entry per week (4+ total) | 25% |
| Notification opt-in (cumulative through D30 nudges) | 70%+ |
| Organic-open rate (opens with no recent push) | 30%+ ← internal trigger forming |

---

## Cohort-specific re-activation

Build named cohorts in PostHog and design distinct campaigns:

| Cohort | Definition | Treatment |
|---|---|---|
| **Activated power users** | D7 + 5+ chats + 1 partner | Soft upsell, refer-a-friend, beta features |
| **Streakers without depth** | D14 streak but <3 chats | Push to deeper feature: "You've never asked Celestia about a person — try it" |
| **Sporadic returners** | 3–5 opens in week 4, no streak | Lower the bar: one-tap journal, one-tap chat suggestion |
| **Lapsed at risk** | No open in 7 days, was active week 1 | Personalized lapse push (chart + partner aware) |
| **Lost** | No open in 21+ days | Single email at D30 post-lapse: "Your chart is still here." Then stop. |

All driven by event data → impossible without P0 analytics restoration.

---

## Implementation references

| Item | File to modify |
|---|---|
| Weekly briefing-mode rotation | `src/screens/HomeScreen.js` + `src/services/geminiService.js` |
| D14 sticky-data Profile surface | `src/screens/ProfileScreen.js` |
| Internal-trigger push copy shift | `src/services/notificationContentEngine.js` |
| Indecision-keyword chat suggestion mining | New: `src/services/journalAnalysisService.js` |
| Investment-loaded push (partner / journal pattern) | `notificationContentEngine.js` + new event-trigger jobs |
| D28 lunar report unlock | `src/services/achievementService.js` (hidden milestone) + new report template |
| Solar return birthday trigger | `notificationService.js` (date-anchored) |
| Anonymous community insights | New backend aggregation + `HomeScreen.js` weekly card |
| Synastry one-way notification | `src/services/synastry/SynastryService.js` + opt-in flow |

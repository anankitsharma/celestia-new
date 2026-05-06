# Stage 5 — Lapse and recovery

When users go quiet. Most apps in this category have NO re-engagement system. Celestia has a 7-stage personalized cascade. **The difference between lapse-into-churn and lapse-into-recovery.**

## What counts as "lapse"

A lapse window opens when the user:
- Doesn't open the app for 2+ consecutive days
- Has previously been an active user (not a D0 install drop-off)

The lapse cascade is scheduled by `notificationService.scheduleAllNotifications` on every active session. Each return resets the schedule.

## The cascade

Schedule from current session:

| Day offset | Channel | Template ID | Voice (post-CA-B1b rewrite) |
|---|---|---|---|
| +2 | reactivation | sg_lapsed_2 | partner-aware OR chat-aware OR moon-fact tier |
| +3 | reactivation | sg_lapsed_3 | "Three days. Your chart moved twice without you." |
| +5 | reactivation | sg_lapsed_5 | "Five days. Three transits hit your chart." |
| +7 | reactivation | sg_lapsed_7 | "A full week. The Sun moved 7 degrees." |
| +10 | reactivation | sg_lapsed_10 | "Ten days. Ten days of you, missed." |
| +14 | reactivation | sg_lapsed_14 | "Two weeks. A pattern showed up." |
| +21 | reactivation | sg_lapsed_21 | "Three weeks. Your month, in one read." |

**All on `reactivation` channel** (P1.5) — not `streak_guardian`. Independent so users who disable streaks still get re-engagement pushes.

## Tiered personalization (P1.4)

Each `sg_lapsed_*` template runs three personalization checks in priority order. The first qualifying tier wins:

### Tier 1: Partner-aware
If `data.lastPartnerName` exists (most-recent partner from Circle):

> Title: *"[Partner name]. Two days."*
> Body: *"Their chart did something this morning yours has an opinion about."*

This taps into the user's existing investment in Circle data.

### Tier 2: Chat-aware
If `data.lastChatTitle` exists (most-recent chat session title):

> Title: *"You started something."*
> Body: *"'[truncated chat title]' — and then stopped. There's more underneath."*

Closes the loop on the user's own conversation.

### Tier 3: Chart-fallback
If neither Tier 1 nor 2 qualify:

> Title: *"Two days. The Moon's in [moonData.sign]."*
> Body: *"You're going to want to know what that means."*

Always-available fallback grounded in the day's actual transit.

## Restoration (FINAL-5 + EXTRA-5)

When the user returns AFTER lapse-cascade pushes have started firing:

### If streak was 7+ days and recently broken:
- **Streak restore offer modal** appears on next app open (`streakRestoreOffer` state in HomeScreen)
- Copy: *"Restore your [N]-day streak? Use one of your freezes to bring it back. Today's check-in counts — you'll be back on day [N+1]."*
- Available freezes shown
- Tap "Use freeze + restore" → `restoreBrokenStreak()` updates SQLite, fires `STREAK_RESTORED` event

### If user previously declined notifications:
- **Permission re-ask** at next 7-day or 14-day milestone (FINAL-5, capped at 2 lifetime)

### Personalized welcome-back copy:
- HomeScreen has `showWelcomeBack` state set to true if `streak.daysAbsent >= 2 && streak.isNew`
- WelcomeBackModal renders with milestone messages + freeze-available callout

## Email-side recovery (EXTRA-7)

7 email templates in `plan/retaintion-new/email-templates/` ready for any email provider:

| File | When | Purpose |
|---|---|---|
| `dunning-d0.md` | Failed payment, day 0 | First friendly nudge |
| `dunning-d3.md` | Day 3 | Reminder |
| `dunning-d7.md` | Day 7 | Approaching pause |
| `dunning-d10.md` | Day 10 | Final notice |
| `winback-d30.md` | 30 days post-cancel | First win-back |
| `winback-d60.md` | 60 days post-cancel | Conditional (only if a feature shipped that addresses their cancel reason) |
| `winback-d90.md` | 90 days post-cancel | Final outreach, then stop |

Each is plain text (best for deliverability), uses `{{variable}}` interpolation. Documented variables: first_name, sun_sign, days_with_us, journal_count, partner_count, etc.

**Status:** templates ready. Sending requires email provider integration — blocked.

## At-risk intervention (proactive recovery)

Before lapse fires, the at-risk banner can intervene.

**Trigger:** `health_score < 40` AND not dismissed in last 7 days.

**Banner copy:**
> Kicker: *"CHECKING IN"*
> Body: *"We noticed you've been quiet. Anything we can help with?"*
> CTAs: *"Talk to Celestia"* (opens chat with prefilled re-engagement question) or *"I'm fine, thanks"* (dismiss for 7 days)

**Health score formula** (in `analytics.js`):
```
loginFreq × 0.30 +
featureUsage × 0.25 +
sentiment × 0.15 +
billing × 0.15 +
engagement × 0.15
```

Each weighted 0-1, scaled to 0-100. <40 = critical, 40-59 = at_risk, 60-79 = attention, 80+ = healthy.

NPS prompt every 30 days feeds the sentiment component (otherwise defaults to 0.7).

**Analytics:**
- `at_risk_banner_shown` (with health_score, health_band)
- `at_risk_banner_tapped` (with action: 'talk' or 'dismiss')

## Recovery success criteria

| Metric | Target |
|---|---|
| Lapse-to-recover rate (D2 push opened → return same day) | 25%+ |
| 7-day reactivation rate (lapse → return within 7 days of any cascade push) | 35%+ |
| Permission re-ask grant rate (after D7 milestone) | 40%+ |
| Streak-restore offer acceptance | 60%+ |

Measurable in PostHog once cohorts are wired.

## End-state for users who don't recover

If user lapses for 21+ days:
- Last cascade push has fired
- No further re-engagement
- Email side (when integrated) takes over — winback-d30, winback-d60, winback-d90, then stop

After 90 days post-cancel: silence. Per `plan/retaintion-new/04-churn-prevention.md` — D90+ open rates collapse, unsubscribe rates spike. Stop emailing.

The user retains their data forever (data export available via Profile per EXTRA-1). If they ever return, their chart, journals, Circle, badges, streak history are all still there. Reactivation deep-link in win-back emails opens the app to a "Welcome back" surface (future work).

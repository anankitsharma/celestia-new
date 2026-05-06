# Stage 6 — Event Instrumentation Map

Every PostHog event fired across the user journey. Source-of-truth for funnel analysis and cohort building.

47 events total, organized by lifecycle stage. Each entry: event name, where it fires, key properties, what funnel it powers.

---

## Pre-install / acquisition

These are fired by external systems (App Store, Play Store) not visible to PostHog directly. Out of scope for this map.

---

## App lifecycle

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `app_opened` | Every cold start (App.js AppOpenTracker) | (autocapture by PostHog) | DAU/MAU |
| `app_backgrounded` | App goes to background (App.js AppState listener) | session_duration_ms | Session length |

---

## Onboarding funnel

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `onboarding_started` | OnboardingFlowScreen mount | — | Funnel step 1 |
| `onboarding_step_completed` | advance() called with target > step | from_step, to_step | Per-step drop-off |
| `onboarding_completed` | Step 14 → "Begin" tapped | sun_sign, motivation, pain_point | Funnel step 2 |

**Funnel: install → onboarding_started → onboarding_completed.** Without per-step events you can't see WHERE in 14 steps users drop.

---

## Activation moment

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `chart_revealed` | WelcomeScreen mount | sun_sign, moon_sign, rising_sign, venus_sign, has_birth_time | Funnel step 3 — the WOW |
| `post_chart_cta_shown` | After CTA fade-in (P1.1) | has_first_reveal, first_reveal_label | Funnel step 4 |
| `post_chart_cta_tapped` | User taps either CTA | target: 'chat' or 'dashboard' | Conversion at chart |
| `notification_permission_requested` | Modal shows | source ('post_chart' / 'home_modal' / 'settings_screen') | Permission rate |
| `notification_permission_granted` | User tapped Enable | source | — |
| `notification_permission_denied` | User tapped Skip | source, status | — |
| `first_chat_message_sent` | First message in any session | source ('post_chart' / 'organic'), char_count | The activation event |

**Activation funnel:** install → chart_revealed → post_chart_cta_shown → post_chart_cta_tapped (target=chat) → first_chat_message_sent.

**Target:** 50%+ of `chart_revealed` produces `first_chat_message_sent` within 24h.

---

## Streak / engagement loop

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `streak_started` | First check-in OR streak === 1 after broken | source ('home' / 'journal') | Habit start rate |
| `streak_milestone_hit` | Streak === 3/7/14/30/50/100/365 | streak, source | Milestone reach rates |
| `streak_broken` | streakBroken returned true | previous_streak, days_absent, comeback_bonus, source | Recovery analysis |
| `streak_freeze_used` | Freeze consumed (auto or manual) | days_absent, freezes_remaining, source | Freeze utilization |
| `streak_freeze_offer_shown` | D2 modal appears (P1.6) | days_since_install, current_streak | Offer engagement |
| `streak_freeze_offer_acknowledged` | User taps "Got it" | — | — |
| `streak_restored` | restoreBrokenStreak() succeeded | restored_streak, previous_streak, freezes_remaining | Save rate |
| `badge_unlocked` | trackEvent unlocks any badge | badge_id, badge_name, category, trigger | Badge progression |
| `level_up` | Level transition in xpService | from_level, to_level, to_tier_name, total_xp, action | Tier progression |

---

## Notifications (push lifecycle)

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `push_delivered` | Notification received (foreground OR background) | template_id, category, channel | Delivery rate |
| `push_opened` | User taps a notification | template_id, category, channel, cold_start | Push CTR |
| `trial_ending_push_scheduled` | Sub-2 schedules a trial-end push | days_until_expiration | Schedule verification |
| `pro_discovery_push_scheduled` | Sub-4 schedules a Pro discovery push | feature, discovery_day, days_since_purchase | Schedule verification |

---

## Daily engagement

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `daily_briefing_viewed` | HomeScreen forecast loads | has_navigator | DAU + briefing read-through |
| `chart_deep_dive` | User opens placement / aspect / house deep-dive | type ('planet' / 'aspect' / 'house'), planet, sign, house | Chart engagement |
| `compatibility_checked` | Synastry generated | (varies) | Circle engagement |
| `journal_entry_created` | Save tapped on JournalScreen | is_update, has_mood, has_tags, tag_count, char_count | Sticky-data investment |
| `partner_added_to_circle` | addPartner succeeds | relationship_type, zodiac_only_mode, time_unknown, total_partner_count | Circle expansion |
| `report_viewed` | Tap report card on ReportsScreen | report_type, source | Reports funnel step 1 |
| `report_generated` | generateFullReport completes | report_type | Reports funnel step 2 |

---

## Subscription funnel

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `paywall_viewed` | PaywallScreen mount | source, variant | Funnel step 1 |
| `paywall_plan_switched` | User toggles plan | plan: 'annual' / 'monthly', source | Plan preference |
| `purchase_tapped` | User taps Buy | plan, source, variant | Funnel step 2 |
| `purchase_completed` | RevenueCat returns success | plan, source, variant | Funnel step 3 (CONVERSION) |
| `purchase_failed` | RevenueCat error (not user-cancel) | plan, source, error | Failure analysis |
| `purchase_cancelled` | User cancels purchase sheet | plan, source | Pre-purchase abandonment |
| `restore_tapped` | User taps Restore | — | Re-entry path |
| `restore_completed` | Restore call returns | success: true/false | — |
| `welcome_to_pro_shown` | WelcomeToProScreen mount | first_time | Post-purchase onboarding |
| `welcome_to_pro_card_tapped` | User taps a hero card | card: 'weekly_report' / 'circle' / 'chat', first_time | Card engagement |
| `welcome_to_pro_dismissed` | "I'll explore on my own" tapped | first_time | Skip rate |

---

## Cancel flow

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `cancel_flow_started` | CancelFlowScreen mount | — | Cancel funnel step 1 |
| `cancel_flow_variant_detected` | Trial-vs-paid detection | is_trial | Cohort segmentation |
| `cancel_variant_assigned` | PostHog flag returns variant | variant: 'control' / 'data-loss' / 'value-deepening' | A/B exposure |
| `cancel_reason_selected` | User picks a reason chip | reason, variant, is_trial | Reason distribution |
| `cancel_save_offer_shown` | Step 2 transition | reason, variant, is_trial | — |
| `cancel_save_offer_accepted` | User taps primary save CTA | reason, variant | SAVE EVENT |
| `cancel_save_offer_declined` | User taps "continue cancelling" | reason, variant | Push-through rate |
| `cancel_confirmed` | User deep-links to settings | reason, variant | CHURN EVENT |
| `cancel_flow_abandoned` | User dismisses mid-flow | last_step, reason | — |

---

## Feedback / sentiment / share

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `nps_score_submitted` | User taps a sentiment emoji | score, label | Health-score sentiment input |
| `at_risk_banner_shown` | Health score < 40 + not dismissed | health_score, health_band | At-risk identification |
| `at_risk_banner_tapped` | User taps Talk or Dismiss | action: 'talk' / 'dismiss' | Save-rate via banner |
| `share_initiated` | User taps any share button | source ('pro_insight' / 'reveal' / etc) | Viral coefficient |

---

## Data + privacy

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `data_export_initiated` | User taps Export My Data | profile_id | Churn signal (data-export precedes leaving) |
| `data_export_completed` | JSON written + share-sheet shown | profile_id, bytes_estimate, journal_count, chat_session_count, partner_count | Export usage |

---

## Variant / experiment exposure

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `push_variant_assigned` | scheduleAllNotifications reads push_copy_variant flag | (variant) | Push A/B exposure |

---

## Recap surfaces

| Event | Fires when | Properties | Powers |
|---|---|---|---|
| `pro_week1_recap_shown` | Day 7 of being Pro modal renders | — | Recap display rate |

---

## Complete super-properties on `identify()`

These are sent on every identify call (RevenueCatContext.js + OnboardingFlowScreen.js completion). Available as user-level properties for cohort filters.

| Property | Source |
|---|---|
| install_date | StorageKeys.FIRST_USE_DATE (lazily set on first call to getDaysSinceFirstUse) |
| days_since_install | computed from install_date |
| has_completed_onboarding | StorageKeys.ONBOARDING_COMPLETED |
| current_streak | StreakRepository.getStreak() |
| longest_streak | same |
| streak_freezes_remaining | same |
| total_xp | XPRepository.getXP() |
| current_level | computed from total_xp via getLevelInfo |
| current_tier | tier name |
| journal_entry_count | JournalRepository.getEntryCount() |
| nps_score | NPS_LAST_SUBMITTED if collected |
| nps_score_at | timestamp |
| **health_score** | computed by computeHealthScore() (0-100) |
| **health_band** | 'critical' / 'at_risk' / 'attention' / 'healthy' |
| is_pro | RevenueCatService.isPro(customerInfo) |
| sun_sign | from chart |
| motivation | from onboarding step 2 |
| pain_point | from onboarding step 3 |

---

## Critical funnels to build in PostHog

Now that you have all 47 events firing, the dashboards to assemble are:

### F1 — Activation funnel
```
install → onboarding_started → onboarding_completed → chart_revealed
       → post_chart_cta_tapped (target=chat)
       → first_chat_message_sent
```
Target: 50%+ of installers reach `first_chat_message_sent`.

### F2 — Trial conversion funnel
```
purchase_completed (with plan='annual', has trial)
   → app open D3
   → app open D5
   → trial_ending_push_opened
   → still_pro_at_D7 (filter by entitlement)
   → still_pro_at_D30
```
Target: 60%+ of trial starts convert to paid by D7.

### F3 — Daily habit funnel
```
app_opened (D1)
   → daily_briefing_viewed (D1)
   → app_opened (D7) — same user
   → streak_milestone_hit (streak=7)
```
Target: 35% of D1 returners hit a 7-day streak.

### F4 — Cancel-flow save funnel
```
cancel_flow_started
   → cancel_reason_selected (split by reason)
   → cancel_save_offer_shown
   → cancel_save_offer_accepted (vs declined → cancel_confirmed)
```
Target: 25-35% save rate.

### F5 — Pro feature discovery funnel
```
purchase_completed
   → welcome_to_pro_shown
   → welcome_to_pro_card_tapped
   → push_opened (event_pro_discovery_*)
   → corresponding feature event (report_viewed / chart_deep_dive / etc)
```
Target: 60%+ of new Pros tap at least one Welcome-to-Pro card.

---

## What's NOT yet instrumented (gaps)

Per the senior-design audit + retention plan, these would benefit from events but aren't firing:

| Missing event | Why |
|---|---|
| `briefing_mode_assigned` (which week's voice) | P2.1 ships content rotation; assignment isn't recorded |
| `surprise_insight_shown` | Roll happens silently |
| `indecision_chip_shown` / `_tapped` | Interaction with journal-mined chip not measured |
| `bento_cell_tapped` (when cells become tappable) | AND-7 cells aren't tappable yet |
| `sheet_dragged_dismiss` | When BrandSheet is migrated to and used |
| `chat_streaming_canceled` | If user navigates away mid-stream |

These are nice-to-haves; the current 47 cover the critical funnels.

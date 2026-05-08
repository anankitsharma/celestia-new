import { usePostHog } from 'posthog-react-native';
import { loadString, loadBoolean, loadObject, StorageKeys } from './storage';
import { StreakRepository } from './database/rep_streaks';
import { XPRepository } from './database/rep_xp';
import { JournalRepository } from './database/rep_journal';
import { getLevelInfo } from '../constants/levels';

// ── Event names (single source of truth) ──────────────────
export const EVENTS = {
  // Onboarding
  ONBOARDING_STARTED:               'onboarding_started',
  ONBOARDING_STEP_COMPLETED:        'onboarding_step_completed',
  ONBOARDING_COMPLETED:             'onboarding_completed',
  ONBOARDING_WAKE_TIME_SET:         'onboarding_wake_time_set',
  ONBOARDING_NOTIF_BUNDLE_PICKED:   'onboarding_notif_bundle_picked',
  CHART_REVEALED:                   'chart_revealed',
  POST_CHART_CTA_SHOWN:             'post_chart_cta_shown',
  POST_CHART_CTA_TAPPED:            'post_chart_cta_tapped',
  D1_PUSH_OPENED:                   'd1_push_opened',
  FIRST_INSIGHT_SAVED:              'first_insight_saved',

  // Paywall
  PAYWALL_VIEWED:                   'paywall_viewed',
  PURCHASE_TAPPED:                  'purchase_tapped',
  PURCHASE_COMPLETED:               'purchase_completed',
  PURCHASE_FAILED:                  'purchase_failed',
  PURCHASE_CANCELLED:               'purchase_cancelled',
  RESTORE_TAPPED:                   'restore_tapped',
  RESTORE_COMPLETED:                'restore_completed',
  PAYWALL_PLAN_SWITCHED:            'paywall_plan_switched',

  // Subscriber retention (Sprint A)
  TRIAL_ENDING_PUSH_SCHEDULED:      'trial_ending_push_scheduled',
  WELCOME_TO_PRO_SHOWN:             'welcome_to_pro_shown',
  WELCOME_TO_PRO_CARD_TAPPED:       'welcome_to_pro_card_tapped',
  WELCOME_TO_PRO_DISMISSED:         'welcome_to_pro_dismissed',
  PRO_DISCOVERY_PUSH_SCHEDULED:     'pro_discovery_push_scheduled',
  CANCEL_FLOW_VARIANT_DETECTED:     'cancel_flow_variant_detected',
  PRO_WEEK1_RECAP_SHOWN:            'pro_week1_recap_shown',
  PUSH_VARIANT_ASSIGNED:            'push_variant_assigned',
  SHARE_INITIATED:                  'share_initiated', // {source: 'pro_insight'|'reveal'|...}

  // Cancel flow (voluntary-churn defense)
  CANCEL_FLOW_STARTED:              'cancel_flow_started',
  CANCEL_REASON_SELECTED:           'cancel_reason_selected',
  CANCEL_SAVE_OFFER_SHOWN:          'cancel_save_offer_shown',
  CANCEL_SAVE_OFFER_ACCEPTED:       'cancel_save_offer_accepted',
  CANCEL_SAVE_OFFER_DECLINED:       'cancel_save_offer_declined',
  CANCEL_CONFIRMED:                 'cancel_confirmed',
  CANCEL_FLOW_ABANDONED:            'cancel_flow_abandoned',
  CANCEL_VARIANT_ASSIGNED:          'cancel_variant_assigned',

  // Core features
  AI_CHAT_MESSAGE_SENT:             'ai_chat_message_sent',
  FIRST_CHAT_MESSAGE_SENT:          'first_chat_message_sent',
  REPORT_GENERATED:                 'report_generated',
  CHART_DEEP_DIVE:                  'chart_deep_dive',
  COMPATIBILITY_CHECKED:            'compatibility_checked',
  DAILY_BRIEFING_VIEWED:            'daily_briefing_viewed',

  // Sticky-data investment
  JOURNAL_ENTRY_CREATED:            'journal_entry_created',
  PARTNER_ADDED_TO_CIRCLE:          'partner_added_to_circle',

  // Engagement loops (streaks / XP / badges)
  STREAK_STARTED:                   'streak_started',
  STREAK_MILESTONE_HIT:             'streak_milestone_hit',
  STREAK_BROKEN:                    'streak_broken',
  STREAK_FREEZE_USED:               'streak_freeze_used',
  STREAK_FREEZE_OFFER_SHOWN:        'streak_freeze_offer_shown',
  STREAK_FREEZE_OFFER_ACKNOWLEDGED: 'streak_freeze_offer_acknowledged',
  BADGE_UNLOCKED:                   'badge_unlocked',
  LEVEL_UP:                         'level_up',

  // Notifications
  NOTIFICATION_PERMISSION_REQUESTED: 'notification_permission_requested',
  NOTIFICATION_PERMISSION_GRANTED:   'notification_permission_granted',
  NOTIFICATION_PERMISSION_DENIED:    'notification_permission_denied',
  PUSH_DELIVERED:                    'push_delivered',
  PUSH_OPENED:                       'push_opened',

  // Engagement depth
  REPORT_VIEWED:                     'report_viewed',
  APP_BACKGROUNDED:                  'app_backgrounded',

  // Data + sentiment
  DATA_EXPORT_INITIATED:             'data_export_initiated',
  DATA_EXPORT_COMPLETED:             'data_export_completed',
  NPS_SCORE_SUBMITTED:               'nps_score_submitted',
  AT_RISK_BANNER_SHOWN:              'at_risk_banner_shown',
  AT_RISK_BANNER_TAPPED:             'at_risk_banner_tapped',
  STREAK_RESTORED:                   'streak_restored',

  // App lifecycle
  APP_OPENED:                        'app_opened',
  SESSION_ENDED:                     'session_ended',
};

// Module-level singleton so non-React services (achievementService, xpService,
// notificationService) can capture events without a React hook.
// Set on first useAnalytics() call.
let _posthog = null;

// Hook for use inside components
export function useAnalytics() {
  const posthog = usePostHog();
  if (posthog && _posthog !== posthog) _posthog = posthog;

  return {
    capture: (event, properties) => posthog?.capture(event, properties),
    identify: (userId, properties) => posthog?.identify(userId, properties),
    reset: () => posthog?.reset(),
  };
}

// Service-layer capture (no React context required).
// Safe to call before _posthog is set — it's a no-op until then.
export function captureEvent(event, properties) {
  _posthog?.capture(event, properties);
}

// Service-layer feature-flag read. Returns the flag value if PostHog has
// loaded flags, or `defaultValue` otherwise. Use for A/B experiments where
// the variant decision must happen in non-React code paths (e.g.,
// scheduleAllNotifications picking a push-copy variant).
export function getFeatureFlag(flagKey, defaultValue = null) {
  try {
    const v = _posthog?.getFeatureFlag?.(flagKey);
    return (v === undefined || v === null) ? defaultValue : v;
  } catch {
    return defaultValue;
  }
}

// Build retention super-properties for identify() calls.
// Reads are independent — partial failures don't abort the rest.
export async function buildUserProperties(profileId) {
  const props = {};

  try {
    let firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
    if (!firstUse) {
      firstUse = new Date().toISOString().split('T')[0];
    }
    props.install_date = firstUse;
    const start = new Date(firstUse + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    props.days_since_install = Math.max(0, Math.floor((now - start) / 86400000));
  } catch {}

  try {
    props.has_completed_onboarding = await loadBoolean(StorageKeys.ONBOARDING_COMPLETED);
  } catch {}

  if (profileId) {
    try {
      const streak = await StreakRepository.getStreak(profileId);
      if (streak) {
        props.current_streak = streak.current_streak || 0;
        props.longest_streak = streak.longest_streak || 0;
        props.streak_freezes_remaining = streak.streak_freezes_remaining || 0;
      }
    } catch {}
    try {
      const xp = await XPRepository.getXP(profileId);
      if (xp) {
        const li = getLevelInfo(xp.total_xp);
        props.total_xp = xp.total_xp;
        props.current_level = li?.current?.level || 1;
        props.current_tier = li?.current?.name || null;
      }
    } catch {}
    try {
      props.journal_entry_count = await JournalRepository.getEntryCount(profileId);
    } catch {}
  }

  // NPS sentiment (1-4 scale), if collected
  try {
    const last = await loadObject(StorageKeys.NPS_LAST_SUBMITTED);
    if (last && typeof last.score === 'number') {
      props.nps_score = last.score;
      props.nps_score_at = last.at || null;
    }
  } catch {}

  // ── Health score (0-100) ──
  // Weighted composite of recent activity. Used by PostHog cohorts to surface
  // at-risk users (score < 40) for proactive intervention. Reads are best-effort.
  try {
    props.health_score = computeHealthScore(props);
    props.health_band = healthBand(props.health_score);
  } catch {}

  return props;
}

// Cheap on-device weighted score. Inputs come from already-loaded super-props
// so this stays synchronous and avoids extra DB calls. Range 0-100.
function computeHealthScore(props) {
  const days = props.days_since_install || 0;
  const streak = props.current_streak || 0;
  const longest = props.longest_streak || 0;
  const xp = props.total_xp || 0;
  const journals = props.journal_entry_count || 0;

  // Login frequency proxy: streak / max(days, 14) — capped
  const loginFreq = Math.min(1, streak / Math.max(7, Math.min(days, 14)));

  // Feature usage proxy: journals + xp normalized
  const journalScore = Math.min(1, journals / 10); // 10 entries = full credit
  const xpScore = Math.min(1, xp / 500); // 500 XP = full credit
  const featureUsage = (journalScore + xpScore) / 2;

  // Engagement score: streak depth (longest as proxy)
  const engagement = Math.min(1, longest / 21);

  // Billing health: assume 1.0 unless we have signal otherwise
  const billing = 1.0;

  // Sentiment from NPS prompt (1-4 → 0.25/0.5/0.75/1.0). Default 0.7 if not collected.
  const sentiment = typeof props.nps_score === 'number'
    ? props.nps_score / 4
    : 0.7;

  const score = (
    loginFreq * 0.30 +
    featureUsage * 0.25 +
    sentiment * 0.15 +
    billing * 0.15 +
    engagement * 0.15
  ) * 100;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function healthBand(score) {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'attention';
  if (score >= 40) return 'at_risk';
  return 'critical';
}

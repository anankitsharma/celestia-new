// V1 — Analytics stripped for minimal-approval submission.
// Cleaner privacy story for App Review: no third-party tracking SDK,
// no Diagnostics rows on the Privacy Nutrition Label, no network requests
// to posthog.com on launch. The hook + EVENTS table are kept so the 6
// call sites across screens compile unchanged. Every method is a no-op.
// Re-enable PostHog (or any analytics) in v1.1 by restoring the previous
// implementation from git history of this file.

// ── Event names (single source of truth, kept for call-site compatibility) ──
export const EVENTS = {
  // Onboarding
  ONBOARDING_STARTED:    'onboarding_started',
  ONBOARDING_COMPLETED:  'onboarding_completed',

  // Paywall
  PAYWALL_VIEWED:        'paywall_viewed',
  PURCHASE_TAPPED:       'purchase_tapped',
  PURCHASE_COMPLETED:    'purchase_completed',
  PURCHASE_FAILED:       'purchase_failed',
  PURCHASE_CANCELLED:    'purchase_cancelled',
  RESTORE_TAPPED:        'restore_tapped',
  RESTORE_COMPLETED:     'restore_completed',

  // Core features
  AI_CHAT_MESSAGE_SENT:  'ai_chat_message_sent',
  REPORT_GENERATED:      'report_generated',
  CHART_DEEP_DIVE:       'chart_deep_dive',
  COMPATIBILITY_CHECKED: 'compatibility_checked',
  DAILY_BRIEFING_VIEWED: 'daily_briefing_viewed',

  // Paywall
  PAYWALL_PLAN_SWITCHED: 'paywall_plan_switched',

  // App lifecycle
  APP_OPENED:            'app_opened',
};

// No-op hook. Same shape as before; every method is a silent stub.
export function useAnalytics() {
  return {
    capture:  (_event, _properties) => {},
    identify: (_userId, _properties) => {},
    reset:    () => {},
  };
}

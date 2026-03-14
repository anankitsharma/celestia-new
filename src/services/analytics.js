import { usePostHog } from 'posthog-react-native';

// ── Event names (single source of truth) ──────────────────
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

// Hook for use inside components
export function useAnalytics() {
  const posthog = usePostHog();

  return {
    capture: (event, properties) => posthog?.capture(event, properties),
    identify: (userId, properties) => posthog?.identify(userId, properties),
    reset: () => posthog?.reset(),
  };
}

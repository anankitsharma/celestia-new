import { loadObject, saveObject, StorageKeys } from './storage';
import { ReportRepository } from './database/rep_reports';
import { ProfileRepository } from './database/rep_profiles';
import { RevenueCatService } from './revenueCatService';
import { captureEvent, EVENTS } from './analytics';

// Pro feature-discovery scheduler.
//
// The cancellation pattern this fixes: subscriber cancels in week 2 / month 2
// citing "not using it enough." Actual cause: they paid for 5 premium features
// and only ever used 1 (whatever drove the conversion). The other 4 are
// invisible because nothing in the app surfaces them.
//
// Day 3 + Day 7 post-purchase, push the highest-rank Pro feature the user
// hasn't tried. Per-feature dedup so we don't spam.

// Ranked by perceived value of the unlock. Highest first.
// 'detect' returns true if the user HAS used the feature (skip).
// Voice per plan/competitive-audit/voice-guide-pushes.md — specific, direct.
const PRO_FEATURE_RANK = [
  {
    id: 'weekly_report',
    push: {
      title: 'You haven\'t opened a weekly read yet.',
      body: 'The next 7 days will be different than this week. The read is already written.',
      tab: 'reports',
    },
    detect: async (ctx) => (ctx.reports || []).some(r => r.type === 'weekly'),
  },
  {
    id: 'deep_dive',
    push: {
      title: 'The deeper placements in your chart are where the spicy reads live.',
      body: 'Pluto, Saturn, your moon\'s house. You haven\'t looked at any of them yet.',
      tab: 'chart',
    },
    detect: async (ctx) => (ctx.counters?.deep_dives || 0) > 0,
  },
  {
    id: 'compatibility',
    push: {
      title: 'Synastry. Your chart, against someone else\'s.',
      body: 'Add anyone to your Circle and Pro shows you the dynamic. Pick the person you\'re thinking about.',
      tab: 'circle',
    },
    detect: async (ctx) => (ctx.counters?.matches_checked || 0) > 0,
  },
  {
    id: 'circle_expansion',
    push: {
      title: 'Pro is unlimited Circle. You\'ve used 3 of forever.',
      body: 'Most people add 5–7. Partners, parents, the friend you can\'t figure out.',
      tab: 'circle',
    },
    detect: async (ctx) => (ctx.partnerCount || 0) > 3,
  },
];

// Days post-purchase on which discovery pushes can fire. Two-day windows
// give some tolerance since scheduleAllNotifications only runs when the user
// opens the app.
//
// 7-day trial / paid: D3 + D7 standard cadence.
// 3-day trial: single push at D1 (D3 fires AT charge, useless).
const DISCOVERY_WINDOWS_DEFAULT = [
  { day: 3, window: [3, 4] },
  { day: 7, window: [7, 8] },
];
const DISCOVERY_WINDOWS_SHORT_TRIAL = [
  { day: 1, window: [1, 2] },
];

const DEDUP_DAYS = 14;

async function loadDedupMap() {
  const raw = await loadObject(StorageKeys.PRO_FEATURE_NUDGED_AT).catch(() => null);
  return raw || {}; // { [featureId]: timestamp }
}

async function markFeatureNudged(featureId) {
  const map = await loadDedupMap();
  map[featureId] = Date.now();
  await saveObject(StorageKeys.PRO_FEATURE_NUDGED_AT, map);
}

function recentlyNudged(map, featureId) {
  const ts = map?.[featureId];
  if (!ts) return false;
  const daysSince = (Date.now() - ts) / 86400000;
  return daysSince < DEDUP_DAYS;
}

/**
 * Returns a queue item for the highest-rank untried Pro feature, or null
 * if no push should be scheduled (not Pro, wrong day, no untried features,
 * or all features recently nudged).
 *
 * @param {object} opts
 * @param {object} opts.userProfile
 * @param {Date}   opts.now
 * @param {object} opts.settings  notification settings (for morning time)
 */
export async function maybeScheduleProDiscoveryPush({ userProfile, now, settings }) {
  if (!userProfile?.id) return null;

  // Confirm Pro entitlement + extract originalPurchaseDate + trial length
  let originalPurchaseDate;
  let trialLengthDays = null;
  try {
    const customerInfo = await RevenueCatService.getCustomerInfo();
    const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
    if (!entitlement) return null;
    originalPurchaseDate = entitlement.originalPurchaseDate
      ? new Date(entitlement.originalPurchaseDate)
      : (entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate) : null);
    trialLengthDays = RevenueCatService.getTrialLengthDays(customerInfo);
  } catch { return null; }
  if (!originalPurchaseDate || isNaN(originalPurchaseDate.getTime())) return null;

  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const purchaseDay = new Date(originalPurchaseDate); purchaseDay.setHours(0, 0, 0, 0);
  const daysSincePurchase = Math.floor((today - purchaseDay) / 86400000);

  // Adaptive window selection by trial length
  const isShortTrial = trialLengthDays !== null && trialLengthDays <= 4;
  const windows = isShortTrial ? DISCOVERY_WINDOWS_SHORT_TRIAL : DISCOVERY_WINDOWS_DEFAULT;
  const matchedWindow = windows.find(w => daysSincePurchase >= w.window[0] && daysSincePurchase <= w.window[1]);
  if (!matchedWindow) return null;

  // Build context for detect() — pull what we need from repos in parallel
  const [reports, allProfiles, counters] = await Promise.all([
    ReportRepository.getReportsForProfile(userProfile.id).catch(() => []),
    ProfileRepository.getAllProfiles().catch(() => []),
    loadObject(StorageKeys.ACHIEVEMENT_COUNTERS).catch(() => null),
  ]);
  const partnerCount = (allProfiles || []).filter(p => p.id !== userProfile.id && p.type !== 'self').length;
  const ctx = { reports, partnerCount, counters };

  // Find highest-rank feature not yet tried AND not recently nudged
  const dedupMap = await loadDedupMap();
  let chosen = null;
  for (const feature of PRO_FEATURE_RANK) {
    if (recentlyNudged(dedupMap, feature.id)) continue;
    let tried = false;
    try { tried = await feature.detect(ctx); } catch { tried = false; }
    if (!tried) { chosen = feature; break; }
  }
  if (!chosen) return null;

  // Schedule for tomorrow morning at user's wake time
  const fireDate = new Date(now);
  fireDate.setDate(fireDate.getDate() + 1);
  fireDate.setHours(settings?.morningTime ?? 7, settings?.morningMinute ?? 5, 0, 0);
  if (fireDate <= now) return null;

  await markFeatureNudged(chosen.id);
  captureEvent(EVENTS.PRO_DISCOVERY_PUSH_SCHEDULED, {
    feature: chosen.id,
    discovery_day: matchedWindow.day,
    days_since_purchase: daysSincePurchase,
    trial_length_days: trialLengthDays,
  });

  return {
    category: 'PRO_DISCOVERY',
    channel: 'cosmic_milestones',
    trigger: 'exactDate',
    date: fireDate,
    content: {
      title: chosen.push.title,
      body: chosen.push.body,
      templateId: `event_pro_discovery_${chosen.id}`,
    },
    params: { tab: chosen.push.tab },
    priority: 3,
  };
}

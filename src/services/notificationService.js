import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadObject, saveObject, StorageKeys } from './storage';
import { generateNotificationContent, buildNotificationData, getLapsedContent } from './notificationContentEngine';
import { getAllFutureCosmicLines } from './cosmicLineService';
import { captureEvent, getFeatureFlag, EVENTS } from './analytics';
import { ProfileRepository } from './database/rep_profiles';
import { ChatRepository } from './database/rep_chats';
import { JournalRepository } from './database/rep_journal';
import { maybeScheduleProDiscoveryPush } from './proEngagementService';
import { loadString } from './storage';
import { getDominantJournalTheme } from './engagementSignals';
import { RevenueCatService } from './revenueCatService';
import { getNextBadgeProgress } from './achievementService';

// ── NOTIFICATION HANDLER ────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── ANDROID CHANNELS ────────────────────────────────────────

const CHANNELS = [
  { id: 'cosmic_morning', name: 'Morning Cosmic Briefing', description: 'Your personalized daily cosmic reading', importance: Notifications.AndroidImportance?.HIGH },
  { id: 'evening_reflection', name: 'Evening Reflection', description: 'Nightly journal prompts and cosmic recaps', importance: Notifications.AndroidImportance?.DEFAULT },
  { id: 'transit_alerts', name: 'Transit Alerts', description: 'Significant cosmic events affecting your chart', importance: Notifications.AndroidImportance?.HIGH },
  { id: 'streak_guardian', name: 'Streak Reminders', description: 'Protect your daily cosmic streak', importance: Notifications.AndroidImportance?.DEFAULT },
  { id: 'reactivation', name: 'Reactivation', description: 'Reminders when you\'ve been away', importance: Notifications.AndroidImportance?.DEFAULT },
  { id: 'cosmic_milestones', name: 'Cosmic Milestones', description: 'Badge unlocks and level-ups', importance: Notifications.AndroidImportance?.DEFAULT },
  { id: 'weekly_digest', name: 'Weekly Cosmic Digest', description: 'Your weekly cosmic preview', importance: Notifications.AndroidImportance?.DEFAULT },
];

export async function initNotificationChannels() {
  if (Platform.OS !== 'android') return;
  for (const ch of CHANNELS) {
    try {
      await Notifications.setNotificationChannelAsync(ch.id, {
        name: ch.name,
        description: ch.description,
        importance: ch.importance || Notifications.AndroidImportance?.DEFAULT,
        sound: null,
        vibrationPattern: ch.importance === Notifications.AndroidImportance?.HIGH ? [0, 250, 250, 250] : undefined,
        lightColor: '#C8A84B',
      });
    } catch {}
  }
}

// ── PERMISSIONS ─────────────────────────────────────────────

export async function requestNotificationPermission(source = 'unknown') {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    captureEvent(EVENTS.NOTIFICATION_PERMISSION_REQUESTED, { source, prior_status: existing });
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      captureEvent(EVENTS.NOTIFICATION_PERMISSION_GRANTED, { source });
      return true;
    }
    captureEvent(EVENTS.NOTIFICATION_PERMISSION_DENIED, { source, status });
    return false;
  } catch {
    return false;
  }
}

export async function hasNotificationPermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── SETTINGS ────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  cosmic_morning: true,
  evening_reflection: true,
  transit_alerts: true,
  streak_guardian: true,
  reactivation: true,
  cosmic_milestones: true,
  weekly_digest: true,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  morningTime: 7,
  morningMinute: 30,
  notificationBundle: 'balanced',
};

// Three pre-baked notification bundles that map onboarding's "what kind of nudge"
// choice to the underlying 7 channels. Picking a bundle is the user's mental
// model; per-channel toggles are the implementation detail behind it.
//   minimal    → 1 push/day (morning only)
//   balanced   → 2 pushes/day (morning + evening + retention scaffolding) [default]
//   everything → up to 5 pushes/week (all channels active)
// reactivation stays ON across all bundles — lapsed cascade is win-back, not
// regular cadence, and we want it firing even for minimal users.
export const BUNDLE_PRESETS = {
  minimal: {
    cosmic_morning: true,
    evening_reflection: false,
    transit_alerts: false,
    streak_guardian: false,
    reactivation: true,
    cosmic_milestones: false,
    weekly_digest: false,
  },
  balanced: {
    cosmic_morning: true,
    evening_reflection: true,
    transit_alerts: false,
    streak_guardian: true,
    reactivation: true,
    cosmic_milestones: true,
    weekly_digest: false,
  },
  everything: {
    cosmic_morning: true,
    evening_reflection: true,
    transit_alerts: true,
    streak_guardian: true,
    reactivation: true,
    cosmic_milestones: true,
    weekly_digest: true,
  },
};

export async function applyNotificationBundle(bundleId) {
  const preset = BUNDLE_PRESETS[bundleId] || BUNDLE_PRESETS.balanced;
  const settings = await getNotificationSettings();
  await saveNotificationSettings({
    ...settings,
    ...preset,
    notificationBundle: bundleId,
  });
}

export async function getNotificationSettings() {
  const saved = await loadObject(StorageKeys.NOTIFICATION_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveNotificationSettings(settings) {
  await saveObject(StorageKeys.NOTIFICATION_SETTINGS, { ...settings, lastUpdated: Date.now() });
}

// ── CORE SCHEDULING ─────────────────────────────────────────

export async function scheduleAllNotifications(userProfile, forecast, streakData, moonData, energyData, cosmicWindows) {
  try {
    const permitted = await hasNotificationPermission();
    if (!permitted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const settings = await getNotificationSettings();
    const history = (await loadObject(StorageKeys.NOTIFICATION_HISTORY)) || [];
    const recentTemplates = history.slice(-14); // last 14 template entries
    const data = buildNotificationData(userProfile, forecast, moonData, energyData, cosmicWindows, streakData);
    // Enrich with retention metadata used by template weight functions
    try {
      const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
      if (firstUse) {
        const start = new Date(firstUse + 'T00:00:00');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const days = Math.max(0, Math.floor((today - start) / 86400000));
        data.daysSinceInstall = days;
        data.weeksSinceInstall = Math.floor(days / 7);
      } else {
        data.daysSinceInstall = 0;
        data.weeksSinceInstall = 0;
      }
    } catch {
      data.daysSinceInstall = 0;
      data.weeksSinceInstall = 0;
    }
    // First reveal statement — used by the D1 personalized push (FINAL-4).
    try { data.firstRevealStatement = await loadString(StorageKeys.FIRST_REVEAL_STATEMENT); } catch {}

    // Push-copy A/B variant. Default 'literary' = the new voice from
    // plan/competitive-audit/voice-guide-pushes.md (already shipped).
    // Future variants ('control_informational', 'experimental_brutalist',
    // etc.) can be wired by adding branches inside template generate() fns
    // that read `d.pushVariant`. Captures PUSH_VARIANT_ASSIGNED for cohorting.
    try {
      data.pushVariant = getFeatureFlag('push_copy_variant', 'literary');
      captureEvent(EVENTS.PUSH_VARIANT_ASSIGNED, { variant: data.pushVariant });
    } catch {
      data.pushVariant = 'literary';
    }
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const queue = [];

    // 1. COSMIC MORNING — AI-generated lines on specific dates, fallback to template
    if (settings.cosmic_morning) {
      const mHour = settings.morningTime ?? 7;
      const mMinute = settings.morningMinute ?? 30;
      let morningScheduled = false;
      try {
        const aiLines = await getAllFutureCosmicLines();
        const linesToSchedule = aiLines.slice(0, 5);
        for (const line of linesToSchedule) {
          const trigDate = new Date(line.date + 'T00:00:00');
          trigDate.setHours(mHour, mMinute, 0, 0);
          if (trigDate > now) {
            queue.push({
              category: 'COSMIC_MORNING',
              channel: 'cosmic_morning',
              trigger: 'exactDate',
              date: trigDate,
              content: { title: line.title, body: line.body, templateId: 'ai_cosmic' },
              params: { tab: 'today' },
              priority: 1,
            });
            morningScheduled = true;
          }
        }
      } catch (e) {
        console.warn('[Notif] AI lines unavailable, using template fallback:', e.message);
      }

      // Fallback: template engine if no AI lines
      if (!morningScheduled) {
        const content = generateNotificationContent('COSMIC_MORNING', data, recentTemplates);
        if (content) {
          queue.push({
            category: 'COSMIC_MORNING',
            channel: 'cosmic_morning',
            hour: mHour, minute: mMinute,
            trigger: 'daily',
            content,
            params: { tab: 'today', highlightLifeArea: content.lifeArea || null },
            priority: 1,
          });
        }
      }
    }

    // 2. EVENING REFLECTION — every day, 8:30 PM (Mia's peak is Sunday 10:30pm — weekends matter most)
    if (settings.evening_reflection) {
      if (currentHour < 20) {
        const content = generateNotificationContent('EVENING_REFLECTION', data, recentTemplates);
        if (content) {
          queue.push({
            category: 'EVENING_REFLECTION',
            channel: 'evening_reflection',
            hour: 20, minute: 30,
            trigger: 'daily',
            content,
            params: { openJournal: true },
            priority: 3,
          });
        }
      }
    }

    // 3. TRANSIT ALERT — only when significant events, 11 AM
    if (settings.transit_alerts && cosmicWindows && cosmicWindows.length > 0) {
      if (currentHour < 11) {
        const content = generateNotificationContent('TRANSIT_ALERT', data, recentTemplates);
        if (content) {
          queue.push({
            category: 'TRANSIT_ALERT',
            channel: 'transit_alerts',
            hour: 11, minute: 0,
            trigger: 'date',
            content,
            params: { highlightTransit: cosmicWindows[0]?.planet },
            priority: 2,
          });
        }
      }
    }

    // 4z. BADGE RESCUE — when user is 1-2 actions away from a meaningful badge
    // (>= 60% progress), fire an evening push surfacing the gap. Uses existing
    // getNextBadgeProgress(); persists last-pushed-badge so we don't spam.
    if (settings.streak_guardian) {
      try {
        const next = await getNextBadgeProgress();
        if (next && next.remaining <= 2 && next.progress >= 0.6 && next.badge) {
          const lastPushedRaw = await loadObject(StorageKeys.BADGE_RESCUE_LAST_PUSHED);
          const alreadyPushed = lastPushedRaw?.badgeId === next.badge.id;
          if (!alreadyPushed) {
            const fireDate = new Date(now);
            // Tomorrow evening (7pm) at user's local time
            fireDate.setDate(fireDate.getDate() + 1);
            fireDate.setHours(19, 0, 0, 0);
            if (fireDate > now) {
              const unit = (next.label || 'actions').toLowerCase().replace(/s$/, next.remaining > 1 ? 's' : '');
              const numWord = next.remaining === 1 ? 'One' : (next.remaining === 2 ? 'Two' : String(next.remaining));
              queue.push({
                category: 'BADGE_RESCUE',
                channel: 'cosmic_milestones',
                trigger: 'exactDate',
                date: fireDate,
                content: {
                  // Voice per voice-guide-pushes.md — short, specific
                  title: `${numWord} ${unit} from ${next.badge.name}.`,
                  body: 'Tonight could be the night.',
                  templateId: 'event_badge_rescue',
                },
                params: { tab: 'today', badgeId: next.badge.id },
                priority: 4,
              });
              // Mark pushed
              await saveObject(StorageKeys.BADGE_RESCUE_LAST_PUSHED, { badgeId: next.badge.id, at: Date.now() });
            }
          }
        }
      } catch {}
    }

    // 4a. STREAK ANTICIPATION — fire one-day-before-milestone push at user's
    // wake time. Hook Model: anticipation-of-reward is the strongest dopamine
    // driver. Fires at streak 6 (→7), 13 (→14), 27 (→30).
    // Voice per plan/competitive-audit/voice-guide-pushes.md — specific,
    // not generic. Typographic glyphs (★ ⌁ ✶) match editorial typography.
    const ANTICIPATION_MAP = {
      6: { milestone: 7, glyph: '★', title: 'One more morning. Then it counts.', body: 'Tomorrow ★ — the kind of consistency most people don\'t manage past day 4.' },
      13: { milestone: 14, glyph: '⌁', title: 'Tomorrow: ⌁ 14 days.', body: 'Two weeks of showing up. Statistically: most don\'t get here. You did.' },
      27: { milestone: 30, glyph: '✶', title: 'Two days to a full lunar cycle.', body: 'Most people stop at week one. You\'re about to do something rare.' },
    };
    const anticipation = ANTICIPATION_MAP[streakData?.current_streak];
    if (settings.streak_guardian && anticipation) {
      const fireDate = new Date(now);
      fireDate.setDate(fireDate.getDate() + 1);
      fireDate.setHours(settings.morningTime ?? 7, settings.morningMinute ?? 5, 0, 0);
      if (fireDate > now) {
        queue.push({
          category: 'STREAK_ANTICIPATION',
          channel: 'streak_guardian',
          trigger: 'exactDate',
          date: fireDate,
          content: {
            title: anticipation.title,
            body: anticipation.body,
            templateId: `cm_streak_anticipation_${anticipation.milestone}`,
          },
          params: { tab: 'today' },
          priority: 2,
        });
      }
    }

    // 4. STREAK GUARDIAN — 9 PM if streak >= 3
    if (settings.streak_guardian && streakData?.current_streak >= 3) {
      if (currentHour < 21) {
        const content = generateNotificationContent('STREAK_GUARDIAN', data, recentTemplates);
        if (content) {
          queue.push({
            category: 'STREAK_GUARDIAN',
            channel: 'streak_guardian',
            hour: 21, minute: 0,
            trigger: 'date',
            content,
            params: { tab: 'today' },
            priority: 4,
          });
        }
      }
    }

    // 5. WEEKLY DIGEST — Sunday at 9 AM
    if (settings.weekly_digest) {
      const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
      const sundayDate = new Date(now);
      sundayDate.setDate(sundayDate.getDate() + daysUntilSunday);
      sundayDate.setHours(9, 0, 0, 0);

      const content = generateNotificationContent('WEEKLY_DIGEST', data, recentTemplates);
      if (content) {
        queue.push({
          category: 'WEEKLY_DIGEST',
          channel: 'weekly_digest',
          trigger: 'exactDate',
          date: sundayDate,
          content,
          params: { tab: 'weekly' },
          priority: 5,
        });
      }
    }

    // 5pro. PRO FEATURE DISCOVERY — Day 3 + Day 7 push for highest-rank
    // untried Pro feature. Defends against the "not using it enough"
    // cancellation by surfacing what the user paid for but never tried.
    try {
      const proPush = await maybeScheduleProDiscoveryPush({ userProfile, now, settings });
      if (proPush) queue.push(proPush);
    } catch {}

    // 5trial. TRIAL-END REMINDER — fires 2 days before a Pro trial charges.
    // Single biggest churn driver for trial-based subscriptions: users forget
    // they signed up, get auto-charged, refund + cancel + leave 1-star reviews.
    // Tone: non-anxious, transparent. Goal is informed cancellation, not coercion.
    try {
      const customerInfo = await RevenueCatService.getCustomerInfo();
      const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
      if (entitlement && entitlement.periodType === 'TRIAL' && entitlement.expirationDate) {
        const exp = new Date(entitlement.expirationDate);
        const daysUntilExp = Math.floor((exp - now) / 86400000);
        const trialLengthDays = RevenueCatService.getTrialLengthDays(customerInfo) || 7;
        // 3-day trial: fire ~24h before charge (offset 1 day, window [1,2])
        // 7-day trial: fire ~48h before charge (offset 2 days, window [2,3])
        const isShortTrial = trialLengthDays <= 4;
        const offsetDays = isShortTrial ? 1 : 2;
        const minWindow = isShortTrial ? 1 : 2;
        const maxWindow = isShortTrial ? 2 : 3;
        if (daysUntilExp >= minWindow && daysUntilExp <= maxWindow) {
          const fireDate = new Date(exp);
          fireDate.setDate(fireDate.getDate() - offsetDays);
          fireDate.setHours(settings.morningTime ?? 7, settings.morningMinute ?? 5, 0, 0);
          if (fireDate > now) {
            // Personalize body with what they've actually built during the trial
            let journalCount = 0;
            let chatCount = 0;
            try { journalCount = await JournalRepository.getEntryCount(userProfile?.id || 'default'); } catch {}
            try { chatCount = (await ChatRepository.getSessions(100)).length; } catch {}
            const stats = [];
            if (journalCount > 0) stats.push(`${journalCount} journal ${journalCount === 1 ? 'entry' : 'entries'}`);
            if (chatCount > 0) stats.push(`${chatCount} ${chatCount === 1 ? 'chat' : 'chats'}`);
            const builtCopy = stats.length > 0
              ? `${stats.join(', ')} so far. `
              : '';
            const title = isShortTrial
              ? 'Tomorrow your trial ends.'
              : 'Two days. We don\'t want to charge you if you don\'t want this.';
            // Loss-frame body: pair what they built with what they'd lose on cancel.
            // Loss aversion (Kahneman) is ~2x stronger than gain framing.
            const lossLine = isShortTrial
              ? 'After tomorrow: no daily Pro insight, no weekly reports, no full chat.'
              : 'After it ends: no daily Pro insight, no weekly reports, no full-depth chat.';
            const builtLine = builtCopy
              ? `${builtCopy}`
              : 'Your chart and everything you\'ve built stays yours. ';
            // A/B test: loss-frame vs investment-frame.
            // PostHog flag `trial_end_frame_variant` with values:
            //   'loss' (default — what shipped in Sprint 1)
            //   'investment' — control: omits the loss-frame line
            // 50/50 split; statistical significance threshold 95%.
            const frameVariant = getFeatureFlag('trial_end_frame_variant', 'loss');
            const includeLoss = frameVariant !== 'investment';
            // Social proof — gated on PostHog feature flag. Flip the flag
            // ON in PostHog with the real cohort stat once N≥1000 members
            // have ≥30 days of usage. Until then this stays silent.
            // Flag payload format: { stat: '82', cohort: 'streak_7_to_month_3' }
            const sproofFlag = getFeatureFlag('trial_end_social_proof', null);
            const socialProofLine = sproofFlag && sproofFlag.stat
              ? ` ${sproofFlag.stat}% of members who built a 7-day streak still use Celestia at month 3.`
              : '';
            const body = includeLoss
              ? `${builtLine}${lossLine}${socialProofLine} Cancel anytime — we won't surprise you.`
              : `${builtLine}${socialProofLine} Cancel anytime — we won't surprise you.`;
            queue.push({
              category: 'TRIAL_ENDING',
              channel: 'cosmic_milestones',
              trigger: 'exactDate',
              date: fireDate,
              content: {
                title,
                body,
                templateId: 'event_trial_ending',
              },
              params: { tab: 'profile' },
              priority: 1,
            });
            captureEvent(EVENTS.TRIAL_ENDING_PUSH_SCHEDULED, {
              days_until_expiration: daysUntilExp,
              trial_length_days: trialLengthDays,
              journal_count: journalCount,
              chat_count: chatCount,
              frame_variant: frameVariant,
            });
          }
        }
      }
    } catch {}

    // 5pre. PRE-BILLING / SUBSCRIPTION-ENDING NOTICES.
    // Two distinct cases driven by RevenueCat customerInfo:
    //   (a) willRenew === true   → standard renewal reminder for annual plans
    //   (b) willRenew === false  → subscription is ending; reactivation nudge
    try {
      const customerInfo = await RevenueCatService.getCustomerInfo();
      const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
      if (entitlement && entitlement.expirationDate) {
        const exp = new Date(entitlement.expirationDate);
        const purchase = entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate) : null;
        const periodDays = purchase ? (exp - purchase) / 86400000 : 0;
        const isAnnualPlan = periodDays > 90;
        const daysUntilExp = Math.floor((exp - now) / 86400000);

        if (entitlement.willRenew !== false && isAnnualPlan && daysUntilExp >= 5 && daysUntilExp <= 9) {
          // (a) Renewal reminder — prevents involuntary-by-surprise charge
          const fireDate = new Date(exp);
          fireDate.setDate(fireDate.getDate() - 7);
          fireDate.setHours(settings.morningTime ?? 7, settings.morningMinute ?? 5, 0, 0);
          if (fireDate > now) {
            queue.push({
              category: 'BILLING_RENEWAL',
              channel: 'cosmic_milestones',
              trigger: 'exactDate',
              date: fireDate,
              content: {
                // Voice per voice-guide-pushes.md — non-anxious, transparent
                title: 'Seven days. Your annual renews.',
                body: `On ${exp.toLocaleDateString()}. Manage in Profile any time. Just letting you know.`,
                templateId: 'event_billing_renewal',
              },
              params: { tab: 'profile' },
              priority: 3,
            });
          }
        } else if (entitlement.willRenew === false && daysUntilExp >= 4 && daysUntilExp <= 6) {
          // (b) Subscription ending — user already cancelled or card lapsing.
          // Soft reactivation nudge before access locks. Captures lost-by-default churn.
          const fireDate = new Date(exp);
          fireDate.setDate(fireDate.getDate() - 5);
          fireDate.setHours(settings.morningTime ?? 7, settings.morningMinute ?? 5, 0, 0);
          if (fireDate > now) {
            queue.push({
              category: 'SUBSCRIPTION_ENDING',
              channel: 'cosmic_milestones',
              trigger: 'exactDate',
              date: fireDate,
              content: {
                title: 'Five days.',
                body: 'Your data stays no matter what. Just letting you know where things are.',
                templateId: 'event_subscription_ending',
              },
              params: { tab: 'profile' },
              priority: 2,
            });
          }
        }
      }
    } catch {}

    // 5a. SOLAR RETURN — annual birthday push, fires 7 days before user's
    // next birthday at their morning time. Highest emotional resonance moment
    // for an astro app. Templated.
    if (settings.weekly_digest && userProfile?.birthDate) {
      try {
        const bd = new Date(userProfile.birthDate + 'T00:00:00');
        if (!isNaN(bd.getTime())) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const thisYear = today.getFullYear();
          const targetYear = (bd.getMonth() < today.getMonth() ||
            (bd.getMonth() === today.getMonth() && bd.getDate() < today.getDate())) ? thisYear + 1 : thisYear;
          const nextBirthday = new Date(targetYear, bd.getMonth(), bd.getDate());
          const daysUntil = Math.floor((nextBirthday - today) / 86400000);
          // Schedule the 7-days-out push if we're 5-9 days away (gives some
          // tolerance for when the user opens the app, since this only fires
          // during scheduleAllNotifications calls).
          if (daysUntil >= 5 && daysUntil <= 9) {
            const fireDate = new Date(nextBirthday);
            fireDate.setDate(fireDate.getDate() - 7);
            fireDate.setHours(settings.morningTime ?? 7, settings.morningMinute ?? 5, 0, 0);
            if (fireDate > now) {
              const sunSign = data.userSunSign || '';
              queue.push({
                category: 'SOLAR_RETURN',
                channel: 'transit_alerts',
                trigger: 'exactDate',
                date: fireDate,
                content: {
                  // Voice per voice-guide-pushes.md — specific, anchored
                  title: sunSign ? `Seven days. The Sun returns to ${sunSign}.` : 'Seven days to your solar return.',
                  body: 'A new year of you starts then. The shape of it is already forming.',
                  templateId: 'event_solar_return',
                },
                params: { tab: 'today' },
                priority: 4,
              });
            }
          }
        }
      } catch {}
    }

    // 5b. JOURNAL PATTERN — Friday noon, only if recent journal theme detected.
    // Investment loads next trigger (Hook Model): user wrote → push references
    // what they wrote about.
    if (settings.weekly_digest && userProfile?.id) {
      try {
        const themeResult = await getDominantJournalTheme(userProfile.id, 7);
        if (themeResult?.theme) {
          const daysUntilFriday = ((5 - dayOfWeek) + 7) % 7 || 7;
          const fridayDate = new Date(now);
          fridayDate.setDate(fridayDate.getDate() + daysUntilFriday);
          fridayDate.setHours(12, 0, 0, 0);
          if (fridayDate > now) {
            queue.push({
              category: 'JOURNAL_PATTERN',
              channel: 'weekly_digest',
              trigger: 'exactDate',
              date: fridayDate,
              content: {
                title: `You wrote about ${themeResult.theme} ${themeResult.count} times this week.`,
                body: 'Worth reading the pattern out loud.',
                templateId: 'event_journal_pattern',
              },
              params: { tab: 'today' },
              priority: 5,
            });
          }
        }
      } catch {}
    }

    // 6. LAPSED CASCADE — independent reactivation channel so users who
    // disable streaks still get re-engagement pushes. Tiered personalization:
    // partner-name > chat-thread > chart placement.
    if (settings.reactivation) {
      // Enrich the shared `data` payload with the user's most recent partner
      // and most recent chat session so lapse templates can reference them.
      try {
        const allProfiles = await ProfileRepository.getAllProfiles();
        const partners = (allProfiles || []).filter(p => p.type === 'other');
        if (partners.length > 0) {
          const last = partners[partners.length - 1];
          data.lastPartnerName = last?.name || null;
          data.lastPartnerId = last?.id || null;
        }
      } catch {}
      try {
        const sessions = await ChatRepository.getSessions(1);
        if (sessions && sessions.length > 0) {
          data.lastChatTitle = sessions[0]?.title || null;
          data.lastChatId = sessions[0]?.id || null;
        }
      } catch {}

      const lapsedDays = [2, 3, 5, 7, 10, 14, 21];
      for (const dayOffset of lapsedDays) {
        const lapsedContent = getLapsedContent(dayOffset, data);
        if (lapsedContent) {
          const trigDate = new Date(now);
          trigDate.setDate(trigDate.getDate() + dayOffset);
          trigDate.setHours(9, 0, 0, 0);

          if (trigDate > now) {
            let lapsedParams = { tab: 'today' };
            if (data.lastPartnerName && data.lastPartnerId) {
              lapsedParams = { tab: 'circle', partnerId: data.lastPartnerId };
            } else if (data.lastChatTitle && data.lastChatId) {
              lapsedParams = { tab: 'askAI', chatId: data.lastChatId };
            }

            queue.push({
              category: 'LAPSED',
              channel: 'reactivation',
              trigger: 'exactDate',
              date: trigDate,
              content: lapsedContent,
              params: lapsedParams,
              priority: 6,
            });
          }
        }
      }
    }

    // ── FREQUENCY CAP: per-day ceiling across the entire schedule ──
    // Hook Model: every unnecessary prompt degrades future prompts. Cap at:
    //   • 1/day for fresh installs (weeks_since_install < 1) — don't overwhelm
    //   • 2/day for everyone else — habituated tolerance
    // Daily-recurring pushes (no specific date) join today's bucket.
    // Lower priority number wins (1 = highest).
    // Bundle-aware daily cap. Honors the user's stated rhythm preference even
    // after habituation: minimal/balanced stay at the base cap; 'everything'
    // pickers signaled tolerance, so we use 1.5× (rounded up).
    const baseCap = (data.weeksSinceInstall || 0) < 1 ? 1 : 2;
    const bundle = settings?.notificationBundle || 'balanced';
    const bundleMultiplier = bundle === 'everything' ? 1.5 : 1;
    const dailyCap = Math.ceil(baseCap * bundleMultiplier);
    const dateKey = (q) => {
      const d = q.trigger === 'exactDate' && q.date ? q.date : now;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const byDay = {};
    for (const q of queue) {
      const k = dateKey(q);
      (byDay[k] = byDay[k] || []).push(q);
    }
    const finalQueue = [];
    for (const k of Object.keys(byDay)) {
      const dayItems = byDay[k].slice().sort((a, b) => a.priority - b.priority);
      finalQueue.push(...dayItems.slice(0, dailyCap));
    }

    // ── QUIET HOURS FILTER ──
    const filtered = settings.quietHoursEnabled
      ? finalQueue.filter(q => {
          const h = q.hour ?? (q.date ? q.date.getHours() : null);
          if (h == null) return true;
          return !isInQuietHours(h, settings.quietHoursStart, settings.quietHoursEnd);
        })
      : finalQueue;

    // ── SCHEDULE ──
    const newHistory = [];
    for (const item of filtered) {
      try {
        const notifContent = {
          title: item.content.title,
          body: item.content.body,
          sound: null,
          data: {
            category: item.category,
            template_id: item.content.templateId || null,
            channel: item.channel || null,
            params: item.params || {},
          },
        };

        let trigger;
        if (item.trigger === 'daily') {
          trigger = { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: item.hour, minute: item.minute };
          if (Platform.OS === 'android' && item.channel) {
            trigger.channelId = item.channel;
          }
        } else if (item.trigger === 'exactDate' && item.date) {
          trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date };
        } else {
          // date-based for today
          const d = new Date(now);
          d.setHours(item.hour, item.minute, 0, 0);
          if (d <= now) continue;
          trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d };
        }

        await Notifications.scheduleNotificationAsync({ content: notifContent, trigger });
        newHistory.push(`${item.category}:${item.content.templateId}`);
      } catch (e) {
        console.error('Failed to schedule notification:', item.category, e);
      }
    }

    // Save history (keep last 7 days worth, ~14 entries)
    const updatedHistory = [...recentTemplates, ...newHistory].slice(-20);
    await saveObject(StorageKeys.NOTIFICATION_HISTORY, updatedHistory);

  } catch (e) {
    console.error('scheduleAllNotifications error:', e);
  }
}

// ── DEEP LINK HANDLER ───────────────────────────────────────

export function handleNotificationNavigation(navigationRef, data) {
  if (!navigationRef?.isReady?.()) return;

  const { category, params } = data || {};
  if (!category) return;

  switch (category) {
    case 'COSMIC_MORNING':
      navigationRef.navigate('Main', { screen: 'Today', params: { highlightLifeArea: params?.highlightLifeArea || null, ...(params || {}) } });
      break;
    case 'STREAK_GUARDIAN':
    case 'STREAK_ANTICIPATION':
    case 'SOLAR_RETURN':
      navigationRef.navigate('Main', { screen: 'Today', params: params || {} });
      break;
    case 'BADGE_RESCUE':
      navigationRef.navigate('Profile', { highlightBadgeId: params?.badgeId });
      break;
    case 'LAPSED':
      if (params?.tab === 'circle') {
        navigationRef.navigate('Main', { screen: 'Circle', params: { partnerId: params.partnerId } });
      } else if (params?.tab === 'askAI') {
        navigationRef.navigate('Main', { screen: 'AskAI', params: { chatId: params.chatId } });
      } else {
        navigationRef.navigate('Main', { screen: 'Today', params: params || {} });
      }
      break;
    case 'JOURNAL_PATTERN':
      navigationRef.navigate('JournalHistory');
      break;
    case 'EVENING_REFLECTION':
      navigationRef.navigate('Main', { screen: 'Today', params: { openJournal: true } });
      break;
    case 'TRANSIT_ALERT':
      navigationRef.navigate('Main', { screen: 'Today', params: { scrollToSection: 'transits', ...(params || {}) } });
      break;
    case 'COSMIC_MILESTONE':
      navigationRef.navigate('Profile', params || {});
      break;
    case 'TRIAL_ENDING':
    case 'BILLING_RENEWAL':
    case 'SUBSCRIPTION_ENDING':
      navigationRef.navigate('CancelFlow');
      break;
    case 'PRO_DISCOVERY':
      if (params?.tab === 'reports') {
        navigationRef.navigate('Reports');
      } else if (params?.tab === 'circle') {
        navigationRef.navigate('Main', { screen: 'Circle' });
      } else {
        navigationRef.navigate('Main', { screen: 'Today', params: params || {} });
      }
      break;
    case 'WEEKLY_DIGEST':
      navigationRef.navigate('Main', { screen: 'Today', params: { tab: 'weekly' } });
      break;
    default:
      navigationRef.navigate('Main', { screen: 'Today' });
  }
}

// ── EVENT-BASED PUSH SCHEDULING ─────────────────────────────
// Hook Model: investment loads next trigger. Each user-action schedules
// a future push referencing what they just invested in.

/**
 * Schedule a one-shot event-based push referencing user-specific content.
 * Honors the user's morning-time setting and notification permission state.
 *
 * @param {object} opts
 * @param {string} opts.type        Logical type (e.g. 'event_partner_insight')
 * @param {number} opts.daysFromNow Days from today before firing
 * @param {string} opts.title       Push title
 * @param {string} opts.body        Push body
 * @param {string} [opts.channel]   Android channel id (default 'transit_alerts')
 * @param {object} [opts.data]      Extra data payload merged into notification.data
 * @returns {Promise<string|null>}  The scheduled notification id, or null if not scheduled
 */
export async function scheduleEventPush({ type, daysFromNow, title, body, channel = 'transit_alerts', data = {} }) {
  try {
    const permitted = await hasNotificationPermission();
    if (!permitted) return null;

    const settings = await getNotificationSettings();
    const mHour = settings.morningTime ?? 7;
    const mMinute = settings.morningMinute ?? 30;

    const fire = new Date();
    fire.setDate(fire.getDate() + Math.max(1, daysFromNow));
    fire.setHours(mHour, mMinute, 0, 0);

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: null,
        data: {
          category: 'EVENT',
          template_id: type,
          channel,
          ...data,
        },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
    });

    return notifId;
  } catch (e) {
    console.warn('[Notif] Event push schedule failed:', e?.message);
    return null;
  }
}

// ── UTILITY ─────────────────────────────────────────────────

export async function cancelAllNotifications() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

export async function cancelNotificationById(id) {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isInQuietHours(hour, start, end) {
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end; // wraps midnight
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadObject, saveObject, StorageKeys } from './storage';
import { generateNotificationContent, buildNotificationData, getLapsedContent } from './notificationContentEngine';
import { getAllFutureCosmicLines } from './cosmicLineService';

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

export async function requestNotificationPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
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
  cosmic_milestones: true,
  weekly_digest: true,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 7,
};

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
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const queue = [];

    // 1. COSMIC MORNING — AI-generated lines on specific dates, fallback to template
    if (settings.cosmic_morning) {
      let morningScheduled = false;
      try {
        const aiLines = await getAllFutureCosmicLines();
        const linesToSchedule = aiLines.slice(0, 5);
        for (const line of linesToSchedule) {
          const trigDate = new Date(line.date + 'T07:30:00');
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
            hour: 7, minute: 30,
            trigger: 'daily',
            content,
            params: { tab: 'today', highlightLifeArea: content.lifeArea || null },
            priority: 1,
          });
        }
      }
    }

    // 2. EVENING REFLECTION — skip Fri/Sat, 8:30 PM
    if (settings.evening_reflection && dayOfWeek !== 5 && dayOfWeek !== 6) {
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

    // 6. LAPSED CASCADE — always schedule (days 2, 3, 5, 7, 10, 14, 21)
    if (settings.streak_guardian) {
      const lapsedDays = [2, 3, 5, 7, 10, 14, 21];
      for (const dayOffset of lapsedDays) {
        const lapsedContent = getLapsedContent(dayOffset, data);
        if (lapsedContent) {
          const trigDate = new Date(now);
          trigDate.setDate(trigDate.getDate() + dayOffset);
          trigDate.setHours(9, 0, 0, 0);

          if (trigDate > now) {
            queue.push({
              category: 'LAPSED',
              channel: 'streak_guardian',
              trigger: 'exactDate',
              date: trigDate,
              content: lapsedContent,
              params: { tab: 'today' },
              priority: 6,
            });
          }
        }
      }
    }

    // ── FREQUENCY CAP: max 2 same-day notifications (morning always wins) ──
    const todayQueue = queue.filter(q => q.trigger !== 'exactDate' || isSameDay(q.date, now));
    const futureQueue = queue.filter(q => q.trigger === 'exactDate' && !isSameDay(q.date, now));

    todayQueue.sort((a, b) => a.priority - b.priority);
    const capped = todayQueue.slice(0, 2);
    const finalQueue = [...capped, ...futureQueue];

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
          data: { category: item.category, params: item.params || {} },
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
    case 'LAPSED':
      navigationRef.navigate('Main', { screen: 'Today', params: params || {} });
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
    case 'WEEKLY_DIGEST':
      navigationRef.navigate('Main', { screen: 'Today', params: { tab: 'weekly' } });
      break;
    default:
      navigationRef.navigate('Main', { screen: 'Today' });
  }
}

// ── UTILITY ─────────────────────────────────────────────────

export async function cancelAllNotifications() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isInQuietHours(hour, start, end) {
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end; // wraps midnight
}

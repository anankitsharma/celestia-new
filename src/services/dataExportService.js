import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ProfileRepository } from './database/rep_profiles';
import { JournalRepository } from './database/rep_journal';
import { ChatRepository } from './database/rep_chats';
import { StreakRepository } from './database/rep_streaks';
import { XPRepository } from './database/rep_xp';
import { AchievementRepository } from './database/rep_achievements';
import { loadString, loadObject, StorageKeys } from './storage';
import { captureEvent, EVENTS } from './analytics';

// Build a single JSON bundle of everything the user has created locally.
// GDPR transparency + churn-signal: data_export_initiated is a strong leaving
// indicator (per 04-churn-prevention.md health-score model).

export async function buildExportBundle(profileId) {
  if (!profileId) throw new Error('profileId required');

  const allProfilesP = ProfileRepository.getAllProfiles().catch(() => []);
  const journalsP = JournalRepository.getAllEntries(profileId, 10000).catch(() => []);
  const chatSessionsP = ChatRepository.getSessions(1000).catch(() => []);
  const streakP = StreakRepository.getStreak(profileId).catch(() => null);
  const xpP = XPRepository.getXP(profileId).catch(() => null);
  const badgesP = AchievementRepository.getAll().catch(() => []);
  const firstUseP = loadString(StorageKeys.FIRST_USE_DATE).catch(() => null);
  const notifSettingsP = loadObject(StorageKeys.NOTIFICATION_SETTINGS).catch(() => null);
  const settingsP = loadObject(StorageKeys.SETTINGS).catch(() => null);

  const [
    allProfiles,
    journals,
    chatSessions,
    streak,
    xp,
    badges,
    firstUse,
    notifSettings,
    settings,
  ] = await Promise.all([
    allProfilesP, journalsP, chatSessionsP, streakP, xpP, badgesP,
    firstUseP, notifSettingsP, settingsP,
  ]);

  // Pull all messages per session — sessions can be large, do sequentially
  const sessionsWithMessages = [];
  for (const s of chatSessions) {
    let messages = [];
    try { messages = await ChatRepository.getMessages(s.id); } catch {}
    sessionsWithMessages.push({ ...s, messages });
  }

  const selfProfile = (allProfiles || []).find(p => p.id === profileId) || null;
  const partners = (allProfiles || []).filter(p => p.id !== profileId && p.type !== 'self');

  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    profile: selfProfile,
    install: {
      first_use_date: firstUse,
      notification_settings: notifSettings,
      app_settings: settings,
    },
    chart: selfProfile?.chart || null,
    partners,
    journal_entries: journals,
    chat_sessions: sessionsWithMessages,
    engagement: {
      streak,
      xp,
      badges,
    },
    summary: {
      journal_count: journals?.length || 0,
      chat_session_count: chatSessions?.length || 0,
      partner_count: partners.length,
      badge_count: (badges || []).length,
    },
  };
}

/**
 * Build the bundle, write to a temp file, and trigger the system share sheet.
 * Returns { ok: bool, path?: string, error?: string }.
 */
export async function exportUserData(profileId, userName) {
  try {
    captureEvent(EVENTS.DATA_EXPORT_INITIATED, { profile_id: profileId });

    const bundle = await buildExportBundle(profileId);
    const safeName = ((userName || 'celestia').toLowerCase().replace(/[^a-z0-9]/g, '_')) || 'celestia';
    const stamp = new Date().toISOString().split('T')[0];
    const filename = `${safeName}_celestia_export_${stamp}.json`;
    const uri = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + filename;

    await FileSystem.writeAsStringAsync(uri, JSON.stringify(bundle, null, 2), {
      encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
    });

    captureEvent(EVENTS.DATA_EXPORT_COMPLETED, {
      profile_id: profileId,
      bytes_estimate: JSON.stringify(bundle).length,
      journal_count: bundle.summary.journal_count,
      chat_session_count: bundle.summary.chat_session_count,
      partner_count: bundle.summary.partner_count,
    });

    const canShare = await Sharing.isAvailableAsync().catch(() => false);
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Your Celestia data',
        UTI: 'public.json',
      });
    }

    return { ok: true, path: uri };
  } catch (e) {
    console.error('[dataExport] failed:', e);
    return { ok: false, error: e?.message || 'Export failed' };
  }
}

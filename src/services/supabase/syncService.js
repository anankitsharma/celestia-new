import { supabase } from './client';
import { getUser } from './authService';
import { ProfileRepository } from '../database/rep_profiles';
import { JournalRepository } from '../database/rep_journal';
import { StreakRepository } from '../database/rep_streaks';
import { AchievementRepository } from '../database/rep_achievements';
import { XPRepository } from '../database/rep_xp';

/**
 * Sync all local data to Supabase after sign-in/sign-up.
 * Local-first: SQLite is the source of truth. Supabase is the backup/sync layer.
 */
export async function syncLocalToCloud() {
  const user = await getUser();
  if (!user) return;

  const userId = user.id;

  try {
    await Promise.all([
      syncProfiles(userId),
      syncJournalEntries(userId),
      syncEngagement(userId),
    ]);
    console.log('[Sync] Local → Cloud complete');
  } catch (e) {
    console.error('[Sync] Error syncing to cloud:', e);
  }
}

/**
 * Sync cloud data to local after sign-in on a new device.
 */
export async function syncCloudToLocal() {
  const user = await getUser();
  if (!user) return;

  const userId = user.id;

  try {
    await Promise.all([
      pullProfiles(userId),
      pullJournalEntries(userId),
      pullEngagement(userId),
    ]);
    console.log('[Sync] Cloud → Local complete');
  } catch (e) {
    console.error('[Sync] Error syncing from cloud:', e);
  }
}

// ── PROFILES ──────────────────────────────────────────────

async function syncProfiles(userId) {
  const localProfiles = await ProfileRepository.getAllProfiles();
  if (localProfiles.length === 0) return;

  for (const p of localProfiles) {
    const row = {
      id: p.id,
      user_id: userId,
      name: p.name,
      gender: p.gender || null,
      birth_date: p.birthDate,
      birth_time: p.birthTime,
      birth_location: p.birthLocation ? (typeof p.birthLocation === 'string' ? { name: p.birthLocation } : p.birthLocation) : null,
      is_time_unknown: p.isTimeUnknown || false,
      profile_type: p.type || 'self',
      chart_data: p.chart || null,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  }
}

async function pullProfiles(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId);

  if (error || !data?.length) return;

  for (const row of data) {
    const existing = await ProfileRepository.getProfileById(row.id);
    if (existing) continue; // Don't overwrite local data

    await ProfileRepository.saveProfile({
      id: row.id,
      name: row.name,
      type: row.profile_type || 'self',
      gender: row.gender,
      birthDate: row.birth_date,
      birthTime: row.birth_time,
      birthLocation: row.birth_location,
      isTimeUnknown: row.is_time_unknown,
      chart: row.chart_data,
    });
  }
}

// ── JOURNAL ───────────────────────────────────────────────

async function syncJournalEntries(userId) {
  const profileId = (await ProfileRepository.getAllProfiles()).find(p => p.type === 'self')?.id;
  if (!profileId) return;

  const entries = await JournalRepository.getAllEntries(profileId, 500);
  if (entries.length === 0) return;

  const rows = entries.map(e => ({
    id: e.id,
    user_id: userId,
    profile_id: profileId,
    date: e.date,
    content: e.content,
    prompt: e.prompt || null,
    created_at: e.created_at ? new Date(e.created_at).toISOString() : new Date().toISOString(),
  }));

  // Batch upsert in chunks of 50
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    await supabase.from('journal_entries').upsert(chunk, { onConflict: 'id' });
  }
}

async function pullJournalEntries(userId) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(500);

  if (error || !data?.length) return;

  const profileId = (await ProfileRepository.getAllProfiles()).find(p => p.type === 'self')?.id || 'default';

  for (const row of data) {
    const existing = await JournalRepository.getEntry(profileId, row.date);
    if (existing) continue;

    await JournalRepository.saveEntry(profileId, row.date, row.content, row.prompt);
  }
}

// ── ENGAGEMENT (streaks, XP, achievements) ────────────────

async function syncEngagement(userId) {
  const profileId = (await ProfileRepository.getAllProfiles()).find(p => p.type === 'self')?.id || 'default';

  // Streak
  const streak = await StreakRepository.getStreak(profileId);
  if (streak) {
    await supabase.from('user_streaks').upsert({
      id: profileId,
      user_id: userId,
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_check_in: streak.last_check_in,
      streak_freezes_remaining: streak.streak_freezes_remaining,
      total_check_ins: streak.total_check_ins,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  }

  // XP
  const xp = await XPRepository.getXP(profileId);
  if (xp) {
    await supabase.from('user_xp').upsert({
      id: profileId,
      user_id: userId,
      total_xp: xp.total_xp,
      level: xp.level,
      last_action: xp.last_action,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  }

  // Achievements
  const achievements = await AchievementRepository.getAll();
  if (achievements.length > 0) {
    const rows = achievements.map(a => ({
      id: a.id,
      user_id: userId,
      badge_id: a.badge_id,
      unlocked_at: a.unlocked_at ? new Date(a.unlocked_at).toISOString() : new Date().toISOString(),
      seen: a.seen ? true : false,
    }));
    await supabase.from('achievements').upsert(rows, { onConflict: 'id' });
  }
}

async function pullEngagement(userId) {
  const profileId = (await ProfileRepository.getAllProfiles()).find(p => p.type === 'self')?.id || 'default';

  // Streak
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (streakData) {
    const localStreak = await StreakRepository.getStreak(profileId);
    if (!localStreak || (streakData.current_streak > (localStreak.current_streak || 0))) {
      // Cloud has better streak - use it
      await StreakRepository.upsertStreak(profileId, streakData);
    }
  }

  // XP
  const { data: xpData } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (xpData) {
    const localXP = await XPRepository.getXP(profileId);
    if (!localXP || (xpData.total_xp > (localXP.total_xp || 0))) {
      await XPRepository.upsertXP(profileId, xpData);
    }
  }

  // Achievements
  const { data: achData } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId);

  if (achData?.length) {
    for (const a of achData) {
      const exists = await AchievementRepository.getById(a.id);
      if (!exists) {
        await AchievementRepository.unlock(a.badge_id);
      }
    }
  }
}

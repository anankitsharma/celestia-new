import { AchievementRepository } from './database/rep_achievements';
import { BADGE_CATALOG, STREAK_MILESTONES } from '../constants/badges';
import { loadObject, saveObject } from './storage';

const COUNTERS_KEY = 'celestia_achievement_counters';

// Tracks incremental counters for achievement conditions
let counters = null;

async function getCounters() {
  if (counters) return counters;
  counters = (await loadObject(COUNTERS_KEY)) || {
    sky_tab_opens: 0,
    reports_generated: 0,
    deep_dives: 0,
    chat_messages: 0,
    shares: 0,
    matches_checked: 0,
  };
  return counters;
}

async function saveCounters() {
  if (counters) await saveObject(COUNTERS_KEY, counters);
}

// Central event dispatcher — call this from screens when actions occur
export async function trackEvent(eventType, payload = {}) {
  const c = await getCounters();
  const unlocked = [];

  switch (eventType) {
    case 'streak_update': {
      const streak = payload.current_streak || 0;
      const badgeId = STREAK_MILESTONES[streak];
      if (badgeId) {
        const result = await AchievementRepository.unlock(badgeId);
        if (result) unlocked.push({ ...result, badge: BADGE_CATALOG[badgeId] });
      }
      break;
    }

    case 'sky_tab_open': {
      c.sky_tab_opens += 1;
      if (c.sky_tab_opens >= 10) {
        const r = await AchievementRepository.unlock('transit_watcher');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.transit_watcher });
      }
      break;
    }

    case 'report_generated': {
      c.reports_generated += 1;
      if (c.reports_generated >= 3) {
        const r = await AchievementRepository.unlock('report_reader');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.report_reader });
      }
      if (c.reports_generated >= 10) {
        const r = await AchievementRepository.unlock('cosmic_scholar');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.cosmic_scholar });
      }
      break;
    }

    case 'deep_dive': {
      c.deep_dives += 1;
      if (c.deep_dives >= 5) {
        const r = await AchievementRepository.unlock('deep_diver');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.deep_diver });
      }
      break;
    }

    case 'chat_message': {
      c.chat_messages += 1;
      if (c.chat_messages >= 20) {
        const r = await AchievementRepository.unlock('question_seeker');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.question_seeker });
      }
      break;
    }

    case 'share': {
      c.shares += 1;
      if (c.shares >= 5) {
        const r = await AchievementRepository.unlock('constellation');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.constellation });
      }
      if (c.shares >= 25) {
        const r = await AchievementRepository.unlock('galaxy_spreader');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.galaxy_spreader });
      }
      break;
    }

    case 'match_checked': {
      c.matches_checked += 1;
      if (c.matches_checked >= 3) {
        const r = await AchievementRepository.unlock('match_maker');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.match_maker });
      }
      break;
    }

    case 'moon_phase': {
      const phase = payload.phaseName;
      if (phase === 'New Moon') {
        const r = await AchievementRepository.unlock('new_moon_ritual');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.new_moon_ritual });
      }
      if (phase === 'Full Moon') {
        const r = await AchievementRepository.unlock('full_moon_witness');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.full_moon_witness });
      }
      break;
    }

    case 'mercury_retrograde': {
      const r = await AchievementRepository.unlock('retrograde_warrior');
      if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.retrograde_warrior });
      break;
    }
  }

  await saveCounters();
  return unlocked;
}

export async function getAllBadges() {
  const unlocked = await AchievementRepository.getAll();
  const unlockedIds = new Set(unlocked.map(a => a.badge_id));

  return Object.values(BADGE_CATALOG).map(badge => ({
    ...badge,
    unlocked: unlockedIds.has(badge.id),
    unlockedAt: unlocked.find(a => a.badge_id === badge.id)?.unlocked_at || null,
  }));
}

export async function getUnseenBadges() {
  const unseen = await AchievementRepository.getUnseen();
  return unseen.map(a => ({
    ...a,
    badge: BADGE_CATALOG[a.badge_id],
  })).filter(a => a.badge);
}

export async function markBadgeSeen(badgeId) {
  await AchievementRepository.markSeen(badgeId);
}

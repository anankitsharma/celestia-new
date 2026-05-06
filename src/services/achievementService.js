import { AchievementRepository } from './database/rep_achievements';
import { BADGE_CATALOG, STREAK_MILESTONES, HIDDEN_BADGES_D7_POOL } from '../constants/badges';
import { loadObject, saveObject } from './storage';
import { captureEvent, EVENTS } from './analytics';

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
    planets_explored: [],
    quests_completed: 0,
  };
  // Ensure new fields exist for existing users
  if (!counters.planets_explored) counters.planets_explored = [];
  if (!counters.quests_completed) counters.quests_completed = 0;
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
      // Surprise hidden-badge roll on milestone days. Variable reward
      // (Hook Model): expected milestone + unexpected bonus. Probability
      // increases at higher milestones since they're rarer.
      const surpriseConfig = {
        7: 0.30,
        14: 0.40,
        30: 0.55,
      }[streak];
      if (surpriseConfig) {
        try {
          const earned = await AchievementRepository.getAll();
          const earnedIds = new Set(earned.map(a => a.badge_id));
          const eligible = HIDDEN_BADGES_D7_POOL.filter(id => !earnedIds.has(id));
          if (eligible.length > 0 && Math.random() < surpriseConfig) {
            const surpriseId = eligible[Math.floor(Math.random() * eligible.length)];
            const surprise = await AchievementRepository.unlock(surpriseId);
            if (surprise) unlocked.push({ ...surprise, badge: BADGE_CATALOG[surpriseId], isSurprise: true });
          }
        } catch {}
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
      // Track which planet was explored for chart_explorer badge
      if (payload.planet && !c.planets_explored.includes(payload.planet)) {
        c.planets_explored.push(payload.planet);
      }
      if (c.deep_dives >= 5) {
        const r = await AchievementRepository.unlock('deep_diver');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.deep_diver });
      }
      // Chart Explorer: explored all major placements (10 planets + Ascendant + Midheaven + Chiron + North Node = 14)
      if (c.planets_explored.length >= 12) {
        const r = await AchievementRepository.unlock('chart_explorer');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.chart_explorer });
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

    case 'quest_complete': {
      c.quests_completed += 1;
      if (c.quests_completed >= 1) {
        const r = await AchievementRepository.unlock('quest_starter');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.quest_starter });
      }
      if (c.quests_completed >= 7) {
        const r = await AchievementRepository.unlock('quest_devotee');
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG.quest_devotee });
      }
      break;
    }

    case 'journey_chapter': {
      const chapterId = payload.chapterId;
      if (chapterId && BADGE_CATALOG[chapterId]) {
        const r = await AchievementRepository.unlock(chapterId);
        if (r) unlocked.push({ ...r, badge: BADGE_CATALOG[chapterId] });
      }
      break;
    }
  }

  await saveCounters();

  // Analytics — fire BADGE_UNLOCKED for each newly-unlocked badge
  for (const u of unlocked) {
    if (u?.badge) {
      captureEvent(EVENTS.BADGE_UNLOCKED, {
        badge_id: u.badge.id,
        badge_name: u.badge.name,
        category: u.badge.category || null,
        trigger: eventType,
      });
    }
  }

  return unlocked;
}

// Get the closest unearned badge with progress info
export async function getNextBadgeProgress() {
  const c = await getCounters();
  const allBadges = await getAllBadges();
  const unlockedIds = new Set(allBadges.filter(b => b.unlocked).map(b => b.id));

  // Define trackable badges with current/target
  const trackable = [
    { id: 'transit_watcher', current: c.sky_tab_opens, target: 10, label: 'Sky explorations' },
    { id: 'report_reader', current: c.reports_generated, target: 3, label: 'Reports generated' },
    { id: 'cosmic_scholar', current: c.reports_generated, target: 10, label: 'Reports generated' },
    { id: 'deep_diver', current: c.deep_dives, target: 5, label: 'Deep dives' },
    { id: 'chart_explorer', current: c.planets_explored.length, target: 12, label: 'Placements explored' },
    { id: 'question_seeker', current: c.chat_messages, target: 20, label: 'Chat messages' },
    { id: 'constellation', current: c.shares, target: 5, label: 'Shares' },
    { id: 'galaxy_spreader', current: c.shares, target: 25, label: 'Shares' },
    { id: 'match_maker', current: c.matches_checked, target: 3, label: 'Matches checked' },
    { id: 'quest_starter', current: c.quests_completed, target: 1, label: 'Quest sets completed' },
    { id: 'quest_devotee', current: c.quests_completed, target: 7, label: 'Quest sets completed' },
  ];

  // Filter to unearned, sort by closest to completion
  const candidates = trackable
    .filter(t => !unlockedIds.has(t.id) && BADGE_CATALOG[t.id])
    .map(t => ({
      ...t,
      badge: BADGE_CATALOG[t.id],
      progress: Math.min(1, t.current / t.target),
      remaining: Math.max(0, t.target - t.current),
    }))
    .sort((a, b) => b.progress - a.progress);

  return candidates[0] || null;
}

export async function getAllBadges() {
  const unlocked = await AchievementRepository.getAll();
  const unlockedIds = new Set(unlocked.map(a => a.badge_id));

  // Hidden badges only appear in the public catalog AFTER they're unlocked,
  // so the surprise stays a surprise.
  return Object.values(BADGE_CATALOG)
    .filter(badge => !badge.hidden || unlockedIds.has(badge.id))
    .map(badge => ({
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

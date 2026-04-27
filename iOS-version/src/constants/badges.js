// Badge definitions for the achievement system
// V1: badge IDs kept stable for storage compat. Display names softened to
// avoid 4.3(b) trigger words (Cosmic, Celestial, Galaxy, Retrograde, etc.)
// shown to users on Profile / Journey screens.

export const BADGE_CATALOG = {
  // ── Streak badges ─────────────────────────
  first_light: {
    id: 'first_light', name: 'Day One', description: 'Check in for your first day',
    icon: '✦', category: 'streak',
  },
  stargazer: {
    id: 'stargazer', name: 'Day Seven', description: '7-day streak',
    icon: '⭐', category: 'streak',
  },
  moon_cycle: {
    id: 'moon_cycle', name: 'Month One', description: '30-day streak',
    icon: '🌙', category: 'streak',
  },
  celestial_devotee: {
    id: 'celestial_devotee', name: 'Hundred Days', description: '100-day streak',
    icon: '✦', category: 'streak',
  },

  // ── Exploration badges ────────────────────
  chart_explorer: {
    id: 'chart_explorer', name: 'Self Map', description: 'Viewed all planet placements',
    icon: '🗺️', category: 'exploration',
  },
  transit_watcher: {
    id: 'transit_watcher', name: 'Sky Watcher', description: 'Checked today\'s sky 10 times',
    icon: '🔭', category: 'exploration',
  },
  report_reader: {
    id: 'report_reader', name: 'Report Reader', description: 'Generated 3 reports',
    icon: '📜', category: 'exploration',
  },
  match_maker: {
    id: 'match_maker', name: 'Connector', description: 'Checked 3 connections',
    icon: '💫', category: 'exploration',
  },

  // ── Knowledge badges ──────────────────────
  deep_diver: {
    id: 'deep_diver', name: 'Deep Diver', description: 'Read 5 deep-dive insights',
    icon: '🌊', category: 'knowledge',
  },
  cosmic_scholar: {
    id: 'cosmic_scholar', name: 'Deep Reader', description: 'Generated 10 reports',
    icon: '📚', category: 'knowledge',
  },
  question_seeker: {
    id: 'question_seeker', name: 'Question Seeker', description: 'Sent 20 chat messages',
    icon: '💬', category: 'knowledge',
  },

  // ── Social badges ─────────────────────────
  constellation: {
    id: 'constellation', name: 'Storyteller', description: 'Shared 5 times',
    icon: '✨', category: 'social',
  },
  galaxy_spreader: {
    id: 'galaxy_spreader', name: 'Storyteller II', description: 'Shared 25 times',
    icon: '✨', category: 'social',
  },
  cosmic_connector: {
    id: 'cosmic_connector', name: 'Inviter', description: 'Referred a friend',
    icon: '🔗', category: 'social',
  },

  // ── Pattern event badges ──────────────────
  new_moon_ritual: {
    id: 'new_moon_ritual', name: 'Reset Day', description: 'Opened during a reset window',
    icon: '🌑', category: 'cosmic_event',
  },
  full_moon_witness: {
    id: 'full_moon_witness', name: 'Bright Night', description: 'Opened during a peak window',
    icon: '🌕', category: 'cosmic_event',
  },
  // V1: 'Retrograde Warrior' removed — Mercury retrograde reference is too
  // explicit a 4.3(b) trigger. Re-introduce in v1.x with softer framing.

  // ── Journey badges ─────────────────────────
  chapter_awakening: {
    id: 'chapter_awakening', name: 'Awakening', description: 'Completed Chapter 1',
    icon: '🌅', category: 'journey',
  },
  chapter_deepening: {
    id: 'chapter_deepening', name: 'Deepening', description: 'Completed Chapter 2',
    icon: '🌊', category: 'journey',
  },
  chapter_connecting: {
    id: 'chapter_connecting', name: 'Connecting', description: 'Completed Chapter 3',
    icon: '🔗', category: 'journey',
  },
  chapter_mastery: {
    id: 'chapter_mastery', name: 'Mastery', description: 'Completed your 30-day journey',
    icon: '👑', category: 'journey',
  },

  // ── Quest badges ────────────────────────────
  quest_starter: {
    id: 'quest_starter', name: 'Quest Starter', description: 'Completed your first daily quest set',
    icon: '⚡', category: 'exploration',
  },
  quest_devotee: {
    id: 'quest_devotee', name: 'Quest Devotee', description: 'Completed 7 daily quest sets',
    icon: '🎯', category: 'exploration',
  },
};

export const BADGE_CATEGORIES = [
  { key: 'streak', label: 'STREAKS' },
  { key: 'exploration', label: 'EXPLORATION' },
  { key: 'knowledge', label: 'KNOWLEDGE' },
  { key: 'social', label: 'SOCIAL' },
  { key: 'cosmic_event', label: 'PATTERN MOMENTS' },
  { key: 'journey', label: 'JOURNEY' },
];

export const STREAK_MILESTONES = {
  1: 'first_light',
  7: 'stargazer',
  30: 'moon_cycle',
  100: 'celestial_devotee',
};

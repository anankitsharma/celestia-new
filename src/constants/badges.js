// Badge definitions for the achievement system
// Each badge has: id, name, description, icon, category

export const BADGE_CATALOG = {
  // ── Streak badges ─────────────────────────
  first_light: {
    id: 'first_light', name: 'First Light', description: 'Check in for your first day',
    icon: '✦', category: 'streak',
  },
  stargazer: {
    id: 'stargazer', name: 'Stargazer', description: '7-day cosmic streak',
    icon: '⭐', category: 'streak',
  },
  moon_cycle: {
    id: 'moon_cycle', name: 'Moon Cycle', description: '30-day cosmic streak',
    icon: '🌙', category: 'streak',
  },
  celestial_devotee: {
    id: 'celestial_devotee', name: 'Celestial Devotee', description: '100-day cosmic streak',
    icon: '🔮', category: 'streak',
  },

  // ── Exploration badges ────────────────────
  chart_explorer: {
    id: 'chart_explorer', name: 'Chart Explorer', description: 'Viewed all planet placements',
    icon: '🗺️', category: 'exploration',
  },
  transit_watcher: {
    id: 'transit_watcher', name: 'Transit Watcher', description: 'Opened Sky tab 10 times',
    icon: '🔭', category: 'exploration',
  },
  report_reader: {
    id: 'report_reader', name: 'Report Reader', description: 'Generated 3 reports',
    icon: '📜', category: 'exploration',
  },
  match_maker: {
    id: 'match_maker', name: 'Match Maker', description: 'Checked 3 compatibility matches',
    icon: '💫', category: 'exploration',
  },

  // ── Knowledge badges ──────────────────────
  deep_diver: {
    id: 'deep_diver', name: 'Deep Diver', description: 'Read 5 deep dive insights',
    icon: '🌊', category: 'knowledge',
  },
  cosmic_scholar: {
    id: 'cosmic_scholar', name: 'Cosmic Scholar', description: 'Generated 10 reports',
    icon: '📚', category: 'knowledge',
  },
  question_seeker: {
    id: 'question_seeker', name: 'Question Seeker', description: 'Sent 20 chat messages',
    icon: '💬', category: 'knowledge',
  },

  // ── Social badges ─────────────────────────
  constellation: {
    id: 'constellation', name: 'Constellation', description: 'Shared 5 times',
    icon: '✨', category: 'social',
  },
  galaxy_spreader: {
    id: 'galaxy_spreader', name: 'Galaxy Spreader', description: 'Shared 25 times',
    icon: '🌌', category: 'social',
  },
  cosmic_connector: {
    id: 'cosmic_connector', name: 'Cosmic Connector', description: 'Referred a friend to Celestia',
    icon: '🔗', category: 'social',
  },

  // ── Cosmic event badges ───────────────────
  new_moon_ritual: {
    id: 'new_moon_ritual', name: 'New Moon Ritual', description: 'Opened during a New Moon',
    icon: '🌑', category: 'cosmic_event',
  },
  full_moon_witness: {
    id: 'full_moon_witness', name: 'Full Moon Witness', description: 'Opened during a Full Moon',
    icon: '🌕', category: 'cosmic_event',
  },
  retrograde_warrior: {
    id: 'retrograde_warrior', name: 'Retrograde Warrior', description: 'Opened during Mercury retrograde',
    icon: '☿', category: 'cosmic_event',
  },

  // ── Journey badges ─────────────────────────
  chapter_awakening: {
    id: 'chapter_awakening', name: 'Awakening', description: 'Completed Chapter 1 of your cosmic journey',
    icon: '🌅', category: 'journey',
  },
  chapter_deepening: {
    id: 'chapter_deepening', name: 'Deepening', description: 'Completed Chapter 2 of your cosmic journey',
    icon: '🌊', category: 'journey',
  },
  chapter_connecting: {
    id: 'chapter_connecting', name: 'Connecting', description: 'Completed Chapter 3 of your cosmic journey',
    icon: '🔗', category: 'journey',
  },
  chapter_mastery: {
    id: 'chapter_mastery', name: 'Mastery', description: 'Completed your 30-day cosmic journey',
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
  { key: 'cosmic_event', label: 'COSMIC EVENTS' },
  { key: 'journey', label: 'COSMIC JOURNEY' },
];

export const STREAK_MILESTONES = {
  1: 'first_light',
  7: 'stargazer',
  30: 'moon_cycle',
  100: 'celestial_devotee',
};

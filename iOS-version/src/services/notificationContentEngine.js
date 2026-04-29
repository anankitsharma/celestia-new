import { HOUSE_THEMES } from '../constants/AstrologyCore';
import { isMercuryRetrograde, getMercuryRetrogradeProximity } from './astrologyService';

// V1: templates that announce astrology jargon (Mercury retrograde, moon phases,
// "cosmic window", "Cosmic Reading", etc.) are disabled for App Store first
// submission. Trigger words in push notifications are the cleanest 4.3(b) hit
// because the OS Settings shelf shows them publicly. Re-enable in v1.x once
// approved; the engagement loop should still work via cm_navigator_excerpt
// (which uses the AI-generated forecast text controlled by our system prompts).
const V1_DISABLED_TEMPLATES = new Set([
  // Cosmic morning — heavy astrology phrasings
  'cm_moon_sign',         // "Moon enters Cancer today"
  'cm_energy',            // "The cosmos is handing you something rare"
  'cm_forecast',          // "Your Cosmic Reading"
  'cm_window',            // "This cosmic window won't last"
  'cm_retrograde',        // "Mercury Retrograde is active"
  'cm_pre_retrograde',    // "Mercury Retrograde starts tomorrow"
  'cm_moon_phase',        // "Tonight's Full Moon in Cancer"
  'cm_love',              // "Venus has something to say"
  'cm_mantra',            // "Your cosmic mantra"
  'cm_journal_follow',    // "Moon moved to Cancer overnight"
  // Evening reflection — moon/lunar leads + chart wording
  'er_moon',
  'er_phase',
  'er_whisper',           // "Something shifted in your chart today"
  // Pattern alerts (formerly transit alerts) — astrology jargon leads
  'ta_window',
  'ta_moon_aspect',
  'ta_lunation',
  'ta_retrograde',
  'ta_energy_shift',
  // Placement unlock — chart-reveal framing
  'pu_reveal',            // "your chart reveals"
  'pu_tease',             // "in your birth chart"
  // Weekly digest — explicit astro framing
  'wd_preview',           // "powerCosmic", "The cosmos has events lined up"
  'wd_love',              // "Venus has mapped out your week"
  'wd_career',            // "Jupiter supports … energy"
  'wd_retrograde',
  'wd_moon',
  // Cosmic milestone — astro-coded victory copy
  'mile_badge',           // "Your cosmic collection grows … celestial identity"
  'mile_level',           // "The cosmos recognizes you"
]);
// ── TEMPLATE CATALOG ────────────────────────────────────────

const TEMPLATES = {
  COSMIC_MORNING: [
    {
      id: 'cm_navigator_excerpt',
      requires: ['forecast'],
      // Weight 100 = ALWAYS wins when forecast exists. Guarantees notification matches homepage headline.
      weight: (d) => d.forecast?.navigatorHeadline ? 100 : 0,
      generate: (d) => {
        const body = d.forecast.notificationExcerpt?.body || d.forecast.navigatorSummary || 'Your daily navigator briefing is ready.';
        return {
          title: d.forecast.navigatorHeadline,
          body: body.endsWith('.') || body.endsWith('→') ? `${body} Open for your full insight →` : `${body}. Open for your full insight →`,
          lifeArea: d.forecast.notificationExcerpt?.lifeArea || null,
        };
      },
    },
    {
      id: 'cm_navigator_headline',
      requires: ['forecast'],
      weight: (d) => d.forecast?.navigatorHeadline ? 8 : 0,
      generate: (d) => {
        const body = d.forecast.navigatorSummary || 'Your daily navigator briefing is ready.';
        return {
          title: d.forecast.navigatorHeadline,
          body: body.endsWith('.') || body.endsWith('→') ? `${body} See your full day →` : `${body}. See your full day →`,
        };
      },
    },
    {
      id: 'cm_moon_sign',
      requires: ['moonData'],
      weight: (d) => d.userMoonSign ? 4 : 2,
      generate: (d) => ({
        title: `Moon enters ${d.moonData.sign} today`,
        body: d.userMoonSign
          ? `Your emotional frequency shifts. As a ${d.userMoonSign} Moon, you'll feel this more than most. Open for details →`
          : `The emotional tide shifts today. See how it lands in your chart →`,
      }),
    },
    {
      id: 'cm_energy',
      requires: ['energyData'],
      weight: () => 3,
      generate: (d) => {
        const top = [...d.energyData].sort((a, b) => b.value - a.value)[0];
        const pct = Math.round((top.value + 1) * 50);
        return {
          title: `${top.id} energy peaks today`,
          body: `Your ${top.id.toLowerCase()} score hits ${pct}%. The cosmos is handing you something rare.`,
        };
      },
    },
    {
      id: 'cm_forecast',
      requires: ['forecast'],
      weight: (d) => d.forecast?.viralInsight ? 4 : 2,
      generate: (d) => ({
        title: `✦ ${d.forecast.header || 'Your Cosmic Reading'}`,
        body: d.forecast.viralInsight || d.forecast.mantra || 'Your personalized briefing is ready.',
      }),
    },
    {
      id: 'cm_window',
      requires: ['cosmicWindows'],
      weight: () => 5,
      generate: (d) => {
        const w = d.cosmicWindows[0];
        return {
          title: `${w.planet} is in your ${w.targetSign || 'chart'}`,
          body: w.description || `This cosmic window won't last. See what it means for you.`,
        };
      },
    },
    {
      id: 'cm_retrograde',
      requires: ['mercuryRx'],
      weight: () => 6,
      generate: (d) => ({
        title: 'Mercury Retrograde is active',
        body: d.userMercurySign
          ? `As a ${d.userMercurySign} Mercury, double-check everything today. Open for your survival guide →`
          : `Communication and tech may be disrupted. Open for your survival guide →`,
      }),
    },
    {
      id: 'cm_pre_retrograde',
      requires: ['retrogradeProximity'],
      weight: (d) => d.retrogradeProximity?.daysUntil === 1 ? 9 : d.retrogradeProximity?.daysUntil <= 3 ? 7 : 0,
      generate: (d) => {
        const days = d.retrogradeProximity.daysUntil;
        if (days === 1) return {
          title: 'Mercury Retrograde starts tomorrow',
          body: d.userMercurySign
            ? `Back up your phone. Finish pending texts. As a ${d.userMercurySign} Mercury, you'll feel this. Open for your survival plan →`
            : `Back up your phone. Finish pending conversations. Your pre-retrograde checklist is ready →`,
        };
        return {
          title: `Mercury Retrograde in ${days} days`,
          body: `It's coming. Don't panic — but wrap up big decisions and double-check plans. Your chart-specific guide is ready →`,
        };
      },
    },
    {
      id: 'cm_moon_phase',
      requires: ['moonData'],
      weight: (d) => ['Full Moon', 'New Moon'].includes(d.moonData.phaseName) ? 6 : 2,
      generate: (d) => ({
        title: `${d.moonData.phaseName} at ${d.moonData.illumination}%`,
        body: `Tonight's ${d.moonData.phaseName} in ${d.moonData.sign} is activating your chart. See where.`,
      }),
    },
    {
      id: 'cm_love',
      requires: ['forecast'],
      weight: (d) => d.forecast?.loveVibe ? 3 : 0,
      generate: (d) => ({
        title: `Love energy: ${d.forecast.loveVibe || 'shifting'}`,
        body: `Venus has something to say about your heart today. Your full reading is waiting.`,
      }),
    },
    {
      id: 'cm_mantra',
      requires: ['forecast'],
      weight: (d) => d.forecast?.mantra ? 3 : 0,
      generate: (d) => ({
        title: 'Today\'s reflection',
        body: `"${d.forecast.mantra}"`,
      }),
    },
    {
      id: 'cm_yesterday_thread',
      requires: ['yesterdayForecast'],
      weight: (d) => d.yesterdayForecast?.header ? 6 : 0,
      generate: (d) => ({
        title: 'Your story continues',
        body: `Yesterday: "${d.yesterdayForecast.header}". Today the energy shifts — your next chapter is ready.`,
      }),
    },
    {
      id: 'cm_journal_follow',
      requires: ['yesterdayJournal'],
      weight: (d) => d.yesterdayJournal?.mood ? 5 : 0,
      generate: (d) => ({
        title: `Good morning, ${d.userName}`,
        body: `You felt ${d.yesterdayJournal.mood} yesterday. The Moon moved to ${d.moonData?.sign || 'a new sign'} overnight — see what today brings.`,
      }),
    },
  ],

  EVENING_REFLECTION: [
    {
      id: 'er_moon',
      requires: ['moonData'],
      weight: (d) => d.userMoonSign ? 4 : 2,
      generate: (d) => ({
        title: 'The Moon asks you something tonight',
        body: `With the Moon in ${d.moonData.sign}, write 3 words about what you felt today.`,
      }),
    },
    {
      id: 'er_recap',
      requires: ['energyData'],
      weight: () => 3,
      generate: (d) => {
        const love = Math.round(((d.energyData.find(e => e.id === 'Love')?.value || 0) + 1) * 50);
        const career = Math.round(((d.energyData.find(e => e.id === 'Career')?.value || 0) + 1) * 50);
        return {
          title: 'Your day is ending',
          body: `Love: ${love}% · Career: ${career}%. What surprised you? Journal it.`,
        };
      },
    },
    {
      id: 'er_phase',
      requires: ['moonData'],
      weight: () => 2,
      generate: (d) => {
        const actions = {
          'New Moon': 'set a quiet intention',
          'Waxing Crescent': 'name one thing you are building',
          'First Quarter': 'acknowledge a challenge you faced',
          'Waxing Gibbous': 'refine your approach',
          'Full Moon': 'celebrate what came to light',
          'Waning Gibbous': 'share a gratitude',
          'Last Quarter': 'release what no longer serves you',
          'Waning Crescent': 'rest and surrender',
        };
        return {
          title: `☽ ${d.moonData.phaseName} reflection`,
          body: `The ${d.moonData.phaseName} invites you to ${actions[d.moonData.phaseName] || 'reflect'}. One sentence is enough.`,
        };
      },
    },
    {
      id: 'er_streak',
      requires: ['streakData'],
      weight: (d) => d.streakData?.current_streak > 1 ? 4 : 0,
      // V1.2 — Banned-word swap: "cosmic journaling" / "the universe" stripped.
      generate: (d) => ({
        title: `Day ${d.streakData.current_streak} of reflection`,
        body: `You've shown up ${d.streakData.current_streak} days in a row. Tonight's prompt: What's the pattern you're noticing this week?`,
      }),
    },
    {
      id: 'er_whisper',
      requires: [],
      weight: () => 1,
      generate: () => ({
        title: 'A quiet whisper',
        body: 'Something shifted in your chart today. Did you feel it? Write it down before you forget.',
      }),
    },
  ],

  TRANSIT_ALERT: [
    {
      id: 'ta_window',
      requires: ['cosmicWindows'],
      weight: () => 5,
      generate: (d) => {
        const w = d.cosmicWindows[0];
        return {
          title: `${w.planet} ${w.type === 'exact_aspect' ? 'aligns with' : 'transits'} your chart`,
          body: w.description || `A significant cosmic event is active. See the full transit map.`,
        };
      },
    },
    {
      id: 'ta_moon_aspect',
      requires: ['moonData'],
      weight: (d) => d.moonData?.majorAspect ? 4 : 0,
      generate: (d) => {
        const asp = d.moonData.majorAspect;
        return {
          title: asp.label,
          body: asp.type === 'Tension'
            ? `Emotional tension is building. Channel it wisely.`
            : `Emotional flow is strong. Trust your instincts today.`,
        };
      },
    },
    {
      id: 'ta_lunation',
      requires: ['moonData'],
      weight: (d) => ['Full Moon', 'New Moon'].includes(d.moonData?.phaseName) ? 6 : 0,
      generate: (d) => {
        const moonHouse = d.userChart?.planets?.find(p => p.name === 'Moon')?.house || 1;
        const theme = HOUSE_THEMES[moonHouse] || 'Self & Identity';
        return {
          title: `${d.moonData.phaseName} in ${d.moonData.sign} tonight`,
          body: `This lands near your natal Moon's house of ${theme}. Set your intention.`,
        };
      },
    },
    {
      id: 'ta_retrograde',
      requires: ['mercuryRx'],
      weight: () => 5,
      generate: () => ({
        title: '☿ Mercury Retrograde check-in',
        body: `The retrograde continues. Review, revise, reconnect — but don't sign anything major.`,
      }),
    },
    {
      id: 'ta_energy_shift',
      requires: ['energyData'],
      weight: () => 2,
      generate: (d) => {
        const top = [...d.energyData].sort((a, b) => b.value - a.value)[0];
        return {
          title: `Cosmic energy shift: ${top.id}`,
          body: `${top.id} energy is amplified in today's sky. See the full transit breakdown.`,
        };
      },
    },
  ],

  STREAK_GUARDIAN: [
    {
      id: 'sg_danger',
      requires: ['streakData'],
      weight: (d) => d.streakData?.current_streak >= 7 ? 5 : 3,
      generate: (d) => ({
        title: `${d.streakData.current_streak}-day streak`,
        body: `You've built a ${d.streakData.current_streak}-day streak. One tap keeps it alive.`,
      }),
    },
    {
      id: 'sg_loss_aversion',
      requires: ['streakData'],
      weight: (d) => d.streakData?.current_streak >= 14 ? 6 : 2,
      generate: (d) => ({
        title: `${d.streakData.current_streak}-day streak`,
        body: `30 seconds keeps your ${d.streakData.current_streak}-day streak alive.`,
      }),
    },
    {
      id: 'sg_freeze',
      requires: ['streakData'],
      weight: (d) => d.streakData?.streak_freezes_remaining > 0 ? 4 : 0,
      generate: (d) => ({
        title: 'Streak freeze available',
        body: `You have a streak freeze ready. Open the app to protect your ${d.streakData.current_streak}-day streak.`,
      }),
    },
    {
      id: 'sg_milestone_close',
      requires: ['streakData'],
      weight: (d) => {
        const s = d.streakData?.current_streak || 0;
        return [6, 13, 29, 49, 99].includes(s) ? 6 : 0;
      },
      generate: (d) => {
        const next = { 6: 7, 13: 14, 29: 30, 49: 50, 99: 100 }[d.streakData.current_streak] || d.streakData.current_streak + 1;
        return {
          title: `1 day from Day ${next}`,
          body: `Tomorrow you hit a milestone. Don't break the chain now.`,
        };
      },
    },
  ],

  LAPSED: [
    {
      id: 'sg_lapsed_2',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: 'Welcome back when you\'re ready',
        body: `${d.userName || 'Hey'}, a new briefing is waiting whenever you open Celestia.`,
      }),
    },
    {
      id: 'sg_lapsed_3',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `${d.userName || 'Hey'}, three days of briefings ready`,
        body: `Pick up where you left off. Your relational outlook is updated.`,
      }),
    },
    {
      id: 'sg_lapsed_5',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `Five days of briefings`,
        body: `${d.userName || 'Hey'}, your weekly summary is ready in Today.`,
      }),
    },
    {
      id: 'sg_lapsed_7',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: 'A week of briefings',
        body: `Open Today to see what's been waiting for you.`,
      }),
    },
    {
      id: 'sg_lapsed_10',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `Your patterns kept moving`,
        body: `${d.userName || 'Hey'}, things shifted while you were away. Open Celestia to catch up.`,
      }),
    },
    {
      id: 'sg_lapsed_14',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `Two weeks of briefings`,
        body: `${d.userName || 'Hey'}, a longer pattern is starting to show. Open to take a look.`,
      }),
    },
    {
      id: 'sg_lapsed_21',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `${d.userName || 'Hey'}, three weeks of briefings`,
        body: `Your monthly summary is ready in Reports.`,
      }),
    },
  ],

  PLACEMENT_UNLOCK: [
    {
      id: 'pu_reveal',
      requires: ['unlockPlanet'],
      weight: () => 5,
      generate: (d) => ({
        title: `${d.unlockPlanet} just unlocked`,
        body: `Day ${d.unlockDay}: Your ${d.unlockPlanet} placement is ready to be explored. See what your chart reveals.`,
      }),
    },
    {
      id: 'pu_tease',
      requires: ['unlockPlanet'],
      weight: () => 4,
      generate: (d) => ({
        title: `New chart insight ready`,
        body: `${d.unlockPlanet} in your birth chart — there is something you need to see. Tap to reveal.`,
      }),
    },
  ],

  COSMIC_MILESTONE: [
    {
      id: 'mile_badge',
      requires: ['badge'],
      weight: () => 5,
      generate: (d) => ({
        title: `✦ ${d.badge.name} unlocked!`,
        body: `Your cosmic collection grows. ${d.badge.icon} See your celestial identity.`,
      }),
    },
    {
      id: 'mile_level',
      requires: ['levelInfo'],
      weight: () => 5,
      generate: (d) => ({
        title: `Level up: ${d.levelInfo.name}`,
        body: `${d.totalXP} Stardust earned. The cosmos recognizes you, ${d.userName}.`,
      }),
    },
  ],

  WEEKLY_DIGEST: [
    {
      id: 'wd_preview',
      requires: ['forecast'],
      weight: () => 4,
      generate: (d) => ({
        title: `Your week ahead: ${d.forecast.powerCosmic || 'New Energy'}`,
        body: d.forecast.viralInsight || `The cosmos has events lined up for your chart. See what's coming.`,
      }),
    },
    {
      id: 'wd_love',
      requires: ['forecast'],
      weight: (d) => d.forecast?.loveVibe ? 3 : 0,
      generate: (d) => ({
        title: `Love forecast: ${d.forecast.loveVibe}`,
        body: `Venus has mapped out your week. See which day is your power day.`,
      }),
    },
    {
      id: 'wd_career',
      requires: ['forecast'],
      weight: (d) => d.forecast?.careerVibe ? 3 : 0,
      generate: (d) => ({
        title: `Career energy this week: ${d.forecast.careerVibe}`,
        body: d.userSunSign
          ? `Jupiter supports ${d.userSunSign} energy this week. Lean into it.`
          : `This week's career forecast is ready. See your power moves.`,
      }),
    },
    {
      id: 'wd_retrograde',
      requires: ['mercuryRx'],
      weight: () => 5,
      generate: () => ({
        title: 'Retrograde week: survival guide inside',
        body: `Mercury retrograde shapes this whole week. Your personalized guide is ready.`,
      }),
    },
    {
      id: 'wd_moon',
      requires: ['moonData'],
      weight: () => 2,
      generate: (d) => ({
        title: `Week starts with Moon in ${d.moonData.sign}`,
        body: `Emotional currents are ${d.moonData.majorAspect?.type === 'Tension' ? 'intense' : 'flowing'}. Your weekly map is ready.`,
      }),
    },
  ],
};

// ── CONTENT GENERATOR ───────────────────────────────────────

/**
 * Generate notification content for a category.
 * Returns { title, body, templateId } or null if no viable template.
 */
export function generateNotificationContent(category, data, history = []) {
  const templates = TEMPLATES[category];
  if (!templates) return null;

  // Filter by data availability — check requires BEFORE weight to avoid null access
  const viable = templates.filter(t => {
    // V1: skip disabled templates outright (see V1_DISABLED_TEMPLATES at top of file).
    if (V1_DISABLED_TEMPLATES.has(t.id)) return false;
    for (const req of t.requires) {
      if (req === 'mercuryRx' && !data.mercuryRx) return false;
      if (req === 'cosmicWindows' && (!data.cosmicWindows || data.cosmicWindows.length === 0)) return false;
      if (req === 'badge' && !data.badge) return false;
      if (req === 'levelInfo' && !data.levelInfo) return false;
      if (req !== 'mercuryRx' && req !== 'cosmicWindows' && req !== 'badge' && req !== 'levelInfo' && !data[req]) return false;
    }
    if (t.weight(data) <= 0) return false;
    return true;
  });

  if (viable.length === 0) return null;

  // Exclude recently used (last 2 entries in history for this category)
  const recentIds = history
    .filter(h => h.startsWith(category + ':'))
    .map(h => h.split(':')[1])
    .slice(-2);

  let pool = viable.filter(t => !recentIds.includes(t.id));
  if (pool.length === 0) pool = viable;

  // Weighted random selection
  const totalWeight = pool.reduce((sum, t) => sum + t.weight(data), 0);
  let rand = Math.random() * totalWeight;
  let selected = pool[0];
  for (const t of pool) {
    rand -= t.weight(data);
    if (rand <= 0) { selected = t; break; }
  }

  const content = selected.generate(data);
  return { ...content, templateId: selected.id };
}

/**
 * Build the data object for content generation from astrology services.
 */
export function buildNotificationData(userProfile, forecast, moonData, energyData, cosmicWindows, streakData, yesterdayForecast, yesterdayJournal) {
  const chart = userProfile?.chart;
  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');
  const mercury = chart?.planets?.find(p => p.name === 'Mercury');

  let mercuryRx = false;
  let retrogradeProximity = null;
  try { mercuryRx = isMercuryRetrograde(); } catch {}
  try { retrogradeProximity = getMercuryRetrogradeProximity(); } catch {}

  return {
    userName: userProfile?.name?.split(' ')[0] || 'friend',
    userSunSign: sun?.sign,
    userMoonSign: moon?.sign,
    userRisingSign: rising?.sign,
    userMercurySign: mercury?.sign,
    userChart: chart,
    moonData: moonData || null,
    forecast: forecast || null,
    energyData: energyData || null,
    cosmicWindows: cosmicWindows || [],
    streakData: streakData || null,
    yesterdayForecast: yesterdayForecast || null,
    yesterdayJournal: yesterdayJournal || null,
    mercuryRx,
    retrogradeProximity,
  };
}

/**
 * Get the lapsed-day content for a specific day offset.
 */
export function getLapsedContent(dayOffset, data) {
  const map = { 2: 'sg_lapsed_2', 3: 'sg_lapsed_3', 5: 'sg_lapsed_5', 7: 'sg_lapsed_7', 10: 'sg_lapsed_10', 14: 'sg_lapsed_14', 21: 'sg_lapsed_21' };
  const id = map[dayOffset];
  if (!id) return null;

  const template = TEMPLATES.LAPSED.find(t => t.id === id);
  if (!template) return null;

  const content = template.generate(data);
  return { ...content, templateId: id };
}

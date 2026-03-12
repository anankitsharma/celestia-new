import { HOUSE_THEMES } from '../constants/AstrologyCore';
import { isMercuryRetrograde } from './astrologyService';

// ── TEMPLATE CATALOG ────────────────────────────────────────

const TEMPLATES = {
  COSMIC_MORNING: [
    {
      id: 'cm_navigator_excerpt',
      requires: ['forecast'],
      weight: (d) => d.forecast?.navigatorHeadline ? 10 : 0,
      generate: (d) => ({
        title: d.forecast.navigatorHeadline,
        body: d.forecast.notificationExcerpt?.body || d.forecast.navigatorSummary || 'Your daily navigator briefing is ready.',
      }),
    },
    {
      id: 'cm_navigator_headline',
      requires: ['forecast'],
      weight: (d) => d.forecast?.navigatorHeadline ? 8 : 0,
      generate: (d) => ({
        title: d.forecast.navigatorHeadline,
        body: d.forecast.navigatorSummary || 'Your daily navigator briefing is ready.',
      }),
    },
    {
      id: 'cm_moon_sign',
      requires: ['moonData'],
      weight: (d) => d.userMoonSign ? 4 : 2,
      generate: (d) => ({
        title: `Moon enters ${d.moonData.sign} today`,
        body: d.userMoonSign
          ? `Your emotional frequency shifts. As a ${d.userMoonSign} Moon, you'll feel this more than most.`
          : `The emotional tide shifts today. See how it lands in your chart.`,
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
        body: d.forecast.viralInsight || d.forecast.mantra || 'Your personalized cosmic reading is ready.',
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
          ? `As a ${d.userMercurySign} Mercury, double-check everything today.`
          : `Communication and tech may be disrupted. Tap for your survival guide.`,
      }),
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
        title: 'Your cosmic mantra',
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
          title: 'Your cosmic day is ending',
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
      generate: (d) => ({
        title: `Day ${d.streakData.current_streak} of cosmic journaling`,
        body: `You've shown up ${d.streakData.current_streak} days in a row. Tonight's prompt: What did the universe teach you?`,
      }),
    },
    {
      id: 'er_whisper',
      requires: [],
      weight: () => 1,
      generate: () => ({
        title: 'A quiet cosmic whisper',
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
        title: `${d.streakData.current_streak}-day streak at risk`,
        body: `You've built ${d.streakData.current_streak} days of cosmic momentum. One tap keeps it alive.`,
      }),
    },
    {
      id: 'sg_loss_aversion',
      requires: ['streakData'],
      weight: (d) => d.streakData?.current_streak >= 14 ? 6 : 2,
      generate: (d) => ({
        title: `Don't lose ${d.streakData.current_streak} days`,
        body: `Your ${d.streakData.current_streak}-day streak is the top 5% of cosmic readers. 30 seconds keeps it alive.`,
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
      requires: ['moonData'],
      weight: () => 5,
      generate: (d) => ({
        title: 'The stars noticed you\'re gone',
        body: `The Moon moved to ${d.moonData?.sign || 'a new sign'} while you were away.`,
      }),
    },
    {
      id: 'sg_lapsed_3',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `${d.userName}, your chart kept moving`,
        body: `3 days of cosmic insights are waiting. The sky didn't stop.`,
      }),
    },
    {
      id: 'sg_lapsed_5',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `✦ ${d.userName}, something unusual happened`,
        body: `Your weekly cosmic summary is ready. 5 days of insights in one view.`,
      }),
    },
    {
      id: 'sg_lapsed_7',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: 'A full week of cosmic wisdom',
        body: `7 days. Multiple Moon sign changes. All personalized to your chart.`,
      }),
    },
    {
      id: 'sg_lapsed_10',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `Your cosmic portrait has evolved`,
        body: `${d.userName}, the transits shifted while you were away. Something new is waiting in your chart.`,
      }),
    },
    {
      id: 'sg_lapsed_14',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `We found something in your chart`,
        body: `${d.userName}, 14 days of cosmic data reveal a pattern. Open to see what the stars are saying.`,
      }),
    },
    {
      id: 'sg_lapsed_21',
      requires: [],
      weight: () => 5,
      generate: (d) => ({
        title: `${d.userName}, your chart reveals something about this month`,
        body: `3 weeks of transits have shaped your path. Your monthly cosmic reading is ready.`,
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
  try { mercuryRx = isMercuryRetrograde(); } catch {}

  return {
    userName: userProfile?.name?.split(' ')[0] || 'Stargazer',
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

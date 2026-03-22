// Web-compatible Narrative Service
import { ForecastRepository } from './database/rep_forecasts';
import { getCosmicSeason, getActiveCosmicWindows, getMoonDataForDate,
         isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance
} from './astrologyService';
import { loadObject } from './storage';

export async function getNarrativeContext(profileId, chart) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Yesterday's data
  let yesterdayForecast = null;
  try {
    const yesterdayForecastKey = `${profileId}_today_${yesterdayStr}`;
    yesterdayForecast = await ForecastRepository.getForecast(yesterdayForecastKey);
  } catch (e) {}

  // Journal entries from localStorage
  let yesterdayJournal = null;
  try {
    const entries = (await loadObject('celestia_journal_entries')) || [];
    yesterdayJournal = entries.find((e) => e.date === yesterdayStr && e.profileId === profileId) || null;
  } catch (e) {}

  // Today's cosmic context
  let moonData = null, cosmicSeason = null, cosmicChange = null;
  let cosmicWindows = [], significance = 0, mercuryRx = false;

  try { moonData = getMoonDataForDate(today); } catch (e) {}
  try { cosmicSeason = getCosmicSeason(chart, today); } catch (e) {}
  try { cosmicChange = getCosmicChangeToday(chart); } catch (e) {}
  try { cosmicWindows = getActiveCosmicWindows(chart, today).slice(0, 3); } catch (e) {}
  try { significance = calculateTransitSignificance(chart, today); } catch (e) {}
  try { mercuryRx = isMercuryRetrograde(today); } catch (e) {}

  let journalText = null, journalMood = null;
  if (yesterdayJournal) {
    journalText = yesterdayJournal.content ? yesterdayJournal.content.substring(0, 100) : null;
    try {
      const promptData = yesterdayJournal.prompt ? JSON.parse(yesterdayJournal.prompt) : null;
      journalMood = promptData?.mood || null;
    } catch (e) {}
  }

  let eveningMoodRating = null;
  try {
    const moods = (await loadObject('celestia_evening_moods')) || {};
    eveningMoodRating = moods[yesterdayStr] || null;
  } catch (e) {}

  return {
    yesterday: {
      forecastHeader: yesterdayForecast?.header || null,
      forecastMantra: yesterdayForecast?.mantra || null,
      journalText,
      journalMood,
      eveningMoodRating,
      moonSign: (() => { try { return getMoonDataForDate(yesterday)?.sign || null; } catch { return null; } })(),
    },
    today: { moonData, cosmicChange, significance, cosmicWindows },
    season: cosmicSeason,
    archetype: null,
    mercuryRx,
  };
}

export function buildNarrativePromptBlock(ctx) {
  if (!ctx) return '';
  const lines = ['NARRATIVE CONTEXT (Weave naturally \u2014 never list these as bullet points):'];
  if (ctx.yesterday?.forecastHeader)
    lines.push(`- Yesterday's reading was: "${ctx.yesterday.forecastHeader}"`);
  if (ctx.yesterday?.journalText)
    lines.push(`- User journaled yesterday: "${ctx.yesterday.journalText}" (mood: ${ctx.yesterday.journalMood || 'unspecified'})`);
  if (ctx.yesterday?.eveningMoodRating) {
    const accuracy = ['', 'off \u2014 reading didn\'t land', 'meh \u2014 partially resonated', 'okay \u2014 somewhat accurate', 'good \u2014 reading was helpful', 'spot on \u2014 eerily accurate'][ctx.yesterday.eveningMoodRating];
    lines.push(`- Yesterday's reading accuracy feedback: ${accuracy}. ${ctx.yesterday.eveningMoodRating <= 2 ? 'Be more specific and personal today.' : 'Keep this calibration.'}`);
  }
  if (ctx.season)
    lines.push(`- Cosmic Season: ${ctx.season.planet} is transiting their natal ${ctx.season.natalTarget} \u2014 ${ctx.season.progress}% through, ${ctx.season.daysRemaining} days remaining. ${ctx.season.isRetrograde ? 'Currently retrograde \u2014 revisiting themes.' : ''}`);
  if (ctx.archetype)
    lines.push(`- Their cosmic archetype: "${ctx.archetype.name}" (${ctx.archetype.rarity})`);
  if (ctx.mercuryRx)
    lines.push('- Mercury is currently retrograde');
  return lines.join('\n');
}

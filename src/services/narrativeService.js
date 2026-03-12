import { ForecastRepository } from './database/rep_forecasts';
import { JournalRepository } from './database/rep_journal';
import { getCosmicSeason, getActiveCosmicWindows, getMoonDataForDate,
         isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance
} from './astrologyService';
import { getCosmicArchetype } from './cosmicIdentityService';

export async function getNarrativeContext(profileId, chart) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  // Yesterday's data
  let yesterdayJournal = null;
  let yesterdayForecast = null;
  try {
    yesterdayJournal = await JournalRepository.getEntry(profileId, yesterdayStr);
  } catch (e) {}
  try {
    const yesterdayForecastKey = `${profileId}_today_${yesterdayStr}`;
    yesterdayForecast = await ForecastRepository.getForecast(yesterdayForecastKey);
  } catch (e) {}

  // Today's cosmic context
  let moonData = null, cosmicSeason = null, cosmicChange = null;
  let cosmicWindows = [], significance = 0, mercuryRx = false, archetype = null;

  try { moonData = getMoonDataForDate(today); } catch (e) {}
  try { cosmicSeason = getCosmicSeason(chart, today); } catch (e) {}
  try { cosmicChange = getCosmicChangeToday(chart); } catch (e) {}
  try { cosmicWindows = getActiveCosmicWindows(chart, today).slice(0, 3); } catch (e) {}
  try { significance = calculateTransitSignificance(chart, today); } catch (e) {}
  try { mercuryRx = isMercuryRetrograde(today); } catch (e) {}
  try { archetype = getCosmicArchetype(chart); } catch (e) {}

  // Parse yesterday's journal mood from the prompt field
  let journalText = null, journalMood = null;
  if (yesterdayJournal) {
    journalText = yesterdayJournal.content ? yesterdayJournal.content.substring(0, 100) : null;
    try {
      const promptData = yesterdayJournal.prompt ? JSON.parse(yesterdayJournal.prompt) : null;
      journalMood = promptData?.mood || null;
    } catch (e) {}
  }

  return {
    yesterday: {
      forecastHeader: yesterdayForecast?.header || null,
      forecastMantra: yesterdayForecast?.mantra || null,
      journalText,
      journalMood,
      moonSign: (() => { try { return getMoonDataForDate(yesterday)?.sign || null; } catch { return null; } })(),
    },
    today: { moonData, cosmicChange, significance, cosmicWindows },
    season: cosmicSeason,
    archetype,
    mercuryRx,
  };
}

export function buildNarrativePromptBlock(ctx) {
  if (!ctx) return '';
  const lines = ['NARRATIVE CONTEXT (Weave naturally — never list these as bullet points):'];
  if (ctx.yesterday?.forecastHeader)
    lines.push(`- Yesterday's reading was: "${ctx.yesterday.forecastHeader}"`);
  if (ctx.yesterday?.journalText)
    lines.push(`- User journaled yesterday: "${ctx.yesterday.journalText}" (mood: ${ctx.yesterday.journalMood || 'unspecified'})`);
  if (ctx.season)
    lines.push(`- Cosmic Season: ${ctx.season.planet} is transiting their natal ${ctx.season.natalTarget} — ${ctx.season.progress}% through, ${ctx.season.daysRemaining} days remaining. ${ctx.season.isRetrograde ? 'Currently retrograde — revisiting themes.' : ''}`);
  if (ctx.archetype)
    lines.push(`- Their cosmic archetype: "${ctx.archetype.name}" (${ctx.archetype.rarity})`);
  if (ctx.mercuryRx)
    lines.push('- Mercury is currently retrograde');
  return lines.join('\n');
}

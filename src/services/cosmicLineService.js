import { loadObject, saveObject, StorageKeys } from './storage';
import { getTransitPlanets, getMoonDataForDate, getActiveCosmicWindows, isMercuryRetrograde } from './astrologyService';
import { generateCosmicNotificationBatch } from './geminiService';

const BATCH_SIZE = 7;
const REFILL_THRESHOLD = 2;

/**
 * Get a single AI-generated notification line for a specific date.
 */
export async function getCosmicLineForDate(dateStr) {
  const lines = (await loadObject(StorageKeys.AI_NOTIFICATION_LINES)) || [];
  return lines.find(l => l.date === dateStr) || null;
}

/**
 * Get all stored lines from today onwards, sorted by date.
 */
export async function getAllFutureCosmicLines() {
  const lines = (await loadObject(StorageKeys.AI_NOTIFICATION_LINES)) || [];
  const todayStr = new Date().toISOString().split('T')[0];
  return lines.filter(l => l.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check buffer and generate more lines if running low (< 2 future lines).
 * Returns true if generation occurred.
 */
export async function refillCosmicLinesIfNeeded(userProfile) {
  if (!userProfile?.chart?.planets) return false;

  const futureLines = await getAllFutureCosmicLines();
  if (futureLines.length >= REFILL_THRESHOLD) return false;

  return forceRefillCosmicLines(userProfile);
}

/**
 * Force-generate a new batch of AI cosmic lines.
 */
export async function forceRefillCosmicLines(userProfile) {
  if (!userProfile?.chart?.planets) return false;

  // Find dates that need lines (skip existing)
  const existingLines = await getAllFutureCosmicLines();
  const existingDates = new Set(existingLines.map(l => l.date));
  const dates = [];

  for (let i = 1; i <= BATCH_SIZE + 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    if (!existingDates.has(ds)) dates.push(d);
    if (dates.length >= BATCH_SIZE) break;
  }

  if (dates.length === 0) return false;

  // Build astrology context for each date (pure local math, no network)
  const dayContexts = dates.map(d => buildDayContext(d, userProfile));
  const astralSig = getAstralSignature(userProfile);

  console.log(`[CosmicLines] Generating ${dates.length} lines...`);

  const newLines = await generateCosmicNotificationBatch(astralSig, dayContexts);
  if (!newLines || newLines.length === 0) {
    console.warn('[CosmicLines] Generation returned no lines');
    return false;
  }

  await mergeAndSaveLines(newLines);
  console.log(`[CosmicLines] Generated ${newLines.length} lines`);
  return true;
}

// ── INTERNAL ────────────────────────────────────────────────

function buildDayContext(date, userProfile) {
  const moonData = getMoonDataForDate(date);
  const transits = getTransitPlanets(date);
  const cosmicWindows = userProfile?.chart
    ? getActiveCosmicWindows(userProfile.chart, date).slice(0, 3)
    : [];
  const mercuryRx = isMercuryRetrograde(date);

  return {
    date: date.toISOString().split('T')[0],
    moonData,
    transits,
    cosmicWindows,
    mercuryRx,
  };
}

function getAstralSignature(profile) {
  if (!profile?.chart?.planets) return 'Unknown Chart';
  const getSign = (name) => profile.chart.planets.find(p => p.name === name)?.sign || '?';
  return `Sun: ${getSign('Sun')}, Moon: ${getSign('Moon')}, Rising: ${getSign('Ascendant')}, Venus: ${getSign('Venus')}, Mars: ${getSign('Mars')}`;
}

async function mergeAndSaveLines(newLines) {
  const existing = (await loadObject(StorageKeys.AI_NOTIFICATION_LINES)) || [];
  const byDate = new Map(existing.map(l => [l.date, l]));

  for (const line of newLines) {
    byDate.set(line.date, { ...line, generatedAt: Date.now() });
  }

  // Prune lines older than 2 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const cleaned = [...byDate.values()]
    .filter(l => l.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  await saveObject(StorageKeys.AI_NOTIFICATION_LINES, cleaned);
}

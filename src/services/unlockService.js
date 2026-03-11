import { loadString, saveString, loadObject, saveObject, StorageKeys } from './storage';

// Planet unlock order — most interesting first (Big 3 free, then drip the rest)
const UNLOCK_ORDER = [
  // Day 0 (immediate): Sun, Moon, Ascendant — always unlocked
  // Day 1: Venus (love planet — high curiosity)
  'Venus',
  // Day 2: Mars (drive/sex — provocative)
  'Mars',
  // Day 3: Mercury (communication — relatable)
  'Mercury',
  // Day 4: Jupiter (luck/expansion — aspirational)
  'Jupiter',
  // Day 5: Saturn (challenges — tension hook)
  'Saturn',
  // Day 6: North Node (destiny — deep curiosity)
  'North Node',
  // Day 7: Midheaven (career calling — milestone unlock)
  'Midheaven',
  // Day 8: Neptune (dreams/illusions)
  'Neptune',
  // Day 9: Uranus (rebellion/change)
  'Uranus',
  // Day 10: Pluto (transformation — endgame)
  'Pluto',
  // Day 11: Chiron (wound — intimate reveal)
  'Chiron',
];

// Always unlocked from day 0
const FREE_PLACEMENTS = ['Sun', 'Moon', 'Ascendant'];

/**
 * Get the number of days since first app use.
 */
export async function getDaysSinceFirstUse() {
  let firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
  if (!firstUse) {
    firstUse = new Date().toISOString().split('T')[0];
    await saveString(StorageKeys.FIRST_USE_DATE, firstUse);
  }
  const start = new Date(firstUse + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

/**
 * Get all currently unlocked planet names.
 */
export async function getUnlockedPlanets() {
  const dayNum = await getDaysSinceFirstUse();
  const unlocked = [...FREE_PLACEMENTS];

  for (let i = 0; i < UNLOCK_ORDER.length && i < dayNum; i++) {
    unlocked.push(UNLOCK_ORDER[i]);
  }

  return unlocked;
}

/**
 * Check if a specific planet placement is unlocked.
 */
export async function isPlanetUnlocked(planetName) {
  if (FREE_PLACEMENTS.includes(planetName)) return true;
  if (planetName === 'South Node') return true; // skip — not shown
  const unlocked = await getUnlockedPlanets();
  return unlocked.includes(planetName);
}

/**
 * Get today's newly unlocked planet (if any).
 * Returns { planet, dayNum } or null.
 */
export async function getTodayUnlock() {
  const schedule = await loadObject(StorageKeys.UNLOCK_SCHEDULE) || {};
  const todayStr = new Date().toISOString().split('T')[0];

  // Already shown today's unlock
  if (schedule.lastShownDate === todayStr) return null;

  const dayNum = await getDaysSinceFirstUse();
  if (dayNum < 1 || dayNum > UNLOCK_ORDER.length) return null;

  const newPlanet = UNLOCK_ORDER[dayNum - 1];
  return { planet: newPlanet, dayNum };
}

/**
 * Mark today's unlock as shown.
 */
export async function markUnlockShown() {
  const todayStr = new Date().toISOString().split('T')[0];
  await saveObject(StorageKeys.UNLOCK_SCHEDULE, { lastShownDate: todayStr });
}

/**
 * Get unlock progress info.
 * Returns { unlocked, total, nextPlanet, nextUnlockDay, daysUntilNext }
 */
export async function getUnlockProgress() {
  const dayNum = await getDaysSinceFirstUse();
  const unlockedCount = FREE_PLACEMENTS.length + Math.min(dayNum, UNLOCK_ORDER.length);
  const total = FREE_PLACEMENTS.length + UNLOCK_ORDER.length;
  const nextIdx = dayNum; // 0-based index into UNLOCK_ORDER
  const nextPlanet = nextIdx < UNLOCK_ORDER.length ? UNLOCK_ORDER[nextIdx] : null;
  const daysUntilNext = nextPlanet ? 1 : 0; // always unlocks tomorrow if there's a next one

  return {
    unlocked: unlockedCount,
    total,
    nextPlanet,
    nextUnlockDay: dayNum + 1,
    daysUntilNext,
    isComplete: unlockedCount >= total,
    percentage: Math.round((unlockedCount / total) * 100),
  };
}

/**
 * Get the unlock day for a specific planet.
 */
export function getUnlockDayForPlanet(planetName) {
  if (FREE_PLACEMENTS.includes(planetName)) return 0;
  const idx = UNLOCK_ORDER.indexOf(planetName);
  return idx >= 0 ? idx + 1 : -1;
}

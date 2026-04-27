import { SIGN_ELEMENTS, SIGN_MODALITIES } from '../constants/AstrologyCore';

// Cosmic archetype based on element distribution
const ARCHETYPES = {
  'Fire-Fire': { name: 'The Blazing Pioneer', tagline: 'You lead with pure flame', rarity: 'Rare' },
  'Fire-Earth': { name: 'The Grounded Visionary', tagline: 'You dream with your feet on the ground', rarity: 'Uncommon' },
  'Fire-Air': { name: 'The Electric Catalyst', tagline: 'You ignite ideas everywhere you go', rarity: 'Uncommon' },
  'Fire-Water': { name: 'The Passionate Mystic', tagline: 'Your emotions fuel your power', rarity: 'Rare' },
  'Earth-Earth': { name: 'The Steady Builder', tagline: 'You create what others only imagine', rarity: 'Uncommon' },
  'Earth-Air': { name: 'The Practical Thinker', tagline: 'You solve with both logic and patience', rarity: 'Common' },
  'Earth-Water': { name: 'The Nurturing Architect', tagline: 'You build with feeling', rarity: 'Common' },
  'Air-Air': { name: 'The Infinite Mind', tagline: 'Your thoughts travel where others can\'t follow', rarity: 'Rare' },
  'Air-Water': { name: 'The Intuitive Communicator', tagline: 'You speak what others only sense', rarity: 'Uncommon' },
  'Water-Water': { name: 'The Deep Empath', tagline: 'You feel the world before it happens', rarity: 'Rare' },
};

const ELEMENT_GREETINGS = {
  Fire: ['Burning bright today', 'Your fire is showing', 'Igniting the day'],
  Earth: ['Grounded and powerful', 'Steady as the earth', 'Building something real'],
  Air: ['Mind in motion', 'Breathing ideas into life', 'Thoughts crystallizing'],
  Water: ['Flowing into clarity', 'Deep currents rising', 'Trust what you feel'],
};

/**
 * Get the dominant elements from a chart (Sun, Moon, Rising).
 */
function getDominantElements(chart) {
  if (!chart?.planets) return { primary: 'Fire', secondary: 'Water' };

  const sun = chart.planets.find(p => p.name === 'Sun');
  const moon = chart.planets.find(p => p.name === 'Moon');
  const rising = chart.planets.find(p => p.name === 'Ascendant');

  const counts = { Fire: 0, Earth: 0, Air: 0, Water: 0 };

  // Weight: Sun=3, Moon=2, Rising=2, other planets=1
  if (sun) counts[SIGN_ELEMENTS[sun.sign] || 'Fire'] += 3;
  if (moon) counts[SIGN_ELEMENTS[moon.sign] || 'Water'] += 2;
  if (rising) counts[SIGN_ELEMENTS[rising.sign] || 'Fire'] += 2;

  // Add other planets with weight 1
  for (const p of chart.planets) {
    if (['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(p.name)) {
      const el = SIGN_ELEMENTS[p.sign];
      if (el) counts[el] += 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], secondary: sorted[1][0], counts };
}

/**
 * Get the user's cosmic archetype.
 */
export function getCosmicArchetype(chart) {
  const { primary, secondary, counts } = getDominantElements(chart);

  // Normalize key (alphabetical order for lookup)
  const key1 = `${primary}-${secondary}`;
  const key2 = `${secondary}-${primary}`;
  const archetype = ARCHETYPES[key1] || ARCHETYPES[key2] || ARCHETYPES['Fire-Water'];

  // Calculate combination rarity (how unusual is this Big 3 element spread?)
  // 12 signs × 12 signs × 12 signs = 1728 combos, ~144 per element combo
  const totalPlanets = Object.values(counts).reduce((a, b) => a + b, 0);
  const dominanceRatio = Math.round((counts[primary] / totalPlanets) * 100);

  return {
    ...archetype,
    primaryElement: primary,
    secondaryElement: secondary,
    elementCounts: counts,
    dominanceRatio,
  };
}

/**
 * Get an element-based greeting for today.
 */
export function getElementGreeting(chart) {
  const { primary } = getDominantElements(chart);
  const greetings = ELEMENT_GREETINGS[primary] || ELEMENT_GREETINGS.Fire;
  // Rotate based on day of week
  const dayIdx = new Date().getDay();
  return greetings[dayIdx % greetings.length];
}

/**
 * Get the Big 3 combination rarity percentage.
 * Sun sign (1/12) × Moon sign (1/12) × Rising sign (1/12) = ~0.06% chance
 * But we simplify to "1 in X people" for display.
 */
export function getComboRarity(chart) {
  if (!chart?.planets) return null;
  const sun = chart.planets.find(p => p.name === 'Sun')?.sign;
  const moon = chart.planets.find(p => p.name === 'Moon')?.sign;
  const rising = chart.planets.find(p => p.name === 'Ascendant')?.sign;

  if (!sun || !moon || !rising) return null;

  // Same sign across 2+ of Big 3 is rarer
  const sameCount = [sun, moon, rising].filter(s => s === sun).length;

  if (sameCount === 3) return { text: '1 in 1,728', label: 'Extremely Rare' };
  if (sameCount === 2) return { text: '1 in 144', label: 'Very Rare' };
  return { text: '1 in 1,728', label: 'Unique' };
}

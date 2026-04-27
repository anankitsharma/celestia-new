import { loadString, saveString } from './storage';

const FIRST_USE_KEY = 'celestia_first_use_date';

// House domain themes
const HOUSE_THEMES = {
  1: 'identity', 2: 'resources', 3: 'communication', 4: 'home',
  5: 'creativity', 6: 'health', 7: 'relationships', 8: 'transformation',
  9: 'wisdom', 10: 'ambition', 11: 'community', 12: 'intuition',
};

// Aspect interpretive themes
const ASPECT_THEMES = {
  conjunction: 'merging energies',
  sextile: 'opportunity',
  square: 'creative tension',
  trine: 'flowing harmony',
  opposition: 'balancing opposites',
};

// Ordinal helper
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Pick a random element from an array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fallback whispers when no chart is available
const FALLBACK_WHISPERS = [
  'Something quiet is asking for your attention today. Stay open.',
  'Your intuition is unusually sharp today. Trust the first thought.',
  'Something beautiful is being built in the background of your life.',
  'Pay attention to dreams tonight. A message is waiting.',
];

// --- Chart-aware whisper generators ---

function generateCommonWhisper(chart) {
  const planet = pick(chart.planets);
  if (!planet) return pick(FALLBACK_WHISPERS);

  const house = planet.house || null;
  const theme = house ? HOUSE_THEMES[house] || 'inner growth' : 'inner growth';

  const templates = [
    `Your ${planet.name} in ${planet.sign} is whispering: trust your ${theme} instincts today.`,
    `With ${planet.name} in your ${ordinal(planet.house)} house, your ${theme} sense is heightened.`,
    `${planet.name} in ${planet.sign} stirs quietly. Listen to what your ${theme} instinct is telling you.`,
    `The placement of ${planet.name} in your ${ordinal(planet.house)} house is activated today — lean into ${theme}.`,
    `Your ${planet.sign} ${planet.name} asks you to honor your ${theme} side today.`,
    `Something about your ${planet.name} placement wants your attention. ${theme.charAt(0).toUpperCase() + theme.slice(1)} matters now.`,
  ];

  return pick(templates);
}

function generateRareWhisper(chart) {
  // Prefer retrograde planets if any
  const retrogrades = (chart.planets || []).filter(p => p.isRetrograde);
  if (retrogrades.length > 0) {
    const rp = pick(retrogrades);
    const theme = rp.house ? HOUSE_THEMES[rp.house] || 'past lessons' : 'past lessons';
    const templates = [
      `${rp.name} retrograde in your chart means old ${theme} patterns are revisiting. Resolve what you can.`,
      `Your retrograde ${rp.name} in ${rp.sign} is stirring. Unfinished ${theme} business seeks closure.`,
    ];
    return pick(templates);
  }

  // Fall back to aspects
  if (chart.aspects && chart.aspects.length > 0) {
    const aspect = pick(chart.aspects);
    const theme = ASPECT_THEMES[aspect.type] || 'subtle energy';
    return `Your ${aspect.planet1}–${aspect.planet2} ${aspect.type} is activating. Pay attention to ${theme}.`;
  }

  // If no aspects or retrogrades, use a chart-specific common whisper
  return generateCommonWhisper(chart);
}

function generateUltraRareWhisper(chart) {
  const planets = chart.planets || [];

  // Check for stellium (3+ planets in one sign)
  const signCounts = {};
  planets.forEach(p => {
    if (p.sign) {
      signCounts[p.sign] = (signCounts[p.sign] || 0) + 1;
    }
  });
  const stelliumSign = Object.entries(signCounts).find(([, count]) => count >= 3);
  if (stelliumSign) {
    return `You carry a stellium in ${stelliumSign[0]} — concentrated cosmic power in your chart. Few have this.`;
  }

  // Check for grand trine (three mutual trines)
  if (chart.aspects && chart.aspects.length > 0) {
    const trines = chart.aspects.filter(a => a.type === 'trine');
    if (trines.length >= 3) {
      // Check if any three planets form a closed triangle
      const trinePlanets = new Set();
      trines.forEach(t => { trinePlanets.add(t.planet1); trinePlanets.add(t.planet2); });
      for (const p1 of trinePlanets) {
        for (const p2 of trinePlanets) {
          if (p1 >= p2) continue;
          for (const p3 of trinePlanets) {
            if (p2 >= p3) continue;
            const has12 = trines.some(t => (t.planet1 === p1 && t.planet2 === p2) || (t.planet1 === p2 && t.planet2 === p1));
            const has23 = trines.some(t => (t.planet1 === p2 && t.planet2 === p3) || (t.planet1 === p3 && t.planet2 === p2));
            const has13 = trines.some(t => (t.planet1 === p1 && t.planet2 === p3) || (t.planet1 === p3 && t.planet2 === p1));
            if (has12 && has23 && has13) {
              return `Your chart holds a Grand Trine between ${p1}, ${p2}, and ${p3} — a rare gift of effortless flow.`;
            }
          }
        }
      }
    }

    // Check for T-square (two squares + one opposition)
    const squares = chart.aspects.filter(a => a.type === 'square');
    const oppositions = chart.aspects.filter(a => a.type === 'opposition');
    if (squares.length >= 2 && oppositions.length >= 1) {
      for (const opp of oppositions) {
        for (const sq1 of squares) {
          for (const sq2 of squares) {
            if (sq1 === sq2) continue;
            const oppPlanets = [opp.planet1, opp.planet2];
            const sq1Planets = [sq1.planet1, sq1.planet2];
            const sq2Planets = [sq2.planet1, sq2.planet2];
            // The apex planet squares both ends of the opposition
            const apex1 = sq1Planets.find(p => !oppPlanets.includes(p));
            const apex2 = sq2Planets.find(p => !oppPlanets.includes(p));
            if (apex1 && apex1 === apex2 &&
                sq1Planets.some(p => oppPlanets.includes(p)) &&
                sq2Planets.some(p => oppPlanets.includes(p))) {
              return `Your chart contains a T-Square with ${apex1} at the apex — a powerful engine of drive and ambition.`;
            }
          }
        }
      }
    }
  }

  // Check for critical degrees (0° or 29°)
  const criticalPlanet = planets.find(p => {
    if (p.degree === undefined && p.longitude === undefined) return false;
    const deg = p.degree !== undefined ? p.degree : (p.longitude % 30);
    return deg < 1 || deg >= 29;
  });
  if (criticalPlanet) {
    const degVal = criticalPlanet.degree !== undefined ? criticalPlanet.degree : (criticalPlanet.longitude % 30);
    const label = degVal < 1 ? 'at 0° — a point of pure beginning' : 'at 29° — a point of completion and mastery';
    return `Your ${criticalPlanet.name} in ${criticalPlanet.sign} sits ${label}. This is a rare and powerful placement.`;
  }

  // Meaningful fallback using actual chart data
  const planet = pick(planets);
  const theme = planet.house ? HOUSE_THEMES[planet.house] || 'purpose' : 'purpose';
  return `The cosmos encoded something rare in your chart. Your ${planet.name} in ${planet.sign} holds a key to your deepest ${theme}.`;
}

// Variable rate based on days since first use
function getWhisperRate(daysSinceFirstUse) {
  if (daysSinceFirstUse <= 7) return 0.05;
  if (daysSinceFirstUse <= 14) return 0.15;
  if (daysSinceFirstUse <= 21) return 0.10;
  return 0.20;
}

async function getDaysSinceFirstUse() {
  const firstUse = await loadString(FIRST_USE_KEY);
  if (!firstUse) return 0;
  const diff = Date.now() - new Date(firstUse).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function getCosmicWhisper(chart) {
  const days = await getDaysSinceFirstUse();
  const rate = getWhisperRate(days);

  if (Math.random() >= rate) return null;

  // Tiered rarity selection
  const roll = Math.random();
  let message;
  let rarity;

  const hasChart = chart && chart.planets && chart.planets.length > 0;

  if (roll < 0.005) {
    rarity = 'Ultra Rare';
    message = hasChart ? generateUltraRareWhisper(chart) : pick(FALLBACK_WHISPERS);
  } else if (roll < 0.035) {
    rarity = 'Rare';
    message = hasChart ? generateRareWhisper(chart) : pick(FALLBACK_WHISPERS);
  } else {
    rarity = null;
    message = hasChart ? generateCommonWhisper(chart) : pick(FALLBACK_WHISPERS);
  }

  return { message, rarity };
}

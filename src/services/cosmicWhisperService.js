import { loadString, saveString } from './storage';

const FIRST_USE_KEY = 'celestia_first_use_date';

// Whisper pools with rarity tiers
const WHISPERS = {
  common: [
    'Your intuition is unusually sharp today. Trust the first thought.',
    'Someone is thinking about you right now. The cosmos confirms it.',
    'A door you thought was closed is quietly reopening.',
    'The universe is rearranging things in your favor. Be patient.',
    'Your energy is magnetic today. Others feel it before you do.',
    'A creative breakthrough is closer than you think.',
    'The cosmos whispers: Let go of what no longer serves you.',
    'Something beautiful is being built in the background of your life.',
    'Pay attention to dreams tonight. A message is waiting.',
    'The person you need to meet is already on their way.',
    'Your next chapter starts with the decision you keep putting off.',
    'The stars say: You are exactly where you need to be.',
  ],
  rare: [
    'A past connection will resurface this week. The timing is deliberate.',
    'The cosmos is preparing a surprise. Keep your schedule open.',
    'Your chart says today holds a hidden turning point. Stay present.',
    'An unexpected message is coming. It will shift your perspective.',
    'The stars have aligned a rare window for you. Move boldly.',
    'Someone from your past is about to re-enter your story.',
  ],
  ultraRare: [
    'The cosmos reveals: You carry a rare cosmic signature. Only 1 in 500 charts have this pattern.',
    'A once-in-a-decade transit is touching your chart. This moment matters more than you know.',
    'The universe has been waiting for you to notice this: you are becoming who you were always meant to be.',
  ],
};

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

export async function getCosmicWhisper() {
  const days = await getDaysSinceFirstUse();
  const rate = getWhisperRate(days);

  if (Math.random() >= rate) return null;

  // Tiered rarity selection
  const roll = Math.random();
  let pool;
  let rarity;

  if (roll < 0.005) {
    pool = WHISPERS.ultraRare;
    rarity = 'Ultra Rare';
  } else if (roll < 0.035) {
    pool = WHISPERS.rare;
    rarity = 'Rare';
  } else {
    pool = WHISPERS.common;
    rarity = null;
  }

  const message = pool[Math.floor(Math.random() * pool.length)];
  return { message, rarity };
}

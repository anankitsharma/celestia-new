export const LEVELS = [
  { level: 1, name: 'Starling',      threshold: 0,     ringColor: 'rgba(200,168,75,0.3)' },
  { level: 2, name: 'Constellation', threshold: 100,   ringColor: 'rgba(200,168,75,0.5)' },
  { level: 3, name: 'Nebula',        threshold: 500,   ringColor: 'rgba(200,168,75,0.7)' },
  { level: 4, name: 'Galaxy',        threshold: 2000,  ringColor: 'rgba(200,168,75,0.85)' },
  { level: 5, name: 'Cosmos',        threshold: 10000, ringColor: '#C8A84B' },
];

export const XP_ACTIONS = {
  daily_check_in: 10,
  journal_entry: 20,
  report_read: 15,
  chat_message: 5,
  share: 25,
  deep_dive: 10,
  compatibility_check: 15,
};

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? (xp - current.threshold) / (next.threshold - current.threshold)
    : 1;
  return { current, next, progress: Math.min(1, Math.max(0, progress)), xp };
}

import { loadObject, saveObject } from './storage';

const QUEST_KEY = 'celestia_daily_quests';

// Quest definitions — each has an id, label, action description, and check key
const QUEST_POOL = [
  { id: 'read_forecast', label: 'Read your full forecast', icon: '☉', checkKey: 'forecast_read' },
  { id: 'journal', label: 'Write in your cosmic journal', icon: '✍', checkKey: 'journal_written' },
  { id: 'deep_dive', label: 'Deep dive into a placement', icon: '🌊', checkKey: 'deep_dive_done' },
  { id: 'chat', label: 'Ask Celestia a question', icon: '☽', checkKey: 'chat_sent' },
  { id: 'share', label: 'Share your reading', icon: '↗', checkKey: 'shared' },
  { id: 'check_transits', label: 'Check today\'s sky', icon: '✧', checkKey: 'transits_checked' },
  { id: 'compatibility', label: 'Check a compatibility match', icon: '♡', checkKey: 'compat_checked' },
  { id: 'energy_grid', label: 'Explore your energy grid', icon: '◎', checkKey: 'energy_explored' },
];

// Deterministic daily shuffle using date as seed
function seededShuffle(arr, seed) {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getDateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Get today's 3 quests (always includes read_forecast)
export async function getTodayQuests() {
  const todayStr = new Date().toISOString().split('T')[0];
  const data = await loadObject(QUEST_KEY) || {};

  // Return cached if same day
  if (data.date === todayStr && data.quests) {
    return data;
  }

  // Generate new quests for today
  const seed = getDateSeed();
  const optional = QUEST_POOL.filter(q => q.id !== 'read_forecast');
  const shuffled = seededShuffle(optional, seed);

  const quests = [
    { ...QUEST_POOL.find(q => q.id === 'read_forecast'), completed: false },
    { ...shuffled[0], completed: false },
    { ...shuffled[1], completed: false },
  ];

  const newData = {
    date: todayStr,
    quests,
    allComplete: false,
    weeklyCount: data.date !== todayStr ? (data.weeklyCount || 0) : data.weeklyCount,
    weekStart: data.weekStart || todayStr,
  };

  // Reset weekly count on Monday
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 1 && data.date !== todayStr) {
    newData.weeklyCount = 0;
    newData.weekStart = todayStr;
  }

  await saveObject(QUEST_KEY, newData);
  return newData;
}

// Mark a quest action as complete
export async function completeQuestAction(checkKey) {
  const todayStr = new Date().toISOString().split('T')[0];
  const data = await loadObject(QUEST_KEY) || {};

  if (data.date !== todayStr || !data.quests) return null;

  let changed = false;
  data.quests = data.quests.map(q => {
    if (q.checkKey === checkKey && !q.completed) {
      changed = true;
      return { ...q, completed: true };
    }
    return q;
  });

  if (!changed) return null;

  const allComplete = data.quests.every(q => q.completed);
  const wasAlreadyComplete = data.allComplete;
  data.allComplete = allComplete;

  // Track daily completion for weekly bonus
  if (allComplete && !wasAlreadyComplete) {
    data.weeklyCount = (data.weeklyCount || 0) + 1;
  }

  await saveObject(QUEST_KEY, data);

  return {
    quests: data.quests,
    allComplete,
    justCompleted: allComplete && !wasAlreadyComplete,
    weeklyCount: data.weeklyCount || 0,
  };
}

// Get weekly quest completion count
export async function getWeeklyQuestCount() {
  const data = await loadObject(QUEST_KEY) || {};
  return data.weeklyCount || 0;
}

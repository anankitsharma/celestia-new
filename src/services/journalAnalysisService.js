import { JournalRepository } from './database/rep_journal';

// Lightweight journal analysis. Server-free; runs locally over the user's
// own SQLite entries. Used to inject grounded chat-suggestion chips on Home,
// turning journal investment into a return-trigger (Hook Model: investment
// loads next trigger).

// Indecision phrases worth surfacing as chat suggestions. Order matters —
// earlier patterns are preferred when multiple appear.
const INDECISION_PATTERNS = [
  /\b(should i|should we)\b[^.!?\n]{0,140}/i,
  /\b(i don'?t know (if|whether|what|how))\b[^.!?\n]{0,140}/i,
  /\b(what should i)\b[^.!?\n]{0,140}/i,
  /\b(torn between|stuck between)\b[^.!?\n]{0,140}/i,
  /\b(can'?t decide)\b[^.!?\n]{0,140}/i,
  /\b(not sure (if|whether|what|how))\b[^.!?\n]{0,140}/i,
];

/**
 * Scan recent journal entries for an indecision phrase.
 * Returns the most recent matched phrase (trimmed, capped) or null.
 *
 * @param {string} profileId
 * @param {number} days  How many days back to scan (default 14).
 * @param {number} maxLen Cap on returned phrase length (default 110).
 */
export async function detectIndecisionPhrase(profileId, days = 14, maxLen = 110) {
  if (!profileId) return null;
  let entries;
  try {
    entries = await JournalRepository.getAllEntries(profileId, 30);
  } catch {
    return null;
  }
  if (!entries || entries.length === 0) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  // Newest-first scan (getAllEntries returns DESC date); first match wins.
  for (const entry of entries) {
    const entryDate = new Date((entry.date || '') + 'T00:00:00');
    if (isNaN(entryDate.getTime()) || entryDate < cutoff) continue;
    const text = (entry.content || '').trim();
    if (!text) continue;
    for (const pattern of INDECISION_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[0]) {
        let phrase = match[0].trim().replace(/\s+/g, ' ');
        if (phrase.length > maxLen) phrase = phrase.slice(0, maxLen - 1).trim() + '…';
        return { phrase, date: entry.date };
      }
    }
  }

  return null;
}

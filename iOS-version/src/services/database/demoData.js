// V1.2 — Demo data loader for App Store screenshot capture.
//
// Exposed only behind __DEV__ in ProfileScreen → "Fill Demo Data". Stripped from
// EAS production binaries because __DEV__ === false in release builds. Apple
// never sees this code path.
//
// Why it exists: capturing 6 App Store screenshots from a real onboarding flow
// is slow and produces inconsistent data across sessions. This seeder gives
// every screenshot capture identical, vetted, psychology-led content.
//
// Compliance posture: every string here was audited against the
// V1_LANGUAGE_OVERRIDE rules used by geminiService — no astrology vocabulary,
// no celebrity names, no markdown. Safe for screenshots that get submitted
// to App Review.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateChart } from '../astrologyService';
import { cancelAllNotifications } from '../notificationService';
import { getDB } from './client';
import { ProfileRepository } from './rep_profiles';
import { ChatRepository } from './rep_chats';
import { JournalRepository } from './rep_journal';
import { saveBoolean, saveObject, StorageKeys } from '../storage';

// ── Fixtures ────────────────────────────────────────────────────────────────
// Names + DOBs picked for: photogenic chart output, no celebrity collision,
// cross-cultural spread (proves the 8-relationship-type breadth without
// tokenizing). Locations are pre-resolved so the demo runs offline (no
// Nominatim call needed).

const USER = {
  name: 'Sasha',
  birthDate: '1992-08-14',
  birthTime: '18:30',
  birthLocation: { lat: 40.7128, lng: -74.006, name: 'New York, NY, USA' },
};

const CONNECTIONS = [
  {
    name: 'Maya',
    relationshipType: 'partner',
    birthDate: '1990-03-22',
    birthTime: '07:15',
    birthLocation: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA, USA' },
  },
  {
    name: 'Daniel',
    relationshipType: 'friend',
    birthDate: '1988-11-08',
    birthTime: '21:40',
    birthLocation: { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL, USA' },
  },
  {
    name: 'Priya',
    relationshipType: 'parent',
    birthDate: '1962-05-15',
    birthTime: '10:00',
    birthLocation: { lat: 19.076, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
  },
];

// Real prompts from JournalScreen.js PROMPTS, paired with first-person replies
// that read as a thoughtful user voicing relational tensions. dayOffset === 0
// is today; -1 is yesterday; etc.
const JOURNAL_FIXTURES = [
  {
    dayOffset: 0,
    prompt: 'What truth are you avoiding?',
    content:
      "The chemistry is real but the consistency isn't. I think I already know what I need to do.",
  },
  {
    dayOffset: -1,
    prompt: 'What patterns are you noticing in your life?',
    content:
      "I freeze when someone gets close. Then they leave, and I'm both relieved and devastated.",
  },
  {
    dayOffset: -2,
    prompt: 'What boundary do you need to set or honor?',
    content:
      "Saying no to a Sunday call from work without explaining myself afterward.",
  },
  {
    dayOffset: -3,
    prompt: 'What would courage look like for you today?',
    content: "Asking for what I want without softening it three times first.",
  },
  {
    dayOffset: -4,
    prompt: 'What is your gut telling you that your head keeps overruling?',
    content:
      "That this isn't the right fit. I keep talking myself out of seeing it.",
  },
];

// Pre-baked chat exchange. Saves a real Gemini call from being made during
// screenshot capture, and locks in the exact AI tone we want shown to Apple.
// Audited: psychology-led, no astrology vocabulary, no markdown, plain text.
const CHAT_FIXTURE = {
  title: 'Shutting down when things get real',
  userMessage:
    'Why do I always shut down right when things start getting real with someone?',
  aiReply:
    "Shutting down is a regulation strategy, not a flaw. When intimacy ramps up, your nervous system reads it as risk — closeness has cost you something before — so it pulls the shutters down to keep you safe. The work isn't to stop shutting down on command. It's to notice the moment your shoulders go quiet and your replies get shorter, and tell the person you trust that's what's happening. \"I'm getting overwhelmed\" is the bridge that keeps closeness from feeling like a threat.",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const isoDateNDaysAgo = (offsetDays) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const buildProfile = (fixture, type) => {
  const id = type === 'self' ? 'demo_self' : `demo_${fixture.name.toLowerCase()}`;
  const chart = calculateChart(
    fixture.birthDate,
    fixture.birthTime,
    fixture.birthLocation,
    false,
    type === 'self' ? 'Placidus' : 'whole'
  );
  return {
    id,
    name: fixture.name,
    type,
    gender: null,
    birthDate: fixture.birthDate,
    birthTime: fixture.birthTime,
    birthLocation: fixture.birthLocation,
    isTimeUnknown: false,
    relationshipType: fixture.relationshipType,
    chart,
  };
};

// ── Public API ──────────────────────────────────────────────────────────────

// Tables wiped during demo reset, in dependency order (children before parents)
// so the DELETE pass runs cleanly even with FKs still defined on disk.
const TABLES_TO_WIPE = [
  'chat_messages',
  'chat_sessions',
  'forecasts',
  'reports',
  'journal_entries',
  'charts',
  'profiles',
  'achievements',
  'user_xp',
  'user_streaks',
];

export const loadDemoData = async () => {
  console.log('[DemoData] Starting full reset + seed…');

  // 1. Cancel all iOS-scheduled notifications. These survive AsyncStorage.clear
  //    and the SQLite wipe because they live in the OS notification queue, not
  //    in app storage. Without this, reminders for the previous user could
  //    still fire after the demo content loads.
  try {
    await cancelAllNotifications();
    console.log('[DemoData] Cancelled all scheduled notifications.');
  } catch (e) {
    console.warn('[DemoData] Notification cancel failed (non-fatal):', e?.message);
  }

  // 2. Clear AsyncStorage (settings, counters, caches). Done early so any
  //    in-flight code that re-reads AsyncStorage after this point sees an
  //    empty slate.
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.warn('[DemoData] AsyncStorage clear failed (non-fatal):', e?.message);
  }

  // 3. SQLite reset under PRAGMA foreign_keys = OFF, kept off through the
  //    seed below. Why: while we're wiping/seeding, other parts of the app
  //    (geminiService retries, forecast cache writes) may resolve and try to
  //    persist rows referencing the old profile_id. With FK ON, those writes
  //    fail with "FOREIGN KEY constraint failed" and pollute the logs. With
  //    FK OFF, the write either lands harmlessly or no-ops; we re-enable FKs
  //    at the end so normal app behavior resumes.
  //
  //    We also DELETE FROM rather than DROP TABLE so concurrent reads don't
  //    see "no such table" mid-reset.
  const db = await getDB();
  await db.runAsync('PRAGMA foreign_keys = OFF;');

  try {
    await db.withTransactionAsync(async () => {
      for (const t of TABLES_TO_WIPE) {
        try {
          await db.runAsync(`DELETE FROM ${t};`);
        } catch (e) {
          // Table may not exist on a fresh install where the schema hasn't
          // run yet; ignore and continue.
          console.warn(`[DemoData] DELETE FROM ${t} skipped:`, e?.message);
        }
      }
    });
    console.log('[DemoData] Existing data wiped.');

    // 3a. Verify wipe — query counts to confirm every table is empty before
    //     we seed. If any has lingering rows, log a warning so we can debug.
    //     This is defensive instrumentation; doesn't block the seed.
    for (const t of TABLES_TO_WIPE) {
      try {
        const row = await db.getFirstAsync(`SELECT COUNT(*) as c FROM ${t};`);
        if (row?.c > 0) {
          console.warn(`[DemoData] ${t} still has ${row.c} row(s) after wipe.`);
        }
      } catch (e) { /* table may not exist; ignore */ }
    }

    // 3. User profile + chart
    console.log('[DemoData] Building user profile…');
    const userProfile = buildProfile(USER, 'self');
    await ProfileRepository.saveProfile(userProfile);

    // 4. Onboarding-derived AsyncStorage keys.
    // motivation/painPoint/depth: chosen for the "Self-Aware Anxious"
    // attachment label which is the most flattering First-Hit copy.
    await saveBoolean(StorageKeys.ONBOARDING_COMPLETED, true);
    await saveObject(StorageKeys.USER_PROFILE, {
      ...userProfile,
      motivation: 'unavailable',
      painPoint: 'shut_down',
      depth: 'aware',
    });
    // Persona prefs key that finishOnboarding normally writes — drives chat
    // tone. Seeding it here keeps the demo's AI replies in the same voice
    // a real user would get.
    await saveObject('celestia_persona_prefs', {
      motivation: 'unavailable',
      painPoint: 'shut_down',
      depth: 'aware',
    });
    await saveBoolean('celestia_show_astrology_v1', false);
    // Demo profile is real (not the X-skip placeholder) — explicitly clear
    // the placeholder flag so SetupRequiredState empty states don't show.
    await saveBoolean('celestia_profile_is_placeholder', false);

    // V1.2 — Seed partner-touched timestamps so the Home drift-alert shows
    // sensible values on the demo. Maya (recently touched), Daniel (1 week ago),
    // Priya (4 weeks ago — triggers a calm "drift" alert with Priya without
    // showing an alarming "n weeks" number for the screenshot). Without this,
    // unset timestamps fall through to the now-clamped zero-age path and the
    // alert wouldn't fire at all on demo data.
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    await saveObject('celestia_partner_touched_v1', {
      [`demo_${CONNECTIONS[0].name.toLowerCase()}`]: now - 1 * dayMs,    // Maya — yesterday
      [`demo_${CONNECTIONS[1].name.toLowerCase()}`]: now - 7 * dayMs,    // Daniel — last week
      [`demo_${CONNECTIONS[2].name.toLowerCase()}`]: now - 28 * dayMs,   // Priya — 4 weeks ago (triggers drift alert)
    });

    // 5. Connections
    console.log('[DemoData] Building connections…');
    for (const conn of CONNECTIONS) {
      const partnerProfile = buildProfile(conn, 'other');
      await ProfileRepository.saveProfile(partnerProfile);
    }

    // 6. Journal entries (5 days, real prompts)
    console.log('[DemoData] Writing journal entries…');
    for (const j of JOURNAL_FIXTURES) {
      const date = isoDateNDaysAgo(j.dayOffset);
      await JournalRepository.saveEntry(userProfile.id, date, j.content, j.prompt);
    }

    // 7. Chat session (1 user message + 1 pre-baked AI reply, no live Gemini call)
    console.log('[DemoData] Seeding chat session…');
    const session = await ChatRepository.createSession(CHAT_FIXTURE.title, null);
    // Role string is 'model' (not 'assistant') — Gemini API + ChatScreen render
    // both expect 'user' | 'model'. Using 'assistant' breaks the next reply.
    await ChatRepository.addMessage(session.id, 'user', CHAT_FIXTURE.userMessage);
    await ChatRepository.addMessage(session.id, 'model', CHAT_FIXTURE.aiReply);

    // 8. Final verification — count rows in key tables to confirm the seed
    //    landed correctly. Output is visible in dev logs only.
    try {
      const counts = {};
      for (const t of ['profiles', 'charts', 'journal_entries', 'chat_messages']) {
        const r = await db.getFirstAsync(`SELECT COUNT(*) as c FROM ${t};`);
        counts[t] = r?.c ?? 0;
      }
      console.log('[DemoData] Post-seed row counts:', counts);
    } catch (e) {
      console.warn('[DemoData] Post-seed count failed (non-fatal):', e?.message);
    }

    console.log('[DemoData] Seed complete.');
    return {
      userId: userProfile.id,
      connectionCount: CONNECTIONS.length,
      journalCount: JOURNAL_FIXTURES.length,
      chatSessionId: session.id,
    };
  } finally {
    // Restore normal FK enforcement, even if seed failed mid-way.
    try {
      await db.runAsync('PRAGMA foreign_keys = ON;');
    } catch (e) {
      console.warn('[DemoData] FK re-enable failed:', e?.message);
    }
  }
};

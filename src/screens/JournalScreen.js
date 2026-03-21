import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Platform, StatusBar, KeyboardAvoidingView, Alert, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMoonDataForDate, getTransitPlanets, captureCosmicSnapshot } from '../services/astrologyService';
import { JournalRepository } from '../services/database/rep_journal';
import { loadObject, saveObject } from '../services/storage';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { trackEvent } from '../services/achievementService';
import { recordDailyCheckIn } from '../services/streakService';
import { haptic } from '../services/hapticService';

const JOURNAL_KEY = 'celestia_journal_entries';

const PLANET_GLYPHS = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

const MOON_PHASE_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

const MOODS = [
  { key: 'great', emoji: '😊', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'low', emoji: '😔', label: 'Low' },
  { key: 'anxious', emoji: '😰', label: 'Anxious' },
];

const TAGS = [
  { key: 'love', icon: '♡', label: 'Love', color: '#E85090' },
  { key: 'career', icon: '◆', label: 'Career', color: '#5090E8' },
  { key: 'growth', icon: '◎', label: 'Growth', color: '#F59E0B' },
  { key: 'health', icon: '✦', label: 'Health', color: '#50C878' },
  { key: 'dreams', icon: '☽', label: 'Dreams', color: '#8B5CF6' },
  { key: 'gratitude', icon: '✧', label: 'Gratitude', color: '#C8A84B' },
];

const PROMPTS = [
  "What is the universe trying to teach you right now?",
  "What are you holding onto that no longer serves you?",
  "What would courage look like for you today?",
  "What are you grateful for in this moment?",
  "What patterns are you noticing in your life?",
  "What does your intuition want you to know?",
  "What boundary do you need to set or honor?",
  "What would you tell your past self about today?",
  "Where do you feel most alive right now?",
  "What truth are you avoiding?",
];

export default function JournalScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { userProfile } = useUserProfile();
  const [journalText, setJournalText] = useState('');
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [saved, setSaved] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);
  const [moonData, setMoonData] = useState(null);
  const [planets, setPlanets] = useState([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const textRef = useRef(null);
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Get the mantra from route params if passed
  const passedMantra = route?.params?.mantra;

  const allPrompts = passedMantra ? [passedMantra, ...PROMPTS] : PROMPTS;

  useEffect(() => {
    // Load sky data
    const moon = getMoonDataForDate(today);
    setMoonData(moon);
    const tp = getTransitPlanets(today);
    setPlanets(tp.slice(0, 5));

    // Load existing entry
    loadExisting();

    // Random prompt
    if (!passedMantra) {
      setPromptIndex(Math.floor(Math.random() * PROMPTS.length));
    }
  }, []);

  const loadExisting = async () => {
    try {
      const profileId = userProfile?.id || 'default';
      const entry = await JournalRepository.getEntry(profileId, dateStr);
      if (entry) {
        setJournalText(entry.content || '');
        setSaved(true);
        setExistingEntry(entry);
        // Restore metadata
        try {
          const meta = JSON.parse(entry.prompt || '{}');
          if (meta.mood) setMood(meta.mood);
          if (meta.energy) setEnergy(meta.energy);
        } catch (e) {}
        // Restore tags
        try {
          const tags = JSON.parse(entry.tags || '[]');
          if (Array.isArray(tags)) setSelectedTags(tags);
        } catch (e) {}
      }
    } catch (e) {}
  };

  const toggleTag = (key) => {
    setSelectedTags(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  };

  const save = async () => {
    if (!journalText.trim()) return;
    haptic.success();
    try {
      const profileId = userProfile?.id || 'default';

      // Capture cosmic snapshot at the moment of saving
      const snapshot = captureCosmicSnapshot(userProfile?.chart || null);

      // Build metadata
      const prompt = JSON.stringify({
        mantra: allPrompts[promptIndex] || '',
        mood,
        energy,
      });

      // Save to AsyncStorage (legacy compat)
      const entries = await loadObject(JOURNAL_KEY) || {};
      entries[dateStr] = journalText.trim();
      await saveObject(JOURNAL_KEY, entries);

      // Save to SQLite with cosmic snapshot + tags
      await JournalRepository.saveEntry(
        profileId, dateStr, journalText.trim(), prompt, snapshot,
        selectedTags.length > 0 ? selectedTags : null
      );

      setSaved(true);

      // XP
      const xp = await awardXP(profileId, 'journal_entry');
      // Quest
      completeQuestAction('journal_written').catch(() => {});
      // Streak
      await recordDailyCheckIn(profileId);
      // Track
      trackEvent('journal').catch(() => {});

      Alert.alert(
        'Saved with cosmic imprint',
        `Your entry has been saved with the sky at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.error('Journal save error:', e);
      Alert.alert('Error', 'Could not save your entry. Please try again.');
    }
  };

  const moonIcon = MOON_PHASE_ICONS[moonData?.phaseName] || '🌘';
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Hero ── */}
        <LinearGradient colors={['#0E0E22', '#14102A', '#0E1628']}
          style={styles.hero}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backBtn}>‹ Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('JournalHistory')}>
              <Text style={styles.historyBtn}>History →</Text>
            </TouchableOpacity>
          </View>

          {/* Date */}
          <Text style={styles.heroDate}>{dayName}, {monthName} {today.getDate()}</Text>
          <Text style={styles.heroTitle}>Cosmic Journal</Text>

          {/* Live sky strip */}
          <View style={styles.skyStrip}>
            <View style={styles.skyItem}>
              <Text style={styles.skyEmoji}>{moonIcon}</Text>
              <Text style={styles.skyText}>{moonData?.phaseName || 'Moon'} in {moonData?.sign || '—'}</Text>
            </View>
            <View style={styles.skyDivider} />
            {planets.slice(0, 3).map((p, i) => (
              <View key={i} style={styles.skyPlanetChip}>
                <Text style={styles.skyPlanetGlyph}>{PLANET_GLYPHS[p.name] || '★'}</Text>
                <Text style={styles.skyPlanetText}>{p.sign}</Text>
              </View>
            ))}
          </View>

          {saved && (
            <View style={styles.savedBadge}>
              <Text style={styles.savedBadgeText}>Saved today</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>

          {/* ── Prompt ── */}
          <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>TODAY'S PROMPT</Text>
            <Text style={[styles.promptText, { color: colors.heading }]}>"{allPrompts[promptIndex]}"</Text>
            <TouchableOpacity onPress={() => setPromptIndex((promptIndex + 1) % allPrompts.length)}>
              <Text style={styles.promptShuffle}>Try another prompt</Text>
            </TouchableOpacity>
          </View>

          {/* ── Mood ── */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>HOW DO YOU FEEL?</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.moodChip, { backgroundColor: colors.card, borderColor: colors.border }, mood === m.key && styles.moodChipOn]}
                activeOpacity={0.7}
                onPress={() => { haptic.selection(); setMood(m.key); }}>
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, { color: colors.textSecondary }, mood === m.key && styles.moodLabelOn]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Energy ── */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ENERGY LEVEL</Text>
          <View style={styles.energyRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <TouchableOpacity key={n} onPress={() => { haptic.light(); setEnergy(n); }}>
                <View style={[styles.energyDot, { backgroundColor: colors.cardAlt, borderColor: colors.border }, n <= energy && styles.energyDotOn]} />
              </TouchableOpacity>
            ))}
            <Text style={styles.energyNum}>{energy}</Text>
          </View>

          {/* ── Tags ── */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>WHAT'S THIS ABOUT?</Text>
          <View style={styles.tagsRow}>
            {TAGS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tagChip, { backgroundColor: colors.card, borderColor: colors.border }, selectedTags.includes(t.key) && { backgroundColor: t.color + '18', borderColor: t.color + '40' }]}
                activeOpacity={0.7}
                onPress={() => { haptic.light(); toggleTag(t.key); }}>
                <Text style={[styles.tagIcon, { color: colors.textSecondary }, selectedTags.includes(t.key) && { color: t.color }]}>{t.icon}</Text>
                <Text style={[styles.tagLabel, { color: colors.textSecondary }, selectedTags.includes(t.key) && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Writing area ── */}
          <View style={[styles.writeCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TextInput
              ref={textRef}
              style={[styles.writeInput, { color: colors.text }]}
              placeholder="Let your thoughts flow..."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              textAlignVertical="top"
              value={journalText}
              onChangeText={setJournalText}
              autoCorrect
              scrollEnabled={false}
            />
          </View>

          {/* ── Cosmic context while writing ── */}
          <View style={[styles.cosmicContext, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={[styles.cosmicContextLabel, { color: colors.textSecondary }]}>THE SKY RIGHT NOW</Text>
            <Text style={[styles.cosmicContextText, { color: colors.text }]}>
              {moonIcon} {moonData?.phaseName} in {moonData?.sign}
              {moonData?.illumination != null ? ` · ${moonData.illumination.toFixed(0)}% illuminated` : ''}
            </Text>
            <View style={styles.cosmicPlanetsRow}>
              {planets.map((p, i) => (
                <View key={i} style={styles.cosmicPlanetItem}>
                  <Text style={[styles.cosmicPlanetGlyph, { color: colors.textSecondary }]}>{PLANET_GLYPHS[p.name]}</Text>
                  <Text style={[styles.cosmicPlanetName, { color: colors.textSecondary }]}>{p.name}</Text>
                  <Text style={[styles.cosmicPlanetSign, { color: colors.textSecondary }]}>{p.sign} {Math.round(p.degree)}°{p.isRetrograde ? ' ℞' : ''}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.cosmicContextNote, { color: colors.textSecondary }]}>This snapshot will be saved with your entry</Text>
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, !journalText.trim() && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            disabled={!journalText.trim()}
            onPress={save}>
            <Text style={styles.saveBtnText}>
              {saved ? 'Update Entry' : 'Save with Cosmic Imprint'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 48) + 12,
    paddingHorizontal: 22,
    paddingBottom: 24,
    
    
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { fontSize: 15, color: 'rgba(250,248,242,0.5)', fontFamily: FONTS.sans },
  historyBtn: { fontSize: 13, color: T.gold, fontFamily: FONTS.sansSemiBold },
  heroDate: { fontSize: 11, color: 'rgba(250,248,242,0.35)', fontFamily: FONTS.sans, letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 28, color: T.cream, marginBottom: 16 },
  skyStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  skyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skyEmoji: { fontSize: 18 },
  skyText: { fontSize: 12, color: 'rgba(250,248,242,0.55)', fontFamily: FONTS.sans },
  skyDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.1)' },
  skyPlanetChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  skyPlanetGlyph: { fontSize: 12, color: 'rgba(250,248,242,0.4)' },
  skyPlanetText: { fontSize: 10, color: 'rgba(250,248,242,0.4)', fontFamily: FONTS.sans },
  savedBadge: { backgroundColor: 'rgba(80,200,120,0.15)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 12 },
  savedBadgeText: { fontSize: 11, color: '#50C878', fontFamily: FONTS.sansSemiBold },

  body: { padding: 20 },

  promptCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  promptLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8 },
  promptText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 16, color: T.navy, lineHeight: 24, fontStyle: 'italic', marginBottom: 10 },
  promptShuffle: { fontSize: 12, color: T.gold, fontFamily: FONTS.sansSemiBold },

  sectionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8 },

  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  moodChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  moodChipOn: { backgroundColor: 'rgba(200,168,75,0.1)', borderColor: 'rgba(200,168,75,0.3)' },
  moodEmoji: { fontSize: 20, marginBottom: 2 },
  moodLabel: { fontSize: 9, color: T.stone, fontFamily: FONTS.sans },
  moodLabelOn: { color: T.gold, fontFamily: FONTS.sansSemiBold },

  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  energyDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F0EDE6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  energyDotOn: { backgroundColor: T.gold, borderColor: T.gold },
  energyNum: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold, marginLeft: 4 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  tagIcon: { fontSize: 13, color: T.stone },
  tagLabel: { fontSize: 12, color: T.stone, fontFamily: FONTS.sans },

  writeCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', minHeight: 200 },
  writeInput: { fontFamily: FONTS.sans, fontSize: 15, color: T.ink, lineHeight: 24, minHeight: 180 },

  cosmicContext: { backgroundColor: '#F8F6F0', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cosmicContextLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8 },
  cosmicContextText: { fontSize: 13, color: T.ink, fontFamily: FONTS.sans, marginBottom: 12 },
  cosmicPlanetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  cosmicPlanetItem: { alignItems: 'center', gap: 2 },
  cosmicPlanetGlyph: { fontSize: 16, color: T.stone },
  cosmicPlanetName: { fontSize: 8, color: T.stone, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5 },
  cosmicPlanetSign: { fontSize: 9, color: T.stone, fontFamily: FONTS.sans },
  cosmicContextNote: { fontSize: 10, color: T.stone, fontStyle: 'italic', textAlign: 'center' },

  saveBtn: { backgroundColor: T.navy, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, color: T.cream, fontFamily: FONTS.sansSemiBold },
});

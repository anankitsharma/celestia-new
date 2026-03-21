import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { JournalRepository } from '../services/database/rep_journal';
import { useTheme } from '../contexts/ThemeContext';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOOD_EMOJIS = { great: '😊', good: '🙂', okay: '😐', low: '😔', anxious: '😰' };

const MOON_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

const PLANET_GLYPHS = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

const TAG_META = {
  love: { icon: '♡', color: '#E85090' },
  career: { icon: '◆', color: '#5090E8' },
  growth: { icon: '◎', color: '#F59E0B' },
  health: { icon: '✦', color: '#50C878' },
  dreams: { icon: '☽', color: '#8B5CF6' },
  gratitude: { icon: '✧', color: '#C8A84B' },
};

// Parse the prompt JSON safely
const parseMeta = (promptStr) => {
  if (!promptStr) return {};
  try { return JSON.parse(promptStr); } catch { return {}; }
};

// Parse cosmic snapshot safely
const parseSnapshot = (snapshotStr) => {
  if (!snapshotStr) return null;
  try { return JSON.parse(snapshotStr); } catch { return null; }
};

// Parse tags safely
const parseTags = (tagsStr) => {
  if (!tagsStr) return [];
  try { const t = JSON.parse(tagsStr); return Array.isArray(t) ? t : []; } catch { return []; }
};

export default function JournalHistoryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { userProfile } = useUserProfile();
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [journalStreak, setJournalStreak] = useState(0);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const profileId = userProfile?.id || 'default';

  useEffect(() => {
    loadMonth();
    loadStats();
  }, [viewYear, viewMonth]);

  // Reload when screen gains focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { loadMonth(); loadStats(); });
    return unsub;
  }, [navigation, viewYear, viewMonth]);

  const loadMonth = async () => {
    try {
      const data = await JournalRepository.getEntriesForMonth(profileId, viewYear, viewMonth);
      setEntries(data);
    } catch (e) { console.error('Journal load error:', e); }
  };

  const loadStats = async () => {
    try {
      const [count, streak] = await Promise.all([
        JournalRepository.getEntryCount(profileId),
        JournalRepository.getStreak(profileId),
      ]);
      setTotalCount(count);
      setJournalStreak(streak);
    } catch (e) {}
  };

  const entryDates = useMemo(() => new Set(entries.map(e => e.date)), [entries]);

  // Build real calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const grid = [];

    // Leading empty cells
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    // Trailing empty cells to complete last row
    while (grid.length % 7 !== 0) grid.push(null);

    return grid;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
    setSelectedDate(null);
    setSelectedEntry(null);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
    setSelectedDate(null);
    setSelectedEntry(null);
  };

  const onDayPress = (day) => {
    if (!day) return;
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    const entry = entries.find(e => e.date === dateStr);
    setSelectedEntry(entry || null);
  };

  const todayStr = now.toISOString().split('T')[0];

  // Render selected entry with cosmic snapshot
  const renderEntry = () => {
    if (!selectedEntry) return <Text style={[s.noEntry, { color: colors.textSecondary }]}>No journal entry for this day.</Text>;

    const meta = parseMeta(selectedEntry.prompt);
    const snapshot = parseSnapshot(selectedEntry.cosmic_snapshot);
    const tags = parseTags(selectedEntry.tags);

    return (
      <View style={[s.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Mood + Energy row */}
        {(meta.mood || meta.energy) && (
          <View style={s.entryMetaRow}>
            {meta.mood && (
              <View style={s.entryMoodChip}>
                <Text style={{ fontSize: 16 }}>{MOOD_EMOJIS[meta.mood] || '😐'}</Text>
                <Text style={s.entryMoodText}>{meta.mood}</Text>
              </View>
            )}
            {meta.energy && (
              <View style={s.entryEnergyRow}>
                <Text style={s.entryEnergyLabel}>Energy</Text>
                <Text style={s.entryEnergyVal}>{meta.energy}/10</Text>
              </View>
            )}
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={s.entryTagsRow}>
            {tags.map(t => {
              const tm = TAG_META[t];
              return tm ? (
                <View key={t} style={[s.entryTag, { backgroundColor: tm.color + '12' }]}>
                  <Text style={[s.entryTagText, { color: tm.color }]}>{tm.icon} {t}</Text>
                </View>
              ) : null;
            })}
          </View>
        )}

        {/* Prompt */}
        {meta.mantra ? (
          <Text style={s.entryPrompt}>"{meta.mantra}"</Text>
        ) : null}

        {/* Content */}
        <Text style={[s.entryContent, { color: colors.text }]}>{selectedEntry.content}</Text>

        {/* Cosmic Snapshot — "The Sky When You Wrote This" */}
        {snapshot && snapshot.moon && (
          <View style={[s.snapshotBox, { borderTopColor: colors.border }]}>
            <Text style={[s.snapshotLabel, { color: colors.textSecondary }]}>THE SKY WHEN YOU WROTE THIS</Text>
            <Text style={[s.snapshotMoon, { color: colors.text }]}>
              {MOON_ICONS[snapshot.moon.phase] || '🌘'} {snapshot.moon.phase} in {snapshot.moon.sign}
              {snapshot.moon.illumination != null ? ` · ${Math.round(snapshot.moon.illumination)}%` : ''}
            </Text>
            {snapshot.planets && snapshot.planets.length > 0 && (
              <View style={s.snapshotPlanets}>
                {snapshot.planets.slice(0, 7).map((p, i) => (
                  <View key={i} style={s.snapshotPlanet}>
                    <Text style={s.snapshotGlyph}>{PLANET_GLYPHS[p.name] || '★'}</Text>
                    <Text style={s.snapshotPlanetText}>{p.sign} {Math.round(p.degree)}°{p.retrograde ? ' ℞' : ''}</Text>
                  </View>
                ))}
              </View>
            )}
            {snapshot.activeTransits && snapshot.activeTransits.length > 0 && (
              <View style={s.snapshotTransits}>
                {snapshot.activeTransits.slice(0, 3).map((t, i) => (
                  <Text key={i} style={s.snapshotTransitText}>✦ {t.description}</Text>
                ))}
              </View>
            )}
            {snapshot.timestamp && (
              <Text style={s.snapshotTime}>
                Captured at {new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.backText, { color: colors.heading }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.heading }]}>Cosmic Journal</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Journal')} style={s.writeBtn}>
          <Text style={s.writeText}>✍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.heading }]}>{totalCount}</Text>
            <Text style={[s.statLbl, { color: colors.textSecondary }]}>Entries</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.heading }]}>{journalStreak}</Text>
            <Text style={[s.statLbl, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.heading }]}>{entries.length}</Text>
            <Text style={[s.statLbl, { color: colors.textSecondary }]}>This Month</Text>
          </View>
        </View>

        {/* Month navigation */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.navBtnText, { color: colors.heading }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.monthLabel, { color: colors.heading }]}>{MONTH_NAMES[viewMonth - 1]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.navBtnText, { color: colors.heading }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={s.dayLabels}>
          {DAY_LABELS.map((d, i) => (
            <View key={i} style={s.dayLabelCell}>
              <Text style={[s.dayLabel, { color: colors.textSecondary }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={s.calGrid}>
          {calendarDays.map((day, i) => {
            if (!day) return <View key={i} style={s.calCell} />;
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = entryDates.has(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <TouchableOpacity key={i} style={[s.calCell, isSelected && s.calCellSelected]}
                activeOpacity={0.7} onPress={() => onDayPress(day)}>
                <Text style={[s.calDay, { color: colors.text }, isToday && s.calDayToday, isSelected && { color: colors.heading, fontFamily: FONTS.sansSemiBold }]}>
                  {day}
                </Text>
                {hasEntry && <View style={[s.calDot, isSelected && { backgroundColor: T.gold }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected entry */}
        {selectedDate && (
          <View style={s.entrySection}>
            <Text style={[s.entryDate, { color: colors.heading }]}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            {renderEntry()}
          </View>
        )}

        {/* Recent entries list */}
        {!selectedDate && entries.length > 0 && (
          <View style={s.recentSection}>
            <Text style={[s.recentLabel, { color: colors.textSecondary }]}>RECENT ENTRIES</Text>
            {entries.slice(-10).reverse().map((entry, i) => {
              const meta = parseMeta(entry.prompt);
              const snapshot = parseSnapshot(entry.cosmic_snapshot);
              const tags = parseTags(entry.tags);
              return (
                <TouchableOpacity key={i} style={[s.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}
                  onPress={() => { setSelectedDate(entry.date); setSelectedEntry(entry); }}>
                  <View style={s.recentTop}>
                    <Text style={s.recentDate}>
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={s.recentChips}>
                      {meta.mood && <Text style={{ fontSize: 14 }}>{MOOD_EMOJIS[meta.mood]}</Text>}
                      {snapshot?.moon && <Text style={[s.recentMoon, { color: colors.textSecondary }]}>{MOON_ICONS[snapshot.moon.phase] || '🌘'} {snapshot.moon.sign}</Text>}
                    </View>
                  </View>
                  {tags.length > 0 && (
                    <View style={s.recentTagsRow}>
                      {tags.map(t => TAG_META[t] ? (
                        <Text key={t} style={[s.recentTagText, { color: TAG_META[t].color }]}>{TAG_META[t].icon}</Text>
                      ) : null)}
                    </View>
                  )}
                  <Text style={[s.recentPreview, { color: colors.text }]} numberOfLines={2}>{entry.content}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const CELL_SIZE = (100 / 7);

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 44) + 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: T.navy, marginTop: -2 },
  headerTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy },
  writeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(200,168,75,0.1)', alignItems: 'center', justifyContent: 'center' },
  writeText: { fontSize: 18 },

  statsRow: { flexDirection: 'row', gap: 9, padding: 20, paddingBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statNum: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy },
  statLbl: { fontSize: 10, color: T.stone, marginTop: 2 },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 20, color: T.navy },
  monthLabel: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy },

  dayLabels: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  dayLabelCell: { width: `${CELL_SIZE}%`, alignItems: 'center' },
  dayLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.stone, letterSpacing: 0.5 },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 20 },
  calCell: { width: `${CELL_SIZE}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 12 },
  calDay: { fontSize: 14, color: T.ink, fontFamily: FONTS.sans },
  calDayToday: { fontFamily: FONTS.sansBold, color: T.gold },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.navy, marginTop: 2 },

  entrySection: { paddingHorizontal: 20, marginBottom: 20 },
  entryDate: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy, marginBottom: 12 },
  entryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  entryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  entryMoodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  entryMoodText: { fontSize: 12, color: T.stone, fontFamily: FONTS.sans, textTransform: 'capitalize' },
  entryEnergyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryEnergyLabel: { fontSize: 10, color: T.stone },
  entryEnergyVal: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: T.gold },
  entryTagsRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  entryTag: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  entryTagText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, textTransform: 'capitalize' },
  entryPrompt: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14, color: T.stone, fontStyle: 'italic', marginBottom: 10, lineHeight: 20 },
  entryContent: { fontSize: 14, color: T.ink, lineHeight: 23 },
  noEntry: { fontSize: 13, color: T.stone, fontStyle: 'italic' },

  // Cosmic snapshot
  snapshotBox: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  snapshotLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8 },
  snapshotMoon: { fontSize: 13, color: T.ink, fontFamily: FONTS.sans, marginBottom: 10 },
  snapshotPlanets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  snapshotPlanet: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  snapshotGlyph: { fontSize: 14, color: T.stone },
  snapshotPlanetText: { fontSize: 11, color: T.stone, fontFamily: FONTS.sans },
  snapshotTransits: { marginBottom: 8 },
  snapshotTransitText: { fontSize: 11, color: T.stone, lineHeight: 17 },
  snapshotTime: { fontSize: 10, color: T.stone, fontStyle: 'italic' },

  recentSection: { paddingHorizontal: 20 },
  recentLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 10 },
  recentCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  recentDate: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.gold },
  recentChips: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentMoon: { fontSize: 10, color: T.stone },
  recentTagsRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  recentTagText: { fontSize: 12 },
  recentPreview: { fontSize: 13, color: T.ink, lineHeight: 20 },
});

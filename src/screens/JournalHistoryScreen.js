import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { JournalRepository } from '../services/database/rep_journal';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function JournalHistoryScreen({ navigation }) {
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

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const grid = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);

    return grid;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const onDayPress = (day) => {
    if (!day) return;
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    const entry = entries.find(e => e.date === dateStr);
    setSelectedEntry(entry || null);
  };

  const todayStr = now.toISOString().split('T')[0];

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cosmic Journal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalCount}</Text>
            <Text style={s.statLbl}>Entries</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{journalStreak}</Text>
            <Text style={s.statLbl}>Day Streak</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{entries.length}</Text>
            <Text style={s.statLbl}>This Month</Text>
          </View>
        </View>

        {/* Month navigation */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthLabel}>{MONTH_NAMES[viewMonth - 1]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
            <Text style={s.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={s.dayLabels}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={s.dayLabel}>{d}</Text>
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
                <Text style={[s.calDay, isToday && s.calDayToday, isSelected && { color: T.navy }]}>
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
            <Text style={s.entryDate}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            {selectedEntry ? (
              <View style={s.entryCard}>
                {selectedEntry.prompt ? (
                  <Text style={s.entryPrompt}>"{selectedEntry.prompt}"</Text>
                ) : null}
                <Text style={s.entryContent}>{selectedEntry.content}</Text>
              </View>
            ) : (
              <Text style={s.noEntry}>No journal entry for this day.</Text>
            )}
          </View>
        )}

        {/* Recent entries list */}
        {!selectedDate && entries.length > 0 && (
          <View style={s.recentSection}>
            <Text style={s.recentLabel}>RECENT ENTRIES</Text>
            {entries.slice(0, 10).map((entry, i) => (
              <TouchableOpacity key={i} style={s.recentCard} activeOpacity={0.7}
                onPress={() => { setSelectedDate(entry.date); setSelectedEntry(entry); }}>
                <Text style={s.recentDate}>
                  {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={s.recentPreview} numberOfLines={2}>{entry.content}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 44) + 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: T.navy, marginTop: -2 },
  headerTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy },

  statsRow: { flexDirection: 'row', gap: 9, padding: 20, paddingBottom: 10 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  statNum: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy },
  statLbl: { fontSize: 10, color: T.stone, marginTop: 2 },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 20, color: T.navy },
  monthLabel: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy },

  dayLabels: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.stone, letterSpacing: 0.5 },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 20 },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 12 },
  calDay: { fontSize: 14, color: T.ink },
  calDayToday: { fontFamily: FONTS.sansSemiBold, color: T.gold },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.navy, marginTop: 2 },

  entrySection: { paddingHorizontal: 20, marginBottom: 20 },
  entryDate: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy, marginBottom: 12 },
  entryCard: { backgroundColor: 'white', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: T.border },
  entryPrompt: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14, color: T.stone, fontStyle: 'italic', marginBottom: 10, lineHeight: 20 },
  entryContent: { fontSize: 14, color: T.ink, lineHeight: 23 },
  noEntry: { fontSize: 13, color: T.stone, fontStyle: 'italic' },

  recentSection: { paddingHorizontal: 20 },
  recentLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 10 },
  recentCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  recentDate: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 4 },
  recentPreview: { fontSize: 13, color: T.ink, lineHeight: 20 },
});

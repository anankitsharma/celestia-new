import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const EVENT_THEMES = {
  'New Moon': {
    emoji: '🌑',
    gradient: ['#0A0A1E', '#3A1A28', '#0C1030'],
    accentColor: 'rgba(160,200,224,0.7)',
    message: 'Set your intentions. Plant seeds in the dark.',
  },
  'Full Moon': {
    emoji: '🌕',
    gradient: ['#1A1828', '#3A1A28', '#3A1A28'],
    accentColor: 'rgba(200,168,75,0.7)',
    message: 'Release what no longer serves you. Celebrate how far you\'ve come.',
  },
  'Eclipse': {
    emoji: '🌘',
    gradient: ['#1A0818', '#3A1A28', '#180A1E'],
    accentColor: 'rgba(176,136,240,0.7)',
    message: 'Expect the unexpected. Eclipses bring fated shifts.',
  },
};

export default function LunarEventCard({ eventType = 'Full Moon', moonSign, ritual, date, innerRef }) {
  const theme = EVENT_THEMES[eventType] || EVENT_THEMES['Full Moon'];

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={theme.gradient} style={s.card}>
        <Text style={s.emoji}>{theme.emoji}</Text>
        <Text style={s.label}>{eventType.toUpperCase()}</Text>
        <Text style={[s.title, { color: theme.accentColor }]}>
          {eventType} in {moonSign || 'the Sky'}
        </Text>
        {date && (
          <Text style={s.date}>{date}</Text>
        )}
        <View style={s.divider} />
        <Text style={s.message}>{theme.message}</Text>
        {ritual && (
          <View style={s.ritualBox}>
            <Text style={s.ritualLabel}>RITUAL</Text>
            <Text style={s.ritualText}>{ritual}</Text>
          </View>
        )}
        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 28, paddingBottom: 20, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  label: { fontSize: 9, letterSpacing: 2.5, color: 'rgba(250,248,242,0.35)', fontFamily: FONTS.sansSemiBold, marginBottom: 8 },
  title: { fontFamily: FONTS.serif, fontSize: 24, textAlign: 'center', marginBottom: 4 },
  date: { fontSize: 11, color: 'rgba(250,248,242,0.4)', marginBottom: 8 },
  divider: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 14 },
  message: { fontStyle: 'italic', fontSize: 13, color: T.cream, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  ritualBox: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, alignItems: 'center' },
  ritualLabel: { fontSize: 9, letterSpacing: 2, color: 'rgba(200,168,75,0.5)', fontFamily: FONTS.sansSemiBold, marginBottom: 6 },
  ritualText: { fontSize: 12, color: 'rgba(250,248,242,0.7)', textAlign: 'center', lineHeight: 18 },
});

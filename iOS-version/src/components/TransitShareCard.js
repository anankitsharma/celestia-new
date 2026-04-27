import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

export default function TransitShareCard({ aspect, meaning, ritual, date, innerRef }) {
  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#3A1A28', '#5A2840', '#1F0F18']} style={s.card}>
        <Text style={s.label}>TODAY'S TRANSIT</Text>

        {/* Aspect name */}
        <Text style={s.aspect}>{aspect}</Text>

        {/* Meaning */}
        {meaning && (
          <Text style={s.meaning}>{meaning}</Text>
        )}

        {/* Ritual */}
        {ritual && (
          <View style={s.ritualBox}>
            <Text style={s.ritualLabel}>TODAY'S RITUAL</Text>
            <Text style={s.ritualText}>{ritual}</Text>
          </View>
        )}

        {/* Date */}
        {date && <Text style={s.date}>{date}</Text>}

        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 28, paddingBottom: 20, alignItems: 'center' },
  label: { fontSize: 9, letterSpacing: 2.5, color: 'rgba(200,168,75,0.55)', fontFamily: FONTS.sansSemiBold, marginBottom: 16 },
  aspect: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, textAlign: 'center', marginBottom: 12 },
  meaning: { fontSize: 14, color: 'rgba(250,248,242,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  ritualBox: { backgroundColor: 'rgba(200,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', borderRadius: 14, padding: 14, width: '100%', marginBottom: 12 },
  ritualLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 6 },
  ritualText: { fontSize: 13, color: T.cream, lineHeight: 20 },
  date: { fontSize: 11, color: 'rgba(250,248,242,0.3)', marginBottom: 4 },
});

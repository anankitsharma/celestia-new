import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

export default function StreakShareCard({ streak, emoji, message, innerRef }) {
  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} style={s.card}>
        <Text style={s.emoji}>{emoji}</Text>
        <Text style={s.streak}>{streak}</Text>
        <Text style={s.days}>days in a row</Text>
        {message && <Text style={s.message}>{message}</Text>}
        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 32, paddingBottom: 20, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 8 },
  streak: { fontFamily: FONTS.serif, fontSize: 72, color: T.gold, lineHeight: 80 },
  days: { fontSize: 13, color: 'rgba(250,248,242,0.45)', marginBottom: 12 },
  message: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 16, color: T.cream, textAlign: 'center', lineHeight: 24, fontStyle: 'italic', marginBottom: 8 },
});

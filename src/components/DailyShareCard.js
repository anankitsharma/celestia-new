import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

export default function DailyShareCard({ sunSign, viralInsight, mantra, date, innerRef }) {
  const glyph = ZODIAC_SYMBOLS[sunSign] || '✦';

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} style={s.card}>
        {/* Glyph watermark */}
        <Text style={s.bgGlyph}>{glyph}</Text>

        {/* Sun sign label */}
        <View style={s.signBadge}>
          <Text style={s.signText}>☉ {sunSign} Sun</Text>
        </View>

        {/* Viral insight or mantra */}
        <Text style={s.insight}>
          {viralInsight || mantra || 'The cosmos speaks through you today.'}
        </Text>

        {/* Date */}
        {date && <Text style={s.date}>{date}</Text>}

        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 32, paddingTop: 40, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
  bgGlyph: { position: 'absolute', fontSize: 180, color: 'rgba(200,168,75,0.04)', right: -20, top: -20, fontFamily: FONTS.serif },
  signBadge: { backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 20 },
  signText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold, letterSpacing: 0.5 },
  insight: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, lineHeight: 32, marginBottom: 16 },
  date: { fontSize: 10, letterSpacing: 1.5, color: 'rgba(250,248,242,0.3)', marginBottom: 8 },
});

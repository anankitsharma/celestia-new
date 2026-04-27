import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

export default function DailyStoryCard({ sunSign, viralInsight, mantra, date, innerRef }) {
  const glyph = ZODIAC_SYMBOLS[sunSign] || '✦';

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#3A1A28', '#5A2840', '#1F0F18']} style={s.card}>
        {/* Star scatter (static dots) */}
        <View style={s.dot1} />
        <View style={s.dot2} />
        <View style={s.dot3} />
        <View style={s.dot4} />
        <View style={s.dot5} />

        {/* Top: Sign glyph */}
        <View style={s.glyphWrap}>
          <Text style={s.glyph}>{glyph}</Text>
          <Text style={s.signLabel}>☉ {sunSign} Sun</Text>
        </View>

        {/* Middle: Viral insight */}
        {viralInsight && (
          <Text style={s.insight}>{viralInsight}</Text>
        )}

        {/* Bottom: Mantra + date */}
        <View style={s.bottom}>
          {mantra && <Text style={s.mantra}>"{mantra}"</Text>}
          {date && <Text style={s.date}>{date}</Text>}
          <ShareWatermark />
        </View>
      </LinearGradient>
    </View>
  );
}

const dotBase = { position: 'absolute', borderRadius: 2, backgroundColor: 'rgba(200,168,75,0.15)' };

const s = StyleSheet.create({
  outer: { width: 360, height: 640, borderRadius: 24, overflow: 'hidden' },
  card: { flex: 1, padding: 32, justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  // Star scatter dots
  dot1: { ...dotBase, width: 3, height: 3, top: 60, left: 40 },
  dot2: { ...dotBase, width: 2, height: 2, top: 120, right: 50 },
  dot3: { ...dotBase, width: 4, height: 4, top: 300, left: 70 },
  dot4: { ...dotBase, width: 2, height: 2, bottom: 180, right: 30 },
  dot5: { ...dotBase, width: 3, height: 3, bottom: 100, left: 50 },
  // Top section
  glyphWrap: { alignItems: 'center', paddingTop: 40 },
  glyph: { fontSize: 120, color: 'rgba(200,168,75,0.25)' },
  signLabel: { fontSize: 14, color: T.gold, fontFamily: FONTS.sansMedium, marginTop: 8 },
  // Middle section
  insight: { fontFamily: FONTS.serif, fontSize: 26, color: T.cream, textAlign: 'center', lineHeight: 36, paddingHorizontal: 10 },
  // Bottom section
  bottom: { alignItems: 'center' },
  mantra: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: 'rgba(250,248,242,0.5)', textAlign: 'center', lineHeight: 22, fontStyle: 'italic', marginBottom: 12 },
  date: { fontSize: 11, color: 'rgba(250,248,242,0.3)', marginBottom: 8 },
});

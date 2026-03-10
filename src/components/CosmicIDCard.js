import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

export default function CosmicIDCard({ name, sun, moon, rising, chips, levelName, innerRef }) {
  const sunGlyph = ZODIAC_SYMBOLS[sun] || '✦';

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#0E0E22', '#1A1060', '#0C2040']} style={s.card}>
        {/* Background glyph */}
        <Text style={s.bgGlyph}>{sunGlyph}</Text>

        {/* Header */}
        <Text style={s.label}>COSMIC IDENTITY</Text>

        {/* Name */}
        <Text style={s.name}>{name || 'Stargazer'}</Text>

        {/* Big Three */}
        <View style={s.bigThreeRow}>
          {sun && (
            <View style={s.signCard}>
              <Text style={s.signGlyph}>☉</Text>
              <Text style={s.signName}>{sun}</Text>
              <Text style={s.signRole}>SUN</Text>
            </View>
          )}
          {moon && (
            <View style={s.signCard}>
              <Text style={s.signGlyph}>☽</Text>
              <Text style={s.signName}>{moon}</Text>
              <Text style={s.signRole}>MOON</Text>
            </View>
          )}
          {rising && (
            <View style={s.signCard}>
              <Text style={s.signGlyph}>↑</Text>
              <Text style={s.signName}>{rising}</Text>
              <Text style={s.signRole}>RISING</Text>
            </View>
          )}
        </View>

        {/* Chips */}
        {chips && chips.length > 0 && (
          <View style={s.chipRow}>
            {chips.map((c, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Level */}
        {levelName && (
          <Text style={s.level}>✦ {levelName}</Text>
        )}

        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 28, paddingTop: 32, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
  bgGlyph: { position: 'absolute', fontSize: 200, color: 'rgba(200,168,75,0.03)', right: -30, top: -30, fontFamily: FONTS.serif },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.55)', fontFamily: FONTS.sansSemiBold, marginBottom: 16 },
  name: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream, marginBottom: 20 },
  bigThreeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  signCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, alignItems: 'center' },
  signGlyph: { fontSize: 20, color: 'rgba(200,168,75,0.7)', marginBottom: 4 },
  signName: { fontFamily: FONTS.sansMedium, fontSize: 13, color: T.cream, marginBottom: 2 },
  signRole: { fontSize: 8, letterSpacing: 1.5, color: 'rgba(250,248,242,0.35)' },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  chip: { backgroundColor: 'rgba(200,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  chipText: { fontSize: 11, color: 'rgba(250,248,242,0.65)' },
  level: { fontSize: 12, color: 'rgba(200,168,75,0.6)', fontFamily: FONTS.sansMedium, marginBottom: 4 },
});

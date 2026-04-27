import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/theme';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export const STORY_THEMES = [
  {
    name: 'Aura',
    bg: ['#FDDCDF', '#F0C6E8', '#D4B4F0'],
    scoreColor: '#2D1B4E',
    glyphColor: '#7B3FA0',
    nameColor: '#2D1B4E',
    signColor: 'rgba(45,27,78,0.55)',
    verdictColor: '#9B5DC7',
    barTrack: 'rgba(45,27,78,0.10)',
    barFill: '#C084E8',
    brandColor: 'rgba(45,27,78,0.30)',
    watermarkColor: 'rgba(45,27,78,0.035)',
    dot: '#9B5DC7',
  },
  {
    name: 'Golden',
    bg: ['#FFF0D4', '#FFD6A8', '#FFBFA0'],
    scoreColor: '#3D1F0A',
    glyphColor: '#C8702A',
    nameColor: '#3D1F0A',
    signColor: 'rgba(61,31,10,0.50)',
    verdictColor: '#D4853A',
    barTrack: 'rgba(61,31,10,0.10)',
    barFill: '#E8A060',
    brandColor: 'rgba(61,31,10,0.25)',
    watermarkColor: 'rgba(61,31,10,0.025)',
    dot: '#D4853A',
  },
  {
    name: 'Midnight',
    bg: ['#1A0A3E', '#2D1060', '#0A0828'],
    scoreColor: '#FFFFFF',
    glyphColor: '#E8A0FF',
    nameColor: '#FFFFFF',
    signColor: 'rgba(255,255,255,0.55)',
    verdictColor: '#C880F0',
    barTrack: 'rgba(255,255,255,0.10)',
    barFill: '#A060E0',
    brandColor: 'rgba(255,255,255,0.25)',
    watermarkColor: 'rgba(232,160,255,0.04)',
    dot: '#C880F0',
  },
  {
    name: 'Rosé',
    bg: ['#FFE0EA', '#F0B8D0', '#E090B8'],
    scoreColor: '#3A0A20',
    glyphColor: '#C03070',
    nameColor: '#3A0A20',
    signColor: 'rgba(58,10,32,0.50)',
    verdictColor: '#D04080',
    barTrack: 'rgba(58,10,32,0.10)',
    barFill: '#E060A0',
    brandColor: 'rgba(58,10,32,0.25)',
    watermarkColor: 'rgba(58,10,32,0.03)',
    dot: '#D04080',
  },
];

export default function MatchStoryCard({ user, partner, score, verdict, insights, themeIndex = 0, innerRef }) {
  const theme = STORY_THEMES[themeIndex] || STORY_THEMES[0];
  const userGlyph = ZODIAC_SYMBOLS[user?.sign] || '✦';
  const partnerGlyph = ZODIAC_SYMBOLS[partner?.sign] || '✦';
  const pct = score || 0;
  const barWidth = Math.round(160 * (pct / 100));

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={theme.bg} locations={[0, 0.5, 1]} style={s.card}>

        {/* Background watermark glyph */}
        <Text style={[s.bgGlyph, { color: theme.watermarkColor }]}>{userGlyph}</Text>

        {/* ── Pair ── */}
        <View style={s.pairSection}>
          <View style={s.personCol}>
            <Text style={[s.glyph, { color: theme.glyphColor }]}>{userGlyph}</Text>
            <Text style={[s.personName, { color: theme.nameColor }]} numberOfLines={1}>
              {user?.name || 'You'}
            </Text>
            <Text style={[s.personSign, { color: theme.signColor }]}>
              {user?.sign?.toUpperCase() || ''}
            </Text>
          </View>

          <Text style={[s.ampersand, { color: theme.signColor }]}>&</Text>

          <View style={s.personCol}>
            <Text style={[s.glyph, { color: theme.glyphColor }]}>{partnerGlyph}</Text>
            <Text style={[s.personName, { color: theme.nameColor }]} numberOfLines={1}>
              {partner?.name || 'Partner'}
            </Text>
            <Text style={[s.personSign, { color: theme.signColor }]}>
              {partner?.sign?.toUpperCase() || ''}
            </Text>
          </View>
        </View>

        {/* ── Score hero ── */}
        <View style={s.scoreSection}>
          <View style={s.scoreRow}>
            <Text style={[s.scoreNum, { color: theme.scoreColor }]}>{pct}</Text>
            <Text style={[s.scorePct, { color: theme.verdictColor }]}>%</Text>
          </View>

          {/* Progress bar */}
          <View style={[s.barTrack, { backgroundColor: theme.barTrack }]}>
            <View style={[s.barFill, { width: barWidth, backgroundColor: theme.barFill }]} />
          </View>

          {/* Verdict */}
          {(insights?.oneWord || verdict) && (
            <Text style={[s.verdict, { color: theme.verdictColor }]}>
              {insights?.oneWord || verdict}
            </Text>
          )}
        </View>

        {/* ── Brand ── */}
        <Text style={[s.brand, { color: theme.brandColor }]}>✦ celestia</Text>

      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 360, height: 640, borderRadius: 24, overflow: 'hidden' },
  card: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingHorizontal: 32, position: 'relative', overflow: 'hidden',
  },

  // Background watermark
  bgGlyph: { position: 'absolute', fontSize: 300, right: -60, top: -60 },

  // Pair
  pairSection: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'center', gap: 32, marginTop: 80,
  },
  personCol: { alignItems: 'center', width: 110 },
  glyph: { fontSize: 52 },
  ampersand: { fontSize: 22, fontFamily: FONTS.serif, fontStyle: 'italic', marginTop: 14 },
  personName: { fontSize: 17, fontFamily: FONTS.serifSemiBold, marginTop: 10 },
  personSign: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.5, marginTop: 4 },

  // Score
  scoreSection: { alignItems: 'center', marginTop: 44 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start' },
  scoreNum: { fontSize: 96, fontFamily: FONTS.serif, letterSpacing: -3, lineHeight: 100 },
  scorePct: { fontSize: 32, fontFamily: FONTS.sansMedium, marginLeft: 2, marginTop: 14 },

  // Bar
  barTrack: { width: 160, height: 2.5, borderRadius: 1.5, marginTop: 8 },
  barFill: { height: 2.5, borderRadius: 1.5, position: 'absolute', left: 0, top: 0 },

  // Verdict
  verdict: {
    fontSize: 18, fontFamily: FONTS.serif, fontStyle: 'italic',
    letterSpacing: 3, textTransform: 'lowercase', marginTop: 18,
  },

  // Brand
  brand: {
    position: 'absolute', bottom: 36,
    fontSize: 13, fontFamily: FONTS.serif, letterSpacing: 2.5,
  },
});

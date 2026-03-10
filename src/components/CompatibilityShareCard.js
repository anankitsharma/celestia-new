import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

export default function CompatibilityShareCard({ user, partner, score, verdict, innerRef }) {
  const userGlyph = ZODIAC_SYMBOLS[user?.sign] || '✦';
  const partnerGlyph = ZODIAC_SYMBOLS[partner?.sign] || '✦';
  const circumference = 2 * Math.PI * 40;
  const progress = ((score || 0) / 100) * circumference;

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#1A0A2E', '#0E0E22', '#0A1A3A']} style={s.card}>
        {/* Title */}
        <Text style={s.label}>COSMIC COMPATIBILITY</Text>

        {/* Pair display */}
        <View style={s.pairRow}>
          <View style={s.person}>
            <LinearGradient colors={['#E2C46A', '#8C6C18']} style={s.orb}>
              <Text style={s.orbText}>{user?.initial || '?'}</Text>
            </LinearGradient>
            <Text style={s.personName}>{user?.name || 'You'}</Text>
            <Text style={s.personSign}>{userGlyph} {user?.sign || ''}</Text>
          </View>

          {/* Score ring */}
          <View style={s.scoreWrap}>
            <Svg width={90} height={90}>
              <Circle cx={45} cy={45} r={40} fill="none" stroke="rgba(200,168,75,0.15)" strokeWidth={3} />
              <Circle cx={45} cy={45} r={40} fill="none" stroke={T.gold} strokeWidth={3}
                strokeDasharray={`${progress} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 45 45)" />
            </Svg>
            <View style={s.scoreCenter}>
              <Text style={s.scoreNum}>{score || 0}</Text>
              <Text style={s.scoreLbl}>%</Text>
            </View>
          </View>

          <View style={s.person}>
            <LinearGradient colors={['#8060C0', '#4030A0']} style={s.orb}>
              <Text style={s.orbText}>{partner?.initial || '?'}</Text>
            </LinearGradient>
            <Text style={s.personName}>{partner?.name || 'Partner'}</Text>
            <Text style={s.personSign}>{partnerGlyph} {partner?.sign || ''}</Text>
          </View>
        </View>

        {/* Verdict */}
        {verdict && <Text style={s.verdict}>"{verdict}"</Text>}

        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 28, paddingTop: 32, paddingBottom: 20, alignItems: 'center' },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.6)', fontFamily: FONTS.sansSemiBold, marginBottom: 24 },
  pairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  person: { alignItems: 'center', flex: 1 },
  orb: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  orbText: { fontFamily: FONTS.serif, fontSize: 22, color: 'white' },
  personName: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.cream, marginBottom: 2 },
  personSign: { fontSize: 11, color: 'rgba(250,248,242,0.45)' },
  scoreWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  scoreCenter: { position: 'absolute', flexDirection: 'row', alignItems: 'baseline' },
  scoreNum: { fontFamily: FONTS.serif, fontSize: 28, color: T.gold },
  scoreLbl: { fontFamily: FONTS.sansMedium, fontSize: 12, color: 'rgba(200,168,75,0.6)', marginLeft: 1 },
  verdict: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: 'rgba(250,248,242,0.55)', textAlign: 'center', fontStyle: 'italic', lineHeight: 22 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const SURVIVAL_TIPS = [
  { icon: '📱', tip: 'Back up your devices — tech glitches are likely' },
  { icon: '📝', tip: 'Double-check all emails and texts before sending' },
  { icon: '🚫', tip: "Avoid signing contracts or major purchases" },
  { icon: '🔄', tip: 'Revisit old projects — great time to finish, not start' },
  { icon: '🧘', tip: 'Practice patience — delays are redirections' },
  { icon: '💬', tip: 'Clarify misunderstandings immediately' },
];

export default function MercuryRxCard({ sunSign, innerRef }) {
  // Randomly pick 4 tips so each share feels fresh
  const tips = [...SURVIVAL_TIPS].sort(() => Math.random() - 0.5).slice(0, 4);

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#1A0A12', '#0E0E22', '#12081E']} style={s.card}>
        <Text style={s.label}>☿ MERCURY RETROGRADE</Text>
        <Text style={s.title}>Survival Kit</Text>
        {sunSign && (
          <Text style={s.subtitle}>For {sunSign} Season</Text>
        )}
        <View style={s.divider} />
        {tips.map((t, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.tipIcon}>{t.icon}</Text>
            <Text style={s.tipText}>{t.tip}</Text>
          </View>
        ))}
        <View style={s.divider} />
        <Text style={s.motto}>"Slow down. Breathe. Retrograde is a teacher."</Text>
        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 28, paddingBottom: 20, alignItems: 'center' },
  label: { fontSize: 9, letterSpacing: 2.5, color: 'rgba(232,120,120,0.7)', fontFamily: FONTS.sansSemiBold, marginBottom: 8 },
  title: { fontFamily: FONTS.serif, fontSize: 28, color: '#E87878', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 12, color: 'rgba(250,248,242,0.45)', marginBottom: 12 },
  divider: { width: 40, height: 1, backgroundColor: 'rgba(232,120,120,0.2)', marginVertical: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, width: '100%' },
  tipIcon: { fontSize: 14, marginRight: 10, marginTop: 1 },
  tipText: { flex: 1, fontSize: 12, color: T.cream, lineHeight: 18, fontFamily: FONTS.sans },
  motto: { fontStyle: 'italic', fontSize: 12, color: 'rgba(232,120,120,0.6)', textAlign: 'center', lineHeight: 18, marginBottom: 6 },
});

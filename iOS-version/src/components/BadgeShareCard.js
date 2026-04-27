import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

export default function BadgeShareCard({ badge, levelName, innerRef }) {
  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#5A2840', '#3A1A28']} style={s.card}>
        {/* Glow ring behind icon */}
        <View style={s.glowRing} />

        <Text style={s.label}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={s.icon}>{badge?.icon}</Text>
        <Text style={s.name}>{badge?.name}</Text>
        <Text style={s.desc}>{badge?.description}</Text>

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
  card: { padding: 28, paddingTop: 36, paddingBottom: 20, alignItems: 'center', position: 'relative' },
  glowRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(200,168,75,0.12)', top: 36 },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.7)', fontFamily: FONTS.sansSemiBold, marginBottom: 20 },
  icon: { fontSize: 52, marginBottom: 16 },
  name: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 13, color: 'rgba(250,248,242,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  level: { fontSize: 12, color: 'rgba(200,168,75,0.6)', fontFamily: FONTS.sansMedium, marginBottom: 4 },
});

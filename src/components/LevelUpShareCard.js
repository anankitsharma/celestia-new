import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const LEVEL_GRADIENTS = {
  Starling:      ['#0E0E22', '#1A1535', '#0F1628'],
  Voyager:       ['#0E0E22', '#0F1628', '#0C2040'],
  Constellation: ['#0E0E22', '#1A1060', '#0C2040'],
  Nebula:        ['#0E0E22', '#1A0A2E', '#201050'],
  Cosmos:        ['#0E0E22', '#1A1535', '#201040'],
};

export default function LevelUpShareCard({ levelName, totalXP, innerRef }) {
  const gradient = LEVEL_GRADIENTS[levelName] || LEVEL_GRADIENTS.Starling;

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={gradient} style={s.card}>
        <Text style={s.label}>LEVEL UP</Text>
        <Text style={s.levelName}>{levelName}</Text>
        <Text style={s.tagline}>Ascended to {levelName}</Text>
        {totalXP != null && (
          <Text style={s.xp}>{totalXP.toLocaleString()} Stardust earned</Text>
        )}
        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 32, paddingBottom: 20, alignItems: 'center' },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.7)', fontFamily: FONTS.sansSemiBold, marginBottom: 20 },
  levelName: { fontFamily: FONTS.serif, fontSize: 36, color: T.gold, textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 14, color: T.cream, marginBottom: 12 },
  xp: { fontSize: 12, color: 'rgba(250,248,242,0.4)', marginBottom: 8 },
});
